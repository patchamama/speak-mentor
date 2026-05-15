import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ErrorBoundary } from '../ErrorBoundary'

function BrokenComponent(): React.ReactElement {
  throw new Error('Test error')
}

describe('ErrorBoundary', () => {
  it('renders children when no error', () => {
    render(
      <ErrorBoundary>
        <p>contenido ok</p>
      </ErrorBoundary>
    )
    expect(screen.getByText('contenido ok')).toBeDefined()
  })

  it('renders fallback when child throws', () => {
    // suppress console.error for this test
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    render(
      <ErrorBoundary>
        <BrokenComponent />
      </ErrorBoundary>
    )
    expect(screen.getByText('Algo salió mal')).toBeDefined()
    spy.mockRestore()
  })
})
