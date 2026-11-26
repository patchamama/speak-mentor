import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react'
import { SettingsContainer } from '../SettingsContainer'
import { useSettingsStore } from '@/stores/settingsStore'
import { useStorageStore } from '@/stores/storageStore'
import { useUnlockStore } from '@/stores/unlockStore'
import { useBackendStore } from '@/stores/backendStore'

const json = (body: unknown) =>
  new Response(JSON.stringify(body), { headers: { 'content-type': 'application/json' } })
const passwordLabels = () => screen.queryAllByLabelText(/^(clave|contraseña) maestra/i, { selector: 'input' })

beforeEach(() => {
  localStorage.clear()
  useUnlockStore.getState().lock()
  useStorageStore.setState({ github: null, mode: 'auto' })
  useSettingsStore.setState({ activeProvider: 'openai', remoteProviders: {} })
  useBackendStore.setState({ status: 'unavailable' })
  vi.stubGlobal('fetch', vi.fn(async () => json({ data: [{ id: 'gpt-4o' }, { id: 'gpt-4o-mini' }] })))
})
afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

describe('Connection and storage settings', () => {
  it('shows provider and storage in a single tab', () => {
    render(<SettingsContainer />)
    expect(screen.getByRole('button', { name: 'Conexión y almacenamiento' })).toBeDefined()
    expect(screen.queryByRole('button', { name: 'Almacenamiento' })).toBeNull()
    expect(screen.getByLabelText('Proveedor')).toBeDefined()
    expect(screen.getByLabelText('Dónde guardar el historial')).toBeDefined()
  })

  it('asks for the master password in exactly one place', () => {
    render(<SettingsContainer />)
    expect(passwordLabels()).toHaveLength(1)
  })

  it('needs the vault open before storing a key or a token', () => {
    render(<SettingsContainer />)
    fireEvent.change(screen.getByLabelText('API key'), { target: { value: 'sk-x' } })
    fireEvent.change(screen.getByLabelText('Token de GitHub'), { target: { value: 'ghp_x' } })
    expect(screen.getByRole('button', { name: 'Conectar y cargar modelos' })).toHaveProperty('disabled', true)
    expect(screen.getByRole('button', { name: 'Conectar GitHub' })).toHaveProperty('disabled', true)
  })

  it('lists the models in a select after connecting and saves the chosen one', async () => {
    useUnlockStore.setState({ masterPassword: 'master-secret-1' })
    render(<SettingsContainer />)
    expect(passwordLabels()).toHaveLength(0)
    expect(screen.queryByLabelText(/^Modelo \(opcional/)).toBeNull()
    fireEvent.change(screen.getByLabelText('API key'), { target: { value: 'sk-x' } })
    fireEvent.click(screen.getByRole('button', { name: 'Conectar y cargar modelos' }))
    const select = await screen.findByRole('combobox', { name: 'Modelo' }, { timeout: 5000 })
    await waitFor(() => expect(select.querySelectorAll('option')).toHaveLength(2))
    fireEvent.change(select, { target: { value: 'gpt-4o-mini' } })
    expect(useSettingsStore.getState().remoteProviders.openai?.model).toBe('gpt-4o-mini')
  })

  it('lists the installed Ollama models without pressing any button', async () => {
    useSettingsStore.setState({ activeProvider: 'ollama' })
    vi.stubGlobal('fetch', vi.fn(async () => json({ models: [{ name: 'llama3' }, { name: 'qwen' }] })))
    render(<SettingsContainer />)
    const select = await screen.findByRole('combobox', { name: 'Modelo' })
    expect(select.querySelectorAll('option')).toHaveLength(2)
  })

  const savedGitHub = {
    owner: 'tester', repo: 'speak-mentor-data', branch: 'main', path: 'data/speak-mentor.json',
    encryptedToken: { v: 1 as const, salt: 'a', iv: 'b', ct: 'c' },
  }

  it.each([
    ['unlocked', { masterPassword: 'master-secret-1', githubToken: 'old' }],
    ['locked', { masterPassword: null, githubToken: null }],
  ])('always offers to change the GitHub token (%s)', (_state, unlock) => {
    useUnlockStore.setState(unlock)
    useStorageStore.setState({ github: savedGitHub })
    render(<SettingsContainer />)
    fireEvent.click(screen.getByRole('button', { name: 'Cambiar token' }))
    expect(screen.getByLabelText('Token de GitHub')).toBeDefined()
  })

  it('keeps the old token when the new one fails and replaces it when it works', async () => {
    useUnlockStore.setState({ masterPassword: 'master-secret-1', githubToken: 'old' })
    useStorageStore.setState({ github: savedGitHub })
    let valid = false
    vi.stubGlobal('fetch', vi.fn(async (url: string) => {
      if (!valid) return new Response('{}', { status: 401 })
      if (String(url).endsWith('/user')) return json({ login: 'tester' })
      return json({ private: true, default_branch: 'main', permissions: { push: true } })
    }))
    render(<SettingsContainer />)
    fireEvent.click(screen.getByRole('button', { name: 'Cambiar token' }))
    fireEvent.change(screen.getByLabelText('Token de GitHub'), { target: { value: 'new-token' } })
    fireEvent.click(screen.getByRole('button', { name: 'Conectar GitHub' }))
    await screen.findByText('GitHub rechazó el token (401).')
    expect(useUnlockStore.getState().githubToken).toBe('old')
    expect(useStorageStore.getState().github?.encryptedToken).toEqual(savedGitHub.encryptedToken)

    valid = true
    fireEvent.click(screen.getByRole('button', { name: 'Conectar GitHub' }))
    await waitFor(() => expect(useUnlockStore.getState().githubToken).toBe('new-token'), { timeout: 5000 })
    expect(useStorageStore.getState().github?.encryptedToken).not.toEqual(savedGitHub.encryptedToken)
  })

  it('shows the reminder next to the unlock field', () => {
    localStorage.setItem('speak-mentor-password-hint', 'xyz')
    useStorageStore.setState({ github: savedGitHub })
    render(<SettingsContainer />)
    expect(screen.getByText(/termina en/).textContent).toContain('xyz')
  })
})
