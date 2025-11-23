import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { TelegramChannel } from '@/types'
import { Loader2, CheckCircle2, XCircle } from 'lucide-react'

const channelSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  botToken: z.string().min(1, 'Bot Token é obrigatório'),
  groupId: z.string().min(1, 'Group ID é obrigatório'),
})

type ChannelFormData = z.infer<typeof channelSchema>

interface ChannelFormModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: ChannelFormData) => Promise<void>
  channel?: TelegramChannel | null
}

async function validateBotToken(botToken: string): Promise<boolean> {
  try {
    const response = await fetch(`https://api.telegram.org/bot${botToken}/getMe`)
    return response.ok
  } catch {
    return false
  }
}

export default function ChannelFormModal({
  open,
  onOpenChange,
  onSubmit,
  channel,
}: ChannelFormModalProps) {
  const [validatingToken, setValidatingToken] = useState(false)
  const [tokenValid, setTokenValid] = useState<boolean | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    watch,
  } = useForm<ChannelFormData>({
    resolver: zodResolver(channelSchema),
    defaultValues: channel
      ? {
          name: channel.name,
          botToken: channel.botToken,
          groupId: channel.groupId,
        }
      : undefined,
  })

  const botToken = watch('botToken')

  const handleValidateToken = async () => {
    if (!botToken || botToken.length < 10) {
      setTokenValid(false)
      return
    }

    setValidatingToken(true)
    const isValid = await validateBotToken(botToken)
    setTokenValid(isValid)
    setValidatingToken(false)
  }

  const handleFormSubmit = async (data: ChannelFormData) => {
    await onSubmit(data)
    reset()
    setTokenValid(null)
    onOpenChange(false)
  }

  const handleCancel = () => {
    reset()
    setTokenValid(null)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {channel ? 'Editar Canal' : 'Novo Canal'}
          </DialogTitle>
          <DialogDescription>
            {channel
              ? 'Atualize as informações do canal do Telegram'
              : 'Configure um novo canal do Telegram para captura de leads'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome</Label>
            <Input
              id="name"
              {...register('name')}
              placeholder="Ex: Canal Principal"
            />
            {errors.name && (
              <p className="text-sm text-red-500">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="botToken">Bot Token</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleValidateToken}
                disabled={validatingToken || !botToken}
              >
                {validatingToken ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Validando...
                  </>
                ) : (
                  'Validar Token'
                )}
              </Button>
            </div>
            <Input
              id="botToken"
              {...register('botToken')}
              placeholder="123456789:ABCdefGHIjklMNOpqrsTUVwxyz"
            />
            {errors.botToken && (
              <p className="text-sm text-red-500">
                {errors.botToken.message}
              </p>
            )}
            {tokenValid !== null && (
              <div
                className={`flex items-center gap-2 text-sm ${
                  tokenValid ? 'text-green-500' : 'text-red-500'
                }`}
              >
                {tokenValid ? (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Token válido</span>
                  </>
                ) : (
                  <>
                    <XCircle className="h-4 w-4" />
                    <span>Token inválido</span>
                  </>
                )}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="groupId">Group ID</Label>
            <Input
              id="groupId"
              {...register('groupId')}
              placeholder="Ex: -1001234567890"
            />
            {errors.groupId && (
              <p className="text-sm text-red-500">{errors.groupId.message}</p>
            )}
            <p className="text-xs text-muted-foreground">
              O ID do grupo onde o bot será usado
            </p>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleCancel}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Salvando...' : channel ? 'Atualizar' : 'Criar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}


