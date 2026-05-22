import ky from 'ky'
import type { BuiltPrompt } from '@/shared/ollama/promptBuilder'
import { enqueue } from '../queue'
import type { LLMModel, LLMProvider, OllamaProviderConfig } from '../types'

function baseUrl(config: OllamaProviderConfig): string {
  return `${config.url}:${config.port}`
}

interface OllamaTagsResponse {
  models: Array<{ name: string; size: number; modified_at: string }>
}

async function chatDirect(config: OllamaProviderConfig, prompt: BuiltPrompt): Promise<string> {
  const response = await ky.post(`${baseUrl(config)}/api/chat`, {
    json: {
      model: config.model,
      format: prompt.format,
      stream: false,
      keep_alive: config.keepAlive,
      options: prompt.options,
      messages: [
        { role: 'system', content: prompt.system },
        { role: 'user', content: prompt.user },
      ],
    },
    timeout: prompt.timeout,
  }).json<{ message: { content: string } }>()
  return response.message.content
}

export class OllamaProvider implements LLMProvider {
  readonly id = 'ollama' as const

  constructor(private readonly config: OllamaProviderConfig) {}

  chat(prompt: BuiltPrompt): Promise<string> {
    return enqueue(() => chatDirect(this.config, prompt))
  }

  async listModels(): Promise<LLMModel[]> {
    const data = await ky.get(`${baseUrl(this.config)}/api/tags`).json<OllamaTagsResponse>()
    return data.models ?? []
  }
}
