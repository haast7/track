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
import { Pixel } from '@/types'

const pixelSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  pixelId: z.string().min(1, 'Pixel ID é obrigatório'),
  accessToken: z.string().optional(), // Opcional - necessário apenas para Conversion API
})

type PixelFormData = z.infer<typeof pixelSchema>

interface PixelFormModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: PixelFormData) => Promise<void>
  pixel?: Pixel | null
}

export default function PixelFormModal({
  open,
  onOpenChange,
  onSubmit,
  pixel,
}: PixelFormModalProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<PixelFormData>({
    resolver: zodResolver(pixelSchema),
    defaultValues: pixel
      ? {
          name: pixel.name,
          pixelId: pixel.pixelId,
          accessToken: pixel.accessToken,
        }
      : undefined,
  })

  const handleFormSubmit = async (data: PixelFormData) => {
    await onSubmit(data)
    reset()
    onOpenChange(false)
  }

  const handleCancel = () => {
    reset()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{pixel ? 'Editar Pixel' : 'Novo Pixel'}</DialogTitle>
          <DialogDescription>
            {pixel
              ? 'Atualize as informações do pixel do Meta'
              : 'Adicione um novo pixel do Meta para rastreamento'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome</Label>
            <Input
              id="name"
              {...register('name')}
              placeholder="Ex: Pixel Principal"
            />
            {errors.name && (
              <p className="text-sm text-red-500">{errors.name.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="pixelId">Pixel ID</Label>
            <Input
              id="pixelId"
              {...register('pixelId')}
              placeholder="Ex: 123456789012345"
            />
            {errors.pixelId && (
              <p className="text-sm text-red-500">{errors.pixelId.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="accessToken">Access Token</Label>
            <Input
              id="accessToken"
              type="password"
              {...register('accessToken')}
              placeholder="Seu access token do Meta (opcional)"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Opcional, mas recomendado. O Access Token habilita o envio de eventos 
              via Facebook Conversion API, melhorando a qualidade dos dados e 
              contornando bloqueadores de ads.{' '}
              <a
                href="https://business.facebook.com/settings/system-users"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:underline"
              >
                Obter Access Token
              </a>
            </p>
            {errors.accessToken && (
              <p className="text-sm text-red-500">
                {errors.accessToken.message}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleCancel}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Salvando...' : pixel ? 'Atualizar' : 'Criar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}


