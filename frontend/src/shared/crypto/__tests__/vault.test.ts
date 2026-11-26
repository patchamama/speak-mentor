import { describe, it, expect, beforeEach } from 'vitest'
import { encryptSecret } from '../secret'
import { listStoredSecrets, migrateSecret, sealSecret, unlockVault } from '../vault'
import { useSettingsStore } from '@/stores/settingsStore'
import { useStorageStore } from '@/stores/storageStore'
import { useUnlockStore } from '@/stores/unlockStore'

const MASTER = 'master-password-1'
const github = { owner: 'a', repo: 'speak-mentor-data', branch: 'main', path: 'data/speak-mentor.json' }

async function storeSecrets(llmPassword = MASTER, ghPassword = MASTER) {
  useSettingsStore.getState().setRemoteProvider('anthropic', {
    model: 'm', encryptedApiKey: await encryptSecret('sk-plain', llmPassword),
  })
  useStorageStore.getState().setGitHub({ ...github, encryptedToken: await encryptSecret('gh-plain', ghPassword) })
}

const storedText = () => Object.keys(localStorage).map((k) => localStorage.getItem(k)).join('\n')

describe('vault', () => {
  beforeEach(() => {
    localStorage.clear()
    useUnlockStore.getState().lock()
    useSettingsStore.setState({ remoteProviders: {} })
    useStorageStore.setState({ github: null })
  })

  it('unlocks every stored secret with one password', async () => {
    await storeSecrets()
    expect(await unlockVault(MASTER)).toEqual({ failed: [] })
    expect(useUnlockStore.getState().decryptedKeys.anthropic).toBe('sk-plain')
    expect(useUnlockStore.getState().githubToken).toBe('gh-plain')
  })

  it('never persists the master password or the plain secrets', async () => {
    await storeSecrets()
    await unlockVault(MASTER)
    useSettingsStore.getState().setPipeline({})
    expect(storedText()).not.toContain(MASTER)
    expect(storedText()).not.toContain('sk-plain')
    expect(storedText()).not.toContain('gh-plain')
  })

  it('rejects a password that opens nothing', async () => {
    await storeSecrets()
    await expect(unlockVault('wrong-password')).rejects.toThrow()
    expect(useUnlockStore.getState().masterPassword).toBeNull()
  })

  it('reports and migrates a secret encrypted with another password', async () => {
    await storeSecrets(MASTER, 'old-password')
    expect(await unlockVault(MASTER)).toEqual({ failed: ['github'] })
    await migrateSecret('github', 'old-password')
    useUnlockStore.getState().lock()
    expect(await unlockVault(MASTER)).toEqual({ failed: [] })
    expect(listStoredSecrets()).toHaveLength(2)
  })

  it('accepts a new password when nothing is stored and seals with it', async () => {
    await unlockVault(MASTER)
    const envelope = await sealSecret('value')
    useStorageStore.getState().setGitHub({ ...github, encryptedToken: envelope })
    useUnlockStore.getState().lock()
    await unlockVault(MASTER)
    expect(useUnlockStore.getState().githubToken).toBe('value')
  })

  it('cannot seal while locked', async () => {
    await expect(sealSecret('value')).rejects.toThrow()
  })
})
