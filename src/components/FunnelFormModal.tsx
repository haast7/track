import { useState } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Funnel, Pixel, TelegramChannel, Domain } from '@/types'
import { Plus, X } from 'lucide-react'

const funnelSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  pixelId: z.string().min(1, 'Selecione um Pixel'),
  channelId: z.string().min(1, 'Selecione um Canal'),
  domainId: z.string().min(1, 'Selecione um Domínio'),
  urls: z
    .array(z.string().url('URL inválida'))
    .min(1, 'Adicione pelo menos uma URL'),
  requiresApproval: z.boolean(),
})

type FunnelFormData = z.infer<typeof funnelSchema>

interface FunnelFormModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: FunnelFormData) => Promise<void>
  funnel?: Funnel | null
  pixels: Pixel[]
  channels: TelegramChannel[]
  domains: Domain[]
}

export default function FunnelFormModal({
  open,
  onOpenChange,
  onSubmit,
  funnel,
  pixels,
  channels,
  domains,
}: FunnelFormModalProps) {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
    reset,
    watch,
    setValue,
  } = useForm<FunnelFormData>({
    resolver: zodResolver(funnelSchema),
    defaultValues: funnel
      ? {
          name: funnel.name,
          pixelId: funnel.pixelId,
          channelId: funnel.channelId,
          domainId: funnel.domainId,
          urls: funnel.urls,
          requiresApproval: funnel.requiresApproval,
        }
      : {
          name: '',
          pixelId: '',
          channelId: '',
          domainId: '',
          urls: [''],
          requiresApproval: false,
        },
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'urls',
  })

  const requiresApproval = watch('requiresApproval')

  const handleFormSubmit = async (data: FunnelFormData) => {
    await onSubmit(data)
    reset()
    onOpenChange(false)
  }

  const handleCancel = () => {
    reset()
    onOpenChange(false)
  }

  const addUrl = () => {
    append('')
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {funnel ? 'Editar Funil' : 'Novo Funil'}
          </DialogTitle>
          <DialogDescription>
            {funnel
              ? 'Atualize as informações do funil'
              : 'Configure um novo funil de captura'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome do Funil</Label>
            <Input
              id="name"
              {...register('name')}
              placeholder="Ex: Funil Principal"
            />
            {errors.name && (
              <p className="text-sm text-red-500">{errors.name.message}</p>
            )}
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="pixelId">Pixel</Label>
              <Select
                value={watch('pixelId') || ''}
                onValueChange={(value) => setValue('pixelId', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {pixels.map((pixel) => (
                    <SelectItem key={pixel.id} value={pixel.id}>
                      {pixel.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.pixelId && (
                <p className="text-sm text-red-500">{errors.pixelId.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="channelId">Canal</Label>
              <Select
                value={watch('channelId') || ''}
                onValueChange={(value) => setValue('channelId', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {channels.map((channel) => (
                    <SelectItem key={channel.id} value={channel.id}>
                      {channel.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.channelId && (
                <p className="text-sm text-red-500">
                  {errors.channelId.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="domainId">Domínio</Label>
              <Select
                value={watch('domainId') || ''}
                onValueChange={(value) => setValue('domainId', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {domains.map((domain) => (
                    <SelectItem key={domain.id} value={domain.id}>
                      {domain.url}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.domainId && (
                <p className="text-sm text-red-500">{errors.domainId.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>URLs</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addUrl}
              >
                <Plus className="h-4 w-4 mr-2" />
                Adicionar URL
              </Button>
            </div>
            {fields.map((field, index) => (
              <div key={field.id} className="flex gap-2">
                <Input
                  {...register(`urls.${index}` as const)}
                  placeholder="https://exemplo.com/pagina"
                />
                {fields.length > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => remove(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
            {errors.urls && (
              <p className="text-sm text-red-500">{errors.urls.message}</p>
            )}
          </div>

          <div className="flex items-center justify-between space-x-2 p-4 border rounded-lg">
            <div className="space-y-0.5">
              <Label htmlFor="requiresApproval">
                Requer aprovação para entrar
              </Label>
              <p className="text-xs text-muted-foreground">
                Usuários precisarão solicitar entrada no grupo
              </p>
            </div>
            <Switch
              id="requiresApproval"
              checked={requiresApproval}
              onCheckedChange={(checked) =>
                setValue('requiresApproval', checked)
              }
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleCancel}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Salvando...' : funnel ? 'Atualizar' : 'Criar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}


