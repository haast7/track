import { useState, useEffect, useMemo } from 'react'
import {
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
} from 'firebase/firestore'
import { useAuth } from '@/hooks/useAuth'
import { db } from '@/lib/firebase/config'
import { Lead, Funnel } from '@/types'
import AppLayout from '@/components/AppLayout'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import LeadDetailsModal from '@/components/LeadDetailsModal'
import { exportLeadsToCSV } from '@/lib/csv-export'
import {
  Download,
  Eye,
  User,
  CheckCircle2,
  XCircle,
  Calendar,
} from 'lucide-react'
import { cn } from '@/lib/utils'

export default function Leads() {
  const { user } = useAuth()
  const [leads, setLeads] = useState<Lead[]>([])
  const [funnels, setFunnels] = useState<Funnel[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [detailsOpen, setDetailsOpen] = useState(false)

  // Filtros
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [funnelFilter, setFunnelFilter] = useState<string>('all')
  const [periodFilter, setPeriodFilter] = useState<number>(30)

  // Carregar funis
  useEffect(() => {
    if (!user) return

    const q = query(
      collection(db, 'funnels'),
      where('userId', '==', user.uid)
    )

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const funnelsData: Funnel[] = []
      snapshot.forEach((doc) => {
        const data = doc.data()
        funnelsData.push({
          id: doc.id,
          userId: data.userId,
          name: data.name,
          pixelId: data.pixelId,
          channelId: data.channelId,
          domainId: data.domainId,
          urls: data.urls || [],
          requiresApproval: data.requiresApproval || false,
          trackingScript: data.trackingScript || '',
          telegramLink: data.telegramLink || '',
          isActive: data.isActive ?? true,
          createdAt: data.createdAt?.toDate() || new Date(),
        })
      })
      setFunnels(funnelsData)
    })

    return () => unsubscribe()
  }, [user])

  // Carregar leads em tempo real
  useEffect(() => {
    if (!user) return

    const q = query(
      collection(db, 'leads'),
      where('userId', '==', user.uid),
      orderBy('enteredAt', 'desc')
    )

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const leadsData: Lead[] = []
        snapshot.forEach((doc) => {
          const data = doc.data()
          leadsData.push({
            id: doc.id,
            userId: data.userId,
            funnelId: data.funnelId,
            channelId: data.channelId,
            telegramUserId: data.telegramUserId,
            username: data.username || null,
            firstName: data.firstName || null,
            lastName: data.lastName || null,
            status: data.status || 'active',
            enteredAt: data.enteredAt?.toDate() || new Date(),
            exitedAt: data.exitedAt?.toDate() || null,
          })
        })
        setLeads(leadsData)
        setLoading(false)
      },
      (error) => {
        console.error('Erro ao buscar leads:', error)
        setLoading(false)
      }
    )

    return () => unsubscribe()
  }, [user])

  // Filtrar leads
  const filteredLeads = useMemo(() => {
    let filtered = [...leads]

    // Filtro por status
    if (statusFilter !== 'all') {
      filtered = filtered.filter((lead) => lead.status === statusFilter)
    }

    // Filtro por funil
    if (funnelFilter !== 'all') {
      filtered = filtered.filter((lead) => lead.funnelId === funnelFilter)
    }

    // Filtro por período
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - periodFilter)
    filtered = filtered.filter((lead) => lead.enteredAt >= cutoffDate)

    return filtered
  }, [leads, statusFilter, funnelFilter, periodFilter])

  // Funções auxiliares
  const getFullName = (lead: Lead) => {
    if (lead.firstName && lead.lastName) {
      return `${lead.firstName} ${lead.lastName}`
    }
    if (lead.firstName) {
      return lead.firstName
    }
    return 'Sem nome'
  }

  const getInitials = (lead: Lead) => {
    if (lead.firstName && lead.lastName) {
      return `${lead.firstName[0]}${lead.lastName[0]}`.toUpperCase()
    }
    if (lead.firstName) {
      return lead.firstName[0].toUpperCase()
    }
    if (lead.username) {
      return lead.username[0].toUpperCase()
    }
    return 'U'
  }

  const getTimeInGroup = (lead: Lead) => {
    const endDate = lead.exitedAt || new Date()
    const diff = endDate.getTime() - lead.enteredAt.getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor(
      (diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
    )
    if (days > 0) {
      return `${days}d ${hours}h`
    }
    return `${hours}h`
  }

  const getFunnelName = (funnelId: string) => {
    return funnels.find((f) => f.id === funnelId)?.name || 'N/A'
  }

  const handleExportCSV = () => {
    const funnelsMap = new Map<string, string>()
    funnels.forEach((funnel) => {
      funnelsMap.set(funnel.id, funnel.name)
    })
    exportLeadsToCSV(filteredLeads, funnelsMap)
  }

  const handleViewDetails = (lead: Lead) => {
    setSelectedLead(lead)
    setDetailsOpen(true)
  }

  if (loading) {
    return (
      <AppLayout title="Leads">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-muted-foreground">Carregando...</div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout title="Leads">
      <div className="space-y-4">
        {/* Filtros e Ações */}
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          <div className="flex flex-wrap gap-4 flex-1">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="active">Ativo</SelectItem>
                <SelectItem value="exited">Saiu</SelectItem>
              </SelectContent>
            </Select>

            <Select value={funnelFilter} onValueChange={setFunnelFilter}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Funil" />
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

            <Select
              value={periodFilter.toString()}
              onValueChange={(value) => setPeriodFilter(Number(value))}
            >
              <SelectTrigger className="w-full md:w-[150px]">
                <SelectValue placeholder="Período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Últimos 7 dias</SelectItem>
                <SelectItem value="15">Últimos 15 dias</SelectItem>
                <SelectItem value="30">Últimos 30 dias</SelectItem>
                <SelectItem value="90">Últimos 90 dias</SelectItem>
                <SelectItem value="365">Último ano</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button onClick={handleExportCSV} variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Exportar CSV
          </Button>
        </div>

        {/* Tabela */}
        <div className="border rounded-lg bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                    Avatar
                  </th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                    Nome Completo
                  </th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                    @username
                  </th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                    Funil
                  </th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                    Status
                  </th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                    Data de Entrada
                  </th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                    Data de Saída
                  </th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                    Tempo no Grupo
                  </th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredLeads.length === 0 ? (
                  <tr>
                    <td
                      colSpan={9}
                      className="p-8 text-center text-muted-foreground"
                    >
                      Nenhum lead encontrado
                    </td>
                  </tr>
                ) : (
                  filteredLeads.map((lead) => (
                    <tr
                      key={lead.id}
                      className="border-t border-border hover:bg-muted/50 transition-colors"
                    >
                      <td className="p-4">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback>
                            {getInitials(lead)}
                          </AvatarFallback>
                        </Avatar>
                      </td>
                      <td className="p-4 text-sm text-foreground">
                        {getFullName(lead)}
                      </td>
                      <td className="p-4 text-sm text-muted-foreground">
                        {lead.username ? `@${lead.username}` : '-'}
                      </td>
                      <td className="p-4 text-sm text-foreground">
                        {getFunnelName(lead.funnelId)}
                      </td>
                      <td className="p-4">
                        <span
                          className={cn(
                            'inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium',
                            lead.status === 'active'
                              ? 'bg-green-500/20 text-green-500'
                              : 'bg-red-500/20 text-red-500'
                          )}
                        >
                          {lead.status === 'active' ? (
                            <>
                              <CheckCircle2 className="h-3 w-3" />
                              Ativo
                            </>
                          ) : (
                            <>
                              <XCircle className="h-3 w-3" />
                              Saiu
                            </>
                          )}
                        </span>
                      </td>
                      <td className="p-4 text-sm text-foreground">
                        {lead.enteredAt.toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="p-4 text-sm text-foreground">
                        {lead.exitedAt
                          ? lead.exitedAt.toLocaleDateString('pt-BR', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : '-'}
                      </td>
                      <td className="p-4 text-sm text-foreground">
                        {getTimeInGroup(lead)}
                      </td>
                      <td className="p-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewDetails(lead)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Contador */}
        <div className="text-sm text-muted-foreground">
          Mostrando {filteredLeads.length} de {leads.length} leads
        </div>
      </div>

      {/* Modal de Detalhes */}
      {selectedLead && (
        <LeadDetailsModal
          open={detailsOpen}
          onOpenChange={setDetailsOpen}
          lead={selectedLead}
          funnel={funnels.find((f) => f.id === selectedLead.funnelId) || null}
        />
      )}
    </AppLayout>
  )
}


