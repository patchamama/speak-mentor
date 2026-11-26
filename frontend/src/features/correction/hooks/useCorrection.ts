import { getLanguage, t } from '@/i18n'
import { useState } from 'react'
import { toast } from 'sonner'
import { buildPrompt } from '@/shared/ollama/promptBuilder'
import { correctText, OllamaParseError } from '@/shared/ollama/client'
import { saveSession } from '@/shared/storage'
import { useSettingsStore } from '@/stores/settingsStore'
import { useActiveLLMProvider } from '@/shared/llm/hooks'
import { PROVIDER_LABELS } from '@/shared/llm/registry'
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
  const { modelParams, prompts, setLastCorrectionLevel } = useSettingsStore()
  const { provider, locked, config } = useActiveLLMProvider()
  const [result, setResult] = useState<CorrectionResponse | null>(null)
  const [rawError, setRawError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [savedSessionId, setSavedSessionId] = useState<number | null>(null)

  const correct = async (text: string, level: CEFRLevel) => {
    if (!provider) {
      toast.error(
        locked
          ? t('{name} está bloqueado o sin configurar: introduce la clave maestra en Configuración → Conexión y almacenamiento.', { name: PROVIDER_LABELS[locked] })
          : t('Configura un proveedor de LLM en Configuración → Conexión y almacenamiento.'),
      )
      return
    }
    setLoading(true)
    setRawError(null)
    setResult(null)
    setSavedSessionId(null)
    setLastCorrectionLevel(level)
    try {
      const prompt = buildPrompt({
        mode: 'correction', text, level,
        systemOverride: prompts.correctionSystem,
        explanationLang: getLanguage(),
        modelParams,
      })
      const response = await correctText(provider, prompt, text)
      setResult(response)
    } catch (err) {
      if (err instanceof OllamaParseError) {
        setRawError(err.rawOutput)
        toast.error(t('El modelo devolvió una respuesta inválida. Ver detalle abajo.'))
      } else {
        toast.error(t('Error al conectar con el proveedor. Revisa la configuración.'))
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
        model: config?.model,
        errors,
      })
      setSavedSessionId(session_id)
      toast.success(t('Sesión guardada'))
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('Error al guardar la sesión'))
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
