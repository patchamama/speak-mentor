interface ReferenceTableProps {
  table: { title: string; headers: string[]; rows: string[][]; note?: string }
}

export function RefTable({ table }: ReferenceTableProps) {
  return (
    <div className="space-y-1">
      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{table.title}</h4>
      <div className="overflow-x-auto rounded-md border">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b bg-muted/50">
              {table.headers.map((h, i) => (
                <th key={i} className="px-3 py-2 text-left font-semibold whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {table.rows.map((row, ri) => (
              <tr key={ri} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                {row.map((cell, ci) => (
                  <td key={ci} className="px-3 py-1.5 font-mono whitespace-nowrap">{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {table.note && <p className="text-xs text-muted-foreground italic">{table.note}</p>}
    </div>
  )
}
