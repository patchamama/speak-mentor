import { cn } from '@/lib/utils'
import type { CorrectionResponse } from '@/shared/ollama/schemas'

const ERROR_COLORS: Record<string, string> = {
  gender: 'bg-blue-100 border-b-2 border-blue-400 text-blue-900',
  case: 'bg-red-100 border-b-2 border-red-400 text-red-900',
  declension: 'bg-orange-100 border-b-2 border-orange-400 text-orange-900',
  conjugation: 'bg-yellow-100 border-b-2 border-yellow-400 text-yellow-900',
  preposition: 'bg-pink-100 border-b-2 border-pink-400 text-pink-900',
  word_order: 'bg-purple-100 border-b-2 border-purple-400 text-purple-900',
  spelling: 'bg-rose-100 border-b-2 border-rose-400 text-rose-900',
  punctuation: 'bg-gray-100 border-b-2 border-gray-400 text-gray-900',
  vocabulary: 'bg-teal-100 border-b-2 border-teal-400 text-teal-900',
  style: 'bg-indigo-100 border-b-2 border-indigo-400 text-indigo-900',
  agreement: 'bg-amber-100 border-b-2 border-amber-400 text-amber-900',
  tense: 'bg-lime-100 border-b-2 border-lime-400 text-lime-900',
  mood: 'bg-emerald-100 border-b-2 border-emerald-400 text-emerald-900',
  voice: 'bg-cyan-100 border-b-2 border-cyan-400 text-cyan-900',
  particle: 'bg-violet-100 border-b-2 border-violet-400 text-violet-900',
}

export const ERROR_COLORS_MAP = ERROR_COLORS

interface ErrorHighlightProps {
  text: string
  errors: CorrectionResponse['errors']
  activeErrorIdx: number | null
  onErrorClick: (idx: number) => void
}

interface Segment {
  text: string
  errorIdx: number | null
}

function buildSegments(text: string, errors: CorrectionResponse['errors']): Segment[] {
  type Span = { start: number; end: number; idx: number }
  const spans: Span[] = []

  errors.forEach((err, idx) => {
    if ((err as { position_unreliable?: boolean }).position_unreliable) return
    const pos = err.position
    if (!pos) return
    spans.push({ start: pos.start, end: pos.end, idx })
  })

  spans.sort((a, b) => a.start - b.start)

  const segments: Segment[] = []
  let cursor = 0

  for (const span of spans) {
    if (span.start > cursor) {
      segments.push({ text: text.slice(cursor, span.start), errorIdx: null })
    }
    segments.push({ text: text.slice(span.start, span.end), errorIdx: span.idx })
    cursor = span.end
  }

  if (cursor < text.length) {
    segments.push({ text: text.slice(cursor), errorIdx: null })
  }

  return segments
}

export function ErrorHighlight({ text, errors, activeErrorIdx, onErrorClick }: ErrorHighlightProps) {
  const segments = buildSegments(text, errors)

  return (
    <p className="leading-relaxed whitespace-pre-wrap font-mono text-sm">
      {segments.map((seg, i) => {
        if (seg.errorIdx === null) return <span key={i}>{seg.text}</span>
        const err = errors[seg.errorIdx]
        const colorClass = ERROR_COLORS[err.type] ?? 'bg-gray-100 border-b-2 border-gray-400'
        const isActive = activeErrorIdx === seg.errorIdx
        return (
          <span
            key={i}
            className={cn(
              'cursor-pointer rounded-sm px-0.5 transition-all',
              colorClass,
              isActive && 'ring-2 ring-offset-1 ring-current'
            )}
            onClick={() => onErrorClick(seg.errorIdx!)}
            title={`${err.type}: ${err.correction}`}
          >
            {seg.text}
          </span>
        )
      })}
    </p>
  )
}
