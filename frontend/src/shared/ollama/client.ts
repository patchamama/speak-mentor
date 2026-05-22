import { z } from 'zod'
import type { OllamaConfig } from '@/shared/types'
import type { BuiltPrompt } from './promptBuilder'
import {
  CorrectionResponseSchema,
  TranslationResponseSchema,
  type CorrectionResponse,
  type TranslationResponse,
} from './schemas'
import { OllamaProvider } from '@/shared/llm/providers/ollama'
import { getQueueLength } from '@/shared/llm/queue'
import type { LLMProvider } from '@/shared/llm/types'

export type OllamaModel = {
  name: string
  size: number
  modified_at: string
}

function makeOllamaProvider(config: OllamaConfig): LLMProvider {
  return new OllamaProvider({
    provider: 'ollama',
    url: config.url,
    port: config.port,
    model: config.model,
    keepAlive: config.keepAlive,
  })
}

export function getOllamaQueueLength(): number {
  return getQueueLength()
}

export async function fetchOllamaModels(config: OllamaConfig): Promise<OllamaModel[]> {
  const models = await makeOllamaProvider(config).listModels()
  return models.map((m) => ({
    name: m.name,
    size: m.size ?? 0,
    modified_at: m.modified_at ?? '',
  }))
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

function normalizeCorrectionObj(obj: Record<string, unknown>): void {
  if (!obj.level_assessment || typeof obj.level_assessment !== 'object') {
    obj.level_assessment = { detected_level: 'B1', target_level: 'B1', gap_notes: '' }
  }
}

export async function correctText(
  provider: LLMProvider,
  prompt: BuiltPrompt,
  originalText: string,
): Promise<CorrectionResponse> {
  let raw = await provider.chat(prompt)
  let parsed = safeParse(raw, CorrectionResponseSchema, normalizeCorrectionObj)

  if (!parsed.success) {
    // retry once at temperature 0
    const retryPrompt: BuiltPrompt = {
      ...prompt,
      system: prompt.system + '\n\nPrevious output was invalid JSON. Return strict JSON matching the schema.',
      options: { ...prompt.options, temperature: 0 },
    }
    raw = await provider.chat(retryPrompt)
    parsed = safeParse(raw, CorrectionResponseSchema, normalizeCorrectionObj)
    if (!parsed.success) {
      throw new OllamaParseError(raw, parsed.error)
    }
  }

  const result = parsed.data
  result.errors = resolvePositions(originalText, result.errors)
  return result
}

export async function translateText(
  provider: LLMProvider,
  prompt: BuiltPrompt,
): Promise<TranslationResponse> {
  let raw = await provider.chat(prompt)
  let parsed = safeParse(raw, TranslationResponseSchema)

  if (!parsed.success) {
    const retryPrompt: BuiltPrompt = {
      ...prompt,
      system: prompt.system + '\n\nPrevious output was invalid JSON. Return strict JSON matching the schema.',
      options: { ...prompt.options, temperature: 0 },
    }
    raw = await provider.chat(retryPrompt)
    parsed = safeParse(raw, TranslationResponseSchema)
    if (!parsed.success) {
      throw new OllamaParseError(raw, parsed.error)
    }
  }

  return parsed.data as TranslationResponse
}

function safeParse<T>(
  raw: string,
  schema: z.ZodType<T>,
  normalize?: (obj: Record<string, unknown>) => void,
): z.SafeParseReturnType<unknown, T> {
  try {
    const obj = JSON.parse(raw)
    if (normalize && obj && typeof obj === 'object') normalize(obj as Record<string, unknown>)
    return schema.safeParse(obj)
  } catch {
    return { success: false, error: new z.ZodError([{ code: 'custom', message: 'Invalid JSON', path: [] }]) }
  }
}

export class OllamaParseError extends Error {
  rawOutput: string
  zodError: z.ZodError

  constructor(rawOutput: string, zodError: z.ZodError) {
    super('LLM returned invalid JSON after 2 attempts')
    this.rawOutput = rawOutput
    this.zodError = zodError
  }
}
