import { useState } from 'react'
import AppLayout from '@/components/AppLayout'
import { useDashboardData } from '@/hooks/useDashboardData'
import MetricCard from '@/components/MetricCard'
import DashboardChart from '@/components/DashboardChart'
import RetentionTable from '@/components/RetentionTable'
import {
  Eye,
  MousePointerClick,
  UserPlus,
  UserMinus,
  TrendingUp,
} from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'

export default function Dashboard() {
  const [selectedFunnelId, setSelectedFunnelId] = useState<string | undefined>()
  const [days, setDays] = useState(30)

  const { funnels, dailyData, retentionData, metrics, loading } =
    useDashboardData(selectedFunnelId, days)

  if (loading) {
    return (
      <AppLayout title="Dashboard">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-muted-foreground">Carregando...</div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout title="Dashboard">
      <div className="space-y-6">
        {/* Filtros */}
        <div className="flex gap-4 items-center">
          <div className="flex-1">
            <Select
              value={selectedFunnelId || 'all'}
              onValueChange={(value) =>
                setSelectedFunnelId(value === 'all' ? undefined : value)
              }
            >
              <SelectTrigger className="w-full md:w-[300px]">
                <SelectValue placeholder="Todos os funis" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os funis</SelectItem>
                {funnels.map((funnel) => (
                  <SelectItem key={funnel.id} value={funnel.id}>
                    {funnel.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2">
            <Button
              variant={days === 7 ? 'default' : 'outline'}
              size="sm"
              onClick={() => setDays(7)}
            >
              7 dias
            </Button>
            <Button
              variant={days === 15 ? 'default' : 'outline'}
              size="sm"
              onClick={() => setDays(15)}
            >
              15 dias
            </Button>
            <Button
              variant={days === 30 ? 'default' : 'outline'}
              size="sm"
              onClick={() => setDays(30)}
            >
              30 dias
            </Button>
          </div>
        </div>

        {/* Cards de Métricas */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            title="Pageviews"
            value={metrics.totalPageviews.toLocaleString('pt-BR')}
            subtitle={`Taxa de conversão: ${metrics.conversionRate.toFixed(2)}%`}
            icon={Eye}
            trend={{
              value: metrics.conversionRate,
              isPositive: metrics.conversionRate > 0,
            }}
          />
          <MetricCard
            title="Clicks"
            value={metrics.totalClicks.toLocaleString('pt-BR')}
            subtitle={`CTR: ${metrics.ctr.toFixed(2)}%`}
            icon={MousePointerClick}
            trend={{
              value: metrics.ctr,
              isPositive: metrics.ctr > 0,
            }}
          />
          <MetricCard
            title="Entradas"
            value={metrics.totalEntries.toLocaleString('pt-BR')}
            subtitle={`Taxa de entrada: ${metrics.entryRate.toFixed(2)}%`}
            icon={UserPlus}
            trend={{
              value: metrics.entryRate,
              isPositive: metrics.entryRate > 0,
            }}
          />
          <MetricCard
            title="Saídas"
            value={metrics.totalExits.toLocaleString('pt-BR')}
            subtitle={`Taxa de retenção: ${metrics.retentionRate.toFixed(2)}%`}
            icon={UserMinus}
            trend={{
              value: metrics.retentionRate,
              isPositive: metrics.retentionRate > 50,
            }}
          />
        </div>

        {/* Gráfico de Evolução */}
        <DashboardChart data={dailyData} />

        {/* Tabela de Retenção */}
        <RetentionTable data={retentionData} />
      </div>
    </AppLayout>
  )
}
