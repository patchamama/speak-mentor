import { t } from '@/i18n'
// Single entry point for session persistence, whatever the active target is.
import * as flask from '@/shared/api/flaskClient'
import { queryClient } from '@/shared/queryClient'
import { useBackendStore } from '@/stores/backendStore'
import { useStorageStore } from '@/stores/storageStore'
import { useUnlockStore } from '@/stores/unlockStore'
import { browserAdapter } from './browser'
import { createDocumentStore } from './document'
import { githubAdapter } from './github'
import { resolveTarget, type StorageTarget } from './resolve'
import type { ListParams, NewSession, SessionStore } from './types'

const browserStore = createDocumentStore(browserAdapter())

// Cached so every call shares the adapter's write queue.
let cachedGitHub: { key: string; store: SessionStore } | null = null

useUnlockStore.subscribe((state) => {
  if (state.githubToken === null) cachedGitHub = null
})

function githubStore(): SessionStore {
  const settings = useStorageStore.getState().github
  if (!settings) {
    throw new Error(t('Configura GitHub en Configuración → Conexión y almacenamiento.'))
  }
  const token = useUnlockStore.getState().githubToken
  // Never fall back to another target here: that would split the history.
  if (!token) {
    throw new Error(t('Introduce la clave maestra en Configuración → Conexión y almacenamiento.'))
  }
  const { owner, repo, branch, path } = settings
  const key = JSON.stringify([owner, repo, branch, path, token])
  if (cachedGitHub?.key !== key) {
    cachedGitHub = {
      key,
      store: createDocumentStore(githubAdapter({ owner, repo, branch, path }, token)),
    }
  }
  return cachedGitHub.store
}

export function getStorageTarget(): StorageTarget {
  const { mode, github } = useStorageStore.getState()
  return resolveTarget(mode, useBackendStore.getState().status === 'available', github !== null)
}

function activeStore(): SessionStore {
  const target = getStorageTarget()
  if (target === 'backend') return flask
  return target === 'github' ? githubStore() : browserStore
}

export function refreshHistory(): Promise<unknown> {
  return Promise.all(
    ['sessions', 'session', 'stats'].map((key) => queryClient.invalidateQueries({ queryKey: [key] })),
  )
}

export async function saveSession(session: NewSession) {
  const result = await activeStore().saveSession(session)
  void refreshHistory()
  return result
}

export const listSessions = async (params?: ListParams) => activeStore().listSessions(params)
export const getSession = async (id: number) => activeStore().getSession(id)
export const deleteSession = async (id: number) => activeStore().deleteSession(id)
export const getStatsByType = async () => activeStore().getStatsByType()
export const getStatsByLevel = async () => activeStore().getStatsByLevel()
export const getStatsTimeline = async (days?: number) => activeStore().getStatsTimeline(days)
export const getTopRules = async (limit?: number) => activeStore().getTopRules(limit)
