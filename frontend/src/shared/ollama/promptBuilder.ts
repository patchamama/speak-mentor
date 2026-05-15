import type { CEFRLevel, Lang } from '@/shared/types'
import { CORRECTION_SYSTEM_TEMPLATE } from './templates/correction-system'
import { TRANSLATION_SYSTEM_TEMPLATE } from './templates/translation-system'

interface CorrectionPromptInput {
  mode: 'correction'
  text: string
  level: CEFRLevel
  explanationLang?: Lang
}

interface TranslationPromptInput {
  mode: 'translation'
  text: string
  sourceLang: Lang
  targetLang: Lang
  level: CEFRLevel
  explanationLang?: Lang
}

export type PromptInput = CorrectionPromptInput | TranslationPromptInput

export interface BuiltPrompt {
  system: string
  user: string
  format: 'json'
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

  if (input.mode === 'correction') {
    const system = CORRECTION_SYSTEM_TEMPLATE
      .replaceAll('{{LEVEL}}', input.level)
      .replaceAll('{{EXPLANATION_LANG}}', explanationLang)
      .replaceAll('{{EXPLANATION_LANG_FULL}}', LANG_FULL[explanationLang])

    return {
      system,
      user: `LEVEL: ${input.level}\nTEXT: ${input.text}\nEXPLANATION_LANG: ${explanationLang}`,
      format: 'json',
      options: { temperature: 0.2, top_p: 0.9, num_ctx: 4096 },
    }
  }

  const system = TRANSLATION_SYSTEM_TEMPLATE
    .replaceAll('{{LEVEL}}', input.level)
    .replaceAll('{{SOURCE_LANG}}', input.sourceLang)
    .replaceAll('{{TARGET_LANG}}', input.targetLang)
    .replaceAll('{{EXPLANATION_LANG}}', explanationLang)
    .replaceAll('{{EXPLANATION_LANG_FULL}}', LANG_FULL[explanationLang])

  return {
    system,
    user: `SOURCE_LANG: ${input.sourceLang}\nTARGET_LANG: ${input.targetLang}\nLEVEL: ${input.level}\nTEXT: ${input.text}\nEXPLANATION_LANG: ${explanationLang}`,
    format: 'json',
    options: { temperature: 0.3, top_p: 0.9, num_ctx: 4096 },
  }
}
