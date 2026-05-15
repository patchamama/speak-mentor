import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ErrorHighlight } from '../components/ErrorHighlight'
import type { CorrectionResponse } from '@/shared/ollama/schemas'

const errors: CorrectionResponse['errors'] = [
  {
    original: 'zu der',
    correction: 'zur',
    type: 'preposition',
    severity: 'major',
    position: { start: 9, end: 15 },
    explanation: 'Contracción',
    rule_reference: 'Verschmelzung',
    example: 'zur Arbeit',
  },
]

describe('ErrorHighlight', () => {
  it('renders text with highlighted error span', () => {
    render(
      <ErrorHighlight
        text="Ich gehe zu der Schule."
        errors={errors}
        activeErrorIdx={null}
        onErrorClick={vi.fn()}
      />
    )
    expect(screen.getByText('zu der')).toBeDefined()
  })

  it('calls onErrorClick when highlighted span is clicked', () => {
    const onClick = vi.fn()
    render(
      <ErrorHighlight
        text="Ich gehe zu der Schule."
        errors={errors}
        activeErrorIdx={null}
        onErrorClick={onClick}
      />
    )
    fireEvent.click(screen.getByText('zu der'))
    expect(onClick).toHaveBeenCalledWith(0)
  })

  it('skips unreliable positions from inline highlight', () => {
    const unreliableErrors = [
      { ...errors[0], position: null, position_unreliable: true },
    ]
    render(
      <ErrorHighlight
        text="Ich gehe zu der Schule."
        errors={unreliableErrors as CorrectionResponse['errors']}
        activeErrorIdx={null}
        onErrorClick={vi.fn()}
      />
    )
    // Should not find a clickable span — whole text rendered as plain
    expect(screen.queryByTitle(/preposition/)).toBeNull()
  })
})
