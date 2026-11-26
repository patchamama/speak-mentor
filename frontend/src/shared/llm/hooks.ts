import { useEffect, useMemo, useState } from 'react'
import { useSettingsStore } from '@/stores/settingsStore'
import { useUnlockStore } from '@/stores/unlockStore'
import { useBackendStore } from '@/stores/backendStore'
import {
  fetchBackendProviders,
  type BackendProviderAvailability,
} from '@/shared/api/flaskClient'
import { buildProvider, ProviderLockedError } from './registry'
import type { LLMConfig, LLMProvider, LLMProviderId } from './types'

/**
 * Resolves the active LLM provider instance based on user settings and
 * session-only unlocked credentials. Returns a tuple:
 *  - `provider` is null when the active provider is locked (no decrypted key
 *    and no backend proxy configured).
 *  - `locked` carries the provider id so the UI can prompt for master password
 *    or backend configuration.
 */
export function useActiveLLMProvider(): {
  provider: LLMProvider | null
  locked: LLMProviderId | null
  config: LLMConfig | null
} {
  const activeProvider = useSettingsStore((s) => s.activeProvider)
  const ollama = useSettingsStore((s) => s.ollama)
  const remoteProviders = useSettingsStore((s) => s.remoteProviders)
  const decryptedKeys = useUnlockStore((s) => s.decryptedKeys)

  return useMemo(() => {
    if (activeProvider === 'ollama') {
      const config: LLMConfig = { provider: 'ollama', ...ollama }
      return { provider: buildProvider(config), locked: null, config }
    }

    const entry = remoteProviders[activeProvider]
    if (!entry) return { provider: null, locked: activeProvider, config: null }

    let config: LLMConfig
    if (activeProvider === 'anthropic') {
      config = { provider: 'anthropic', apiKey: '', model: entry.model, baseUrl: entry.baseUrl }
    } else if (activeProvider === 'gemini') {
      config = { provider: 'gemini', apiKey: '', model: entry.model, baseUrl: entry.baseUrl }
    } else {
      config = { provider: 'openai', apiKey: '', model: entry.model, baseUrl: entry.baseUrl }
    }

    // Backend proxy path: no local key required, key lives on the server
    if (entry.useBackend) {
      try {
        return {
          provider: buildProvider(config, { useBackend: true }),
          locked: null,
          config,
        }
      } catch {
        return { provider: null, locked: activeProvider, config }
      }
    }

    // Direct path: needs the decrypted local key
    const apiKey = decryptedKeys[activeProvider]
    if (!apiKey) return { provider: null, locked: activeProvider, config }

    try {
      return { provider: buildProvider(config, { apiKey }), locked: null, config }
    } catch (err) {
      if (err instanceof ProviderLockedError) {
        return { provider: null, locked: activeProvider, config }
      }
      throw err
    }
  }, [activeProvider, ollama, remoteProviders, decryptedKeys])
}

const NO_BACKEND_KEYS: BackendProviderAvailability = { openai: false, anthropic: false, gemini: false }

/**
 * One-shot fetch of which providers have a server-side key configured on the
 * Flask backend. Used by Settings to decide whether to enable OpenAI and to
 * surface "use backend" toggles for the other providers.
 */
export function useBackendProviders(): {
  availability: BackendProviderAvailability | null
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
} {
  const backendStatus = useBackendStore((s) => s.status)
  const [availability, setAvailability] = useState<BackendProviderAvailability | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refetch = async () => {
    if (backendStatus === 'unavailable') {
      setAvailability(NO_BACKEND_KEYS)
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const data = await fetchBackendProviders()
      setAvailability(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo consultar el backend')
      setAvailability(NO_BACKEND_KEYS)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refetch()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [backendStatus])

  return { availability, loading, error, refetch }
}
