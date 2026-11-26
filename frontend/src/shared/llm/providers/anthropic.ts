import { t } from '@/i18n'
import ky from 'ky'
import type { BuiltPrompt } from '@/shared/ollama/promptBuilder'
import { enqueue } from '../queue'
import { stripCodeFence } from './json'
import type { AnthropicProviderConfig, LLMModel, LLMProvider } from '../types'

const ANTHROPIC_DEFAULT_BASE_URL = 'https://api.anthropic.com'
const ANTHROPIC_VERSION = '2023-06-01'
// Thinking counts against this budget on current models.
const MAX_TOKENS = 16000

interface AnthropicMessageResponse {
  content: Array<{ type: string; text?: string }>
  stop_reason?: string
}

interface AnthropicModelsResponse {
  data: Array<{ id: string; display_name?: string; created_at?: string }>
}

export class AnthropicProvider implements LLMProvider {
  readonly id = 'anthropic' as const
  private readonly base: string

  constructor(
    private readonly config: AnthropicProviderConfig,
    private readonly apiKey: string,
  ) {
    this.base = config.baseUrl ?? ANTHROPIC_DEFAULT_BASE_URL
  }

  chat(prompt: BuiltPrompt): Promise<string> {
    return enqueue(() => this._chat(prompt))
  }

  private async _chat(prompt: BuiltPrompt): Promise<string> {
    // Anthropic has no native JSON mode — reinforce via system prompt and rely
    // on existing retry logic in shared/ollama/client.ts.
    const system =
      prompt.system + '\n\nReturn a single valid JSON object. No prose outside JSON.'
    const response = await ky.post(`${this.base}/v1/messages`, {
      headers: this._headers(),
      json: {
        model: this.config.model,
        max_tokens: MAX_TOKENS,
        system,
        messages: [{ role: 'user', content: prompt.user }],
      },
      timeout: prompt.timeout,
    }).json<AnthropicMessageResponse>()

    if (response.stop_reason === 'refusal' || response.stop_reason === 'max_tokens') {
      throw new Error(t('Anthropic no completó la respuesta ({reason}).', { reason: response.stop_reason }))
    }
    return stripCodeFence(response.content.find((c) => c.type === 'text')?.text ?? '')
  }

  async listModels(): Promise<LLMModel[]> {
    const response = await ky.get(`${this.base}/v1/models?limit=200`, {
      headers: this._headers(),
    }).json<AnthropicModelsResponse>()
    return response.data.map((m) => ({
      name: m.id,
      modified_at: m.created_at,
    }))
  }

  private _headers(): Record<string, string> {
    return {
      'x-api-key': this.apiKey,
      'anthropic-version': ANTHROPIC_VERSION,
      'anthropic-dangerous-direct-browser-access': 'true',
    }
  }
}
