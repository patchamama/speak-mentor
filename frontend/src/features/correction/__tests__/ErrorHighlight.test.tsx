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

  it('does not highlight an error whose original is not in the text', () => {
    render(
      <ErrorHighlight
        text="Ich gehe zu der Schule."
        errors={[{ ...errors[0], original: 'bei dem', position: null }]}
        activeErrorIdx={null}
        onErrorClick={vi.fn()}
      />
    )
    expect(screen.queryByTitle(/preposition/)).toBeNull()
  })

  it('locates the error by text even when the model position is wrong', () => {
    render(
      <ErrorHighlight
        text="Ich gehe zu der Schule."
        errors={[{ ...errors[0], position: { start: 0, end: 3 } }]}
        activeErrorIdx={null}
        onErrorClick={vi.fn()}
      />
    )
    expect(screen.getByTitle(/preposition/).textContent).toBe('zu der')
  })
})
