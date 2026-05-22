import { AnthropicProvider } from './providers/anthropic'
import { BackendProxyProvider } from './providers/backend'
import { GeminiProvider } from './providers/gemini'
import { OllamaProvider } from './providers/ollama'
import type { LLMConfig, LLMProvider, LLMProviderId } from './types'

export class ProviderLockedError extends Error {
  constructor(public readonly provider: LLMProviderId) {
    super(`Provider "${provider}" is locked — unlock with master password first`)
    this.name = 'ProviderLockedError'
  }
}

export interface BuildProviderOptions {
  /** Route through Flask `/api/llm/*` instead of calling the provider directly. */
  useBackend?: boolean
  /** Decrypted API key for direct browser-to-provider calls. Ignored when useBackend is true. */
  apiKey?: string
}

export function buildProvider(config: LLMConfig, options: BuildProviderOptions = {}): LLMProvider {
  const { useBackend = false, apiKey } = options

  switch (config.provider) {
    case 'ollama':
      return new OllamaProvider(config)
    case 'openai':
      // OpenAI never works direct from browser (CORS). Always proxied.
      return new BackendProxyProvider('openai', config.model)
    case 'anthropic':
      if (useBackend) return new BackendProxyProvider('anthropic', config.model)
      if (!apiKey) throw new ProviderLockedError('anthropic')
      return new AnthropicProvider(config, apiKey)
    case 'gemini':
      if (useBackend) return new BackendProxyProvider('gemini', config.model)
      if (!apiKey) throw new ProviderLockedError('gemini')
      return new GeminiProvider(config, apiKey)
  }
}

export const PROVIDER_LABELS: Record<LLMProviderId, string> = {
  ollama: 'Ollama (local)',
  openai: 'OpenAI',
  anthropic: 'Anthropic',
  gemini: 'Google Gemini',
}
