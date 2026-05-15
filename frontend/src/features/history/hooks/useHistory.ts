import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  listSessions, getSession, deleteSession,
  getStatsByType, getStatsByLevel, getStatsTimeline, getTopRules,
} from '@/shared/api/flaskClient'

export function useSessionList(page = 1, mode?: string) {
  return useQuery({
    queryKey: ['sessions', page, mode],
    queryFn: () => listSessions({ page, per_page: 20, mode }),
  })
}

export function useSessionDetail(id: number | null) {
  return useQuery({
    queryKey: ['session', id],
    queryFn: () => getSession(id!),
    enabled: id !== null,
  })
}

export function useDeleteSession() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => deleteSession(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sessions'] })
      toast.success('Sesión eliminada')
    },
    onError: () => toast.error('Error al eliminar la sesión'),
  })
}

export function useStatsByType() {
  return useQuery({ queryKey: ['stats', 'by-type'], queryFn: getStatsByType })
}

export function useStatsByLevel() {
  return useQuery({ queryKey: ['stats', 'by-level'], queryFn: getStatsByLevel })
}

export function useStatsTimeline(days = 30) {
  return useQuery({ queryKey: ['stats', 'timeline', days], queryFn: () => getStatsTimeline(days) })
}

export function useTopRules(limit = 10) {
  return useQuery({ queryKey: ['stats', 'top-rules', limit], queryFn: () => getTopRules(limit) })
}
