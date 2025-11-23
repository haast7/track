import { Funnel, Pixel, TelegramChannel, Domain } from '@/types'

export function generateTrackingScript(
  funnelId: string,
  domain: Domain,
  urls: string[]
): string {
  const baseUrl = import.meta.env.VITE_FUNCTIONS_URL || 'https://your-region-your-project.cloudfunctions.net'
  
  const script = `
(function() {
  const funnelId = '${funnelId}';
  const baseUrl = '${baseUrl}';
  const currentUrl = window.location.href;
  const allowedUrls = ${JSON.stringify(urls)};
  
  // Verificar se a URL atual está nas URLs permitidas
  const isAllowedUrl = allowedUrls.some(url => currentUrl.includes(url));
  if (!isAllowedUrl) return;
  
  // Track pageview automaticamente no load
  fetch(baseUrl + '/trackPageview', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ funnelId, url: currentUrl })
  }).catch(console.error);
  
  // Track clicks em elementos com class="telegram-button"
  document.addEventListener('click', function(e) {
    const target = e.target.closest('.telegram-button');
    if (target) {
      fetch(baseUrl + '/trackClick', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ funnelId, url: currentUrl })
      }).catch(console.error);
    }
  });
})();
`.trim()

  return script
}

export async function generateTelegramLink(
  channel: TelegramChannel,
  requiresApproval: boolean
): Promise<string> {
  try {
    const response = await fetch(
      `https://api.telegram.org/bot${channel.botToken}/createChatInviteLink`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: channel.groupId,
          creates_join_request: requiresApproval,
        }),
      }
    )

    if (!response.ok) {
      throw new Error('Erro ao criar link do Telegram')
    }

    const data = await response.json()
    return data.result.invite_link
  } catch (error) {
    console.error('Erro ao gerar link do Telegram:', error)
    throw error
  }
}


