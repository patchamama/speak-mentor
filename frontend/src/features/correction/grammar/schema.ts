import { z } from 'zod'

const text = z.string()
const list = z.array(text).default([])

export const GrammarExplanationSchema = z.object({
  title: text,
  summary: text,
  rules: list,
  tables: z
    .array(
      z.object({
        title: text,
        headers: z.array(text),
        rows: z.array(z.array(z.coerce.string())),
        note: text.nullish().transform((v) => v ?? undefined),
      }),
    )
    .default([]),
  examples: z.array(z.object({ wrong: text, correct: text, why: text.default('') })).default([]),
  spanish_comparison: text.default(''),
  tips: list,
})

export type GrammarExplanation = z.infer<typeof GrammarExplanationSchema>
