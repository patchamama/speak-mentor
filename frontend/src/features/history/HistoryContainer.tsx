import { HistoryView } from './HistoryView'

interface HistoryContainerProps {
  initialTab?: 'sessions' | 'stats'
}

export function HistoryContainer({ initialTab }: HistoryContainerProps) {
  return <HistoryView initialTab={initialTab} />
}
