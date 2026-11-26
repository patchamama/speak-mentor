import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type CorrectionView = 'cards' | 'detailed'

interface CorrectionViewState {
  view: CorrectionView
  setView: (view: CorrectionView) => void
}

export const useCorrectionViewStore = create<CorrectionViewState>()(
  persist(
    (set) => ({
      view: 'cards',
      setView: (view) => set({ view }),
    }),
    { name: 'speak-mentor-correction-view' },
  ),
)
