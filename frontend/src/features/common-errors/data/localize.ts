import type { Language } from '@/i18n'
import { COMMON_ERRORS_DATA, type CommonErrorCategory } from './commonErrors'
import { COMMON_ERRORS_DE } from './commonErrors.de'

const german = (text: string) => COMMON_ERRORS_DE[text] ?? text

function toGerman(category: CommonErrorCategory): CommonErrorCategory {
  return {
    ...category,
    title: german(category.title),
    examples: category.examples.map((example) => ({
      ...example,
      explanation: german(example.explanation),
      rule: german(example.rule),
      tip: german(example.tip),
    })),
    referenceTables: category.referenceTables?.map((table) => ({
      ...table,
      title: german(table.title),
      headers: table.headers.map(german),
      rows: table.rows.map((row) => row.map(german)),
      note: table.note && german(table.note),
    })),
  }
}

const BY_LANGUAGE: Record<Language, CommonErrorCategory[]> = {
  es: COMMON_ERRORS_DATA,
  de: COMMON_ERRORS_DATA.map(toGerman),
}

/** Stable references per language, safe to use as hook dependencies. */
export function getCommonErrors(language: Language): CommonErrorCategory[] {
  return BY_LANGUAGE[language]
}
