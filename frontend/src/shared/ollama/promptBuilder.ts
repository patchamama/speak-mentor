import type { CEFRLevel, Lang, ModelParams } from '@/shared/types'
import { CORRECTION_SYSTEM_TEMPLATE } from './templates/correction-system'
import { TRANSLATION_SYSTEM_TEMPLATE } from './templates/translation-system'
import { VOCABULARY_SYSTEM_TEMPLATE } from './templates/vocabulary-system'
import { EXERCISES_SYSTEM_TEMPLATE } from './templates/exercises-system'
import { VERIFICATION_SYSTEM_TEMPLATE } from './templates/verification-system'
import { COMMON_ERRORS_EXERCISES_SYSTEM_TEMPLATE } from './templates/common-errors-exercises-system'
import { DEFAULT_MODEL_PARAMS } from '@/stores/settingsStore'
import type { CommonErrorCategory } from '@/features/common-errors/data/commonErrors'

interface CorrectionPromptInput {
  mode: 'correction'
  text: string
  level: CEFRLevel
  explanationLang?: Lang
  systemOverride?: string
  modelParams?: Partial<ModelParams>
}

interface VocabularyPromptInput {
  mode: 'vocabulary'
  correctedText: string
  originalText: string
  level: CEFRLevel
  explanationLang?: Lang
  systemOverride?: string
  modelParams?: Partial<ModelParams>
}

interface ExercisesPromptInput {
  mode: 'exercises'
  correctedText: string
  errors: Array<{ type: string; original: string; correction: string; explanation: string }>
  level: CEFRLevel
  explanationLang?: Lang
  systemOverride?: string
  modelParams?: Partial<ModelParams>
}

interface VerificationPromptInput {
  mode: 'verification'
  correctedText: string
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

interface CommonErrorsExercisesPromptInput {
  mode: 'commonErrorsExercises'
  category: CommonErrorCategory
  level: CEFRLevel
  explanationLang?: Lang
  modelParams?: Partial<ModelParams>
}

export type PromptInput =
  | CorrectionPromptInput
  | VocabularyPromptInput
  | ExercisesPromptInput
  | VerificationPromptInput
  | TranslationPromptInput
  | CommonErrorsExercisesPromptInput

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

function applyBaseVars(template: string, level: CEFRLevel, lang: Lang): string {
  return template
    .replaceAll('{{LEVEL}}', level)
    .replaceAll('{{EXPLANATION_LANG}}', lang)
    .replaceAll('{{EXPLANATION_LANG_FULL}}', LANG_FULL[lang])
}

export function buildPrompt(input: PromptInput): BuiltPrompt {
  const explanationLang = ('explanationLang' in input ? input.explanationLang : undefined) ?? 'es'
  const params = { ...DEFAULT_MODEL_PARAMS, ...input.modelParams }
  const baseOpts = {
    format: 'json' as const,
    timeout: params.timeout,
    options: { temperature: params.temperature, top_p: params.top_p, num_ctx: params.num_ctx },
  }

  if (input.mode === 'correction') {
    const system = applyBaseVars(
      input.systemOverride ?? CORRECTION_SYSTEM_TEMPLATE,
      input.level,
      explanationLang,
    )
    return {
      system,
      user: `LEVEL: ${input.level}\nTEXT: ${input.text}\nEXPLANATION_LANG: ${explanationLang}`,
      ...baseOpts,
    }
  }

  if (input.mode === 'vocabulary') {
    const system = applyBaseVars(
      input.systemOverride ?? VOCABULARY_SYSTEM_TEMPLATE,
      input.level,
      explanationLang,
    )
    return {
      system,
      user: `LEVEL: ${input.level}\nORIGINAL_TEXT: ${input.originalText}\nCORRECTED_TEXT: ${input.correctedText}\nEXPLANATION_LANG: ${explanationLang}`,
      ...baseOpts,
    }
  }

  if (input.mode === 'exercises') {
    const system = applyBaseVars(
      input.systemOverride ?? EXERCISES_SYSTEM_TEMPLATE,
      input.level,
      explanationLang,
    )
    const errorsJson = JSON.stringify(input.errors, null, 2)
    return {
      system,
      user: `LEVEL: ${input.level}\nCORRECTED_TEXT: ${input.correctedText}\nERRORS:\n${errorsJson}\nEXPLANATION_LANG: ${explanationLang}`,
      ...baseOpts,
    }
  }

  if (input.mode === 'verification') {
    return {
      system: VERIFICATION_SYSTEM_TEMPLATE,
      user: `TEXT: ${input.correctedText}`,
      ...baseOpts,
      options: { ...baseOpts.options, temperature: 0 },
    }
  }

  if (input.mode === 'commonErrorsExercises') {
    const { category, level } = input
    const hasTables = !!(category.referenceTables && category.referenceTables.length > 0)
    const tableTitles = hasTables ? category.referenceTables!.map((t) => t.title).join(', ') : ''
    const examplesJson = JSON.stringify(
      category.examples.map((e) => ({
        wrong: e.wrong,
        correct: e.correct,
        explanation: e.explanation,
        rule: e.rule,
      })),
      null,
      2,
    )
    const system = applyBaseVars(COMMON_ERRORS_EXERCISES_SYSTEM_TEMPLATE, level, explanationLang)
      .replaceAll('{{CATEGORY_TITLE}}', category.title)
      .replaceAll('{{ERROR_TYPE}}', category.errorType)
      .replaceAll('{{EXAMPLES}}', examplesJson)
      .replaceAll('{{HAS_TABLES}}', hasTables ? 'true' : 'false')
      .replaceAll('{{TABLE_TITLES}}', tableTitles)
    return {
      system,
      user: `CATEGORY: ${category.title}\nERROR_TYPE: ${category.errorType}\nLEVEL: ${level}\nEXPLANATION_LANG: ${explanationLang}`,
      ...baseOpts,
    }
  }

  // translation
  const system = applyBaseVars(
    input.systemOverride ?? TRANSLATION_SYSTEM_TEMPLATE,
    input.level,
    explanationLang,
  ).replaceAll('{{SOURCE_LANG}}', input.sourceLang).replaceAll('{{TARGET_LANG}}', input.targetLang)

  return {
    system,
    user: `SOURCE_LANG: ${input.sourceLang}\nTARGET_LANG: ${input.targetLang}\nLEVEL: ${input.level}\nTEXT: ${input.text}\nEXPLANATION_LANG: ${explanationLang}`,
    ...baseOpts,
  }
}
