import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { CorrectionView } from '../CorrectionView'

const mockResult = {
  corrected: 'Ich gehe zur Schule.',
  level_assessment: { detected_level: 'A2' as const, target_level: 'B1' as const, gap_notes: 'test gap' },
  errors: [
    {
      original: 'zu der',
      correction: 'zur',
      type: 'preposition' as const,
      severity: 'major' as const,
      position: { start: 9, end: 15 },
      explanation: 'Contracción obligatoria',
      rule_reference: 'Präposition-Verschmelzung',
      example: 'Ich fahre zur Arbeit.',
    },
  ],
  summary: { error_count: 1, by_type: { preposition: 1 }, main_focus: 'Preposiciones' },
  tips: ['Estudiar contracciones'],
}

describe('CorrectionView', () => {
  it('renders textarea and correct button', () => {
    render(
      <CorrectionView
        result={null} rawError={null} loading={false} saving={false} savedSessionId={null}
        onCorrect={vi.fn()} onSave={vi.fn()}
      />
    )
    expect(screen.getByRole('textbox')).toBeDefined()
    expect(screen.getByText('Corregir')).toBeDefined()
  })

  it('calls onCorrect when button clicked with text', () => {
    const onCorrect = vi.fn()
    render(
      <CorrectionView
        result={null} rawError={null} loading={false} saving={false} savedSessionId={null}
        onCorrect={onCorrect} onSave={vi.fn()}
      />
    )
    const textarea = screen.getByRole('textbox')
    fireEvent.change(textarea, { target: { value: 'Ich gehe zu der Schule.' } })
    fireEvent.click(screen.getByText('Corregir'))
    expect(onCorrect).toHaveBeenCalledWith('Ich gehe zu der Schule.', 'B1')
  })

  it('shows corrected text when result is provided', () => {
    render(
      <CorrectionView
        result={mockResult} rawError={null} loading={false} saving={false} savedSessionId={null}
        onCorrect={vi.fn()} onSave={vi.fn()}
      />
    )
    expect(screen.getByText('Ich gehe zur Schule.')).toBeDefined()
  })

  it('shows error panel with error count', () => {
    render(
      <CorrectionView
        result={mockResult} rawError={null} loading={false} saving={false} savedSessionId={null}
        onCorrect={vi.fn()} onSave={vi.fn()}
      />
    )
    expect(screen.getByText('Errores (1)')).toBeDefined()
  })

  it('shows Guardar button when result is available', () => {
    render(
      <CorrectionView
        result={mockResult} rawError={null} loading={false} saving={false} savedSessionId={null}
        onCorrect={vi.fn()} onSave={vi.fn()}
      />
    )
    expect(screen.getByText('Guardar')).toBeDefined()
  })

  it('shows raw error when JSON parse fails', () => {
    render(
      <CorrectionView
        result={null} rawError="invalid json output" loading={false} saving={false} savedSessionId={null}
        onCorrect={vi.fn()} onSave={vi.fn()}
      />
    )
    expect(screen.getByText('invalid json output')).toBeDefined()
  })
})
