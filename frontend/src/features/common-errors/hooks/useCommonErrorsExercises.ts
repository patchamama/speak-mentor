import { useState, useCallback } from 'react'
import { useSettingsStore } from '@/stores/settingsStore'
import { buildPrompt } from '@/shared/ollama/promptBuilder'
import { callOllama } from '@/shared/ollama/client'
import type { CommonErrorCategory } from '../data/commonErrors'
import type { CEFRLevel, Lang } from '@/shared/types'

export interface ChooseOneExercise {
  id: number
  type: 'choose_one'
  targets_error_type: string
  instruction: string
  prompt: string
  options: string[]
  answer: string
  answer_explanation: string
  rule_reference?: string
}

export interface FillTableCell {
  value: string
  isHeader: boolean
}

export interface FillTableExercise {
  id: number
  type: 'fill_table'
  targets_error_type: string
  instruction: string
  table_title: string
  headers: string[]
  rows: FillTableCell[][]
  answer_explanation: string
}

export type CommonErrorExercise = ChooseOneExercise | FillTableExercise

export interface CommonErrorsExercisesResult {
  exercises: CommonErrorExercise[]
  study_advice: string
}

type Status = 'idle' | 'loading' | 'done' | 'error'

interface UseCommonErrorsExercisesReturn {
  status: Status
  result: CommonErrorsExercisesResult | null
  error: string | null
  generate: () => Promise<void>
}

export function useCommonErrorsExercises(
  category: CommonErrorCategory,
  level: CEFRLevel,
  explanationLang: Lang = 'es',
): UseCommonErrorsExercisesReturn {
  const [status, setStatus] = useState<Status>('idle')
  const [result, setResult] = useState<CommonErrorsExercisesResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const { ollama } = useSettingsStore()

  const generate = useCallback(async () => {
    setStatus('loading')
    setError(null)

    try {
      const prompt = buildPrompt({
        mode: 'commonErrorsExercises',
        category,
        level,
        explanationLang,
      })

      const raw = await callOllama(ollama, prompt, ollama.model, ollama.keepAlive)
      const parsed = JSON.parse(raw) as CommonErrorsExercisesResult

      if (!parsed.exercises || !Array.isArray(parsed.exercises)) {
        throw new Error('Respuesta inválida del modelo')
      }

      setResult(parsed)
      setStatus('done')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
      setStatus('error')
    }
  }, [category, level, explanationLang, ollama])

  return { status, result, error, generate }
}
