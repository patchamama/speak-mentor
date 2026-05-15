import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid,
} from 'recharts'

interface ByTypeChartProps {
  data: { type: string; count: number }[]
}

interface ByLevelChartProps {
  data: { level: string; count: number }[]
}

interface TimelineChartProps {
  data: { day: string; count: number }[]
}

interface TopRulesProps {
  data: { rule: string; count: number }[]
}

export function ByTypeChart({ data }: ByTypeChartProps) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} layout="vertical" margin={{ left: 80, right: 20, top: 5, bottom: 5 }}>
        <XAxis type="number" tick={{ fontSize: 11 }} />
        <YAxis type="category" dataKey="type" tick={{ fontSize: 11 }} width={80} />
        <Tooltip />
        <Bar dataKey="count" fill="hsl(222.2, 47.4%, 11.2%)" radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}

export function ByLevelChart({ data }: ByLevelChartProps) {
  return (
    <ResponsiveContainer width="100%" height={180}>
      <BarChart data={data} margin={{ left: 10, right: 20, top: 5, bottom: 5 }}>
        <XAxis dataKey="level" tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} />
        <Tooltip />
        <Bar dataKey="count" fill="hsl(215.4, 16.3%, 46.9%)" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}

export function TimelineChart({ data }: TimelineChartProps) {
  return (
    <ResponsiveContainer width="100%" height={180}>
      <LineChart data={data} margin={{ left: 10, right: 20, top: 5, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(214.3, 31.8%, 91.4%)" />
        <XAxis dataKey="day" tick={{ fontSize: 10 }} />
        <YAxis tick={{ fontSize: 11 }} />
        <Tooltip />
        <Line type="monotone" dataKey="count" stroke="hsl(222.2, 47.4%, 11.2%)" strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  )
}

export function TopRulesTable({ data }: TopRulesProps) {
  if (data.length === 0) return <p className="text-sm text-muted-foreground italic">Sin datos.</p>
  return (
    <div className="space-y-1.5">
      {data.map((r, i) => (
        <div key={i} className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground truncate flex-1">{r.rule}</span>
          <span className="font-medium ml-4 shrink-0">{r.count}</span>
        </div>
      ))}
    </div>
  )
}
