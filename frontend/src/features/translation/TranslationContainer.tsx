import { useFaviconProgress } from '@/shared/hooks/useFaviconProgress'
import { useTranslation } from './hooks/useTranslation'
import { TranslationView } from './TranslationView'

export function TranslationContainer() {
  const { result, rawError, loading, saving, savedSessionId, translate, save } = useTranslation()

  useFaviconProgress({ progress: loading ? 50 : null, color: '#a78bfa' })

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
