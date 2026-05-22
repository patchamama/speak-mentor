import { useMemo } from 'react'
import { useSettingsStore } from '@/stores/settingsStore'
import { useUnlockStore } from '@/stores/unlockStore'
import { buildProvider, ProviderLockedError } from './registry'
import type { LLMConfig, LLMProvider, LLMProviderId } from './types'

/**
 * Resolves the active LLM provider instance based on user settings and
 * session-only unlocked credentials. Returns a tuple:
 *  - `provider` is null when the active provider is locked (no decrypted key).
 *  - `locked` carries the provider id so the UI can prompt for master password.
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
      return { provider: buildProvider(config, undefined), locked: null, config }
    }

    if (activeProvider === 'openai') {
      // OpenAI requires backend proxy (PR 3). Until then, treat as locked.
      return { provider: null, locked: 'openai', config: null }
    }

    const entry = remoteProviders[activeProvider]
    if (!entry) return { provider: null, locked: activeProvider, config: null }

    const config: LLMConfig =
      activeProvider === 'anthropic'
        ? { provider: 'anthropic', apiKey: '', model: entry.model, baseUrl: entry.baseUrl }
        : { provider: 'gemini', apiKey: '', model: entry.model, baseUrl: entry.baseUrl }

    const key = decryptedKeys[activeProvider]
    if (!key) return { provider: null, locked: activeProvider, config }

    try {
      return { provider: buildProvider(config, key), locked: null, config }
    } catch (err) {
      if (err instanceof ProviderLockedError) {
        return { provider: null, locked: activeProvider, config }
      }
      throw err
    }
  }, [activeProvider, ollama, remoteProviders, decryptedKeys])
}
