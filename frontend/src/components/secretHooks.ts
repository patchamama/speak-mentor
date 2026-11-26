import { MIN_PASSWORD_LENGTH } from '@/shared/crypto/vault'
import { useSettingsStore } from '@/stores/settingsStore'
import { useStorageStore } from '@/stores/storageStore'
import { useUnlockStore } from '@/stores/unlockStore'

export function useHasStoredSecrets(): boolean {
  const hasKeys = useSettingsStore((s) =>
    Object.values(s.remoteProviders).some((entry) => entry?.encryptedApiKey),
  )
  const hasToken = useStorageStore((s) => s.github !== null)
  return hasKeys || hasToken
}

/** Whether `NewSecretPassword` has what it needs to submit. */
export function useNewSecretPasswordReady(password: string, confirm: string): boolean {
  const unlocked = useUnlockStore((s) => s.masterPassword !== null)
  const hasSecrets = useHasStoredSecrets()
  if (unlocked) return true
  return password.length >= MIN_PASSWORD_LENGTH && (hasSecrets || password === confirm)
}
