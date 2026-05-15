import { useState } from 'react'
import { toast } from 'sonner'
import { buildPrompt } from '@/shared/ollama/promptBuilder'
import { correctText, OllamaParseError } from '@/shared/ollama/client'
import { saveSession } from '@/shared/api/flaskClient'
import { useSettingsStore } from '@/stores/settingsStore'
import type { CEFRLevel, ErrorItem } from '@/shared/types'
import type { CorrectionResponse } from '@/shared/ollama/schemas'

interface UseCorrectionReturn {
  result: CorrectionResponse | null
  rawError: string | null
  loading: boolean
  saving: boolean
  savedSessionId: number | null
  correct: (text: string, level: CEFRLevel) => Promise<void>
  save: (text: string, level: CEFRLevel) => Promise<void>
  reset: () => void
}

export function useCorrection(): UseCorrectionReturn {
  const { ollama, modelParams, prompts, setLastCorrectionLevel } = useSettingsStore()
  const [result, setResult] = useState<CorrectionResponse | null>(null)
  const [rawError, setRawError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [savedSessionId, setSavedSessionId] = useState<number | null>(null)

  const correct = async (text: string, level: CEFRLevel) => {
    setLoading(true)
    setRawError(null)
    setResult(null)
    setSavedSessionId(null)
    setLastCorrectionLevel(level)
    try {
      const prompt = buildPrompt({
        mode: 'correction', text, level,
        systemOverride: prompts.correctionSystem,
        modelParams,
      })
      const response = await correctText(ollama, prompt, ollama.model, text)
      setResult(response)
    } catch (err) {
      if (err instanceof OllamaParseError) {
        setRawError(err.rawOutput)
        toast.error('El modelo devolvió una respuesta inválida. Ver detalle abajo.')
      } else {
        toast.error('Error al conectar con Ollama. Verificá la configuración.')
      }
    } finally {
      setLoading(false)
    }
  }

  const save = async (text: string, level: CEFRLevel) => {
    if (!result) return
    setSaving(true)
    try {
      const errors: ErrorItem[] = result.errors.map((e) => ({
        original: e.original,
        correction: e.correction,
        type: e.type,
        severity: e.severity,
        position_start: e.position?.start,
        position_end: e.position?.end,
        position_unreliable: (e as { position_unreliable?: boolean }).position_unreliable,
        explanation: e.explanation,
        rule_reference: e.rule_reference,
        example: e.example,
      }))
      const { session_id } = await saveSession({
        mode: 'correction',
        source_lang: 'de',
        target_lang: 'de',
        level,
        input_text: text,
        output_text: result.corrected,
        raw_llm: JSON.stringify(result),
        model: ollama.model,
        errors,
      })
      setSavedSessionId(session_id)
      toast.success('Sesión guardada')
    } catch {
      toast.error('Error al guardar la sesión')
    } finally {
      setSaving(false)
    }
  }

  const reset = () => {
    setResult(null)
    setRawError(null)
    setSavedSessionId(null)
  }

  return { result, rawError, loading, saving, savedSessionId, correct, save, reset }
}
