import { msg, t } from '@/i18n'
import type { RemoteProviderId } from '@/stores/settingsStore'

// None of these providers expose the remaining balance to a regular API key,
// so the app links to the page that shows it.
const LINKS: Record<RemoteProviderId, { label: string; url: string }[]> = {
  openai: [
    { label: msg('Crear API key'), url: 'https://platform.openai.com/api-keys' },
    { label: msg('Saldo y recarga'), url: 'https://platform.openai.com/settings/organization/billing/overview' },
    { label: msg('Consumo'), url: 'https://platform.openai.com/usage' },
  ],
  anthropic: [
    { label: msg('Crear API key'), url: 'https://platform.claude.com/settings/keys' },
    { label: msg('Saldo y recarga'), url: 'https://platform.claude.com/settings/billing' },
    { label: msg('Consumo'), url: 'https://platform.claude.com/usage' },
  ],
  gemini: [
    { label: msg('Crear API key'), url: 'https://aistudio.google.com/apikey' },
    { label: msg('Saldo y recarga'), url: 'https://aistudio.google.com/billing' },
    { label: msg('Consumo'), url: 'https://aistudio.google.com/usage' },
  ],
}

export function ProviderLinks({ providerId }: { providerId: RemoteProviderId }) {
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
      {LINKS[providerId].map((link) => (
        <li key={link.url}>
          <a
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary underline underline-offset-2"
          >
            {t(link.label)} ↗
          </a>
        </li>
      ))}
    </ul>
  )
}
