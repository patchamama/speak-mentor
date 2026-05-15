import type { CEFRLevel, Lang, ModelParams } from '@/shared/types'
import { CORRECTION_SYSTEM_TEMPLATE } from './templates/correction-system'
import { TRANSLATION_SYSTEM_TEMPLATE } from './templates/translation-system'
import { DEFAULT_MODEL_PARAMS } from '@/stores/settingsStore'

interface CorrectionPromptInput {
  mode: 'correction'
  text: string
  level: CEFRLevel
  explanationLang?: Lang
  systemOverride?: string
  modelParams?: Partial<ModelParams>
}

interface TranslationPromptInput {
  mode: 'translation'
  text: string
  sourceLang: Lang
  targetLang: Lang
  level: CEFRLevel
  explanationLang?: Lang
  systemOverride?: string
  modelParams?: Partial<ModelParams>
}

export type PromptInput = CorrectionPromptInput | TranslationPromptInput

export interface BuiltPrompt {
  system: string
  user: string
  format: 'json'
  timeout: number
  options: {
    temperature: number
    top_p: number
    num_ctx: number
  }
}

const LANG_FULL: Record<Lang, string> = {
  es: 'Spanish',
  de: 'German',
}

export function buildPrompt(input: PromptInput): BuiltPrompt {
  const explanationLang = input.explanationLang ?? 'es'
  const params = { ...DEFAULT_MODEL_PARAMS, ...input.modelParams }

  if (input.mode === 'correction') {
    const template = input.systemOverride ?? CORRECTION_SYSTEM_TEMPLATE
    const system = template
      .replaceAll('{{LEVEL}}', input.level)
      .replaceAll('{{EXPLANATION_LANG}}', explanationLang)
      .replaceAll('{{EXPLANATION_LANG_FULL}}', LANG_FULL[explanationLang])

    return {
      system,
      user: `LEVEL: ${input.level}\nTEXT: ${input.text}\nEXPLANATION_LANG: ${explanationLang}`,
      format: 'json',
      timeout: params.timeout,
      options: { temperature: params.temperature, top_p: params.top_p, num_ctx: params.num_ctx },
    }
  }

  const template = input.systemOverride ?? TRANSLATION_SYSTEM_TEMPLATE
  const system = template
    .replaceAll('{{LEVEL}}', input.level)
    .replaceAll('{{SOURCE_LANG}}', input.sourceLang)
    .replaceAll('{{TARGET_LANG}}', input.targetLang)
    .replaceAll('{{EXPLANATION_LANG}}', explanationLang)
    .replaceAll('{{EXPLANATION_LANG_FULL}}', LANG_FULL[explanationLang])

  return {
    system,
    user: `SOURCE_LANG: ${input.sourceLang}\nTARGET_LANG: ${input.targetLang}\nLEVEL: ${input.level}\nTEXT: ${input.text}\nEXPLANATION_LANG: ${explanationLang}`,
    format: 'json',
    timeout: params.timeout,
    options: { temperature: params.temperature, top_p: params.top_p, num_ctx: params.num_ctx },
  }
}
