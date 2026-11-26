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
  config: GitHubConfig,
  token: string,
  fetchImpl: typeof fetch,
  suffix: string,
  init: RequestInit = {},
): Promise<Response> {
  const repo = `${encodeURIComponent(config.owner)}/${encodeURIComponent(config.repo)}`
  return fetchImpl(`${API}/repos/${repo}${suffix}`, {
    ...init,
    cache: 'no-store',
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
      'X-GitHub-Api-Version': '2022-11-28',
    },
  })
}

export async function inspectRepo(
  config: GitHubConfig,
  token: string,
  fetchImpl: typeof fetch = (...args) => fetch(...args),
): Promise<{ private: boolean; canWrite: boolean }> {
  const repo = await request(config, token, fetchImpl, '')
  if (!repo.ok) throw new GitHubError(describe(repo.status), repo.status)
  const info = (await repo.json()) as { private: boolean; permissions?: { push?: boolean } }
  const branch = await request(config, token, fetchImpl, `/branches/${encodeURIComponent(config.branch)}`)
  if (!branch.ok) throw new GitHubError(describe(branch.status), branch.status)
  return { private: info.private, canWrite: info.permissions?.push ?? false }
}

export function githubAdapter(
  config: GitHubConfig,
  token: string,
  fetchImpl: typeof fetch = (...args) => fetch(...args),
): DocumentAdapter {
  const filePath = config.path.split('/').filter(Boolean).map(encodeURIComponent).join('/')

  const load = async (): Promise<{ doc: DbDocument; sha?: string }> => {
    const res = await request(
      config, token, fetchImpl,
      `/contents/${filePath}?ref=${encodeURIComponent(config.branch)}`,
    )
    if (res.status === 404) return { doc: emptyDocument() }
    if (!res.ok) throw new GitHubError(describe(res.status), res.status)
    let file = (await res.json()) as { sha: string; content: string; encoding: string }
    const { sha } = file
    // Files above 1 MB come without inline content; fetch the blob instead.
    if (file.encoding !== 'base64') {
      const blob = await request(config, token, fetchImpl, `/git/blobs/${sha}`)
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
          const res = await request(config, token, fetchImpl, `/contents/${filePath}`, {
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
