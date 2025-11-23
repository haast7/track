import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

interface ChartData {
  date: string
  formattedDate: string
  pageviews: number
  clicks: number
  entries: number
  exits: number
}

interface DashboardChartProps {
  data: ChartData[]
}

export default function DashboardChart({ data }: DashboardChartProps) {
  return (
    <div className="p-6 border rounded-lg bg-card">
      <h3 className="text-lg font-semibold text-foreground mb-4">
        Evolução (últimos 30 dias)
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis
            dataKey="formattedDate"
            className="text-xs"
            stroke="hsl(var(--muted-foreground))"
          />
          <YAxis className="text-xs" stroke="hsl(var(--muted-foreground))" />
          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '0.5rem',
            }}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="pageviews"
            stroke="hsl(var(--primary))"
            strokeWidth={2}
            name="Pageviews"
            dot={false}
          />
          <Line
            type="monotone"
            dataKey="clicks"
            stroke="#3b82f6"
            strokeWidth={2}
            name="Clicks"
            dot={false}
          />
          <Line
            type="monotone"
            dataKey="entries"
            stroke="#10b981"
            strokeWidth={2}
            name="Entradas"
            dot={false}
          />
          <Line
            type="monotone"
            dataKey="exits"
            stroke="#ef4444"
            strokeWidth={2}
            name="Saídas"
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}


