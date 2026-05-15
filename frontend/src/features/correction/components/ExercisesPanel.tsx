import { useState } from 'react'
import { cn } from '@/lib/utils'
import type { Exercise } from '../hooks/useCorrectionPipeline'

function ChooseOne({ exercise }: { exercise: Exercise }) {
  const [selected, setSelected] = useState<string | null>(null)
  const opts = exercise.options ?? []
  const revealed = selected !== null

  return (
    <div className="space-y-3">
      <p className="text-sm font-mono leading-relaxed">{exercise.prompt}</p>
      <div className="flex flex-wrap gap-2">
        {opts.map((opt) => {
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

function ExerciseCard({ exercise, index }: { exercise: Exercise; index: number }) {
  return (
    <div className="rounded-lg border bg-card p-4 space-y-3">
      <div className="flex items-center gap-3">
        <span className="text-xs font-medium text-muted-foreground">#{index + 1}</span>
        <span className="text-xs text-muted-foreground">→ {exercise.targets_error_type}</span>
      </div>
      <p className="text-sm text-muted-foreground">{exercise.instruction}</p>
      <ChooseOne exercise={exercise} />
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
        {exercises.map((ex, i) => (
          <ExerciseCard key={ex.id} exercise={ex} index={i} />
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
