import { emptyDocument, parseDocument } from './document'
import type { DocumentAdapter } from './types'

export const BROWSER_KEY = 'speak-mentor-sessions'

export function browserAdapter(): DocumentAdapter {
  const read = async () => {
    const raw = localStorage.getItem(BROWSER_KEY)
    return raw === null ? emptyDocument() : parseDocument(raw)
  }
  return {
    read,
    async update(change) {
      // No await between read and write: concurrent saves cannot interleave.
      const raw = localStorage.getItem(BROWSER_KEY)
      const { doc, result } = change(raw === null ? emptyDocument() : parseDocument(raw))
      localStorage.setItem(BROWSER_KEY, JSON.stringify(doc))
      return result
    },
  }
}
