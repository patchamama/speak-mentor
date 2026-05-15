import { z } from 'zod'

export const ErrorTypeEnum = z.enum([
  'gender', 'case', 'declension', 'conjugation', 'preposition',
  'word_order', 'spelling', 'punctuation', 'vocabulary', 'style',
  'agreement', 'tense', 'mood', 'voice', 'particle',
])

export const SeverityEnum = z.enum(['critical', 'major', 'minor'])
export const LevelEnum = z.enum(['A1', 'A2', 'B1', 'B2', 'C1', 'C2'])

export const CorrectionResponseSchema = z.object({
  corrected: z.string(),
  level_assessment: z.object({
    detected_level: LevelEnum,
    target_level: LevelEnum,
    gap_notes: z.string(),
  }),
  errors: z.array(
    z.object({
      original: z.string(),
      correction: z.string(),
      type: ErrorTypeEnum,
      severity: SeverityEnum,
      position: z.object({ start: z.number().int(), end: z.number().int() }).nullable().optional(),
      explanation: z.string(),
      rule_reference: z.string().optional(),
      example: z.string().optional(),
    })
  ),
  summary: z.object({
    error_count: z.number().int(),
    by_type: z.record(z.string(), z.number()),
    main_focus: z.string(),
  }),
  tips: z.array(z.string()).max(3),
})

export type CorrectionResponse = z.infer<typeof CorrectionResponseSchema>

export const TranslationResponseSchema = z.object({
  source_lang: z.string(),
  target_lang: z.string(),
  level: LevelEnum,
  translation: z.string(),
  alternatives: z.array(
    z.object({
      text: z.string(),
      register: z.enum(['neutral', 'formal', 'informal', 'colloquial', 'literary']),
      note: z.string(),
    })
  ).optional().default([]),
  vocabulary_notes: z.array(
    z.object({
      source_term: z.string(),
      target_term: z.string(),
      type: z.enum(['false_friend', 'idiom', 'collocation', 'register', 'cultural', 'polysemy']),
      explanation: z.string(),
    })
  ).optional().default([]),
  grammar_notes: z.array(
    z.object({
      topic: z.string(),
      explanation: z.string(),
      level_relevant: LevelEnum,
    })
  ).optional().default([]),
  level_adaptation_notes: z.string().optional().default(''),
})

export type TranslationResponse = z.infer<typeof TranslationResponseSchema>
