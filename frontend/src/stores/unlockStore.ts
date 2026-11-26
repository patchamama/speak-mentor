import { create } from 'zustand'
import type { LLMProviderId } from '@/shared/llm/types'

// Session-only store: holds decrypted API keys in memory. NEVER persisted to
// localStorage. Lost on tab close / hard reload — the user re-enters the master
// password on next session.

type RemoteProviderId = Exclude<LLMProviderId, 'ollama'>

interface UnlockState {
  masterPassword: string | null
  /** Decrypted GitHub storage token. Memory only. */
  githubToken: string | null
  setGitHubToken: (token: string | null) => void
  decryptedKeys: Partial<Record<RemoteProviderId, string>>
  setMasterPassword: (password: string | null) => void
  setDecryptedKey: (provider: RemoteProviderId, key: string) => void
  clearProvider: (provider: RemoteProviderId) => void
  lock: () => void
}

export const useUnlockStore = create<UnlockState>((set) => ({
  masterPassword: null,
  decryptedKeys: {},
  githubToken: null,
  setGitHubToken: (token) => set({ githubToken: token }),
  setMasterPassword: (password) => set({ masterPassword: password }),
  setDecryptedKey: (provider, key) =>
    set((state) => ({ decryptedKeys: { ...state.decryptedKeys, [provider]: key } })),
  clearProvider: (provider) =>
    set((state) => {
      const next = { ...state.decryptedKeys }
      delete next[provider]
      return { decryptedKeys: next }
    }),
  lock: () => set({ masterPassword: null, decryptedKeys: {}, githubToken: null }),
}))
