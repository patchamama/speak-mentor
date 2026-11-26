import { describe, it, expect, vi } from 'vitest'
import { ensureDataRepo, parseGitHubUser } from '../github'

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status })

function fakeApi(options: { exists?: boolean; private?: boolean; createStatus?: number; branchStatus?: number } = {}) {
  const calls: { method: string; path: string; body?: unknown }[] = []
  const repo = { private: options.private ?? true, default_branch: 'trunk', permissions: { push: true } }
  const fetchImpl = vi.fn(async (url: string, init: RequestInit = {}) => {
    const path = url.replace('https://api.github.com', '')
    const method = init.method ?? 'GET'
    calls.push({ method, path, body: init.body ? JSON.parse(init.body as string) : undefined })
    if (path === '/user') return json({ login: 'Ana' })
    if (method === 'POST') {
      const status = options.createStatus ?? 201
      return json(repo, status)
    }
    if (path.includes('/branches/')) return json({}, options.branchStatus ?? 200)
    return options.exists ? json(repo) : json({}, 404)
  })
  return { fetchImpl: fetchImpl as unknown as typeof fetch, calls }
}

describe('parseGitHubUser', () => {
  it.each(['ana', '@ana', ' ana ', 'github.com/ana', 'https://github.com/ana/', 'https://www.github.com/ana?tab=repositories'])(
    'reads the user from %s',
    (input) => expect(parseGitHubUser(input)).toBe('ana'),
  )
  it('allows an empty value', () => expect(parseGitHubUser('  ')).toBe(''))
  it.each(['https://gitlab.com/ana', 'a b', '../x', '-ana'])('rejects %s', (input) => {
    expect(() => parseGitHubUser(input)).toThrow()
  })
})

describe('ensureDataRepo', () => {
  it('creates a private speak-mentor-data repository when missing', async () => {
    const api = fakeApi()
    const result = await ensureDataRepo('t', 'https://github.com/ana', api.fetchImpl)
    const post = api.calls.find((c) => c.method === 'POST')!
    expect(post.path).toBe('/user/repos')
    expect(post.body).toMatchObject({ name: 'speak-mentor-data', private: true, auto_init: true })
    expect(result).toEqual({
      config: { owner: 'ana', repo: 'speak-mentor-data', branch: 'trunk', path: 'data/speak-mentor.json' },
      created: true,
      isPrivate: true,
    })
  })

  it('reuses an existing repository without creating or changing it', async () => {
    const api = fakeApi({ exists: true, private: false })
    const result = await ensureDataRepo('t', '', api.fetchImpl)
    expect(result).toMatchObject({ created: false, isPrivate: false, config: { owner: 'Ana' } })
    expect(api.calls.every((c) => c.method === 'GET')).toBe(true)
  })

  it('does not create a repository under somebody else', async () => {
    const api = fakeApi()
    await expect(ensureDataRepo('t', 'bob', api.fetchImpl)).rejects.toThrow(/Ana/)
    expect(api.calls.some((c) => c.method === 'POST')).toBe(false)
  })

  it.each([[403, /permiso/], [422, /acceso/]])('explains a %i on creation', async (createStatus, message) => {
    await expect(ensureDataRepo('t', '', fakeApi({ createStatus }).fetchImpl)).rejects.toThrow(message)
  })

  it('reports an existing repository without commits', async () => {
    const api = fakeApi({ exists: true, branchStatus: 404 })
    await expect(ensureDataRepo('t', '', api.fetchImpl)).rejects.toThrow(/vacío/)
  })
})
