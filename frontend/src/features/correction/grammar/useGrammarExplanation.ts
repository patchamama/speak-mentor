import { useCallback, useState } from 'react'
import { getLanguage, t } from '@/i18n'
import { useActiveLLMProvider } from '@/shared/llm/hooks'
import { PROVIDER_LABELS } from '@/shared/llm/registry'
import { buildPrompt } from '@/shared/ollama/promptBuilder'
import { useSettingsStore } from '@/stores/settingsStore'
import type { CEFRLevel } from '@/shared/types'
import { GrammarExplanationSchema, type GrammarExplanation } from './schema'

export interface GrammarError {
  type: string
  original: string
  correction: string
  explanation: string
  rule_reference?: string
}

// In memory only: reopening an explanation must not spend another request.
const cache = new Map<string, GrammarExplanation>()
export const clearGrammarCache = () => cache.clear()

export function useGrammarExplanation(error: GrammarError, level: CEFRLevel) {
  const { provider, locked } = useActiveLLMProvider()
  const modelParams = useSettingsStore((s) => s.modelParams)
  const language = getLanguage()
  const key = JSON.stringify([language, level, error.type, error.original, error.correction])
  const [data, setData] = useState<GrammarExplanation | null>(null)
  const [loading, setLoading] = useState(false)
  const [failure, setFailure] = useState<string | null>(null)

  const load = useCallback(async () => {
    const cached = cache.get(key)
    setFailure(null)
    if (cached) {
      setData(cached)
      return
    }
    if (!provider) {
      setFailure(
        locked
          ? t('{name} está bloqueado o sin configurar: introduce la clave maestra en Configuración → Conexión y almacenamiento.', { name: PROVIDER_LABELS[locked] })
          : t('Configura un proveedor de LLM en Configuración → Conexión y almacenamiento.'),
      )
      return
    }
    setData(null)
    setLoading(true)
    try {
      const raw = await provider.chat(
        buildPrompt({ mode: 'grammarExplanation', error, level, explanationLang: language, modelParams }),
      )
      const parsed = GrammarExplanationSchema.parse(JSON.parse(raw))
      cache.set(key, parsed)
      setData(parsed)
    } catch (err) {
      setFailure(
        err instanceof Error && err.name !== 'SyntaxError' && err.name !== 'ZodError'
          ? err.message
          : t('El modelo devolvió una respuesta inválida.'),
      )
    } finally {
      setLoading(false)
    }
  }, [key, provider, locked, level, language, modelParams, error])

  return { data, loading, failure, load }
}
