import { create } from 'zustand'

type BackendStatus = 'checking' | 'available' | 'unavailable'

interface BackendState {
  status: BackendStatus
  setStatus: (s: BackendStatus) => void
}

export const useBackendStore = create<BackendState>()((set) => ({
  status: 'checking',
  setStatus: (status) => set({ status }),
}))
