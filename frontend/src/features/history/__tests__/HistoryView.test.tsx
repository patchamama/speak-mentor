import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { HistoryContainer } from '../HistoryContainer'

vi.mock('@/shared/api/flaskClient', () => ({
  listSessions: vi.fn().mockResolvedValue({ sessions: [], total: 0, page: 1, pages: 1 }),
  getSession: vi.fn(),
  deleteSession: vi.fn(),
  getStatsByType: vi.fn().mockResolvedValue([]),
  getStatsByLevel: vi.fn().mockResolvedValue([]),
  getStatsTimeline: vi.fn().mockResolvedValue([]),
  getTopRules: vi.fn().mockResolvedValue([]),
}))

function wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>
}

describe('HistoryContainer', () => {
  it('renders sessions and stats tabs', () => {
    render(<HistoryContainer />, { wrapper })
    expect(screen.getByText('Sesiones')).toBeDefined()
    expect(screen.getByText('Estadísticas')).toBeDefined()
  })

  it('renders filter buttons', () => {
    render(<HistoryContainer />, { wrapper })
    expect(screen.getByText('Todos')).toBeDefined()
    expect(screen.getByText('Corrección')).toBeDefined()
    expect(screen.getByText('Traducción')).toBeDefined()
  })

  it('renders export button', () => {
    render(<HistoryContainer />, { wrapper })
    expect(screen.getByText('Exportar JSON')).toBeDefined()
  })
})
