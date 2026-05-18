import { useEffect } from 'react'
import { useBackendStore } from '@/stores/backendStore'

export function useBackendStatus() {
  const setStatus = useBackendStore((s) => s.setStatus)

  useEffect(() => {
    if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
      setStatus('unavailable')
      return
    }

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 3000)

    fetch('http://localhost:5001/api/sessions?page=1&per_page=1', {
      signal: controller.signal,
    })
      .then(() => setStatus('available'))
      .catch(() => setStatus('unavailable'))
      .finally(() => clearTimeout(timeout))

    return () => {
      controller.abort()
      clearTimeout(timeout)
    }
  }, [setStatus])
}
