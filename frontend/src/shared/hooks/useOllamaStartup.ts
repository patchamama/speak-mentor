import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { fetchOllamaModels } from '@/shared/ollama/client'
import { useSettingsStore } from '@/stores/settingsStore'
import type { OllamaConfig } from '@/shared/types'

export type OllamaStatus = 'idle' | 'checking' | 'connected' | 'error'

const FALLBACK_PORTS = [11434, 11435]

function resolveModel(availableNames: string[], storedModel: string): string | null {
  if (availableNames.includes(storedModel)) return null

  const variant = availableNames
    .filter((n) => n.toLowerCase().includes('translategemma'))
    .sort()[0]

  return variant ?? null
}

async function tryPorts(
  config: OllamaConfig,
  ports: number[]
): Promise<{ models: Awaited<ReturnType<typeof fetchOllamaModels>>; port: number } | null> {
  for (const port of ports) {
    try {
      const models = await fetchOllamaModels({ ...config, port })
      return { models, port }
    } catch {
      // try next port
    }
  }
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

      // Try configured port first, then fallbacks (dedup to avoid double-trying same port)
      const portsToTry = [ollama.port, ...FALLBACK_PORTS].filter(
        (p, i, arr) => arr.indexOf(p) === i
      )

      const result = await tryPorts(ollama, portsToTry)
      if (cancelled) return

      if (!result) {
        setOllamaStatus('error')
        return
      }

      setOllamaStatus('connected')

      // Persist the working port if different from configured
      if (result.port !== ollama.port) {
        setOllama({ port: result.port })
        toast.info(`Ollama found on port ${result.port} — settings updated.`)
      }

      // Resolve best model
      const names = result.models.map((m) => m.name)
      const resolved = resolveModel(names, ollama.model)
      if (resolved) {
        setOllama({ model: resolved })
        toast.info(`Modelo cambiado a "${resolved}" — "${ollama.model}" no está instalado.`)
      }
    }

    run()
    return () => { cancelled = true }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return { ollamaStatus }
}
