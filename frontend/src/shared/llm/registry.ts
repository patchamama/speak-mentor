import { AnthropicProvider } from './providers/anthropic'
import { GeminiProvider } from './providers/gemini'
import { OllamaProvider } from './providers/ollama'
import type { LLMConfig, LLMProvider, LLMProviderId } from './types'

export class ProviderLockedError extends Error {
  constructor(public readonly provider: LLMProviderId) {
    super(`Provider "${provider}" is locked — unlock with master password first`)
    this.name = 'ProviderLockedError'
  }
}

export function buildProvider(
  config: LLMConfig,
  decryptedApiKey: string | undefined,
): LLMProvider {
  switch (config.provider) {
    case 'ollama':
      return new OllamaProvider(config)
    case 'anthropic':
      if (!decryptedApiKey) throw new ProviderLockedError('anthropic')
      return new AnthropicProvider(config, decryptedApiKey)
    case 'gemini':
      if (!decryptedApiKey) throw new ProviderLockedError('gemini')
      return new GeminiProvider(config, decryptedApiKey)
    case 'openai':
      throw new Error('OpenAI provider not yet available — requires backend proxy (PR 3)')
  }
}

export const PROVIDER_LABELS: Record<LLMProviderId, string> = {
  ollama: 'Ollama (local)',
  openai: 'OpenAI',
  anthropic: 'Anthropic',
  gemini: 'Google Gemini',
}
