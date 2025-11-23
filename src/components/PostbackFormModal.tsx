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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Checkbox } from '@/components/ui/checkbox'
import { Postback, Funnel } from '@/types'

const postbackSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  webhookUrl: z.string().url('URL inválida'),
  eventType: z.enum(['viewPage', 'clickButton', 'memberJoin', 'memberLeft']),
  funnelIds: z.array(z.string()).nullable(),
  isActive: z.boolean(),
})

type PostbackFormData = z.infer<typeof postbackSchema>

interface PostbackFormModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: PostbackFormData) => Promise<void>
  postback?: Postback | null
  funnels: Funnel[]
}

export default function PostbackFormModal({
  open,
  onOpenChange,
  onSubmit,
  postback,
  funnels,
}: PostbackFormModalProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    watch,
    setValue,
  } = useForm<PostbackFormData>({
    resolver: zodResolver(postbackSchema),
    defaultValues: postback
      ? {
          name: postback.name,
          webhookUrl: postback.webhookUrl,
          eventType: postback.eventType,
          funnelIds: postback.funnelIds,
          isActive: postback.isActive,
        }
      : {
          funnelIds: null,
          isActive: true,
        },
  })

  const selectedFunnelIds = watch('funnelIds')
  const selectAll = selectedFunnelIds === null

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setValue('funnelIds', null)
    } else {
      setValue('funnelIds', [])
    }
  }

  const handleFunnelToggle = (funnelId: string, checked: boolean) => {
    const current = selectedFunnelIds || []
    if (checked) {
      setValue('funnelIds', [...current, funnelId])
    } else {
      setValue(
        'funnelIds',
        current.filter((id) => id !== funnelId)
      )
    }
  }

  const handleFormSubmit = async (data: PostbackFormData) => {
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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {postback ? 'Editar Postback' : 'Novo Postback'}
          </DialogTitle>
          <DialogDescription>
            {postback
              ? 'Atualize as configurações do postback'
              : 'Configure um novo postback para receber eventos'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome</Label>
            <Input
              id="name"
              {...register('name')}
              placeholder="Ex: Postback Principal"
            />
            {errors.name && (
              <p className="text-sm text-red-500">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="webhookUrl">Webhook URL</Label>
            <Input
              id="webhookUrl"
              type="url"
              {...register('webhookUrl')}
              placeholder="https://exemplo.com/webhook"
            />
            {errors.webhookUrl && (
              <p className="text-sm text-red-500">
                {errors.webhookUrl.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="eventType">Tipo de Evento</Label>
            <Select
              value={watch('eventType')}
              onValueChange={(value) =>
                setValue('eventType', value as PostbackFormData['eventType'])
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="viewPage">View Page</SelectItem>
                <SelectItem value="clickButton">Click Button</SelectItem>
                <SelectItem value="memberJoin">Member Join</SelectItem>
                <SelectItem value="memberLeft">Member Left</SelectItem>
              </SelectContent>
            </Select>
            {errors.eventType && (
              <p className="text-sm text-red-500">
                {errors.eventType.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Funis</Label>
            <div className="p-4 border rounded-lg space-y-3 max-h-48 overflow-y-auto">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="select-all"
                  checked={selectAll}
                  onCheckedChange={handleSelectAll}
                />
                <label
                  htmlFor="select-all"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Todos os funis
                </label>
              </div>
              {funnels.map((funnel) => {
                const isChecked =
                  selectAll || (selectedFunnelIds || []).includes(funnel.id)
                return (
                  <div key={funnel.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={funnel.id}
                      checked={isChecked}
                      onCheckedChange={(checked) => {
                        if (selectAll) {
                          // Se "Todos" está marcado, desmarcar e selecionar apenas este
                          setValue('funnelIds', [funnel.id])
                        } else {
                          handleFunnelToggle(funnel.id, checked as boolean)
                        }
                      }}
                    />
                    <label
                      htmlFor={funnel.id}
                      className="text-sm leading-none cursor-pointer"
                    >
                      {funnel.name}
                    </label>
                  </div>
                )
              })}
            </div>
            {funnels.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Nenhum funil cadastrado
              </p>
            )}
          </div>

          <div className="flex items-center justify-between space-x-2 p-4 border rounded-lg">
            <div className="space-y-0.5">
              <Label htmlFor="isActive">Ativo</Label>
              <p className="text-xs text-muted-foreground">
                Postback receberá eventos quando ativo
              </p>
            </div>
            <Switch
              id="isActive"
              checked={watch('isActive')}
              onCheckedChange={(checked) => setValue('isActive', checked)}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleCancel}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Salvando...' : postback ? 'Atualizar' : 'Criar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

