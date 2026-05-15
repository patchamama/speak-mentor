import { useState } from 'react'
import { cn } from '@/lib/utils'
import type {
  CommonErrorExercise,
  ChooseOneExercise,
  FillTableExercise,
  FillTableCell,
  CommonErrorsExercisesResult,
} from '../hooks/useCommonErrorsExercises'

function ChooseOneCard({ exercise, index }: { exercise: ChooseOneExercise; index: number }) {
  const [selected, setSelected] = useState<string | null>(null)
  const revealed = selected !== null

  return (
    <div className="rounded-lg border bg-card p-4 space-y-3">
      <div className="flex items-center gap-3">
        <span className="text-xs font-medium text-muted-foreground">#{index + 1}</span>
        <span className="text-xs text-muted-foreground">→ {exercise.targets_error_type}</span>
      </div>
      <p className="text-sm text-muted-foreground">{exercise.instruction}</p>
      <p className="text-sm font-mono leading-relaxed">{exercise.prompt}</p>
      <div className="flex flex-wrap gap-2">
        {exercise.options.map((opt) => {
          const isCorrect = opt === exercise.answer
          const isSelected = opt === selected
          return (
            <button
              key={opt}
              onClick={() => { if (!revealed) setSelected(opt) }}
              disabled={revealed}
              className={cn(
                'text-sm px-3 py-1.5 rounded-md border transition-colors',
                revealed
                  ? isCorrect
                    ? 'bg-green-500/20 border-green-500 text-green-700 dark:text-green-400 font-semibold'
                    : isSelected
                      ? 'bg-destructive/20 border-destructive text-destructive'
                      : 'border-border text-muted-foreground opacity-50'
                  : 'border-border hover:border-primary hover:bg-primary/5 cursor-pointer',
              )}
            >
              {opt}
            </button>
          )
        })}
      </div>
      {revealed && (
        <div className="rounded-md bg-blue-500/10 border border-blue-500/20 px-3 py-2 space-y-1">
          <p className="text-xs font-medium text-blue-700 dark:text-blue-400">
            {selected === exercise.answer ? '✓ Correcto' : `✗ Incorrecto — respuesta: ${exercise.answer}`}
          </p>
          <p className="text-xs">{exercise.answer_explanation}</p>
          {exercise.rule_reference && (
            <p className="text-xs text-muted-foreground font-mono">Regla: {exercise.rule_reference}</p>
          )}
        </div>
      )}
    </div>
  )
}

interface CellState {
  value: string
  status: 'neutral' | 'correct' | 'wrong'
}

function FillTableCard({ exercise, index }: { exercise: FillTableExercise; index: number }) {
  // col 0 is always the "Caso/Persona" label column — never an input
  const dataRows = exercise.rows.slice(1)

  const totalInputs = dataRows.reduce((acc, row) => {
    return acc + row.filter((c, ci) => !c.isHeader && ci > 0).length
  }, 0)

  const [cells, setCells] = useState<CellState[][]>(() => {
    // Determine how many data columns exist (excluding col 0)
    const colCount = dataRows[0]?.length ?? 0
    const hints = new Set<string>()

    // Guarantee at least 1 hint per data column
    for (let ci = 1; ci < colCount; ci++) {
      const fillableInCol = dataRows
        .map((row, ri) => ({ ri, cell: row[ci] }))
        .filter(({ cell }) => cell && !cell.isHeader)
      if (fillableInCol.length === 0) continue
      const pick = fillableInCol[Math.floor(Math.random() * fillableInCol.length)]
      hints.add(`${pick.ri},${ci}`)
    }

    // Add extra hints up to ~25% total
    const allFillable: [number, number][] = []
    dataRows.forEach((row, ri) => {
      row.forEach((cell, ci) => {
        if (ci > 0 && !cell.isHeader && !hints.has(`${ri},${ci}`)) allFillable.push([ri, ci])
      })
    })
    const totalFillable = dataRows.reduce((acc, row) => acc + row.filter((c, ci) => ci > 0 && !c.isHeader).length, 0)
    const extraNeeded = Math.max(0, Math.round(totalFillable * 0.25) - hints.size)
    const shuffled = [...allFillable].sort(() => Math.random() - 0.5)
    shuffled.slice(0, extraNeeded).forEach(([r, c]) => hints.add(`${r},${c}`))

    return dataRows.map((row, ri) =>
      row.map((cell, ci) => {
        if (ci > 0 && !cell.isHeader && hints.has(`${ri},${ci}`)) {
          return { value: cell.value, status: 'correct' as const }
        }
        return { value: '', status: 'neutral' as const }
      }),
    )
  })

  const inputCells = cells.flatMap((row, _ri) => row.filter((_c, ci) => ci > 0))
  const correct = inputCells.filter((c) => c.status === 'correct').length
  const answered = inputCells.filter((c) => c.status !== 'neutral').length

  function handleSubmit(ri: number, ci: number, answer: FillTableCell) {
    const userVal = cells[ri]?.[ci]?.value.trim().toLowerCase() ?? ''
    const correctVal = answer.value.trim().toLowerCase()
    const status = userVal === correctVal ? 'correct' : 'wrong'
    setCells((prev) => {
      const next = prev.map((row) => row.map((c) => ({ ...c })))
      next[ri][ci].status = status
      return next
    })
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>, ri: number, ci: number, answer: FillTableCell) {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSubmit(ri, ci, answer)
    }
  }

  return (
    <div className="rounded-lg border bg-card p-4 space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="text-xs font-medium text-muted-foreground">#{index + 1}</span>
          <span className="text-xs text-muted-foreground">→ {exercise.targets_error_type}</span>
        </div>
        {answered > 0 && (
          <span className="text-xs font-medium text-muted-foreground">
            {correct} / {totalInputs} correctos
          </span>
        )}
      </div>
      <p className="text-sm text-muted-foreground">{exercise.instruction}</p>
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{exercise.table_title}</p>

      <div className="overflow-x-auto rounded-md border">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b bg-muted/50">
              {exercise.headers.map((h, i) => (
                <th key={i} className={cn('px-3 py-2 text-left font-semibold whitespace-nowrap', i === 0 && 'sticky left-0 bg-muted/80 z-10')}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {dataRows.map((row, ri) => {
              const isHeaderRow = row.every((c) => c.isHeader)
              return (
                <tr key={ri} className="border-b last:border-0">
                  {row.map((cell, ci) => {
                    // col 0: always static label (sticky)
                    if (ci === 0 || isHeaderRow || cell.isHeader) {
                      return (
                        <td key={ci} className={cn('px-3 py-1.5 font-mono whitespace-nowrap bg-muted/30 font-medium', ci === 0 && 'sticky left-0 z-10')}>
                          {cell.value}
                        </td>
                      )
                    }
                    const cellState = cells[ri]?.[ci]
                    const status = cellState?.status ?? 'neutral'
                    return (
                      <td key={ci} className="px-2 py-1">
                        <div className="space-y-0.5">
                          <input
                            type="text"
                            value={cellState?.value ?? ''}
                            disabled={status !== 'neutral'}
                            onChange={(e) =>
                              setCells((prev) => {
                                const next = prev.map((r) => r.map((c) => ({ ...c })))
                                next[ri][ci].value = e.target.value
                                return next
                              })
                            }
                            onBlur={() => {
                              if (status === 'neutral' && cellState?.value.trim()) {
                                handleSubmit(ri, ci, cell)
                              }
                            }}
                            onKeyDown={(e) => handleKeyDown(e, ri, ci, cell)}
                            className={cn(
                              'w-full min-w-[60px] px-2 py-1 text-xs font-mono rounded border bg-background outline-none transition-colors',
                              status === 'correct' && 'border-green-500 bg-green-500/10 text-green-700 dark:text-green-400',
                              status === 'wrong' && 'border-destructive bg-destructive/10 text-destructive',
                              status === 'neutral' && 'border-border focus:border-primary',
                            )}
                          />
                          {status === 'wrong' && (
                            <p className="text-[10px] text-muted-foreground font-mono">{cell.value}</p>
                          )}
                        </div>
                      </td>
                    )
                  })}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="rounded-md bg-blue-500/10 border border-blue-500/20 px-3 py-2">
        <p className="text-xs">{exercise.answer_explanation}</p>
      </div>
    </div>
  )
}

function ExerciseCard({ exercise, index }: { exercise: CommonErrorExercise; index: number }) {
  if (exercise.type === 'fill_table') {
    return <FillTableCard exercise={exercise} index={index} />
  }
  return <ChooseOneCard exercise={exercise} index={index} />
}

export function CommonErrorsExercisePanel({ result }: { result: CommonErrorsExercisesResult }) {
  if (!result.exercises.length) return null

  return (
    <div className="space-y-4 pt-2">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
        Ejercicios generados ({result.exercises.length})
      </p>
      <div className="space-y-3">
        {result.exercises.map((ex, i) => (
          <ExerciseCard key={ex.id} exercise={ex} index={i} />
        ))}
      </div>
      {result.study_advice && (
        <div className="rounded-md bg-muted px-4 py-3">
          <p className="text-sm text-muted-foreground">{result.study_advice}</p>
        </div>
      )}
    </div>
  )
}
