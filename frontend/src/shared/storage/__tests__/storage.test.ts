import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createDocumentStore } from '../document'
import { browserAdapter, BROWSER_KEY } from '../browser'
import { githubAdapter } from '../github'
import { resolveTarget } from '../resolve'

const session = {
  mode: 'correction' as const,
  source_lang: 'de' as const,
  target_lang: 'de' as const,
  level: 'B1' as const,
  input_text: 'Ich gehe zu der Schule über',
  output_text: 'Ich gehe zur Schule',
  errors: [
    { original: 'zu der', correction: 'zur', type: 'preposition', severity: 'major' as const, explanation: 'x', rule_reference: 'R1' },
  ],
}

describe('browser document store', () => {
  beforeEach(() => localStorage.clear())

  it('saves, lists without errors, details with errors, deletes', async () => {
    const store = createDocumentStore(browserAdapter())
    const { session_id } = await store.saveSession(session)
    const list = await store.listSessions({ page: 1, per_page: 20 })
    expect(list.total).toBe(1)
    expect(list.sessions[0].errors).toBeUndefined()
    expect((await store.getSession(session_id)).errors).toHaveLength(1)
    await store.deleteSession(session_id)
    expect((await store.listSessions()).total).toBe(0)
  })

  it('filters by mode and never reuses ids', async () => {
    const store = createDocumentStore(browserAdapter())
    const first = await store.saveSession(session)
    await store.deleteSession(first.session_id)
    const second = await store.saveSession({ ...session, mode: 'translation', errors: [] })
    expect(second.session_id).toBeGreaterThan(first.session_id)
    expect((await store.listSessions({ mode: 'correction' })).total).toBe(0)
  })

  it('computes the same stats shapes as the backend', async () => {
    const store = createDocumentStore(browserAdapter())
    await store.saveSession(session)
    await store.saveSession(session)
    expect(await store.getStatsByType()).toEqual([{ type: 'preposition', count: 2 }])
    expect(await store.getStatsByLevel()).toEqual([{ level: 'B1', count: 2 }])
    expect(await store.getTopRules(10)).toEqual([{ rule: 'R1', count: 2 }])
    expect((await store.getStatsTimeline(30))[0].count).toBe(2)
  })

  it('refuses to overwrite a corrupted document', async () => {
    localStorage.setItem(BROWSER_KEY, '{broken')
    await expect(createDocumentStore(browserAdapter()).saveSession(session)).rejects.toThrow()
    expect(localStorage.getItem(BROWSER_KEY)).toBe('{broken')
  })
})

const cfg = { owner: 'o', repo: 'r', branch: 'main', path: 'data/db.json' }
const b64 = (s: string) => btoa(String.fromCharCode(...new TextEncoder().encode(s)))
const unb64 = (s: string) => new TextDecoder().decode(Uint8Array.from(atob(s), (c) => c.charCodeAt(0)))
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status })

function fakeGitHub(options: { conflicts?: number; initial?: string; large?: boolean } = {}) {
  let file: string | null = options.initial ?? null
  let sha = 1
  let conflicts = options.conflicts ?? 0
  const calls: { url: string; init: RequestInit }[] = []
  const fetchImpl = vi.fn(async (url: string, init: RequestInit = {}) => {
    calls.push({ url, init })
    if (url.includes('/git/blobs/')) return json({ content: b64(file!), encoding: 'base64' })
    if (init.method === 'PUT') {
      const body = JSON.parse(init.body as string)
      if (conflicts-- > 0) return json({ message: 'conflict' }, 409)
      file = unb64(body.content)
      sha++
      return json({})
    }
    if (file === null) return json({ message: 'Not Found' }, 404)
    return options.large
      ? json({ sha: `s${sha}`, content: '', encoding: 'none' })
      : json({ sha: `s${sha}`, content: b64(file), encoding: 'base64' })
  })
  return { fetchImpl: fetchImpl as unknown as typeof fetch, calls, read: () => file }
}

describe('github document store', () => {
  it('creates the JSON file, keeps UTF-8 and sends the token only as a header', async () => {
    const gh = fakeGitHub()
    const store = createDocumentStore(githubAdapter(cfg, 'tok_secret', gh.fetchImpl))
    await store.saveSession(session)
    expect(JSON.parse(gh.read()!).sessions[0].input_text).toBe(session.input_text)
    expect(gh.read()).not.toContain('tok_secret')
    for (const c of gh.calls) {
      expect(c.url.startsWith('https://api.github.com/repos/o/r/')).toBe(true)
      expect(c.url).not.toContain('tok_secret')
      expect((c.init.headers as Record<string, string>).Authorization).toBe('Bearer tok_secret')
    }
  })

  it('re-reads and retries on a write conflict', async () => {
    const gh = fakeGitHub({ conflicts: 1 })
    await createDocumentStore(githubAdapter(cfg, 't', gh.fetchImpl)).saveSession(session)
    expect(JSON.parse(gh.read()!).sessions).toHaveLength(1)
  })

  it('serializes concurrent saves', async () => {
    const gh = fakeGitHub()
    const store = createDocumentStore(githubAdapter(cfg, 't', gh.fetchImpl))
    await Promise.all([store.saveSession(session), store.saveSession(session)])
    expect(JSON.parse(gh.read()!).sessions.map((s: { id: number }) => s.id)).toEqual([1, 2])
  })

  it('never overwrites a file it cannot parse', async () => {
    const gh = fakeGitHub({ initial: '{"something":"else"}' })
    await expect(createDocumentStore(githubAdapter(cfg, 't', gh.fetchImpl)).saveSession(session)).rejects.toThrow()
    expect(gh.read()).toBe('{"something":"else"}')
  })

  it('reads files above the contents API inline limit', async () => {
    const gh = fakeGitHub({ initial: '{"version":1,"nextId":1,"sessions":[]}', large: true })
    expect((await createDocumentStore(githubAdapter(cfg, 't', gh.fetchImpl)).listSessions()).total).toBe(0)
  })
})

describe('resolveTarget', () => {
  it('auto prefers backend, then GitHub, then browser', () => {
    expect(resolveTarget('auto', true, true)).toBe('backend')
    expect(resolveTarget('auto', false, true)).toBe('github')
    expect(resolveTarget('auto', false, false)).toBe('browser')
  })
  it('honours an explicit choice', () => {
    expect(resolveTarget('browser', true, true)).toBe('browser')
    expect(resolveTarget('github', true, false)).toBe('github')
  })
})
