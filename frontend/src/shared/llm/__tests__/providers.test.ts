import { describe, it, expect, vi, afterEach } from 'vitest'
import { buildProvider, ProviderLockedError } from '../registry'
import type { BuiltPrompt } from '@/shared/ollama/promptBuilder'

const prompt: BuiltPrompt = {
  system: 'sys', user: 'usr', format: 'json', timeout: 5000,
  options: { temperature: 0.2, top_p: 0.9, num_ctx: 4096 },
}
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } })

afterEach(() => {
  vi.unstubAllGlobals()
})

function stub(...responses: Response[]) {
  const requests: Request[] = []
  vi.stubGlobal('fetch', vi.fn(async (input: Request) => {
    requests.push(input.clone())
    return responses.shift()!
  }))
  return requests
}

describe('OpenAI direct provider', () => {
  const config = { provider: 'openai' as const, apiKey: '', model: 'm' }

  it('requires a key when not proxied', () => {
    expect(() => buildProvider(config)).toThrow(ProviderLockedError)
  })

  it('calls api.openai.com from the browser', async () => {
    const requests = stub(json({ choices: [{ message: { content: '{"a":1}' } }] }))
    expect(await buildProvider(config, { apiKey: 'k' }).chat(prompt)).toBe('{"a":1}')
    expect(requests[0].url).toBe('https://api.openai.com/v1/chat/completions')
    expect(requests[0].headers.get('authorization')).toBe('Bearer k')
  })

  it('retries without sampling params when the model rejects them', async () => {
    const requests = stub(
      json({ error: { message: "Unsupported value: 'temperature'" } }, 400),
      json({ choices: [{ message: { content: '{}' } }] }),
    )
    await buildProvider(config, { apiKey: 'k' }).chat(prompt)
    expect(await requests[1].json()).not.toHaveProperty('temperature')
  })
})

describe('Anthropic direct provider', () => {
  const config = { provider: 'anthropic' as const, apiKey: '', model: 'claude-opus-5-5' }

  it('omits sampling params and unwraps fenced JSON', async () => {
    const requests = stub(json({ content: [{ type: 'text', text: '```json\n{"a":1}\n```' }], stop_reason: 'end_turn' }))
    expect(await buildProvider(config, { apiKey: 'k' }).chat(prompt)).toBe('{"a":1}')
    const body = await requests[0].json()
    expect(body).not.toHaveProperty('temperature')
    expect(body).not.toHaveProperty('top_p')
  })

  it('reports truncated and refused replies', async () => {
    stub(json({ content: [], stop_reason: 'refusal' }))
    await expect(buildProvider(config, { apiKey: 'k' }).chat(prompt)).rejects.toThrow(/refusal/)
  })
})
