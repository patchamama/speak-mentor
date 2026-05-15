import ky from 'ky'
import type { Session } from '@/shared/types'

const api = ky.create({ prefixUrl: 'http://localhost:5001/api', timeout: 10000 })

export async function saveSession(session: Omit<Session, 'id' | 'created_at'>): Promise<{ session_id: number }> {
  return api.post('sessions', { json: session }).json()
}

export async function listSessions(params?: { page?: number; per_page?: number; mode?: string }) {
  const searchParams: Record<string, string | number> = {}
  if (params?.page !== undefined) searchParams.page = params.page
  if (params?.per_page !== undefined) searchParams.per_page = params.per_page
  if (params?.mode) searchParams.mode = params.mode
  return api.get('sessions', { searchParams }).json<{
    sessions: Session[]
    total: number
    page: number
    pages: number
  }>()
}

export async function getSession(id: number): Promise<Session> {
  return api.get(`sessions/${id}`).json()
}

export async function deleteSession(id: number): Promise<void> {
  await api.delete(`sessions/${id}`)
}

export async function getStatsByType() {
  return api.get('stats/by-type').json<{ type: string; count: number }[]>()
}

export async function getStatsByLevel() {
  return api.get('stats/by-level').json<{ level: string; count: number }[]>()
}

export async function getStatsTimeline(days = 30) {
  return api.get('stats/timeline', { searchParams: { days } }).json<{ day: string; count: number }[]>()
}

export async function getTopRules(limit = 10) {
  return api.get('stats/top-rules', { searchParams: { limit } }).json<{ rule: string; count: number }[]>()
}
