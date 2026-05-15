import { useState, useCallback } from 'react'

const MAX_ENTRIES = 10

export function useInputHistory(storageKey: string) {
  const load = (): string[] => {
    try {
      return JSON.parse(localStorage.getItem(storageKey) ?? '[]')
    } catch {
      return []
    }
  }

  const [history, setHistory] = useState<string[]>(load)

  const push = useCallback(
    (entry: string) => {
      const trimmed = entry.trim()
      if (!trimmed) return
      setHistory((prev) => {
        const deduped = [trimmed, ...prev.filter((e) => e !== trimmed)].slice(0, MAX_ENTRIES)
        localStorage.setItem(storageKey, JSON.stringify(deduped))
        return deduped
      })
    },
    [storageKey]
  )

  const remove = useCallback(
    (entry: string) => {
      setHistory((prev) => {
        const next = prev.filter((e) => e !== entry)
        localStorage.setItem(storageKey, JSON.stringify(next))
        return next
      })
    },
    [storageKey]
  )

  return { history, push, remove }
}
