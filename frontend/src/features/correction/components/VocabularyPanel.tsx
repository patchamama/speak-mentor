import type { VocabCard } from '../hooks/useCorrectionPipeline'
import { cn } from '@/lib/utils'

type VerbInfoType = NonNullable<NonNullable<VocabCard['grammar']>['verb_info']>
type NounInfoType = NonNullable<NonNullable<VocabCard['grammar']>['noun_info']>
type AdjInfoType = NonNullable<NonNullable<VocabCard['grammar']>['adjective_info']>

const POS_LABELS: Record<string, string> = {
  verb: 'Verbo',
  noun: 'Sustantivo',
  adjective: 'Adjetivo',
  adverb: 'Adverbio',
  preposition_collocation: 'Preposición',
}

const POS_COLORS: Record<string, string> = {
  verb: 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300',
  noun: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
  adjective: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
  adverb: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300',
  preposition_collocation: 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300',
}

function VerbInfo({ info }: { info: VerbInfoType }) {
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs font-mono">
      {info.infinitiv && <div><span className="text-muted-foreground">Infinitiv:</span> {info.infinitiv}</div>}
      {info.partizip_II && <div><span className="text-muted-foreground">Partizip II:</span> {info.partizip_II}</div>}
      {info.präteritum_3sg && <div><span className="text-muted-foreground">Präteritum:</span> {info.präteritum_3sg}</div>}
      {info.auxiliary && <div><span className="text-muted-foreground">Hilfsverb:</span> {info.auxiliary}</div>}
      {info.separable && (
        <div className="col-span-2">
          <span className="text-muted-foreground">Trennbar:</span>{' '}
          <span className="text-amber-600 font-semibold">sí — prefijo: {info.prefix}</span>
        </div>
      )}
      {info.vowel_change && (
        <div className="col-span-2">
          <span className="text-muted-foreground">Vokalwechsel:</span> {info.vowel_change}
        </div>
      )}
    </div>
  )
}

function NounInfo({ info }: { info: NounInfoType }) {
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs font-mono">
      {info.article && <div><span className="text-muted-foreground">Artikel:</span> {info.article}</div>}
      {info.plural && <div><span className="text-muted-foreground">Plural:</span> {info.plural}</div>}
      {info.genitive_sg && <div className="col-span-2"><span className="text-muted-foreground">Genitiv Sg.:</span> {info.genitive_sg}</div>}
    </div>
  )
}

function AdjInfo({ info }: { info: AdjInfoType }) {
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs font-mono">
      {info.comparative && <div><span className="text-muted-foreground">Komparativ:</span> {info.comparative}</div>}
      {info.superlative && <div><span className="text-muted-foreground">Superlativ:</span> {info.superlative}</div>}
      {info.strong_nom && (
        <div className="col-span-2">
          <span className="text-muted-foreground">Stark Nom.:</span>{' '}
          m. {info.strong_nom.mask} / f. {info.strong_nom.fem} / n. {info.strong_nom.neut}
        </div>
      )}
    </div>
  )
}

export function VocabularyPanel({ cards }: { cards: VocabCard[] }) {
  if (!cards.length) return null

  return (
    <div className="space-y-4">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
        Vocabulario ({cards.length} palabras)
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {cards.map((card, i) => {
          const grammar = card.grammar
          const verbInfo = grammar?.verb_info
          const nounInfo = grammar?.noun_info
          const adjInfo = grammar?.adjective_info

          return (
            <div key={i} className="rounded-lg border bg-card p-4 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-base">{card.word}</p>
                  <p className="text-sm text-muted-foreground">{card.translation}</p>
                </div>
                <span className={cn('text-xs px-2 py-0.5 rounded-full shrink-0', POS_COLORS[card.part_of_speech] ?? 'bg-muted')}>
                  {POS_LABELS[card.part_of_speech] ?? card.part_of_speech}
                </span>
              </div>

              {verbInfo && <VerbInfo info={verbInfo} />}
              {nounInfo && <NounInfo info={nounInfo} />}
              {adjInfo && <AdjInfo info={adjInfo} />}

              {card.collocation && (
                <div className="rounded-md bg-muted px-3 py-2">
                  <p className="text-xs text-muted-foreground mb-0.5">Ejemplo</p>
                  <p className="text-sm font-mono italic">{card.collocation}</p>
                </div>
              )}

              {card.tip && (
                <div className="rounded-md bg-amber-500/10 border border-amber-500/20 px-3 py-2">
                  <p className="text-xs">💡 {card.tip}</p>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
