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
import { Domain } from '@/types'

const domainSchema = z.object({
  url: z
    .string()
    .min(1, 'URL é obrigatória')
    .refine(
      (url) => {
        try {
          const urlObj = new URL(url)
          return urlObj.protocol === 'http:' || urlObj.protocol === 'https:'
        } catch {
          return false
        }
      },
      {
        message: 'URL deve começar com http:// ou https://',
      }
    ),
})

type DomainFormData = z.infer<typeof domainSchema>

interface DomainFormModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: DomainFormData) => Promise<void>
  domain?: Domain | null
}

export default function DomainFormModal({
  open,
  onOpenChange,
  onSubmit,
  domain,
}: DomainFormModalProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<DomainFormData>({
    resolver: zodResolver(domainSchema),
    defaultValues: domain
      ? {
          url: domain.url,
        }
      : undefined,
  })

  const handleFormSubmit = async (data: DomainFormData) => {
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
          <DialogTitle>
            {domain ? 'Editar Domínio' : 'Novo Domínio'}
          </DialogTitle>
          <DialogDescription>
            {domain
              ? 'Atualize a URL do domínio'
              : 'Adicione um novo domínio para rastreamento'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="url">URL</Label>
            <Input
              id="url"
              type="url"
              {...register('url')}
              placeholder="https://exemplo.com"
            />
            {errors.url && (
              <p className="text-sm text-red-500">{errors.url.message}</p>
            )}
            <p className="text-xs text-muted-foreground">
              A URL deve começar com http:// ou https://
            </p>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleCancel}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Salvando...' : domain ? 'Atualizar' : 'Criar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}


