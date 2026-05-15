import { useFaviconProgress } from '@/shared/hooks/useFaviconProgress'
import { useTranslation } from './hooks/useTranslation'
import { TranslationView } from './TranslationView'

export function TranslationContainer() {
  const { result, rawError, loading, saving, savedSessionId, translate, save } = useTranslation()

  useFaviconProgress('translation', loading ? 50 : null)

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
