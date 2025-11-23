import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Copy, Check } from 'lucide-react'
import { useState } from 'react'

interface FunnelTutorialModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  trackingScript: string
  telegramLink: string
}

export default function FunnelTutorialModal({
  open,
  onOpenChange,
  trackingScript,
  telegramLink,
}: FunnelTutorialModalProps) {
  const [copiedScript, setCopiedScript] = useState(false)
  const [copiedLink, setCopiedLink] = useState(false)

  const copyToClipboard = async (text: string, type: 'script' | 'link') => {
    try {
      await navigator.clipboard.writeText(text)
      if (type === 'script') {
        setCopiedScript(true)
        setTimeout(() => setCopiedScript(false), 2000)
      } else {
        setCopiedLink(true)
        setTimeout(() => setCopiedLink(false), 2000)
      }
    } catch (error) {
      console.error('Erro ao copiar:', error)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Tutorial de Implementação</DialogTitle>
          <DialogDescription>
            Siga os passos abaixo para implementar o funil no seu site
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Tracking Script */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-foreground">
                1. Tracking Script
              </h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(trackingScript, 'script')}
              >
                {copiedScript ? (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Copiado!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-2" />
                    Copiar
                  </>
                )}
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Cole este script antes do fechamento da tag &lt;/body&gt; em todas
              as páginas do funil:
            </p>
            <pre className="p-4 bg-muted rounded-lg overflow-x-auto text-xs">
              <code>{trackingScript}</code>
            </pre>
            <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <p className="text-sm text-blue-500">
                <strong>Dica:</strong> Adicione a classe{' '}
                <code className="bg-background px-1 rounded">
                  telegram-button
                </code>{' '}
                aos botões/elementos que devem rastrear cliques para o Telegram.
              </p>
            </div>
          </div>

          {/* Telegram Link */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-foreground">
                2. Link do Telegram
              </h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(telegramLink, 'link')}
              >
                {copiedLink ? (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Copiado!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-2" />
                    Copiar
                  </>
                )}
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Use este link nos botões/elementos com a classe{' '}
              <code className="bg-muted px-1 rounded">telegram-button</code>:
            </p>
            <div className="p-4 bg-muted rounded-lg break-all">
              <code className="text-sm">{telegramLink}</code>
            </div>
            <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
              <p className="text-sm text-green-500">
                <strong>Exemplo:</strong>
              </p>
              <pre className="mt-2 text-xs bg-background p-2 rounded">
                <code>
                  {`<a href="${telegramLink}" class="telegram-button">
  Entrar no Grupo
</a>`}
                </code>
              </pre>
            </div>
          </div>

          {/* Instruções */}
          <div className="space-y-2">
            <h3 className="font-semibold text-foreground">
              3. Instruções de Implementação
            </h3>
            <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
              <li>
                Cole o tracking script no final do HTML de todas as páginas do
                funil
              </li>
              <li>
                Adicione o link do Telegram nos botões/elementos que devem
                redirecionar para o grupo
              </li>
              <li>
                Certifique-se de adicionar a classe{' '}
                <code className="bg-muted px-1 rounded">telegram-button</code> aos
                elementos clicáveis
              </li>
              <li>
                O script rastreará automaticamente as visualizações de página e
                os cliques nos elementos marcados
              </li>
            </ol>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>Entendi</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}


