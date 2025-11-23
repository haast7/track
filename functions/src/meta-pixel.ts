import axios, { AxiosError } from 'axios'
import * as crypto from 'crypto'

/**
 * Interface para dados do evento Meta Pixel
 */
interface MetaPixelEventData {
  event_name: string
  event_time: number
  action_source: 'website' | 'app' | 'email' | 'chat'
  event_source_url?: string
  user_data?: {
    em?: string // email hashed
    ph?: string // phone hashed
    fn?: string // first name hashed
    ln?: string // last name hashed
    external_id?: string // telegram user id
  }
  custom_data?: {
    [key: string]: any
  }
}

/**
 * Hash SHA256 para dados sensíveis (Meta exige)
 */
function hashSHA256(value: string): string {
  return crypto.createHash('sha256').update(value.toLowerCase().trim()).digest('hex')
}

/**
 * Enviar evento para Meta Pixel via Conversion API
 *
 * @param pixelId - ID do pixel do Meta
 * @param accessToken - Access Token do Meta
 * @param eventData - Dados do evento
 * @returns Promise com resultado do envio
 */
export async function sendMetaPixelEvent(
  pixelId: string,
  accessToken: string,
  eventData: MetaPixelEventData
): Promise<{ success: boolean; response?: any; error?: string }> {
  try {
    // Validar parâmetros obrigatórios
    if (!pixelId || !accessToken) {
      return {
        success: false,
        error: 'Pixel ID and Access Token are required',
      }
    }

    // URL da API de Conversões do Meta
    const url = `https://graph.facebook.com/v18.0/${pixelId}/events`

    // Fazer requisição
    const response = await axios.post(
      url,
      {
        data: [eventData],
        access_token: accessToken,
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 10000, // 10 segundos
      }
    )

    // Verificar resposta
    if (response.data && response.data.events_received) {
      return {
        success: true,
        response: {
          events_received: response.data.events_received,
          messages: response.data.messages || [],
          fbtrace_id: response.data.fbtrace_id,
        },
      }
    }

    return {
      success: false,
      error: 'Invalid response from Meta API',
    }
  } catch (error) {
    const axiosError = error as AxiosError
    console.error('Error sending Meta Pixel event:', axiosError.message)

    return {
      success: false,
      error:
        axiosError.response?.data
          ? JSON.stringify(axiosError.response.data)
          : axiosError.message || 'Unknown error',
    }
  }
}

/**
 * Enviar evento ViewContent (Pageview)
 */
export async function sendViewContentEvent(
  pixelId: string,
  accessToken: string,
  url: string,
  funnelId: string
): Promise<{ success: boolean; response?: any; error?: string }> {
  const eventData: MetaPixelEventData = {
    event_name: 'ViewContent',
    event_time: Math.floor(Date.now() / 1000),
    action_source: 'website',
    event_source_url: url,
    custom_data: {
      content_name: 'Funnel Page',
      content_category: 'Tracking',
      funnel_id: funnelId,
    },
  }

  return sendMetaPixelEvent(pixelId, accessToken, eventData)
}

/**
 * Enviar evento personalizado ClickButton (Click)
 */
export async function sendClickButtonEvent(
  pixelId: string,
  accessToken: string,
  url: string,
  funnelId: string,
  buttonId?: string
): Promise<{ success: boolean; response?: any; error?: string }> {
  const eventData: MetaPixelEventData = {
    event_name: 'ClickButton',
    event_time: Math.floor(Date.now() / 1000),
    action_source: 'website',
    event_source_url: url,
    custom_data: {
      content_name: 'Telegram Button',
      content_category: 'Tracking',
      funnel_id: funnelId,
      button_id: buttonId || null,
    },
  }

  return sendMetaPixelEvent(pixelId, accessToken, eventData)
}

/**
 * Enviar evento personalizado EnterChannel (Join)
 * ESTE É O EVENTO PRINCIPAL QUE FALTAVA!
 */
export async function sendEnterChannelEvent(
  pixelId: string,
  accessToken: string,
  funnelId: string,
  leadData: {
    telegramUserId: number
    username?: string | null
    firstName?: string | null
    lastName?: string | null
  }
): Promise<{ success: boolean; response?: any; error?: string }> {
  const eventData: MetaPixelEventData = {
    event_name: 'EnterChannel',
    event_time: Math.floor(Date.now() / 1000),
    action_source: 'chat', // Telegram = chat
    user_data: {
      external_id: String(leadData.telegramUserId), // ID do usuário no Telegram
    },
    custom_data: {
      content_name: 'Telegram Channel Join',
      content_category: 'Conversion',
      funnel_id: funnelId,
      telegram_user_id: leadData.telegramUserId,
      telegram_username: leadData.username || null,
      telegram_first_name: leadData.firstName || null,
      telegram_last_name: leadData.lastName || null,
    },
  }

  // Adicionar hash do primeiro nome se disponível
  if (leadData.firstName) {
    eventData.user_data!.fn = hashSHA256(leadData.firstName)
  }

  // Adicionar hash do último nome se disponível
  if (leadData.lastName) {
    eventData.user_data!.ln = hashSHA256(leadData.lastName)
  }

  return sendMetaPixelEvent(pixelId, accessToken, eventData)
}

/**
 * Testar conexão com Meta Pixel
 * Envia evento de teste para verificar se credenciais estão corretas
 */
export async function testMetaPixelConnection(
  pixelId: string,
  accessToken: string
): Promise<{ success: boolean; response?: any; error?: string }> {
  const eventData: MetaPixelEventData = {
    event_name: 'PageView',
    event_time: Math.floor(Date.now() / 1000),
    action_source: 'website',
    event_source_url: 'https://test.example.com',
    custom_data: {
      test_event: true,
      test_event_code: 'TEST12345',
    },
  }

  return sendMetaPixelEvent(pixelId, accessToken, eventData)
}
