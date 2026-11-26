import { t } from '@/i18n'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  listSessions, getSession, deleteSession,
  getStatsByType, getStatsByLevel, getStatsTimeline, getTopRules,
} from '@/shared/storage'
import { useStorageTarget } from '@/shared/storage/useStorageTarget'

export function useSessionList(page = 1, mode?: string) {
  const { ready: enabled, cacheKey } = useStorageTarget()
  return useQuery({
    queryKey: ['sessions', cacheKey, page, mode],
    queryFn: () => listSessions({ page, per_page: 20, mode }),
    enabled,
  })
}

export function useSessionDetail(id: number | null) {
  const { ready, cacheKey } = useStorageTarget()
  return useQuery({
    queryKey: ['session', cacheKey, id],
    queryFn: () => getSession(id!),
    enabled: id !== null && ready,
  })
}

export function useDeleteSession() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => deleteSession(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sessions'] })
      qc.invalidateQueries({ queryKey: ['stats'] })
      toast.success(t('Sesión eliminada'))
    },
    onError: (err) => toast.error(err.message || t('Error al eliminar la sesión')),
  })
}

export function useStatsByType() {
  const { ready: enabled, cacheKey } = useStorageTarget()
  return useQuery({ queryKey: ['stats', cacheKey, 'by-type'], queryFn: getStatsByType, enabled })
}

export function useStatsByLevel() {
  const { ready: enabled, cacheKey } = useStorageTarget()
  return useQuery({ queryKey: ['stats', cacheKey, 'by-level'], queryFn: getStatsByLevel, enabled })
}

export function useStatsTimeline(days = 30) {
  const { ready: enabled, cacheKey } = useStorageTarget()
  return useQuery({ queryKey: ['stats', cacheKey, 'timeline', days], queryFn: () => getStatsTimeline(days), enabled })
}

export function useTopRules(limit = 10) {
  const { ready: enabled, cacheKey } = useStorageTarget()
  return useQuery({ queryKey: ['stats', cacheKey, 'top-rules', limit], queryFn: () => getTopRules(limit), enabled })
}
