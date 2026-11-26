import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { EncryptedSecret } from '@/shared/crypto/secret'
import type { GitHubConfig } from '@/shared/storage/github'
import type { StorageMode } from '@/shared/storage/resolve'

export interface GitHubStorageSettings extends GitHubConfig {
  encryptedToken: EncryptedSecret
}

interface StorageState {
  mode: StorageMode
  github: GitHubStorageSettings | null
  setMode: (mode: StorageMode) => void
  setGitHub: (github: GitHubStorageSettings | null) => void
}

export const useStorageStore = create<StorageState>()(
  persist(
    (set) => ({
      mode: 'auto',
      github: null,
      setMode: (mode) => set({ mode }),
      setGitHub: (github) => set({ github }),
    }),
    { name: 'speak-mentor-storage', version: 1 },
  ),
)
