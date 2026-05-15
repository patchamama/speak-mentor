import { useState, useCallback } from 'react'
import { useSettingsStore } from '@/stores/settingsStore'
import { useFaviconStore } from '@/stores/faviconStore'
import { buildPrompt } from '@/shared/ollama/promptBuilder'
import { callOllama } from '@/shared/ollama/client'
import type { CommonErrorCategory, ReferenceTable } from '../data/commonErrors'
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

// Tables that should never appear as fill exercises
const EXCLUDED_TABLE_TITLES = ['Usos y matices de cada modal']

// ── Helpers ───────────────────────────────────────────────────────────────────

function refTableToFillTable(table: ReferenceTable, id: number): FillTableExercise {
  // Col 0 = case/pronoun labels → always isHeader: true
  // All other cells → isHeader: false (fillable)
  const rows: FillTableCell[][] = table.rows.map((row) =>
    row.map((val, ci) => ({ value: val, isHeader: ci === 0 })),
  )
  return {
    id,
    type: 'fill_table',
    targets_error_type: 'declension',
    instruction: `Completá la tabla: ${table.title}`,
    table_title: table.title,
    headers: table.headers,
    rows,
    answer_explanation: table.note ?? '',
  }
}

function deduplicateOptions(exercises: CommonErrorExercise[]): CommonErrorExercise[] {
  return exercises.map((ex) => {
    if (ex.type !== 'choose_one') return ex
    const seen = new Set<string>()
    const unique = ex.options.filter((o) => {
      const key = o.trim().toLowerCase()
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
    return { ...ex, options: unique }
  })
}

// ─────────────────────────────────────────────────────────────────────────────

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
  const faviconKey = `common-errors-${category.id}`
  const setTask = useFaviconStore((s) => s.setTask)

  const generate = useCallback(async () => {
    setStatus('loading')
    setError(null)
    setTask(faviconKey, 10)

    try {
      // Build fill_table exercises directly from reference tables (no AI needed)
      const staticFillTables: FillTableExercise[] = (category.referenceTables ?? [])
        .filter((t) => !EXCLUDED_TABLE_TITLES.includes(t.title))
        .map((table, i) => refTableToFillTable(table, -(i + 1)))

      const prompt = buildPrompt({
        mode: 'commonErrorsExercises',
        category,
        level,
        explanationLang,
      })

      setTask(faviconKey, 40)
      const raw = await callOllama(ollama, prompt, ollama.model, ollama.keepAlive)
      setTask(faviconKey, 90)
      const parsed = JSON.parse(raw) as CommonErrorsExercisesResult

      if (!parsed.exercises || !Array.isArray(parsed.exercises)) {
        throw new Error('Respuesta inválida del modelo')
      }

      // Keep only choose_one from AI (discard any AI-generated fill_table — use real data instead)
      const chooseOnly = parsed.exercises.filter((e) => e.type === 'choose_one')
      const allExercises = deduplicateOptions([...staticFillTables, ...chooseOnly])

      setResult({ ...parsed, exercises: allExercises })
      setStatus('done')
      setTask(faviconKey, null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
      setStatus('error')
      setTask(faviconKey, null)
    }
  }, [category, level, explanationLang, ollama, faviconKey, setTask])

  return { status, result, error, generate }
}
