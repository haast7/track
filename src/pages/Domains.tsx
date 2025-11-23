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
import { Domain } from '@/types'
import AppLayout from '@/components/AppLayout'
import { Button } from '@/components/ui/button'
import DomainFormModal from '@/components/DomainFormModal'
import { Plus, Edit, Trash2, Globe } from 'lucide-react'

export default function Domains() {
  const { user } = useAuth()
  const [domains, setDomains] = useState<Domain[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingDomain, setEditingDomain] = useState<Domain | null>(null)

  useEffect(() => {
    if (!user) return

    const q = query(
      collection(db, 'domains'),
      where('userId', '==', user.uid)
    )

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
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
        setLoading(false)
      },
      (error) => {
        console.error('Erro ao buscar domínios:', error)
        setLoading(false)
      }
    )

    return () => unsubscribe()
  }, [user])

  const handleCreate = async (data: { url: string }) => {
    if (!user) return

    await addDoc(collection(db, 'domains'), {
      userId: user.uid,
      url: data.url,
      createdAt: serverTimestamp(),
    })
  }

  const handleUpdate = async (data: { url: string }) => {
    if (!editingDomain) return

    await updateDoc(doc(db, 'domains', editingDomain.id), {
      url: data.url,
    })
    setEditingDomain(null)
  }

  const handleDelete = async (domainId: string) => {
    if (!confirm('Tem certeza que deseja excluir este domínio?')) return

    await deleteDoc(doc(db, 'domains', domainId))
  }

  const openCreateModal = () => {
    setEditingDomain(null)
    setModalOpen(true)
  }

  const openEditModal = (domain: Domain) => {
    setEditingDomain(domain)
    setModalOpen(true)
  }

  const handleModalSubmit = async (data: { url: string }) => {
    if (editingDomain) {
      await handleUpdate(data)
    } else {
      await handleCreate(data)
    }
  }

  if (loading) {
    return (
      <AppLayout title="Domínios">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-muted-foreground">Carregando...</div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout title="Domínios">
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold text-foreground">
            Gerenciar Domínios
          </h2>
          <Button onClick={openCreateModal}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Domínio
          </Button>
        </div>

        {domains.length === 0 ? (
          <div className="p-8 text-center border rounded-lg bg-card">
            <Globe className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">
              Nenhum domínio cadastrado. Clique em "Novo Domínio" para começar.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {domains.map((domain) => (
              <div
                key={domain.id}
                className="p-6 border rounded-lg bg-card space-y-4"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Globe className="h-5 w-5 text-primary" />
                      <h3 className="text-lg font-semibold text-foreground break-all">
                        {domain.url}
                      </h3>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Criado em:{' '}
                      {new Date(domain.createdAt).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2 pt-2 border-t border-border">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEditModal(domain)}
                    className="flex-1"
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    Editar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(domain.id)}
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

      <DomainFormModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onSubmit={handleModalSubmit}
        domain={editingDomain}
      />
    </AppLayout>
  )
}


