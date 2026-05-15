import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SettingsContainer } from '../SettingsContainer'

vi.mock('@/shared/ollama/client', () => ({
  fetchOllamaModels: vi.fn().mockResolvedValue([{ name: 'translategemma:12b', size: 0, modified_at: '' }]),
}))

describe('SettingsContainer', () => {
  it('renders URL, port, model fields', () => {
    render(<SettingsContainer />)
    expect(screen.getByLabelText('URL')).toBeDefined()
    expect(screen.getByLabelText('Puerto')).toBeDefined()
    expect(screen.getByLabelText('Modelo')).toBeDefined()
  })

  it('has test connection button', () => {
    render(<SettingsContainer />)
    expect(screen.getByText('Probar conexión')).toBeDefined()
  })
})
