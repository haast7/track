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
import { TelegramChannel } from '@/types'
import AppLayout from '@/components/AppLayout'
import { Button } from '@/components/ui/button'
import ChannelFormModal from '@/components/ChannelFormModal'
import {
  Plus,
  Edit,
  Trash2,
  CheckCircle2,
  XCircle,
  MessageSquare,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import { cn } from '@/lib/utils'

export default function Channels() {
  const { user } = useAuth()
  const [channels, setChannels] = useState<TelegramChannel[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingChannel, setEditingChannel] = useState<TelegramChannel | null>(
    null
  )
  const [showTutorial, setShowTutorial] = useState(false)

  useEffect(() => {
    if (!user) return

    const q = query(
      collection(db, 'channels'),
      where('userId', '==', user.uid)
    )

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
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
        setLoading(false)
      },
      (error) => {
        console.error('Erro ao buscar canais:', error)
        setLoading(false)
      }
    )

    return () => unsubscribe()
  }, [user])

  const handleCreate = async (data: {
    name: string
    botToken: string
    groupId: string
  }) => {
    if (!user) return

    await addDoc(collection(db, 'channels'), {
      userId: user.uid,
      name: data.name,
      botToken: data.botToken,
      groupId: data.groupId,
      isActive: true,
      createdAt: serverTimestamp(),
    })
  }

  const handleUpdate = async (data: {
    name: string
    botToken: string
    groupId: string
  }) => {
    if (!editingChannel) return

    await updateDoc(doc(db, 'channels', editingChannel.id), {
      name: data.name,
      botToken: data.botToken,
      groupId: data.groupId,
    })
    setEditingChannel(null)
  }

  const handleDelete = async (channelId: string) => {
    if (!confirm('Tem certeza que deseja excluir este canal?')) return

    await deleteDoc(doc(db, 'channels', channelId))
  }

  const handleToggleActive = async (channel: TelegramChannel) => {
    await updateDoc(doc(db, 'channels', channel.id), {
      isActive: !channel.isActive,
    })
  }

  const openCreateModal = () => {
    setEditingChannel(null)
    setModalOpen(true)
  }

  const openEditModal = (channel: TelegramChannel) => {
    setEditingChannel(channel)
    setModalOpen(true)
  }

  const handleModalSubmit = async (data: {
    name: string
    botToken: string
    groupId: string
  }) => {
    if (editingChannel) {
      await handleUpdate(data)
    } else {
      await handleCreate(data)
    }
  }

  if (loading) {
    return (
      <AppLayout title="Canais">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-muted-foreground">Carregando...</div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout title="Canais">
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold text-foreground">
            Gerenciar Canais do Telegram
          </h2>
          <Button onClick={openCreateModal}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Canal
          </Button>
        </div>

        {/* Tutorial */}
        <div className="border rounded-lg bg-card">
          <button
            onClick={() => setShowTutorial(!showTutorial)}
            className="w-full flex items-center justify-between p-4 hover:bg-accent transition-colors"
          >
            <div className="flex items-center gap-3">
              <MessageSquare className="h-5 w-5 text-primary" />
              <span className="font-semibold text-foreground">
                Tutorial de Configuração do Bot
              </span>
            </div>
            {showTutorial ? (
              <ChevronUp className="h-5 w-5" />
            ) : (
              <ChevronDown className="h-5 w-5" />
            )}
          </button>

          {showTutorial && (
            <div className="p-4 pt-0 border-t border-border space-y-4">
              <div className="space-y-2">
                <h3 className="font-semibold text-foreground">
                  1. Criar um Bot no Telegram
                </h3>
                <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                  <li>Abra o Telegram e procure por @BotFather</li>
                  <li>Envie o comando /newbot</li>
                  <li>Siga as instruções para criar seu bot</li>
                  <li>Copie o Bot Token fornecido pelo BotFather</li>
                </ol>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold text-foreground">
                  2. Obter o Group ID
                </h3>
                <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                  <li>Adicione o bot ao grupo do Telegram</li>
                  <li>
                    Adicione o bot @userinfobot ao grupo e envie /start
                  </li>
                  <li>
                    O bot retornará o ID do grupo (número negativo, ex:
                    -1001234567890)
                  </li>
                  <li>Copie o Group ID</li>
                </ol>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold text-foreground">
                  3. Configurar o Bot
                </h3>
                <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                  <li>Certifique-se de que o bot é administrador do grupo</li>
                  <li>
                    Configure as permissões necessárias no grupo (adicionar
                    membros, etc.)
                  </li>
                  <li>Use o botão "Validar Token" para verificar se está
                    correto</li>
                </ol>
              </div>
            </div>
          )}
        </div>

        {channels.length === 0 ? (
          <div className="p-8 text-center border rounded-lg bg-card">
            <p className="text-muted-foreground">
              Nenhum canal cadastrado. Clique em "Novo Canal" para começar.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {channels.map((channel) => (
              <div
                key={channel.id}
                className="p-6 border rounded-lg bg-card space-y-4"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-foreground">
                      {channel.name}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Grupo: {channel.groupId}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {channel.isActive ? (
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
                      channel.isActive
                        ? 'bg-green-500/20 text-green-500'
                        : 'bg-gray-500/20 text-gray-500'
                    )}
                  >
                    {channel.isActive ? 'Ativo' : 'Inativo'}
                  </span>
                </div>

                <div className="flex gap-2 pt-2 border-t border-border">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleToggleActive(channel)}
                    className="flex-1"
                  >
                    {channel.isActive ? 'Desativar' : 'Ativar'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEditModal(channel)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(channel.id)}
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

      <ChannelFormModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onSubmit={handleModalSubmit}
        channel={editingChannel}
      />
    </AppLayout>
  )
}


