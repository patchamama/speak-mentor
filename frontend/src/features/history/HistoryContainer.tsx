import { HistoryView } from './HistoryView'

interface HistoryContainerProps {
  initialTab?: 'sessions' | 'stats'
  onUnlock?: () => void
}

export function HistoryContainer({ initialTab, onUnlock }: HistoryContainerProps) {
  return <HistoryView initialTab={initialTab} onUnlock={onUnlock} />
}
