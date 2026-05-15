import { useEffect, useRef } from 'react'
import { useFaviconStore } from '@/stores/faviconStore'

const FAVICON_SIZE = 32
const DEFAULT_FAVICON = '/favicon.svg'
const PROGRESS_COLOR = '#38bdf8'

function getOrCreateLink(): HTMLLinkElement {
  let link = document.querySelector<HTMLLinkElement>('link[rel~="icon"]')
  if (!link) {
    link = document.createElement('link')
    link.rel = 'icon'
    document.head.appendChild(link)
  }
  return link
}

function drawFavicon(progress: number): string {
  const canvas = document.createElement('canvas')
  canvas.width = FAVICON_SIZE
  canvas.height = FAVICON_SIZE
  const ctx = canvas.getContext('2d')!

  ctx.beginPath()
  ctx.arc(16, 16, 15, 0, Math.PI * 2)
  ctx.fillStyle = '#1e293b'
  ctx.fill()

  const start = -Math.PI / 2
  const end = start + (progress / 100) * Math.PI * 2
  ctx.beginPath()
  ctx.moveTo(16, 16)
  ctx.arc(16, 16, 15, start, end)
  ctx.closePath()
  ctx.fillStyle = PROGRESS_COLOR
  ctx.fill()

  ctx.beginPath()
  ctx.arc(16, 16, 9, 0, Math.PI * 2)
  ctx.fillStyle = '#1e293b'
  ctx.fill()

  const label = progress >= 100 ? '✓' : `${Math.round(progress)}`
  ctx.fillStyle = '#f8fafc'
  ctx.font = `bold ${progress >= 100 ? 11 : 9}px system-ui,sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(label, 16, 16.5)

  return canvas.toDataURL('image/png')
}

// Global favicon renderer — mount once in App.tsx
export function useFaviconRenderer() {
  const overallProgress = useFaviconStore((s) => s.overallProgress)
  const tasks = useFaviconStore((s) => s.tasks)
  const prevProgress = useRef<number | null>(null)

  useEffect(() => {
    const progress = overallProgress()
    if (progress === prevProgress.current) return
    prevProgress.current = progress

    const link = getOrCreateLink()
    if (progress === null) {
      link.type = 'image/svg+xml'
      link.href = DEFAULT_FAVICON
    } else {
      link.type = 'image/png'
      link.href = drawFavicon(progress)
    }
  }, [tasks, overallProgress])
}

// Per-task hook — registers progress with a unique key
export function useFaviconProgress(key: string, progress: number | null) {
  const setTask = useFaviconStore((s) => s.setTask)
  const prevProgress = useRef<number | null>(undefined as unknown as null)

  useEffect(() => {
    if (progress === prevProgress.current) return
    prevProgress.current = progress
    setTask(key, progress)
    return () => {
      if (progress !== null) setTask(key, null)
    }
  }, [key, progress, setTask])

  // Cleanup on unmount
  useEffect(() => {
    return () => setTask(key, null)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])
}
