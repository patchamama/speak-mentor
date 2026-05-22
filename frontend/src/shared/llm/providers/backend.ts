import type { BuiltPrompt } from '@/shared/ollama/promptBuilder'
import {
  backendChat,
  fetchBackendModels,
  type BackendProviderId,
} from '@/shared/api/flaskClient'
import { enqueue } from '../queue'
import type { LLMModel, LLMProvider } from '../types'

/**
 * Routes chat + model-list calls through the Flask `/api/llm/*` proxy. The
 * backend reads the API key from its environment, so the frontend never
 * sees it. Used for OpenAI today (CORS-only path) and optionally for
 * Anthropic/Gemini when the user prefers server-side keys.
 */
export class BackendProxyProvider implements LLMProvider {
  readonly id: BackendProviderId

  constructor(
    providerId: BackendProviderId,
    private readonly model: string,
  ) {
    this.id = providerId
  }

  chat(prompt: BuiltPrompt): Promise<string> {
    return enqueue(() =>
      backendChat({
        provider: this.id,
        model: this.model,
        system: prompt.system,
        user: prompt.user,
        options: prompt.options,
        timeout: prompt.timeout,
      }),
    )
  }

  async listModels(): Promise<LLMModel[]> {
    const models = await fetchBackendModels(this.id)
    return models.map((m) => ({ name: m.name }))
  }
}
