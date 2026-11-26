import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { HistoryContainer } from '../HistoryContainer'
import { useStorageStore } from '@/stores/storageStore'
import { useUnlockStore } from '@/stores/unlockStore'
import { useBackendStore } from '@/stores/backendStore'

const github = {
  owner: 'a', repo: 'speak-mentor-data', branch: 'main', path: 'data/speak-mentor.json',
  encryptedToken: { v: 1 as const, salt: 'a', iv: 'b', ct: 'c' },
}
const fetchSpy = vi.fn(async () => new Response('{}', { status: 404 }))

function renderHistory(onUnlock = vi.fn(), initialTab: 'sessions' | 'stats' = 'stats') {
  render(
    <QueryClientProvider client={new QueryClient()}>
      <HistoryContainer initialTab={initialTab} onUnlock={onUnlock} />
    </QueryClientProvider>,
  )
  return onUnlock
}

describe('history with a saved but locked GitHub token', () => {
  beforeEach(() => {
    localStorage.clear()
    useUnlockStore.getState().lock()
    useStorageStore.setState({ github, mode: 'auto' })
    useBackendStore.setState({ status: 'unavailable' })
    vi.stubGlobal('fetch', fetchSpy)
    fetchSpy.mockClear()
  })
  afterEach(() => {
    cleanup()
    vi.unstubAllGlobals()
  })

  it.each(['stats', 'sessions'] as const)('explains it without showing an error (%s)', (tab) => {
    renderHistory(vi.fn(), tab)
    expect(screen.getByText(/Tu token de GitHub ya está guardado/)).toBeDefined()
    expect(screen.queryByRole('alert')).toBeNull()
    expect(screen.queryByText('No se pudo cargar el historial')).toBeNull()
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('offers to go and unlock', () => {
    const onUnlock = renderHistory()
    fireEvent.click(screen.getByRole('button', { name: 'Desbloquear claves' }))
    expect(onUnlock).toHaveBeenCalled()
  })

  it('says so when the token uses another password', () => {
    useUnlockStore.setState({ masterPassword: 'master-secret-1' })
    renderHistory()
    expect(screen.getByText(/se cifró con otra contraseña/)).toBeDefined()
  })

  it('shows empty stats once unlocked and the data file does not exist yet', async () => {
    useUnlockStore.setState({ masterPassword: 'master-secret-1', githubToken: 't' })
    renderHistory()
    expect(await screen.findAllByText(/Sin datos aún/)).not.toHaveLength(0)
    expect(screen.queryByRole('alert')).toBeNull()
  })
})
