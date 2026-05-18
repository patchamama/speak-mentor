import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { fetchOllamaModels } from '@/shared/ollama/client'
import { useSettingsStore } from '@/stores/settingsStore'

export type OllamaStatus = 'idle' | 'checking' | 'connected' | 'error'

const DEFAULT_MODEL = 'translategemma:12b'

function resolveModel(availableNames: string[], storedModel: string): string | null {
  // 1. Stored model is available → keep it
  if (availableNames.includes(storedModel)) return null

  // 2. Look for any translategemma variant (sorted for determinism)
  const variant = availableNames
    .filter((n) => n.toLowerCase().includes('translategemma'))
    .sort()[0]

  if (variant) return variant

  // 3. Nothing suitable found → don't change
  return null
}

export function useOllamaStartup(): { ollamaStatus: OllamaStatus } {
  const ollama = useSettingsStore((s) => s.ollama)
  const setOllama = useSettingsStore((s) => s.setOllama)
  const [ollamaStatus, setOllamaStatus] = useState<OllamaStatus>('idle')

  useEffect(() => {
    let cancelled = false

    async function run() {
      setOllamaStatus('checking')
      try {
        const models = await fetchOllamaModels(ollama)
        if (cancelled) return

        setOllamaStatus('connected')

        const names = models.map((m) => m.name)
        const resolved = resolveModel(names, ollama.model)

        if (resolved) {
          setOllama({ model: resolved })
          toast.info(`Modelo cambiado a "${resolved}" — "${ollama.model}" no está instalado.`)
        }
      } catch {
        if (!cancelled) {
          setOllamaStatus('error')
        }
      }
    }

    run()
    return () => {
      cancelled = true
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return { ollamaStatus }
}
