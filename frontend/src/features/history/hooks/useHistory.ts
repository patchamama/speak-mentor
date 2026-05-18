import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  listSessions, getSession, deleteSession,
  getStatsByType, getStatsByLevel, getStatsTimeline, getTopRules,
} from '@/shared/api/flaskClient'
import { useBackendStore } from '@/stores/backendStore'

function useBackendEnabled() {
  return useBackendStore((s) => s.status === 'available')
}

export function useSessionList(page = 1, mode?: string) {
  const enabled = useBackendEnabled()
  return useQuery({
    queryKey: ['sessions', page, mode],
    queryFn: () => listSessions({ page, per_page: 20, mode }),
    enabled,
  })
}

export function useSessionDetail(id: number | null) {
  const backendEnabled = useBackendEnabled()
  return useQuery({
    queryKey: ['session', id],
    queryFn: () => getSession(id!),
    enabled: id !== null && backendEnabled,
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
  const enabled = useBackendEnabled()
  return useQuery({ queryKey: ['stats', 'by-type'], queryFn: getStatsByType, enabled })
}

export function useStatsByLevel() {
  const enabled = useBackendEnabled()
  return useQuery({ queryKey: ['stats', 'by-level'], queryFn: getStatsByLevel, enabled })
}

export function useStatsTimeline(days = 30) {
  const enabled = useBackendEnabled()
  return useQuery({ queryKey: ['stats', 'timeline', days], queryFn: () => getStatsTimeline(days), enabled })
}

export function useTopRules(limit = 10) {
  const enabled = useBackendEnabled()
  return useQuery({ queryKey: ['stats', 'top-rules', limit], queryFn: () => getTopRules(limit), enabled })
}
