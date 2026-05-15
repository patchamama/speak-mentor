import { describe, it, expect } from 'vitest'
import { CorrectionResponseSchema, TranslationResponseSchema } from '../schemas'

describe('CorrectionResponseSchema', () => {
  it('validates a correct response', () => {
    const result = CorrectionResponseSchema.safeParse({
      corrected: 'Ich gehe zur Schule.',
      level_assessment: { detected_level: 'A2', target_level: 'B1', gap_notes: 'gap' },
      errors: [],
      summary: { error_count: 0, by_type: {}, main_focus: 'ok' },
      tips: ['tip 1'],
    })
    expect(result.success).toBe(true)
  })

  it('rejects invalid error type', () => {
    const result = CorrectionResponseSchema.safeParse({
      corrected: '',
      level_assessment: { detected_level: 'A1', target_level: 'A1', gap_notes: '' },
      errors: [{ original: 'x', correction: 'y', type: 'invalid_type', severity: 'minor', explanation: 'x' }],
      summary: { error_count: 1, by_type: {}, main_focus: '' },
      tips: [],
    })
    expect(result.success).toBe(false)
  })
})

describe('TranslationResponseSchema', () => {
  it('validates a minimal valid response', () => {
    const result = TranslationResponseSchema.safeParse({
      source_lang: 'es',
      target_lang: 'de',
      level: 'B1',
      translation: 'Hallo Welt',
    })
    expect(result.success).toBe(true)
  })
})
