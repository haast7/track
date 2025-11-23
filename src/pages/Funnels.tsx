import { useState, useEffect } from 'react'
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
} from 'firebase/firestore'
import { useAuth } from '@/hooks/useAuth'
import { db } from '@/lib/firebase/config'
import { Funnel, Pixel, TelegramChannel, Domain } from '@/types'
import AppLayout from '@/components/AppLayout'
import { Button } from '@/components/ui/button'
import FunnelFormModal from '@/components/FunnelFormModal'
import FunnelTutorialModal from '@/components/FunnelTutorialModal'
import { generateTrackingScript, generateTelegramLink } from '@/lib/funnel-utils'
import {
  Plus,
  Edit,
  Trash2,
  CheckCircle2,
  XCircle,
  GitBranch,
  BookOpen,
} from 'lucide-react'
import { cn } from '@/lib/utils'

export default function Funnels() {
  const { user } = useAuth()
  const [funnels, setFunnels] = useState<Funnel[]>([])
  const [pixels, setPixels] = useState<Pixel[]>([])
  const [channels, setChannels] = useState<TelegramChannel[]>([])
  const [domains, setDomains] = useState<Domain[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [tutorialOpen, setTutorialOpen] = useState(false)
  const [editingFunnel, setEditingFunnel] = useState<Funnel | null>(null)
  const [selectedFunnel, setSelectedFunnel] = useState<Funnel | null>(null)

  // Carregar funis
  useEffect(() => {
    if (!user) return

    const q = query(
      collection(db, 'funnels'),
      where('userId', '==', user.uid)
    )

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
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
        setLoading(false)
      },
      (error) => {
        console.error('Erro ao buscar funis:', error)
        setLoading(false)
      }
    )

    return () => unsubscribe()
  }, [user])

  // Carregar pixels
  useEffect(() => {
    if (!user) return

    const q = query(
      collection(db, 'pixels'),
      where('userId', '==', user.uid)
    )

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const pixelsData: Pixel[] = []
      snapshot.forEach((doc) => {
        const data = doc.data()
        pixelsData.push({
          id: doc.id,
          userId: data.userId,
          name: data.name,
          pixelId: data.pixelId,
          accessToken: data.accessToken,
          isActive: data.isActive ?? true,
          createdAt: data.createdAt?.toDate() || new Date(),
        })
      })
      setPixels(pixelsData)
    })

    return () => unsubscribe()
  }, [user])

  // Carregar canais
  useEffect(() => {
    if (!user) return

    const q = query(
      collection(db, 'channels'),
      where('userId', '==', user.uid)
    )

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const channelsData: TelegramChannel[] = []
      snapshot.forEach((doc) => {
        const data = doc.data()
        channelsData.push({
          id: doc.id,
          userId: data.userId,
          name: data.name,
          botToken: data.botToken,
          groupId: data.groupId,
          isActive: data.isActive ?? true,
          createdAt: data.createdAt?.toDate() || new Date(),
        })
      })
      setChannels(channelsData)
    })

    return () => unsubscribe()
  }, [user])

  // Carregar domínios
  useEffect(() => {
    if (!user) return

    const q = query(
      collection(db, 'domains'),
      where('userId', '==', user.uid)
    )

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const domainsData: Domain[] = []
      snapshot.forEach((doc) => {
        const data = doc.data()
        domainsData.push({
          id: doc.id,
          userId: data.userId,
          url: data.url,
          createdAt: data.createdAt?.toDate() || new Date(),
        })
      })
      setDomains(domainsData)
    })

    return () => unsubscribe()
  }, [user])

  const handleCreate = async (data: {
    name: string
    pixelId: string
    channelId: string
    domainId: string
    urls: string[]
    requiresApproval: boolean
  }) => {
    if (!user) return

    const domain = domains.find((d) => d.id === data.domainId)
    const channel = channels.find((c) => c.id === data.channelId)

    if (!domain || !channel) {
      throw new Error('Domínio ou canal não encontrado')
    }

    // Gerar tracking script
    const trackingScript = generateTrackingScript(
      'temp-id',
      domain,
      data.urls
    )

    // Gerar link do Telegram
    const telegramLink = await generateTelegramLink(
      channel,
      data.requiresApproval
    )

    // Criar funil
    const docRef = await addDoc(collection(db, 'funnels'), {
      userId: user.uid,
      name: data.name,
      pixelId: data.pixelId,
      channelId: data.channelId,
      domainId: data.domainId,
      urls: data.urls,
      requiresApproval: data.requiresApproval,
      trackingScript,
      telegramLink,
      isActive: true,
      createdAt: serverTimestamp(),
    })

    // Atualizar script com ID real
    const updatedScript = generateTrackingScript(docRef.id, domain, data.urls)
    await updateDoc(docRef, {
      trackingScript: updatedScript,
    })
  }

  const handleUpdate = async (data: {
    name: string
    pixelId: string
    channelId: string
    domainId: string
    urls: string[]
    requiresApproval: boolean
  }) => {
    if (!editingFunnel) return

    const domain = domains.find((d) => d.id === data.domainId)
    const channel = channels.find((c) => c.id === data.channelId)

    if (!domain || !channel) {
      throw new Error('Domínio ou canal não encontrado')
    }

    // Gerar novo tracking script
    const trackingScript = generateTrackingScript(
      editingFunnel.id,
      domain,
      data.urls
    )

    // Gerar novo link do Telegram
    const telegramLink = await generateTelegramLink(
      channel,
      data.requiresApproval
    )

    await updateDoc(doc(db, 'funnels', editingFunnel.id), {
      name: data.name,
      pixelId: data.pixelId,
      channelId: data.channelId,
      domainId: data.domainId,
      urls: data.urls,
      requiresApproval: data.requiresApproval,
      trackingScript,
      telegramLink,
    })
    setEditingFunnel(null)
  }

  const handleDelete = async (funnelId: string) => {
    if (!confirm('Tem certeza que deseja excluir este funil?')) return

    await deleteDoc(doc(db, 'funnels', funnelId))
  }

  const handleToggleActive = async (funnel: Funnel) => {
    await updateDoc(doc(db, 'funnels', funnel.id), {
      isActive: !funnel.isActive,
    })
  }

  const openCreateModal = () => {
    setEditingFunnel(null)
    setModalOpen(true)
  }

  const openEditModal = (funnel: Funnel) => {
    setEditingFunnel(funnel)
    setModalOpen(true)
  }

  const openTutorial = (funnel: Funnel) => {
    setSelectedFunnel(funnel)
    setTutorialOpen(true)
  }

  const handleModalSubmit = async (data: {
    name: string
    pixelId: string
    channelId: string
    domainId: string
    urls: string[]
    requiresApproval: boolean
  }) => {
    if (editingFunnel) {
      await handleUpdate(data)
    } else {
      await handleCreate(data)
    }
  }

  const getPixelName = (pixelId: string) => {
    return pixels.find((p) => p.id === pixelId)?.name || 'N/A'
  }

  const getChannelName = (channelId: string) => {
    return channels.find((c) => c.id === channelId)?.name || 'N/A'
  }

  const getDomainUrl = (domainId: string) => {
    return domains.find((d) => d.id === domainId)?.url || 'N/A'
  }

  if (loading) {
    return (
      <AppLayout title="Funis">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-muted-foreground">Carregando...</div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout title="Funis">
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold text-foreground">
            Gerenciar Funis
          </h2>
          <Button onClick={openCreateModal}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Funil
          </Button>
        </div>

        {funnels.length === 0 ? (
          <div className="p-8 text-center border rounded-lg bg-card">
            <GitBranch className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">
              Nenhum funil cadastrado. Clique em "Novo Funil" para começar.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {funnels.map((funnel) => (
              <div
                key={funnel.id}
                className="p-6 border rounded-lg bg-card space-y-4"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-foreground">
                      {funnel.name}
                    </h3>
                    <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                      <p>Pixel: {getPixelName(funnel.pixelId)}</p>
                      <p>Canal: {getChannelName(funnel.channelId)}</p>
                      <p>Domínio: {getDomainUrl(funnel.domainId)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {funnel.isActive ? (
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                    ) : (
                      <XCircle className="h-5 w-5 text-gray-500" />
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      'px-2 py-1 text-xs rounded',
                      funnel.isActive
                        ? 'bg-green-500/20 text-green-500'
                        : 'bg-gray-500/20 text-gray-500'
                    )}
                  >
                    {funnel.isActive ? 'Ativo' : 'Inativo'}
                  </span>
                  {funnel.requiresApproval && (
                    <span className="px-2 py-1 text-xs rounded bg-blue-500/20 text-blue-500">
                      Requer aprovação
                    </span>
                  )}
                </div>

                <div className="flex gap-2 pt-2 border-t border-border">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openTutorial(funnel)}
                    className="flex-1"
                  >
                    <BookOpen className="mr-2 h-4 w-4" />
                    Tutorial
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleToggleActive(funnel)}
                  >
                    {funnel.isActive ? 'Desativar' : 'Ativar'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEditModal(funnel)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(funnel.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <FunnelFormModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onSubmit={handleModalSubmit}
        funnel={editingFunnel}
        pixels={pixels}
        channels={channels}
        domains={domains}
      />

      {selectedFunnel && (
        <FunnelTutorialModal
          open={tutorialOpen}
          onOpenChange={setTutorialOpen}
          trackingScript={selectedFunnel.trackingScript}
          telegramLink={selectedFunnel.telegramLink}
        />
      )}
    </AppLayout>
  )
}


