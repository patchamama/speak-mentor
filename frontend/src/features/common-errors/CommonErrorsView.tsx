import { useState } from 'react'
import { cn } from '@/lib/utils'
import { COMMON_ERRORS_DATA, type CommonErrorCategory } from './data/commonErrors'

const ERROR_TYPE_COLORS: Record<string, string> = {
  case: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
  preposition: 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300',
  conjugation: 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300',
  word_order: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
  tense: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300',
  gender: 'bg-pink-100 text-pink-800 dark:bg-pink-900/40 dark:text-pink-300',
  spelling: 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300',
  separable_verb: 'bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-300',
}

function ExampleCard({ example }: { example: CommonErrorCategory['examples'][number] }) {
  return (
    <div className="rounded-lg border bg-card p-4 space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <div className="rounded-md bg-destructive/10 border border-destructive/20 px-3 py-2">
          <p className="text-xs font-medium text-destructive/70 mb-1">✗ Incorrecto</p>
          <p className="text-sm font-mono">{example.wrong}</p>
        </div>
        <div className="rounded-md bg-green-500/10 border border-green-500/20 px-3 py-2">
          <p className="text-xs font-medium text-green-700 dark:text-green-400 mb-1">✓ Correcto</p>
          <p className="text-sm font-mono">{example.correct}</p>
        </div>
      </div>
      <p className="text-sm text-muted-foreground">{example.explanation}</p>
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="flex-1 rounded-md bg-muted px-3 py-2">
          <p className="text-xs font-medium text-muted-foreground mb-1">Regla</p>
          <p className="text-xs font-mono">{example.rule}</p>
        </div>
        <div className="flex-1 rounded-md bg-amber-500/10 border border-amber-500/20 px-3 py-2">
          <p className="text-xs font-medium text-amber-700 dark:text-amber-400 mb-1">💡 Truco</p>
          <p className="text-xs">{example.tip}</p>
        </div>
      </div>
    </div>
  )
}

function CategorySection({ category }: { category: CommonErrorCategory }) {
  const [open, setOpen] = useState(true)
  const colorClass = ERROR_TYPE_COLORS[category.errorType] ?? 'bg-muted text-muted-foreground'

  return (
    <section className="space-y-3">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between text-left group"
        aria-expanded={open}
      >
        <div className="flex items-center gap-3">
          <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full', colorClass)}>
            {category.errorType}
          </span>
          <div>
            <h3 className="text-base font-semibold group-hover:text-primary transition-colors">
              {category.title}
            </h3>
            <p className="text-xs text-muted-foreground">{category.subtitle}</p>
          </div>
        </div>
        <span className="text-muted-foreground text-sm">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="space-y-3 pl-2 border-l-2 border-muted ml-1">
          {category.examples.map((ex) => (
            <ExampleCard key={ex.id} example={ex} />
          ))}
        </div>
      )}
    </section>
  )
}

export function CommonErrorsView() {
  const [filter, setFilter] = useState<string>('all')

  const errorTypes = ['all', ...new Set(COMMON_ERRORS_DATA.map((c) => c.errorType))]

  const filtered =
    filter === 'all' ? COMMON_ERRORS_DATA : COMMON_ERRORS_DATA.filter((c) => c.errorType === filter)

  const totalExamples = COMMON_ERRORS_DATA.reduce((acc, c) => acc + c.examples.length, 0)

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Errores frecuentes</h2>
        <p className="text-muted-foreground mt-1">
          Los errores más comunes de hispanohablantes al aprender alemán — {totalExamples} ejemplos
          con explicación, regla y truco mnemotécnico.
        </p>
      </div>

      <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrar por tipo de error">
        {errorTypes.map((type) => {
          const active = filter === type
          const colorClass = type !== 'all' ? (ERROR_TYPE_COLORS[type] ?? '') : ''
          return (
            <button
              key={type}
              onClick={() => setFilter(type)}
              className={cn(
                'text-xs px-3 py-1.5 rounded-full border transition-all',
                active
                  ? type === 'all'
                    ? 'bg-primary text-primary-foreground border-primary'
                    : cn(colorClass, 'border-current font-semibold')
                  : 'border-border text-muted-foreground hover:border-foreground/40',
              )}
            >
              {type === 'all' ? 'Todos' : type}
            </button>
          )
        })}
      </div>

      <div className="space-y-8">
        {filtered.map((cat) => (
          <CategorySection key={cat.id} category={cat} />
        ))}
      </div>
    </div>
  )
}
