import { create } from 'zustand'

interface OllamaActivityState {
  busy: boolean
  setBusy: (busy: boolean) => void
}

export const useOllamaActivityStore = create<OllamaActivityState>()((set) => ({
  busy: false,
  setBusy: (busy) => set({ busy }),
}))
