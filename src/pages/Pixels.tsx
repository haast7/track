import { useState, useEffect } from 'react'
import { collection, query, where, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore'
import { useAuth } from '@/hooks/useAuth'
import { db } from '@/lib/firebase/config'
import { Pixel } from '@/types'
import AppLayout from '@/components/AppLayout'
import { Button } from '@/components/ui/button'
import PixelFormModal from '@/components/PixelFormModal'
import { Plus, Edit, Trash2, CheckCircle2, XCircle } from 'lucide-react'

export default function Pixels() {
  const { user } = useAuth()
  const [pixels, setPixels] = useState<Pixel[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingPixel, setEditingPixel] = useState<Pixel | null>(null)

  useEffect(() => {
    if (!user) return

    const q = query(
      collection(db, 'pixels'),
      where('userId', '==', user.uid)
    )

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
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
        setLoading(false)
      },
      (error) => {
        console.error('Erro ao buscar pixels:', error)
        setLoading(false)
      }
    )

    return () => unsubscribe()
  }, [user])

  const handleCreate = async (data: { name: string; pixelId: string; accessToken: string }) => {
    if (!user) return

    await addDoc(collection(db, 'pixels'), {
      userId: user.uid,
      name: data.name,
      pixelId: data.pixelId,
      accessToken: data.accessToken,
      isActive: true,
      createdAt: serverTimestamp(),
    })
  }

  const handleUpdate = async (data: { name: string; pixelId: string; accessToken: string }) => {
    if (!editingPixel) return

    await updateDoc(doc(db, 'pixels', editingPixel.id), {
      name: data.name,
      pixelId: data.pixelId,
      accessToken: data.accessToken,
    })
    setEditingPixel(null)
  }

  const handleDelete = async (pixelId: string) => {
    if (!confirm('Tem certeza que deseja excluir este pixel?')) return

    await deleteDoc(doc(db, 'pixels', pixelId))
  }

  const handleToggleActive = async (pixel: Pixel) => {
    await updateDoc(doc(db, 'pixels', pixel.id), {
      isActive: !pixel.isActive,
    })
  }

  const openCreateModal = () => {
    setEditingPixel(null)
    setModalOpen(true)
  }

  const openEditModal = (pixel: Pixel) => {
    setEditingPixel(pixel)
    setModalOpen(true)
  }

  const handleModalSubmit = async (data: { name: string; pixelId: string; accessToken: string }) => {
    if (editingPixel) {
      await handleUpdate(data)
    } else {
      await handleCreate(data)
    }
  }

  if (loading) {
    return (
      <AppLayout title="Pixels">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-muted-foreground">Carregando...</div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout title="Pixels">
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold text-foreground">
            Gerenciar Pixels
          </h2>
          <Button onClick={openCreateModal}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Pixel
          </Button>
        </div>

        {pixels.length === 0 ? (
          <div className="p-8 text-center border rounded-lg bg-card">
            <p className="text-muted-foreground">
              Nenhum pixel cadastrado. Clique em "Novo Pixel" para começar.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {pixels.map((pixel) => (
              <div
                key={pixel.id}
                className="p-6 border rounded-lg bg-card space-y-4"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-foreground">
                      {pixel.name}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      ID: {pixel.pixelId}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {pixel.isActive ? (
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                    ) : (
                      <XCircle className="h-5 w-5 text-gray-500" />
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-1 text-xs rounded ${
                      pixel.isActive
                        ? 'bg-green-500/20 text-green-500'
                        : 'bg-gray-500/20 text-gray-500'
                    }`}
                  >
                    {pixel.isActive ? 'Ativo' : 'Inativo'}
                  </span>
                </div>

                <div className="flex gap-2 pt-2 border-t border-border">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleToggleActive(pixel)}
                    className="flex-1"
                  >
                    {pixel.isActive ? 'Desativar' : 'Ativar'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEditModal(pixel)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(pixel.id)}
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

      <PixelFormModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onSubmit={handleModalSubmit}
        pixel={editingPixel}
      />
    </AppLayout>
  )
}

