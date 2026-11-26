import { describe, it, expect, afterEach } from 'vitest'
import { de } from '../de'
import { t, useLanguageStore } from '..'

const sources = import.meta.glob(
  ['/src/**/*.{ts,tsx}', '!/src/**/__tests__/**', '!/src/i18n/**', '!/src/shared/ollama/templates/**', '!/src/features/common-errors/data/**', '!/src/test/**',
    // Legacy view, only referenced by its own test.
    '!/src/features/correction/CorrectionView.tsx'],
  { query: '?raw', import: 'default', eager: true },
) as Record<string, string>

const CALL = /(?<![\w.])(?:t|msg)\(\s*(['"`])((?:\\.|(?!\1)[^\\])*)\1/g
const keys = new Set(
  Object.values(sources).flatMap((code) =>
    [...code.matchAll(CALL)].map((m) => m[2].replace(/\\(['"`\\])/g, '$1')),
  ),
)
const placeholders = (text: string) => [...text.matchAll(/\{\w+\}/g)].map((m) => m[0]).sort()

describe('German translation coverage', () => {
  it('has a German entry for every translatable text', () => {
    expect([...keys].filter((key) => !(key in de))).toEqual([])
  })

  it('keeps the same placeholders', () => {
    const broken = Object.entries(de).filter(
      ([es, german]) => placeholders(es).join() !== placeholders(german).join(),
    )
    expect(broken).toEqual([])
  })

  it('has no unused entries', () => {
    expect(Object.keys(de).filter((key) => !keys.has(key))).toEqual([])
  })

  it('leaves no untranslated Spanish in the interface', () => {
    const leftovers = Object.entries(sources).flatMap(([file, code]) =>
      code
        .replace(CALL, '')
        .replace(/\/\*[\s\S]*?\*\/|(?<![:'"])\/\/.*$/gm, '')
        .split('\n')
        .filter((line) => /[áéíóúñ¿¡]/i.test(line) && !/präteritum/.test(line))
        .map((line) => `${file}: ${line.trim()}`),
    )
    expect(leftovers).toEqual([])
  })
})

describe('t', () => {
  afterEach(() => useLanguageStore.setState({ language: 'es' }))

  it('returns Spanish or German and fills placeholders', () => {
    useLanguageStore.setState({ language: 'es' })
    expect(t('Guardar')).toBe('Guardar')
    useLanguageStore.setState({ language: 'de' })
    expect(t('Guardar')).toBe('Speichern')
  })
})
