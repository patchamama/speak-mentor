import { useState } from 'react'
import { Button } from '@/shared/ui/Button'
import { cn } from '@/lib/utils'
import type { Exercise } from '../hooks/useCorrectionPipeline'

const TYPE_LABELS: Record<string, string> = {
  fill_blank: 'Completar',
  reorder: 'Ordenar',
  choose_one: 'Elegir',
  transform: 'Transformar',
  correct_error: 'Corregir',
}

function FillBlank({ exercise, revealed }: { exercise: Exercise; revealed: boolean }) {
  const parts = exercise.prompt.split('___')
  return (
    <p className="text-sm font-mono leading-relaxed">
      {parts.map((part, i) => (
        <span key={i}>
          {part}
          {i < parts.length - 1 && (
            <span className={cn(
              'inline-block min-w-[80px] border-b-2 mx-1 text-center',
              revealed
                ? 'border-green-500 text-green-700 dark:text-green-400 font-semibold'
                : 'border-foreground',
            )}>
              {revealed ? exercise.answer : ''}
            </span>
          )}
        </span>
      ))}
    </p>
  )
}

function Reorder({ exercise, revealed }: { exercise: Exercise; revealed: boolean }) {
  const words = exercise.prompt.split(',').map((w) => w.trim())
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {words.map((w, i) => (
          <span key={i} className="text-sm font-mono px-2 py-1 rounded bg-muted border">{w}</span>
        ))}
      </div>
      {revealed && (
        <p className="text-sm font-mono text-green-700 dark:text-green-400 font-semibold">
          → {exercise.answer}
        </p>
      )}
    </div>
  )
}

function ChooseOne({ exercise, revealed }: { exercise: Exercise; revealed: boolean }) {
  const [selected, setSelected] = useState<string | null>(null)
  const opts = exercise.options ?? []
  return (
    <div className="space-y-2">
      <p className="text-sm font-mono">{exercise.prompt}</p>
      <div className="flex flex-wrap gap-2">
        {opts.map((opt) => {
          const isCorrect = opt === exercise.answer
          const isSelected = opt === selected
          return (
            <button
              key={opt}
              onClick={() => setSelected(opt)}
              className={cn(
                'text-sm px-3 py-1.5 rounded-md border transition-colors',
                revealed
                  ? isCorrect
                    ? 'bg-green-500/20 border-green-500 text-green-700 dark:text-green-400'
                    : isSelected
                      ? 'bg-destructive/20 border-destructive'
                      : 'border-border text-muted-foreground'
                  : isSelected
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'border-border hover:border-foreground/40',
              )}
            >
              {opt}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function ExerciseCard({ exercise }: { exercise: Exercise }) {
  const [revealed, setRevealed] = useState(false)

  return (
    <div className="rounded-lg border bg-card p-4 space-y-4">
      <div className="flex items-center gap-3">
        <span className="text-xs px-2 py-0.5 rounded-full bg-muted font-medium">
          {TYPE_LABELS[exercise.type] ?? exercise.type}
        </span>
        <span className="text-xs text-muted-foreground">→ {exercise.targets_error_type}</span>
      </div>

      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">{exercise.instruction}</p>
        {exercise.type === 'fill_blank' && <FillBlank exercise={exercise} revealed={revealed} />}
        {exercise.type === 'reorder' && <Reorder exercise={exercise} revealed={revealed} />}
        {exercise.type === 'choose_one' && <ChooseOne exercise={exercise} revealed={revealed} />}
        {(exercise.type === 'transform' || exercise.type === 'correct_error') && (
          <div className="space-y-2">
            <p className="text-sm font-mono bg-muted px-3 py-2 rounded">{exercise.prompt}</p>
            {revealed && (
              <p className="text-sm font-mono text-green-700 dark:text-green-400 font-semibold px-3">
                → {exercise.answer}
              </p>
            )}
          </div>
        )}
      </div>

      {revealed && (
        <div className="rounded-md bg-blue-500/10 border border-blue-500/20 px-3 py-2 space-y-1">
          <p className="text-xs font-medium text-blue-700 dark:text-blue-400">Explicación</p>
          <p className="text-xs">{exercise.answer_explanation}</p>
          {exercise.rule_reference && (
            <p className="text-xs text-muted-foreground font-mono">Regla: {exercise.rule_reference}</p>
          )}
        </div>
      )}

      <Button
        variant="outline"
        size="sm"
        onClick={() => setRevealed((r) => !r)}
        className="text-xs"
      >
        {revealed ? 'Ocultar respuesta' : 'Ver respuesta'}
      </Button>
    </div>
  )
}

export function ExercisesPanel({
  exercises,
  studyAdvice,
}: {
  exercises: Exercise[]
  studyAdvice?: string
}) {
  if (!exercises.length) return null

  return (
    <div className="space-y-4">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
        Ejercicios ({exercises.length})
      </p>
      <div className="space-y-3">
        {exercises.map((ex) => (
          <ExerciseCard key={ex.id} exercise={ex} />
        ))}
      </div>
      {studyAdvice && (
        <div className="rounded-md bg-muted px-4 py-3">
          <p className="text-sm text-muted-foreground">{studyAdvice}</p>
        </div>
      )}
    </div>
  )
}
