import ky, { HTTPError } from 'ky'
import type { BuiltPrompt } from '@/shared/ollama/promptBuilder'
import { enqueue } from '../queue'
import type { LLMModel, LLMProvider, OpenAIProviderConfig } from '../types'

const OPENAI_DEFAULT_BASE_URL = 'https://api.openai.com/v1'

interface ChatResponse {
  choices: Array<{ message: { content: string | null } }>
}

export class OpenAIProvider implements LLMProvider {
  readonly id = 'openai' as const
  private readonly base: string

  constructor(
    private readonly config: OpenAIProviderConfig,
    private readonly apiKey: string,
  ) {
    this.base = config.baseUrl ?? OPENAI_DEFAULT_BASE_URL
  }

  chat(prompt: BuiltPrompt): Promise<string> {
    return enqueue(() => this._chat(prompt))
  }

  private async _chat(prompt: BuiltPrompt): Promise<string> {
    const send = (sampling: Record<string, number>) =>
      ky
        .post(`${this.base}/chat/completions`, {
          headers: this._headers(),
          json: {
            model: this.config.model,
            response_format: { type: 'json_object' },
            messages: [
              // json_object mode requires the word "JSON" in the messages.
              { role: 'system', content: `${prompt.system}\n\nReturn a single JSON object.` },
              { role: 'user', content: prompt.user },
            ],
            ...sampling,
          },
          timeout: prompt.timeout,
        })
        .json<ChatResponse>()

    let response: ChatResponse
    try {
      response = await send({
        temperature: prompt.options.temperature,
        top_p: prompt.options.top_p,
      })
    } catch (err) {
      // Reasoning models reject non-default sampling parameters.
      if (!(err instanceof HTTPError) || err.response.status !== 400) throw err
      const detail = await err.response.clone().text()
      if (!/temperature|top_p/.test(detail)) throw err
      response = await send({})
    }
    return response.choices[0]?.message.content ?? ''
  }

  async listModels(): Promise<LLMModel[]> {
    const { data } = await ky
      .get(`${this.base}/models`, { headers: this._headers() })
      .json<{ data: Array<{ id: string }> }>()
    return data.filter((m) => /^(gpt-|o\d)/.test(m.id)).map((m) => ({ name: m.id }))
  }

  private _headers(): Record<string, string> {
    return { authorization: `Bearer ${this.apiKey}` }
  }
}
