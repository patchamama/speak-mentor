// One master password opens every secret stored encrypted in localStorage.
// The password and the decrypted values live only in the in-memory unlock store.
import { useSettingsStore, type RemoteProviderId } from '@/stores/settingsStore'
import { useStorageStore } from '@/stores/storageStore'
import { useUnlockStore } from '@/stores/unlockStore'
import { DecryptError, decryptSecret, encryptSecret, type EncryptedSecret } from './secret'

export type SecretId = RemoteProviderId | 'github'

export const MIN_PASSWORD_LENGTH = 6

export function listStoredSecrets(): { id: SecretId; envelope: EncryptedSecret }[] {
  const providers = Object.entries(useSettingsStore.getState().remoteProviders).flatMap(
    ([id, entry]) =>
      entry?.encryptedApiKey
        ? [{ id: id as SecretId, envelope: entry.encryptedApiKey }]
        : [],
  )
  const github = useStorageStore.getState().github
  return github ? [...providers, { id: 'github', envelope: github.encryptedToken }] : providers
}

function keepInMemory(id: SecretId, value: string): void {
  const unlock = useUnlockStore.getState()
  if (id === 'github') unlock.setGitHubToken(value)
  else unlock.setDecryptedKey(id, value)
}

/**
 * Decrypts everything the password opens. Throws when secrets exist and it opens
 * none of them; `failed` lists secrets encrypted with a different password.
 */
export async function unlockVault(password: string): Promise<{ failed: SecretId[] }> {
  const secrets = listStoredSecrets()
  const results = await Promise.allSettled(
    secrets.map(({ envelope }) => decryptSecret(envelope, password)),
  )
  const failed: SecretId[] = []
  results.forEach((result, i) => {
    if (result.status === 'rejected') failed.push(secrets[i].id)
  })
  if (secrets.length > 0 && failed.length === secrets.length) throw new DecryptError()
  results.forEach((result, i) => {
    if (result.status === 'fulfilled') keepInMemory(secrets[i].id, result.value)
  })
  useUnlockStore.getState().setMasterPassword(password)
  return { failed }
}

export async function sealSecret(plaintext: string): Promise<EncryptedSecret> {
  const password = useUnlockStore.getState().masterPassword
  if (!password) throw new Error('Introduce primero la contraseña maestra.')
  return encryptSecret(plaintext, password)
}

/** Re-encrypts a secret saved with another password under the master password. */
export async function migrateSecret(id: SecretId, oldPassword: string): Promise<void> {
  const secret = listStoredSecrets().find((s) => s.id === id)
  if (!secret) return
  const value = await decryptSecret(secret.envelope, oldPassword)
  const envelope = await sealSecret(value)
  if (id === 'github') {
    const { github, setGitHub } = useStorageStore.getState()
    if (github) setGitHub({ ...github, encryptedToken: envelope })
  } else {
    useSettingsStore.getState().updateRemoteProvider(id, { encryptedApiKey: envelope })
  }
  keepInMemory(id, value)
}
