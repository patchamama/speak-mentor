import { msg } from '@/i18n'
export type StorageMode = 'auto' | 'backend' | 'github' | 'browser'
export type StorageTarget = Exclude<StorageMode, 'auto'>

export const STORAGE_LABELS: Record<StorageTarget, string> = {
  backend: 'Backend',
  github: 'GitHub',
  browser: msg('Navegador'),
}

export function resolveTarget(
  mode: StorageMode,
  backendAvailable: boolean,
  githubConfigured: boolean,
): StorageTarget {
  if (mode !== 'auto') return mode
  if (backendAvailable) return 'backend'
  return githubConfigured ? 'github' : 'browser'
}
