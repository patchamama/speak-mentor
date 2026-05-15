import { useCorrection } from './hooks/useCorrection'
import { CorrectionView } from './CorrectionView'

export function CorrectionContainer() {
  const { result, rawError, loading, saving, savedSessionId, correct, save } = useCorrection()

  return (
    <CorrectionView
      result={result}
      rawError={rawError}
      loading={loading}
      saving={saving}
      savedSessionId={savedSessionId}
      onCorrect={correct}
      onSave={save}
    />
  )
}
