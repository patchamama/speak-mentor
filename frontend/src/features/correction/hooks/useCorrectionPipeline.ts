import { useState, useCallback } from 'react'
import { useSettingsStore } from '@/stores/settingsStore'
import { buildPrompt } from '@/shared/ollama/promptBuilder'
import { callOllama } from '@/shared/ollama/client'
import type { CEFRLevel, Lang, CorrectionPassId } from '@/shared/types'
import { CorrectionResponseSchema } from '@/shared/ollama/schemas'
import { z } from 'zod'

const VerbInfoSchema = z.object({
  infinitiv: z.string().optional(),
  partizip_II: z.string().optional(),
  präteritum_3sg: z.string().optional(),
  auxiliary: z.enum(['haben', 'sein']).optional(),
  separable: z.boolean().optional(),
  prefix: z.string().nullable().optional(),
  strong: z.boolean().optional(),
  vowel_change: z.string().nullable().optional(),
}).nullable().optional()

const NounInfoSchema = z.object({
  article: z.enum(['der', 'die', 'das']).optional(),
  plural: z.string().optional(),
  genitive_sg: z.string().optional(),
}).nullable().optional()

const AdjInfoSchema = z.object({
  comparative: z.string().optional(),
  superlative: z.string().optional(),
  strong_nom: z.object({ mask: z.string(), fem: z.string(), neut: z.string() }).optional(),
}).nullable().optional()

const GrammarSchema = z.object({
  verb_info: VerbInfoSchema,
  noun_info: NounInfoSchema,
  adjective_info: AdjInfoSchema,
}).nullable().optional()

const VocabCardSchema = z.object({
  word: z.string(),
  part_of_speech: z.string(),
  translation: z.string(),
  grammar: GrammarSchema,
  collocation: z.string().optional(),
  tip: z.string().optional(),
})

const VocabularyResponseSchema = z.object({
  vocab_cards: z.array(VocabCardSchema),
  summary: z.object({ word_count: z.number(), focus_areas: z.array(z.string()) }).optional(),
})

const ExerciseSchema = z.object({
  id: z.number(),
  type: z.string(),
  targets_error_type: z.string(),
  instruction: z.string(),
  prompt: z.string(),
  options: z.array(z.string()).nullable().optional(),
  answer: z.string(),
  answer_explanation: z.string(),
  rule_reference: z.string().optional(),
})

const ExercisesResponseSchema = z.object({
  exercises: z.array(ExerciseSchema),
  study_advice: z.string().optional(),
})

export type VocabCard = z.infer<typeof VocabCardSchema>
export type Exercise = z.infer<typeof ExerciseSchema>
export type CorrectionResult = z.infer<typeof CorrectionResponseSchema>
export type VocabularyResult = z.infer<typeof VocabularyResponseSchema>
export type ExercisesResult = z.infer<typeof ExercisesResponseSchema>

export type PassStatus = 'idle' | 'running' | 'done' | 'error'

export interface PassState<T> {
  status: PassStatus
  data: T | null
  error: string | null
  elapsedMs: number | null
}

export interface PipelineState {
  correction: PassState<CorrectionResult>
  vocabulary: PassState<VocabularyResult>
  exercises: PassState<ExercisesResult>
}

const initialPass = <T>(): PassState<T> => ({
  status: 'idle',
  data: null,
  error: null,
  elapsedMs: null,
})

const initialState = (): PipelineState => ({
  correction: initialPass(),
  vocabulary: initialPass(),
  exercises: initialPass(),
})

export function useCorrectionPipeline() {
  const { ollama, modelParams, prompts, pipeline } = useSettingsStore()
  const [state, setState] = useState<PipelineState>(initialState())

  const updatePass = useCallback(
    <K extends keyof PipelineState>(pass: K, update: Partial<PassState<PipelineState[K]['data']>>) => {
      setState((prev) => ({
        ...prev,
        [pass]: { ...prev[pass], ...update },
      }))
    },
    [],
  )

  const reset = useCallback(() => setState(initialState()), [])

  const run = useCallback(
    async (text: string, level: CEFRLevel, explanationLang: Lang = 'es', passesOverride?: CorrectionPassId[]) => {
      setState(initialState())
      const passes = passesOverride ?? pipeline.passes

      // ── PASS 1: Correction (always runs) ──────────────────────────
      updatePass('correction', { status: 'running' })
      const t0 = Date.now()
      let correctionData: CorrectionResult | null = null

      try {
        const built = buildPrompt({
          mode: 'correction',
          text,
          level,
          explanationLang,
          systemOverride: prompts.correctionSystem,
          modelParams,
        })
        const rawStr = await callOllama(ollama, built, ollama.model)
        correctionData = CorrectionResponseSchema.parse(JSON.parse(rawStr))
        updatePass('correction', {
          status: 'done',
          data: correctionData,
          elapsedMs: Date.now() - t0,
        })
      } catch (err) {
        updatePass('correction', {
          status: 'error',
          error: err instanceof Error ? err.message : String(err),
          elapsedMs: Date.now() - t0,
        })
        return // abort pipeline on pass 1 failure
      }

      // ── PASS 1.5: Verification of corrected text ──────────────────
      try {
        const verifyBuilt = buildPrompt({ mode: 'verification', correctedText: correctionData.corrected, modelParams })
        const verifyRaw = await callOllama(ollama, verifyBuilt, ollama.model)
        const verifyResult = JSON.parse(verifyRaw) as { ok: boolean; fixed: string | null }
        if (!verifyResult.ok && verifyResult.fixed) {
          correctionData = { ...correctionData, corrected: verifyResult.fixed }
          updatePass('correction', { data: correctionData })
        }
      } catch {
        // verification is best-effort — don't abort the pipeline
      }

      // ── PASS 2: Vocabulary (optional) ─────────────────────────────
      if (passes.includes('vocabulary') && correctionData) {
        updatePass('vocabulary', { status: 'running' })
        const t1 = Date.now()
        try {
          const built = buildPrompt({
            mode: 'vocabulary',
            originalText: text,
            correctedText: correctionData.corrected,
            level,
            explanationLang,
            systemOverride: prompts.vocabularySystem,
            modelParams,
          })
          const rawStr = await callOllama(ollama, built, ollama.model)
          const data = VocabularyResponseSchema.parse(JSON.parse(rawStr))
          updatePass('vocabulary', { status: 'done', data, elapsedMs: Date.now() - t1 })
        } catch (err) {
          updatePass('vocabulary', {
            status: 'error',
            error: err instanceof Error ? err.message : String(err),
            elapsedMs: Date.now() - t1,
          })
        }
      }

      // ── PASS 3: Exercises (optional) ──────────────────────────────
      if (passes.includes('exercises') && correctionData && correctionData.errors.length > 0) {
        updatePass('exercises', { status: 'running' })
        const t2 = Date.now()
        try {
          const errorsForPrompt = correctionData.errors.map((e) => ({
            type: e.type,
            original: e.original,
            correction: e.correction,
            explanation: e.explanation,
          }))
          const built = buildPrompt({
            mode: 'exercises',
            correctedText: correctionData.corrected,
            errors: errorsForPrompt,
            level,
            explanationLang,
            systemOverride: prompts.exercisesSystem,
            modelParams,
          })
          const rawStr = await callOllama(ollama, built, ollama.model)
          const data = ExercisesResponseSchema.parse(JSON.parse(rawStr))
          updatePass('exercises', { status: 'done', data, elapsedMs: Date.now() - t2 })
        } catch (err) {
          updatePass('exercises', {
            status: 'error',
            error: err instanceof Error ? err.message : String(err),
            elapsedMs: Date.now() - t2,
          })
        }
      }
    },
    [ollama, modelParams, prompts, pipeline, updatePass],
  )

  const isRunning =
    state.correction.status === 'running' ||
    state.vocabulary.status === 'running' ||
    state.exercises.status === 'running'

  const activePasses = pipeline.passes as CorrectionPassId[]

  return { state, run, reset, isRunning, activePasses }
}
