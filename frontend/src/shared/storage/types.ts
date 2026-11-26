import type { ErrorItem, Session } from '@/shared/types'

export type NewSession = Omit<Session, 'id' | 'created_at'>

export interface StoredSession extends Session {
  id: number
  created_at: string
  errors: ErrorItem[]
}

export interface DbDocument {
  version: 1
  /** Monotonic: ids are never reused after a delete. */
  nextId: number
  sessions: StoredSession[]
}

export interface SessionPage {
  sessions: Session[]
  total: number
  page: number
  pages: number
}

export interface ListParams {
  page?: number
  per_page?: number
  mode?: string
}

export interface SessionStore {
  saveSession(session: NewSession): Promise<{ session_id: number }>
  listSessions(params?: ListParams): Promise<SessionPage>
  getSession(id: number): Promise<Session>
  deleteSession(id: number): Promise<void>
  getStatsByType(): Promise<{ type: string; count: number }[]>
  getStatsByLevel(): Promise<{ level: string; count: number }[]>
  getStatsTimeline(days?: number): Promise<{ day: string; count: number }[]>
  getTopRules(limit?: number): Promise<{ rule: string; count: number }[]>
}

export interface DocumentAdapter {
  read(): Promise<DbDocument>
  /** Applies `change` to the latest document and persists the result atomically. */
  update<T>(change: (doc: DbDocument) => { doc: DbDocument; result: T }, message: string): Promise<T>
}
