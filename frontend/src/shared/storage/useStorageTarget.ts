import { useBackendStore } from '@/stores/backendStore'
import { useStorageStore } from '@/stores/storageStore'
import { useUnlockStore } from '@/stores/unlockStore'
import { resolveTarget } from './resolve'

export function useStorageTarget() {
  const mode = useStorageStore((s) => s.mode)
  const github = useStorageStore((s) => s.github)
  const backendStatus = useBackendStore((s) => s.status)
  const unlocked = useUnlockStore((s) => s.githubToken !== null)
  const target = resolveTarget(mode, backendStatus === 'available', github !== null)
  const locked = target === 'github' && !unlocked

  return {
    target,
    locked,
    /** False only while auto mode is still probing for the backend. */
    ready: mode !== 'auto' || backendStatus !== 'checking',
    /** Changes whenever cached history would belong to somewhere else. */
    cacheKey: [
      target,
      locked,
      target === 'github' && github ? `${github.owner}/${github.repo}/${github.branch}/${github.path}` : '',
    ].join(':'),
  }
}
