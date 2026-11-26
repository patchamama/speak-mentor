import { SettingsView } from './SettingsView'

export function SettingsContainer({ connectionRequest }: { connectionRequest?: number }) {
  return <SettingsView connectionRequest={connectionRequest} />
}
