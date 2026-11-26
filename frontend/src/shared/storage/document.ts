// Backend-equivalent session queries over a single JSON document.
import type { DbDocument, DocumentAdapter, SessionStore, StoredSession } from './types'

export function emptyDocument(): DbDocument {
  return { version: 1, nextId: 1, sessions: [] }
}

/** Throws instead of returning an empty document, so bad data is never overwritten. */
export function parseDocument(raw: string): DbDocument {
  let value: unknown
  try {
    value = JSON.parse(raw)
  } catch {
    throw new Error('El archivo de datos no es un JSON válido. No se modificó.')
  }
  const doc = value as Partial<DbDocument> | null
  if (!doc || doc.version !== 1 || typeof doc.nextId !== 'number' || !Array.isArray(doc.sessions)) {
    throw new Error('El archivo de datos no tiene el formato de Speak Mentor. No se modificó.')
  }
  return doc as DbDocument
}

function countBy(values: (string | undefined)[]): [string, number][] {
  const counts = new Map<string, number>()
  for (const value of values) {
    if (value === undefined || value === null) continue
    counts.set(value, (counts.get(value) ?? 0) + 1)
  }
  return [...counts]
}

const byCountDesc = (a: [string, number], b: [string, number]) => b[1] - a[1]
const byKey = (a: [string, number], b: [string, number]) => a[0].localeCompare(b[0])

export function createDocumentStore(adapter: DocumentAdapter): SessionStore {
  const allErrors = async () => {
    const { sessions } = await adapter.read()
    return sessions.flatMap((session) => session.errors.map((error) => ({ session, error })))
  }

  return {
    saveSession(input) {
      return adapter.update((doc) => {
        const session: StoredSession = {
          ...input,
          errors: input.errors ?? [],
          id: doc.nextId,
          created_at: new Date().toISOString(),
        }
        return {
          doc: { ...doc, nextId: doc.nextId + 1, sessions: [...doc.sessions, session] },
          result: { session_id: session.id },
        }
      }, 'data: save session')
    },

    async listSessions({ page = 1, per_page = 20, mode } = {}) {
      const { sessions } = await adapter.read()
      const matching = sessions
        .filter((s) => !mode || s.mode === mode)
        .sort((a, b) => b.created_at.localeCompare(a.created_at) || b.id - a.id)
      return {
        sessions: matching
          .slice((page - 1) * per_page, page * per_page)
          .map((s) => ({ ...s, errors: undefined })),
        total: matching.length,
        page,
        pages: Math.ceil(matching.length / per_page),
      }
    },

    async getSession(id) {
      const found = (await adapter.read()).sessions.find((s) => s.id === id)
      if (!found) throw new Error(`Sesión ${id} no encontrada`)
      return found
    },

    deleteSession(id) {
      return adapter.update(
        (doc) => ({
          doc: { ...doc, sessions: doc.sessions.filter((s) => s.id !== id) },
          result: undefined,
        }),
        `data: delete session ${id}`,
      )
    },

    async getStatsByType() {
      return countBy((await allErrors()).map((e) => e.error.type))
        .sort(byCountDesc)
        .map(([type, count]) => ({ type, count }))
    },

    async getStatsByLevel() {
      return countBy((await allErrors()).map((e) => e.session.level))
        .sort(byKey)
        .map(([level, count]) => ({ level, count }))
    },

    async getStatsTimeline(days = 30) {
      const since = new Date(Date.now() - days * 86_400_000).toISOString().slice(0, 10)
      return countBy((await allErrors()).map((e) => e.session.created_at.slice(0, 10)))
        .filter(([day]) => day >= since)
        .sort(byKey)
        .map(([day, count]) => ({ day, count }))
    },

    async getTopRules(limit = 10) {
      return countBy((await allErrors()).map((e) => e.error.rule_reference))
        .sort(byCountDesc)
        .slice(0, limit)
        .map(([rule, count]) => ({ rule, count }))
    },
  }
}
