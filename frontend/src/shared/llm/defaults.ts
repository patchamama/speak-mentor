import type { LLMProviderId } from './types'

export const DEFAULT_MODELS: Record<Exclude<LLMProviderId, 'ollama'>, string> = {
  openai: 'gpt-4o',
  anthropic: 'claude-opus-5-5',
  gemini: 'gemini-2.5-flash',
}
