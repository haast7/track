import { useState, useEffect, useMemo } from 'react'
import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  orderBy,
  limit,
} from 'firebase/firestore'
import { useAuth } from '@/hooks/useAuth'
import { db } from '@/lib/firebase/config'
import { Postback, PostbackLog, Funnel } from '@/types'
import AppLayout from '@/components/AppLayout'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import PostbackFormModal from '@/components/PostbackFormModal'
import {
  Plus,
  Edit,
  Trash2,
  CheckCircle2,
  XCircle,
  Webhook,
  TrendingUp,
  Clock,
} from 'lucide-react'
import { cn } from '@/lib/utils'

export default function Postbacks() {
  const { user } = useAuth()
  const [postbacks, setPostbacks] = useState<Postback[]>([])
  const [logs, setLogs] = useState<PostbackLog[]>([])
  const [funnels, setFunnels] = useState<Funnel[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingPostback, setEditingPostback] = useState<Postback | null>(null)
  const [logStatusFilter, setLogStatusFilter] = useState<string>('all')

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

  // Carregar postbacks
  useEffect(() => {
    if (!user) return

    const q = query(
      collection(db, 'postbacks'),
      where('userId', '==', user.uid)
    )

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const postbacksData: Postback[] = []
      snapshot.forEach((doc) => {
        const data = doc.data()
        postbacksData.push({
          id: doc.id,
          userId: data.userId,
          name: data.name,
          webhookUrl: data.webhookUrl,
          eventType: data.eventType,
          funnelIds: data.funnelIds || null,
          isActive: data.isActive ?? true,
          stats: {
            sent: data.stats?.sent || 0,
            failed: data.stats?.failed || 0,
            lastSent: data.stats?.lastSent?.toDate() || null,
          },
          createdAt: data.createdAt?.toDate() || new Date(),
        })
      })
      setPostbacks(postbacksData)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [user])

  // Carregar logs (últimos 100)
  useEffect(() => {
    if (!user) return

    const userId = user.uid
    let unsubscribe: (() => void) | null = null

    // Função para carregar logs sem ordenação (fallback)
    const loadLogsWithoutOrder = () => {
      const qWithoutOrder = query(
        collection(db, 'postback_logs'),
        where('userId', '==', userId),
        limit(100)
      )
      
      return onSnapshot(
        qWithoutOrder,
        (snapshot) => {
          const logsData: PostbackLog[] = []
          snapshot.forEach((doc) => {
            const data = doc.data()
            logsData.push({
              id: doc.id,
              postbackId: data.postbackId,
              userId: data.userId,
              eventType: data.eventType,
              status: data.status,
              payload: data.payload,
              response: data.response,
              error: data.error || null,
              createdAt: data.createdAt?.toDate() || new Date(),
            })
          })
          // Ordenar no cliente
          logsData.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
          setLogs(logsData)
        },
        (fallbackError) => {
          console.error('Erro ao carregar logs sem ordenação:', fallbackError)
        }
      )
    }

    // Tentar carregar com ordenação primeiro
    const q = query(
      collection(db, 'postback_logs'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(100)
    )

    unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const logsData: PostbackLog[] = []
        snapshot.forEach((doc) => {
          const data = doc.data()
          logsData.push({
            id: doc.id,
            postbackId: data.postbackId,
            userId: data.userId,
            eventType: data.eventType,
            status: data.status,
            payload: data.payload,
            response: data.response,
            error: data.error || null,
            createdAt: data.createdAt?.toDate() || new Date(),
          })
        })
        setLogs(logsData)
      },
      (error) => {
        // Se o erro for de índice faltando ou sendo construído, usar fallback
        if (error.code === 'failed-precondition') {
          // Não logar como erro se for apenas índice sendo construído
          const isIndexBuilding = error.message?.includes('currently building') || 
                                  error.message?.includes('cannot be used yet')
          
          if (isIndexBuilding) {
            // Silenciosamente usar fallback quando índice está sendo construído
            unsubscribe = loadLogsWithoutOrder()
          } else {
            // Logar apenas se for outro tipo de erro de índice
            console.warn('Índice do Firestore necessário. Carregando logs sem ordenação...')
            unsubscribe = loadLogsWithoutOrder()
          }
        } else {
          // Para outros erros, logar normalmente
          console.error('Erro ao carregar logs de postback:', error)
        }
      }
    )

    return () => {
      if (unsubscribe) unsubscribe()
    }
  }, [user])

  const handleCreate = async (data: {
    name: string
    webhookUrl: string
    eventType: 'viewPage' | 'clickButton' | 'memberJoin' | 'memberLeft'
    funnelIds: string[] | null
    isActive: boolean
  }) => {
    if (!user) return

    await addDoc(collection(db, 'postbacks'), {
      userId: user.uid,
      name: data.name,
      webhookUrl: data.webhookUrl,
      eventType: data.eventType,
      funnelIds: data.funnelIds,
      isActive: data.isActive,
      stats: {
        sent: 0,
        failed: 0,
        lastSent: null,
      },
      createdAt: serverTimestamp(),
    })
  }

  const handleUpdate = async (data: {
    name: string
    webhookUrl: string
    eventType: 'viewPage' | 'clickButton' | 'memberJoin' | 'memberLeft'
    funnelIds: string[] | null
    isActive: boolean
  }) => {
    if (!editingPostback) return

    await updateDoc(doc(db, 'postbacks', editingPostback.id), {
      name: data.name,
      webhookUrl: data.webhookUrl,
      eventType: data.eventType,
      funnelIds: data.funnelIds,
      isActive: data.isActive,
    })
    setEditingPostback(null)
  }

  const handleDelete = async (postbackId: string) => {
    if (!confirm('Tem certeza que deseja excluir este postback?')) return

    await deleteDoc(doc(db, 'postbacks', postbackId))
  }

  const handleToggleActive = async (postback: Postback) => {
    await updateDoc(doc(db, 'postbacks', postback.id), {
      isActive: !postback.isActive,
    })
  }

  const openCreateModal = () => {
    setEditingPostback(null)
    setModalOpen(true)
  }

  const openEditModal = (postback: Postback) => {
    setEditingPostback(postback)
    setModalOpen(true)
  }

  const handleModalSubmit = async (data: {
    name: string
    webhookUrl: string
    eventType: 'viewPage' | 'clickButton' | 'memberJoin' | 'memberLeft'
    funnelIds: string[] | null
    isActive: boolean
  }) => {
    if (editingPostback) {
      await handleUpdate(data)
    } else {
      await handleCreate(data)
    }
  }

  // Filtrar postbacks
  const activePostbacks = postbacks.filter((p) => p.isActive)
  const inactivePostbacks = postbacks.filter((p) => !p.isActive)

  // Filtrar logs
  const filteredLogs = useMemo(() => {
    if (logStatusFilter === 'all') return logs
    return logs.filter((log) => log.status === logStatusFilter)
  }, [logs, logStatusFilter])

  // Calcular estatísticas
  const totalSent = postbacks.reduce((sum, p) => sum + p.stats.sent, 0)
  const totalFailed = postbacks.reduce((sum, p) => sum + p.stats.failed, 0)
  const totalAttempts = totalSent + totalFailed
  const successRate = totalAttempts > 0 ? (totalSent / totalAttempts) * 100 : 0

  // Funções auxiliares
  const getEventTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      viewPage: 'View Page',
      clickButton: 'Click Button',
      memberJoin: 'Member Join',
      memberLeft: 'Member Left',
    }
    return labels[type] || type
  }

  const getFunnelsLabel = (postback: Postback) => {
    if (postback.funnelIds === null) {
      return 'Todos os funis'
    }
    if (postback.funnelIds.length === 0) {
      return 'Nenhum funil'
    }
    if (postback.funnelIds.length === 1) {
      const funnel = funnels.find((f) => f.id === postback.funnelIds![0])
      return funnel?.name || 'N/A'
    }
    return `${postback.funnelIds.length} funis`
  }

  const getPostbackName = (postbackId: string) => {
    return postbacks.find((p) => p.id === postbackId)?.name || 'N/A'
  }

  if (loading) {
    return (
      <AppLayout title="Postbacks">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-muted-foreground">Carregando...</div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout title="Postbacks">
      <div className="space-y-6">
        {/* Estatísticas */}
        <div className="grid gap-4 md:grid-cols-3">
          <div className="p-6 border rounded-lg bg-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Total Enviado
                </p>
                <p className="text-2xl font-bold text-foreground mt-1">
                  {totalSent.toLocaleString('pt-BR')}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-primary" />
            </div>
          </div>
          <div className="p-6 border rounded-lg bg-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Taxa de Sucesso
                </p>
                <p className="text-2xl font-bold text-foreground mt-1">
                  {successRate.toFixed(2)}%
                </p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-500" />
            </div>
          </div>
          <div className="p-6 border rounded-lg bg-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Falhas
                </p>
                <p className="text-2xl font-bold text-foreground mt-1">
                  {totalFailed.toLocaleString('pt-BR')}
                </p>
              </div>
              <XCircle className="h-8 w-8 text-red-500" />
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="active" className="space-y-4">
          <div className="flex justify-between items-center">
            <TabsList>
              <TabsTrigger value="active">
                Ativos ({activePostbacks.length})
              </TabsTrigger>
              <TabsTrigger value="inactive">
                Inativos ({inactivePostbacks.length})
              </TabsTrigger>
              <TabsTrigger value="logs">Logs ({logs.length})</TabsTrigger>
            </TabsList>
            <Button onClick={openCreateModal}>
              <Plus className="mr-2 h-4 w-4" />
              Novo Postback
            </Button>
          </div>

          {/* Tab: Ativos */}
          <TabsContent value="active" className="space-y-4">
            <div className="border rounded-lg bg-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                        Nome
                      </th>
                      <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                        URL
                      </th>
                      <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                        Evento
                      </th>
                      <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                        Funis
                      </th>
                      <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                        Status
                      </th>
                      <th className="text-right p-4 text-sm font-medium text-muted-foreground">
                        Enviados
                      </th>
                      <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                        Último Envio
                      </th>
                      <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {activePostbacks.length === 0 ? (
                      <tr>
                        <td
                          colSpan={8}
                          className="p-8 text-center text-muted-foreground"
                        >
                          Nenhum postback ativo
                        </td>
                      </tr>
                    ) : (
                      activePostbacks.map((postback) => (
                        <tr
                          key={postback.id}
                          className="border-t border-border hover:bg-muted/50 transition-colors"
                        >
                          <td className="p-4 text-sm font-medium text-foreground">
                            {postback.name}
                          </td>
                          <td className="p-4 text-sm text-muted-foreground max-w-xs truncate">
                            {postback.webhookUrl}
                          </td>
                          <td className="p-4 text-sm text-foreground">
                            {getEventTypeLabel(postback.eventType)}
                          </td>
                          <td className="p-4 text-sm text-foreground">
                            {getFunnelsLabel(postback)}
                          </td>
                          <td className="p-4">
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-500">
                              <CheckCircle2 className="h-3 w-3" />
                              Ativo
                            </span>
                          </td>
                          <td className="p-4 text-sm text-right text-foreground">
                            {postback.stats.sent}
                          </td>
                          <td className="p-4 text-sm text-muted-foreground">
                            {postback.stats.lastSent
                              ? postback.stats.lastSent.toLocaleString('pt-BR')
                              : 'Nunca'}
                          </td>
                          <td className="p-4">
                            <div className="flex gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openEditModal(postback)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleToggleActive(postback)}
                              >
                                Desativar
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(postback.id)}
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>

          {/* Tab: Inativos */}
          <TabsContent value="inactive" className="space-y-4">
            <div className="border rounded-lg bg-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                        Nome
                      </th>
                      <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                        URL
                      </th>
                      <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                        Evento
                      </th>
                      <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                        Funis
                      </th>
                      <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                        Status
                      </th>
                      <th className="text-right p-4 text-sm font-medium text-muted-foreground">
                        Enviados
                      </th>
                      <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                        Último Envio
                      </th>
                      <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {inactivePostbacks.length === 0 ? (
                      <tr>
                        <td
                          colSpan={8}
                          className="p-8 text-center text-muted-foreground"
                        >
                          Nenhum postback inativo
                        </td>
                      </tr>
                    ) : (
                      inactivePostbacks.map((postback) => (
                        <tr
                          key={postback.id}
                          className="border-t border-border hover:bg-muted/50 transition-colors"
                        >
                          <td className="p-4 text-sm font-medium text-foreground">
                            {postback.name}
                          </td>
                          <td className="p-4 text-sm text-muted-foreground max-w-xs truncate">
                            {postback.webhookUrl}
                          </td>
                          <td className="p-4 text-sm text-foreground">
                            {getEventTypeLabel(postback.eventType)}
                          </td>
                          <td className="p-4 text-sm text-foreground">
                            {getFunnelsLabel(postback)}
                          </td>
                          <td className="p-4">
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-500/20 text-gray-500">
                              <XCircle className="h-3 w-3" />
                              Inativo
                            </span>
                          </td>
                          <td className="p-4 text-sm text-right text-foreground">
                            {postback.stats.sent}
                          </td>
                          <td className="p-4 text-sm text-muted-foreground">
                            {postback.stats.lastSent
                              ? postback.stats.lastSent.toLocaleString('pt-BR')
                              : 'Nunca'}
                          </td>
                          <td className="p-4">
                            <div className="flex gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openEditModal(postback)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleToggleActive(postback)}
                              >
                                Ativar
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(postback.id)}
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>

          {/* Tab: Logs */}
          <TabsContent value="logs" className="space-y-4">
            <div className="flex justify-end">
              <Select
                value={logStatusFilter}
                onValueChange={setLogStatusFilter}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filtrar por status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="success">Sucesso</SelectItem>
                  <SelectItem value="failed">Falha</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="border rounded-lg bg-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                        Data
                      </th>
                      <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                        Postback
                      </th>
                      <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                        Evento
                      </th>
                      <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                        Status
                      </th>
                      <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                        Response
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLogs.length === 0 ? (
                      <tr>
                        <td
                          colSpan={5}
                          className="p-8 text-center text-muted-foreground"
                        >
                          Nenhum log encontrado
                        </td>
                      </tr>
                    ) : (
                      filteredLogs.map((log) => (
                        <tr
                          key={log.id}
                          className="border-t border-border hover:bg-muted/50 transition-colors"
                        >
                          <td className="p-4 text-sm text-foreground">
                            {log.createdAt.toLocaleString('pt-BR')}
                          </td>
                          <td className="p-4 text-sm text-foreground">
                            {getPostbackName(log.postbackId)}
                          </td>
                          <td className="p-4 text-sm text-foreground">
                            {getEventTypeLabel(log.eventType)}
                          </td>
                          <td className="p-4">
                            <span
                              className={cn(
                                'inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium',
                                log.status === 'success'
                                  ? 'bg-green-500/20 text-green-500'
                                  : 'bg-red-500/20 text-red-500'
                              )}
                            >
                              {log.status === 'success' ? (
                                <>
                                  <CheckCircle2 className="h-3 w-3" />
                                  Sucesso
                                </>
                              ) : (
                                <>
                                  <XCircle className="h-3 w-3" />
                                  Falha
                                </>
                              )}
                            </span>
                          </td>
                          <td className="p-4 text-sm text-muted-foreground max-w-md truncate">
                            {log.status === 'success'
                              ? log.response?.status
                                ? `HTTP ${log.response.status}`
                                : 'OK'
                              : log.error || 'Erro desconhecido'}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Modal */}
        <PostbackFormModal
          open={modalOpen}
          onOpenChange={setModalOpen}
          onSubmit={handleModalSubmit}
          postback={editingPostback}
          funnels={funnels}
        />
      </div>
    </AppLayout>
  )
}


