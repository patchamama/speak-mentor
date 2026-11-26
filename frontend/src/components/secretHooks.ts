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

export function useVaultOpen(): boolean {
  return useUnlockStore((s) => s.masterPassword !== null)
}
