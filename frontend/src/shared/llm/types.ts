import type { BuiltPrompt } from '@/shared/ollama/promptBuilder'

export type LLMProviderId = 'ollama' | 'openai' | 'anthropic' | 'gemini'

export interface LLMModel {
  name: string
  size?: number
  modified_at?: string
}

export interface OllamaProviderConfig {
  provider: 'ollama'
  url: string
  port: number
  model: string
  keepAlive: number
}

export interface OpenAIProviderConfig {
  provider: 'openai'
  apiKey: string
  model: string
  baseUrl?: string
}

export interface AnthropicProviderConfig {
  provider: 'anthropic'
  apiKey: string
  model: string
  baseUrl?: string
}

export interface GeminiProviderConfig {
  provider: 'gemini'
  apiKey: string
  model: string
  baseUrl?: string
}

export type LLMConfig =
  | OllamaProviderConfig
  | OpenAIProviderConfig
  | AnthropicProviderConfig
  | GeminiProviderConfig

export interface LLMProvider {
  readonly id: LLMProviderId
  chat(prompt: BuiltPrompt): Promise<string>
  listModels(): Promise<LLMModel[]>
}
