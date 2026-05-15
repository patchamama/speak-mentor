import { useState } from 'react'
import { fetchOllamaModels, type OllamaModel } from '@/shared/ollama/client'
import { useSettingsStore } from '@/stores/settingsStore'

interface UseOllamaModelsReturn {
  models: OllamaModel[]
  loading: boolean
  error: string | null
  testConnection: () => Promise<void>
}

export function useOllamaModels(): UseOllamaModelsReturn {
  const config = useSettingsStore((s) => s.ollama)
  const [models, setModels] = useState<OllamaModel[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const testConnection = async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await fetchOllamaModels(config)
      setModels(result)
    } catch (err) {
      setError(
        'No se pudo conectar con Ollama. Verificá que esté corriendo con OLLAMA_ORIGINS=* y que la URL/puerto sean correctos.'
      )
    } finally {
      setLoading(false)
    }
  }

  return { models, loading, error, testConnection }
}
