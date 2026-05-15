import { useState } from 'react'
import { toast } from 'sonner'
import { buildPrompt } from '@/shared/ollama/promptBuilder'
import { translateText, OllamaParseError } from '@/shared/ollama/client'
import { saveSession } from '@/shared/api/flaskClient'
import { useSettingsStore } from '@/stores/settingsStore'
import type { CEFRLevel, Lang } from '@/shared/types'
import type { TranslationResponse } from '@/shared/ollama/schemas'

interface UseTranslationReturn {
  result: TranslationResponse | null
  rawError: string | null
  loading: boolean
  saving: boolean
  savedSessionId: number | null
  translate: (text: string, sourceLang: Lang, targetLang: Lang, level: CEFRLevel) => Promise<void>
  save: (text: string, sourceLang: Lang, targetLang: Lang, level: CEFRLevel) => Promise<void>
  reset: () => void
}

export function useTranslation(): UseTranslationReturn {
  const { ollama } = useSettingsStore()
  const [result, setResult] = useState<TranslationResponse | null>(null)
  const [rawError, setRawError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [savedSessionId, setSavedSessionId] = useState<number | null>(null)

  const translate = async (text: string, sourceLang: Lang, targetLang: Lang, level: CEFRLevel) => {
    setLoading(true)
    setRawError(null)
    setResult(null)
    setSavedSessionId(null)
    try {
      const prompt = buildPrompt({ mode: 'translation', text, sourceLang, targetLang, level })
      const response = await translateText(ollama, prompt, ollama.model)
      setResult(response)
    } catch (err) {
      if (err instanceof OllamaParseError) {
        setRawError(err.rawOutput)
        toast.error('El modelo devolvió una respuesta inválida.')
      } else {
        toast.error('Error al conectar con Ollama. Verificá la configuración.')
      }
    } finally {
      setLoading(false)
    }
  }

  const save = async (text: string, sourceLang: Lang, targetLang: Lang, level: CEFRLevel) => {
    if (!result) return
    setSaving(true)
    try {
      const { session_id } = await saveSession({
        mode: 'translation',
        source_lang: sourceLang,
        target_lang: targetLang,
        level,
        input_text: text,
        output_text: result.translation,
        raw_llm: JSON.stringify(result),
        model: ollama.model,
        errors: [],
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

  return { result, rawError, loading, saving, savedSessionId, translate, save, reset }
}
