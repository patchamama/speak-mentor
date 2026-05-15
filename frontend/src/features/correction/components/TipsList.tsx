interface TipsListProps {
  tips: string[]
  mainFocus: string
}

export function TipsList({ tips, mainFocus }: TipsListProps) {
  return (
    <div className="space-y-3">
      <div className="rounded-lg bg-muted p-3">
        <p className="text-sm font-medium mb-1">Foco principal</p>
        <p className="text-sm text-muted-foreground">{mainFocus}</p>
      </div>
      {tips.length > 0 && (
        <div>
          <p className="text-sm font-medium mb-2">Consejos</p>
          <ul className="space-y-1.5" role="list">
            {tips.map((tip, i) => (
              <li key={i} className="flex gap-2 text-sm text-muted-foreground">
                <span className="text-primary shrink-0">•</span>
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
