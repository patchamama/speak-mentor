import { useEffect, useRef } from 'react'

interface FaviconProgressOptions {
  progress: number | null  // 0-100, null = idle (restore default)
  color?: string
}

const FAVICON_SIZE = 32
const DEFAULT_FAVICON = '/favicon.svg'

function getOrCreateLink(): HTMLLinkElement {
  let link = document.querySelector<HTMLLinkElement>('link[rel~="icon"]')
  if (!link) {
    link = document.createElement('link')
    link.rel = 'icon'
    document.head.appendChild(link)
  }
  return link
}

function drawFavicon(progress: number, color: string): string {
  const canvas = document.createElement('canvas')
  canvas.width = FAVICON_SIZE
  canvas.height = FAVICON_SIZE
  const ctx = canvas.getContext('2d')!

  // Dark background circle
  ctx.beginPath()
  ctx.arc(16, 16, 15, 0, Math.PI * 2)
  ctx.fillStyle = '#1e293b'
  ctx.fill()

  // Progress arc (clockwise from top)
  const start = -Math.PI / 2
  const end = start + (progress / 100) * Math.PI * 2
  ctx.beginPath()
  ctx.moveTo(16, 16)
  ctx.arc(16, 16, 15, start, end)
  ctx.closePath()
  ctx.fillStyle = color
  ctx.fill()

  // Inner circle (donut hole) — white
  ctx.beginPath()
  ctx.arc(16, 16, 9, 0, Math.PI * 2)
  ctx.fillStyle = '#1e293b'
  ctx.fill()

  // Percentage text
  const label = progress >= 100 ? '✓' : `${Math.round(progress)}`
  ctx.fillStyle = '#f8fafc'
  ctx.font = `bold ${progress >= 100 ? 11 : 9}px system-ui,sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(label, 16, 16.5)

  return canvas.toDataURL('image/png')
}

export function useFaviconProgress({ progress, color = '#38bdf8' }: FaviconProgressOptions) {
  const prevProgress = useRef<number | null>(null)

  useEffect(() => {
    if (progress === prevProgress.current) return
    prevProgress.current = progress

    const link = getOrCreateLink()

    if (progress === null) {
      link.type = 'image/svg+xml'
      link.href = DEFAULT_FAVICON
      return
    }

    link.type = 'image/png'
    link.href = drawFavicon(Math.min(100, Math.max(0, progress)), color)
  }, [progress, color])
}
