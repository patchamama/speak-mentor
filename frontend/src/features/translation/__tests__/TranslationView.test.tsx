import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { TranslationView } from '../TranslationView'

const mockResult = {
  source_lang: 'es',
  target_lang: 'de',
  level: 'A2' as const,
  translation: 'Als ich ein Kind war, hat meine Oma Empanadas gekocht.',
  alternatives: [
    { text: 'Als ich klein war, ...', register: 'informal' as const, note: 'Más coloquial' },
  ],
  vocabulary_notes: [
    { source_term: 'empanadas', target_term: 'Empanadas', type: 'cultural' as const, explanation: 'Préstamo léxico' },
  ],
  grammar_notes: [
    { topic: 'Perfekt', explanation: 'Pasado coloquial en A2', level_relevant: 'A2' as const },
  ],
  level_adaptation_notes: 'Estructura simple para A2.',
}

describe('TranslationView', () => {
  it('renders textarea and translate button', () => {
    render(
      <TranslationView
        result={null} rawError={null} loading={false} saving={false} savedSessionId={null}
        onTranslate={vi.fn()} onSave={vi.fn()}
      />
    )
    expect(screen.getByRole('textbox')).toBeDefined()
    expect(screen.getByText('Traducir')).toBeDefined()
  })

  it('calls onTranslate when button clicked with text', () => {
    const onTranslate = vi.fn()
    render(
      <TranslationView
        result={null} rawError={null} loading={false} saving={false} savedSessionId={null}
        onTranslate={onTranslate} onSave={vi.fn()}
      />
    )
    const textarea = screen.getByRole('textbox')
    fireEvent.change(textarea, { target: { value: 'Hallo Welt' } })
    fireEvent.click(screen.getByText('Traducir'))
    expect(onTranslate).toHaveBeenCalledWith('Hallo Welt', 'de', 'es', 'B1')
  })

  it('shows primary translation when result provided', () => {
    render(
      <TranslationView
        result={mockResult} rawError={null} loading={false} saving={false} savedSessionId={null}
        onTranslate={vi.fn()} onSave={vi.fn()}
      />
    )
    expect(screen.getByText('Als ich ein Kind war, hat meine Oma Empanadas gekocht.')).toBeDefined()
  })

  it('shows vocabulary and grammar notes', () => {
    render(
      <TranslationView
        result={mockResult} rawError={null} loading={false} saving={false} savedSessionId={null}
        onTranslate={vi.fn()} onSave={vi.fn()}
      />
    )
    expect(screen.getByText('Vocabulario')).toBeDefined()
    expect(screen.getByText('Gramática')).toBeDefined()
  })

  it('shows level adaptation note', () => {
    render(
      <TranslationView
        result={mockResult} rawError={null} loading={false} saving={false} savedSessionId={null}
        onTranslate={vi.fn()} onSave={vi.fn()}
      />
    )
    expect(screen.getByText('Estructura simple para A2.')).toBeDefined()
  })
})
