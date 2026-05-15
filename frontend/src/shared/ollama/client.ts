import ky from 'ky'
import { z } from 'zod'
import type { OllamaConfig } from '@/shared/types'
import type { BuiltPrompt } from './promptBuilder'
import {
  CorrectionResponseSchema,
  TranslationResponseSchema,
  type CorrectionResponse,
  type TranslationResponse,
} from './schemas'

function getBaseUrl(config: OllamaConfig): string {
  return `${config.url}:${config.port}`
}

export interface OllamaModel {
  name: string
  size: number
  modified_at: string
}

export async function fetchOllamaModels(config: OllamaConfig): Promise<OllamaModel[]> {
  const data = await ky.get(`${getBaseUrl(config)}/api/tags`).json<{ models: OllamaModel[] }>()
  return data.models ?? []
}

async function callOllama(config: OllamaConfig, prompt: BuiltPrompt, model: string): Promise<string> {
  const response = await ky.post(`${getBaseUrl(config)}/api/chat`, {
    json: {
      model,
      format: prompt.format,
      stream: false,
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

function resolvePositions(
  original: string,
  errors: CorrectionResponse['errors']
): CorrectionResponse['errors'] {
  return errors.map((err) => {
    const idx = original.indexOf(err.original)
    if (idx === -1) {
      return { ...err, position: null, position_unreliable: true } as typeof err & { position_unreliable: boolean }
    }
    const count = (original.match(new RegExp(err.original.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) ?? []).length
    if (count === 1) {
      return { ...err, position: { start: idx, end: idx + err.original.length } }
    }
    // multiple occurrences: keep LLM position if within range, else use first
    const pos = err.position
    if (pos && pos.start >= 0 && pos.start < original.length) {
      return err
    }
    return { ...err, position: { start: idx, end: idx + err.original.length } }
  })
}

export async function correctText(
  config: OllamaConfig,
  prompt: BuiltPrompt,
  model: string,
  originalText: string
): Promise<CorrectionResponse> {
  let raw = await callOllama(config, prompt, model)
  let parsed = safeParse(raw, CorrectionResponseSchema)

  if (!parsed.success) {
    // retry once at temperature 0
    const retryPrompt: BuiltPrompt = {
      ...prompt,
      system: prompt.system + '\n\nPrevious output was invalid JSON. Return strict JSON matching the schema.',
      options: { ...prompt.options, temperature: 0 },
    }
    raw = await callOllama(config, retryPrompt, model)
    parsed = safeParse(raw, CorrectionResponseSchema)
    if (!parsed.success) {
      throw new OllamaParseError(raw, parsed.error)
    }
  }

  const result = parsed.data
  result.errors = resolvePositions(originalText, result.errors)
  return result
}

export async function translateText(
  config: OllamaConfig,
  prompt: BuiltPrompt,
  model: string
): Promise<TranslationResponse> {
  let raw = await callOllama(config, prompt, model)
  let parsed = safeParse(raw, TranslationResponseSchema)

  if (!parsed.success) {
    const retryPrompt: BuiltPrompt = {
      ...prompt,
      system: prompt.system + '\n\nPrevious output was invalid JSON. Return strict JSON matching the schema.',
      options: { ...prompt.options, temperature: 0 },
    }
    raw = await callOllama(config, retryPrompt, model)
    parsed = safeParse(raw, TranslationResponseSchema)
    if (!parsed.success) {
      throw new OllamaParseError(raw, parsed.error)
    }
  }

  return parsed.data
}

function safeParse<T>(raw: string, schema: z.ZodType<T>): z.SafeParseReturnType<unknown, T> {
  try {
    const obj = JSON.parse(raw)
    return schema.safeParse(obj)
  } catch {
    return { success: false, error: new z.ZodError([{ code: 'custom', message: 'Invalid JSON', path: [] }]) }
  }
}

export class OllamaParseError extends Error {
  rawOutput: string
  zodError: z.ZodError

  constructor(rawOutput: string, zodError: z.ZodError) {
    super('Ollama returned invalid JSON after 2 attempts')
    this.rawOutput = rawOutput
    this.zodError = zodError
  }
}
