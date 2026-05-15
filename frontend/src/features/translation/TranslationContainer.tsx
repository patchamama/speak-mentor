import { useTranslation } from './hooks/useTranslation'
import { TranslationView } from './TranslationView'

export function TranslationContainer() {
  const { result, rawError, loading, saving, savedSessionId, translate, save } = useTranslation()

  return (
    <TranslationView
      result={result}
      rawError={rawError}
      loading={loading}
      saving={saving}
      savedSessionId={savedSessionId}
      onTranslate={translate}
      onSave={save}
    />
  )
}
