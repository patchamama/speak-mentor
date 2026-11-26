import * as Dialog from '@radix-ui/react-dialog'
import { useState } from 'react'
import { getLanguage, t } from '@/i18n'
import { Button } from '@/shared/ui/Button'
import { Spinner } from '@/shared/ui/Spinner'
import { RefTable } from '@/shared/ui/ReferenceTable'
import type { CEFRLevel } from '@/shared/types'
import { errorTypeLabel } from '../errorTypes'
import { referenceTablesFor } from './referenceTables'
import { useGrammarExplanation, type GrammarError } from './useGrammarExplanation'
import type { GrammarExplanation } from './schema'

const heading = 'text-sm font-semibold'

function Explanation({ data }: { data: GrammarExplanation }) {
  return (
    <div className="space-y-5">
      <p className="text-xs text-muted-foreground">
        {t('Explicación generada por IA: puede contener errores. Las tablas de referencia de abajo están escritas a mano.')}
      </p>
      <section className="space-y-2">
        <h3 className="text-base font-semibold">{data.title}</h3>
        <p className="text-sm leading-relaxed">{data.summary}</p>
      </section>
      {data.rules.length > 0 && (
        <section className="space-y-1">
          <h4 className={heading}>{t('Reglas')}</h4>
          <ul className="list-disc pl-5 text-sm space-y-1">
            {data.rules.map((rule, i) => <li key={i}>{rule}</li>)}
          </ul>
        </section>
      )}
      {data.tables.map((table, i) => <RefTable key={i} table={table} />)}
      {data.examples.length > 0 && (
        <section className="space-y-1">
          <h4 className={heading}>{t('Ejemplos')}</h4>
          <div className="overflow-x-auto rounded-md border">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b bg-muted/50 text-left">
                  <th className="px-3 py-2">✗ {t('Incorrecto')}</th>
                  <th className="px-3 py-2">✓ {t('Correcto')}</th>
                  <th className="px-3 py-2">{t('Por qué')}</th>
                </tr>
              </thead>
              <tbody>
                {data.examples.map((example, i) => (
                  <tr key={i} className="border-b last:border-0 align-top">
                    <td className="px-3 py-2 font-mono text-destructive">{example.wrong}</td>
                    <td className="px-3 py-2 font-mono text-green-700 dark:text-green-400">{example.correct}</td>
                    <td className="px-3 py-2">{example.why}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
      {data.spanish_comparison && (
        <section className="rounded-md bg-blue-500/10 border border-blue-500/20 px-3 py-2 space-y-1">
          <h4 className={heading}>{t('Comparación con el español')}</h4>
          <p className="text-sm leading-relaxed">{data.spanish_comparison}</p>
        </section>
      )}
      {data.tips.length > 0 && (
        <section className="rounded-md bg-amber-500/10 border border-amber-500/20 px-3 py-2">
          {data.tips.map((tip, i) => <p key={i} className="text-sm">💡 {tip}</p>)}
        </section>
      )}
    </div>
  )
}

export function GrammarExplanationButton({ error, level }: { error: GrammarError; level: CEFRLevel }) {
  const [open, setOpen] = useState(false)
  const { data, loading, failure, load } = useGrammarExplanation(error, level)
  const references = open ? referenceTablesFor(error.type, getLanguage()) : []

  return (
    // The surrounding card is clickable; the dialog must not select it.
    <div onClick={(e) => e.stopPropagation()}>
      <Dialog.Root
        open={open}
        onOpenChange={(next) => {
          setOpen(next)
          if (next && !loading) void load()
        }}
      >
        <Dialog.Trigger asChild>
          <Button type="button" size="sm" variant="outline">{t('Explicar gramática')}</Button>
        </Dialog.Trigger>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[min(56rem,calc(100vw-2rem))] max-h-[90vh] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-lg border bg-background p-6 shadow-xl space-y-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <Dialog.Title className="text-lg font-semibold">
                  {t('Gramática: {topic}', { topic: errorTypeLabel(error.type) })}
                </Dialog.Title>
                <Dialog.Description className="text-sm text-muted-foreground">
                  <span className="line-through">{error.original}</span> → <strong>{error.correction}</strong>
                </Dialog.Description>
              </div>
              <Dialog.Close asChild>
                <Button type="button" size="sm" variant="outline">{t('Cerrar')}</Button>
              </Dialog.Close>
            </div>

            {loading && (
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <Spinner /> {t('Preparando la explicación...')}
              </p>
            )}
            {failure && (
              <div className="space-y-2">
                <p role="alert" className="text-sm text-destructive">{failure}</p>
                <Button type="button" size="sm" onClick={() => void load()}>{t('Reintentar')}</Button>
              </div>
            )}
            {data && <Explanation data={data} />}

            {references.length > 0 && (
              <section className="space-y-4 border-t pt-4">
                <h3 className={heading}>{t('Tablas de referencia')}</h3>
                {references.map((table, i) => <RefTable key={i} table={table} />)}
              </section>
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  )
}
