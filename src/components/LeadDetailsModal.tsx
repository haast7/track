import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Lead, Funnel } from '@/types'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { User } from 'lucide-react'

interface LeadDetailsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  lead: Lead | null
  funnel: Funnel | null
}

export default function LeadDetailsModal({
  open,
  onOpenChange,
  lead,
  funnel,
}: LeadDetailsModalProps) {
  if (!lead) return null

  const getInitials = () => {
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

  const getFullName = () => {
    if (lead.firstName && lead.lastName) {
      return `${lead.firstName} ${lead.lastName}`
    }
    if (lead.firstName) {
      return lead.firstName
    }
    return 'Sem nome'
  }

  const getTimeInGroup = () => {
    if (!lead.exitedAt) {
      const now = new Date()
      const diff = now.getTime() - lead.enteredAt.getTime()
      const days = Math.floor(diff / (1000 * 60 * 60 * 24))
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      return `${days}d ${hours}h`
    }
    const diff = lead.exitedAt.getTime() - lead.enteredAt.getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    return `${days}d ${hours}h`
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Detalhes do Lead</DialogTitle>
          <DialogDescription>
            Informações completas do lead capturado
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Avatar e Nome */}
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarFallback>
                <User className="h-8 w-8" />
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="text-xl font-semibold text-foreground">
                {getFullName()}
              </h3>
              {lead.username && (
                <p className="text-sm text-muted-foreground">@{lead.username}</p>
              )}
            </div>
          </div>

          {/* Informações */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Status</p>
              <p
                className={`text-sm font-semibold ${
                  lead.status === 'active' ? 'text-green-500' : 'text-red-500'
                }`}
              >
                {lead.status === 'active' ? 'Ativo' : 'Saiu'}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Funil</p>
              <p className="text-sm text-foreground">
                {funnel?.name || 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Telegram User ID
              </p>
              <p className="text-sm text-foreground">{lead.telegramUserId}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Tempo no Grupo
              </p>
              <p className="text-sm text-foreground">{getTimeInGroup()}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Data de Entrada
              </p>
              <p className="text-sm text-foreground">
                {lead.enteredAt.toLocaleString('pt-BR')}
              </p>
            </div>
            {lead.exitedAt && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Data de Saída
                </p>
                <p className="text-sm text-foreground">
                  {lead.exitedAt.toLocaleString('pt-BR')}
                </p>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>Fechar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}


