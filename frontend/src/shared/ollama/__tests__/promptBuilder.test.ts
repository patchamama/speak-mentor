import { describe, it, expect } from 'vitest'
import { buildPrompt } from '../promptBuilder'

describe('buildPrompt', () => {
  it('builds correction prompt with correct substitutions', () => {
    const result = buildPrompt({ mode: 'correction', text: 'Ich gehe zu der Schule.', level: 'B1' })
    expect(result.system).toContain('B1')
    expect(result.system).toContain('Spanish')
    expect(result.user).toContain('B1')
    expect(result.user).toContain('Ich gehe zu der Schule.')
    expect(result.format).toBe('json')
    expect(result.options.temperature).toBe(0.2)
  })

  it('builds translation prompt with source/target lang', () => {
    const result = buildPrompt({
      mode: 'translation',
      text: 'Hola mundo',
      sourceLang: 'es',
      targetLang: 'de',
      level: 'A2',
    })
    expect(result.system).toContain('es')
    expect(result.system).toContain('de')
    expect(result.user).toContain('Hola mundo')
    expect(result.options.temperature).toBe(0.2)
  })
})
