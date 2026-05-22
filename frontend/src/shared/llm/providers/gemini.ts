import ky from 'ky'
import type { BuiltPrompt } from '@/shared/ollama/promptBuilder'
import { enqueue } from '../queue'
import type { GeminiProviderConfig, LLMModel, LLMProvider } from '../types'

const GEMINI_DEFAULT_BASE_URL = 'https://generativelanguage.googleapis.com'

interface GeminiGenerateResponse {
  candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>
}

interface GeminiModelsResponse {
  models: Array<{
    name: string
    displayName?: string
    supportedGenerationMethods?: string[]
  }>
}

export class GeminiProvider implements LLMProvider {
  readonly id = 'gemini' as const
  private readonly base: string

  constructor(
    private readonly config: GeminiProviderConfig,
    private readonly apiKey: string,
  ) {
    this.base = config.baseUrl ?? GEMINI_DEFAULT_BASE_URL
  }

  chat(prompt: BuiltPrompt): Promise<string> {
    return enqueue(() => this._chat(prompt))
  }

  private async _chat(prompt: BuiltPrompt): Promise<string> {
    const model = this.config.model.replace(/^models\//, '')
    const url = `${this.base}/v1beta/models/${model}:generateContent?key=${encodeURIComponent(this.apiKey)}`
    const response = await ky.post(url, {
      json: {
        systemInstruction: { parts: [{ text: prompt.system }] },
        contents: [{ role: 'user', parts: [{ text: prompt.user }] }],
        generationConfig: {
          temperature: prompt.options.temperature,
          topP: prompt.options.top_p,
          responseMimeType: 'application/json',
        },
      },
      timeout: prompt.timeout,
    }).json<GeminiGenerateResponse>()

    return response.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
  }

  async listModels(): Promise<LLMModel[]> {
    const url = `${this.base}/v1beta/models?key=${encodeURIComponent(this.apiKey)}`
    const response = await ky.get(url).json<GeminiModelsResponse>()
    return response.models
      .filter((m) => m.supportedGenerationMethods?.includes('generateContent') ?? true)
      .map((m) => ({ name: m.name.replace(/^models\//, '') }))
  }
}
