import { create } from 'zustand'

// Each active task registers itself with a unique key and a progress 0-100.
// The favicon shows the average of all active tasks.
// When a task finishes (progress === null), remove it.

interface FaviconStore {
  tasks: Record<string, number>
  setTask: (key: string, progress: number | null) => void
  overallProgress: () => number | null
}

export const useFaviconStore = create<FaviconStore>((set, get) => ({
  tasks: {},

  setTask: (key, progress) => {
    set((state) => {
      const tasks = { ...state.tasks }
      if (progress === null) {
        delete tasks[key]
      } else {
        tasks[key] = Math.min(100, Math.max(0, progress))
      }
      return { tasks }
    })
  },

  overallProgress: () => {
    const { tasks } = get()
    const values = Object.values(tasks)
    if (values.length === 0) return null
    return values.reduce((a, b) => a + b, 0) / values.length
  },
}))
