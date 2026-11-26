// Stores the session document as a JSON file in a repository through the
// GitHub Contents API. The token only ever travels in the Authorization header.
import { emptyDocument, parseDocument } from './document'
import type { DbDocument, DocumentAdapter } from './types'

export interface GitHubConfig {
  owner: string
  repo: string
  branch: string
  path: string
}

const API = 'https://api.github.com'
const MAX_ATTEMPTS = 3

export class GitHubError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message)
    this.name = 'GitHubError'
  }
}

function encodeBase64(text: string): string {
  const bytes = new TextEncoder().encode(text)
  let binary = ''
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i])
  return btoa(binary)
}

function decodeBase64(encoded: string): string {
  const binary = atob(encoded.replace(/\s/g, ''))
  return new TextDecoder().decode(Uint8Array.from(binary, (c) => c.charCodeAt(0)))
}

function describe(status: number): string {
  if (status === 401) return 'GitHub rechazó el token (401).'
  if (status === 403) return 'El token no tiene permiso, o se superó el límite de la API (403).'
  if (status === 404) return 'GitHub no encontró el repositorio o la rama (404).'
  return `Error de GitHub (${status}).`
}

function request(
  token: string,
  fetchImpl: typeof fetch,
  path: string,
  init: RequestInit = {},
): Promise<Response> {
  return fetchImpl(`${API}${path}`, {
    ...init,
    cache: 'no-store',
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
      'X-GitHub-Api-Version': '2022-11-28',
    },
  })
}

export const DATA_REPO = 'speak-mentor-data'
export const DATA_PATH = 'data/speak-mentor.json'

/** Accepts a user name, `@user` or a github.com profile URL. Empty means "token owner". */
export function parseGitHubUser(input: string): string {
  const user = input
    .trim()
    .replace(/^(https?:\/\/)?(www\.)?github\.com\//i, '')
    .replace(/^@/, '')
    .replace(/[/?#].*$/, '')
  const looksLikeOtherUrl = /:\/\/|\.\w+\//.test(input) && !/github\.com\//i.test(input)
  if (looksLikeOtherUrl || (user && !/^[a-z0-9][a-z0-9-]{0,38}$/i.test(user))) {
    throw new Error('Escribe tu usuario de GitHub o la URL de tu perfil.')
  }
  return user
}

interface RepoInfo {
  private: boolean
  default_branch: string
  permissions?: { push?: boolean }
}

export interface DataRepo {
  config: GitHubConfig
  created: boolean
  isPrivate: boolean
}

const CREATE_ERRORS: Record<number, string> = {
  403: 'El token no tiene permiso para crear repositorios. Usa un token clásico con el scope "repo", o uno fine-grained con acceso a todos los repositorios y permisos Administration y Contents (Read and write).',
  422: `El repositorio ${DATA_REPO} ya existe, pero el token no tiene acceso. Agrégalo a los repositorios del token.`,
}

/** Finds `speak-mentor-data` and creates it as private when missing. Never alters an existing one. */
export async function ensureDataRepo(
  token: string,
  userInput: string,
  fetchImpl: typeof fetch = (...args) => fetch(...args),
): Promise<DataRepo> {
  const requested = parseGitHubUser(userInput)
  const send = (path: string, init?: RequestInit) => request(token, fetchImpl, path, init)

  const me = await send('/user')
  if (!me.ok) throw new GitHubError(describe(me.status), me.status)
  const { login } = (await me.json()) as { login: string }
  const owner = requested || login
  const repoPath = `/repos/${encodeURIComponent(owner)}/${DATA_REPO}`

  let response = await send(repoPath)
  let created = false
  if (response.status === 404) {
    if (owner.toLowerCase() !== login.toLowerCase()) {
      throw new Error(
        `No se encontró ${owner}/${DATA_REPO} y el token pertenece a ${login}: solo se puede crear en esa cuenta.`,
      )
    }
    response = await send('/user/repos', {
      method: 'POST',
      body: JSON.stringify({
        name: DATA_REPO,
        description: 'Speak Mentor data',
        private: true,
        auto_init: true,
      }),
    })
    // A fine-grained token without the permission can answer 404 as well as 403.
    if (!response.ok) {
      const status = response.status === 404 ? 403 : response.status
      throw new GitHubError(CREATE_ERRORS[status] ?? describe(status), response.status)
    }
    created = true
  } else if (!response.ok) {
    throw new GitHubError(describe(response.status), response.status)
  }

  const info = (await response.json()) as RepoInfo
  if (info.permissions?.push === false) {
    throw new Error('El token no puede escribir en ese repositorio.')
  }
  if (!created) {
    const branch = await send(`${repoPath}/branches/${encodeURIComponent(info.default_branch)}`)
    if (branch.status === 404) {
      throw new Error(`El repositorio ${DATA_REPO} está vacío. Agrega un README y vuelve a intentarlo.`)
    }
    if (!branch.ok) throw new GitHubError(describe(branch.status), branch.status)
  }

  return {
    config: { owner, repo: DATA_REPO, branch: info.default_branch, path: DATA_PATH },
    created,
    isPrivate: info.private,
  }
}

export function githubAdapter(
  config: GitHubConfig,
  token: string,
  fetchImpl: typeof fetch = (...args) => fetch(...args),
): DocumentAdapter {
  const repoPath = `/repos/${encodeURIComponent(config.owner)}/${encodeURIComponent(config.repo)}`
  const send = (suffix: string, init?: RequestInit) =>
    request(token, fetchImpl, repoPath + suffix, init)
  const filePath = config.path.split('/').filter(Boolean).map(encodeURIComponent).join('/')

  const load = async (): Promise<{ doc: DbDocument; sha?: string }> => {
    const res = await send(`/contents/${filePath}?ref=${encodeURIComponent(config.branch)}`)
    if (res.status === 404) return { doc: emptyDocument() }
    if (!res.ok) throw new GitHubError(describe(res.status), res.status)
    let file = (await res.json()) as { sha: string; content: string; encoding: string }
    const { sha } = file
    // Files above 1 MB come without inline content; fetch the blob instead.
    if (file.encoding !== 'base64') {
      const blob = await send(`/git/blobs/${sha}`)
      if (!blob.ok) throw new GitHubError(describe(blob.status), blob.status)
      file = (await blob.json()) as typeof file
    }
    return { doc: parseDocument(decodeBase64(file.content)), sha }
  }

  let writes: Promise<unknown> = Promise.resolve()

  return {
    read: async () => {
      await writes.catch(() => undefined)
      return (await load()).doc
    },
    update(change, message) {
      const run = async () => {
        for (let attempt = 1; ; attempt++) {
          const { doc: current, sha } = await load()
          const { doc, result } = change(current)
          const res = await send(`/contents/${filePath}`, {
            method: 'PUT',
            body: JSON.stringify({
              message,
              branch: config.branch,
              content: encodeBase64(JSON.stringify(doc, null, 2)),
              ...(sha ? { sha } : {}),
            }),
          })
          if (res.ok) return result
          // 409/422: the file changed under us; re-read and re-apply.
          const conflict = res.status === 409 || res.status === 422
          if (!conflict || attempt === MAX_ATTEMPTS) {
            throw new GitHubError(describe(res.status), res.status)
          }
        }
      }
      const next = writes.then(run, run)
      writes = next
      return next
    },
  }
}
