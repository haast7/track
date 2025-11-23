import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'
import axios, { AxiosError } from 'axios'

const db = admin.firestore()
const FieldValue = admin.firestore.FieldValue

/**
 * Helper: sendWebhook
 * Envia webhook com retry e timeout
 */
async function sendWebhook(
  url: string,
  payload: any
): Promise<{ success: boolean; response?: any; error?: string }> {
  const maxRetries = 3
  const timeout = 5000 // 5 segundos

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await axios.post(url, payload, {
        timeout,
        headers: {
          'Content-Type': 'application/json',
        },
      })

      return {
        success: true,
        response: {
          status: response.status,
          data: response.data,
        },
      }
    } catch (error) {
      const isLastAttempt = attempt === maxRetries
      const axiosError = error as AxiosError

      if (isLastAttempt) {
        return {
          success: false,
          error:
            axiosError.response?.status
              ? `HTTP ${axiosError.response.status}: ${axiosError.message}`
              : axiosError.message || 'Unknown error',
        }
      }

      // Aguardar antes de tentar novamente (exponential backoff)
      await new Promise((resolve) => setTimeout(resolve, attempt * 1000))
    }
  }

  return {
    success: false,
    error: 'Max retries exceeded',
  }
}

/**
 * Helper: registrar log de postback
 */
async function logPostback(
  postbackId: string,
  userId: string,
  eventType: string,
  status: 'success' | 'failed',
  payload: any,
  response?: any,
  error?: string
): Promise<void> {
  try {
    await db.collection('postback_logs').add({
      postbackId,
      userId,
      eventType,
      status,
      payload,
      response: response || null,
      error: error || null,
      createdAt: FieldValue.serverTimestamp(),
    })
  } catch (error) {
    console.error('Error logging postback:', error)
  }
}

/**
 * Helper: buscar postbacks ativos
 */
async function getActivePostbacks(
  eventType: string,
  funnelId?: string
): Promise<
  Array<{
    id: string
    userId: string
    webhookUrl: string
    funnelIds: string[] | null
  }>
> {
  try {
    const postbacksSnapshot = await db
      .collection('postbacks')
      .where('eventType', '==', eventType)
      .where('isActive', '==', true)
      .get()

    const postbacks: Array<{
      id: string
      userId: string
      webhookUrl: string
      funnelIds: string[] | null
    }> = []

    postbacksSnapshot.forEach((doc) => {
      const data = doc.data()
      const postbackFunnelIds = data.funnelIds

      // Se funnelIds é null, envia para todos
      // Se funnelIds é array, verifica se contém o funnelId
      if (
        postbackFunnelIds === null ||
        (funnelId && postbackFunnelIds?.includes(funnelId))
      ) {
        postbacks.push({
          id: doc.id,
          userId: data.userId,
          webhookUrl: data.webhookUrl,
          funnelIds: postbackFunnelIds,
        })
      }
    })

    return postbacks
  } catch (error) {
    console.error('Error getting active postbacks:', error)
    return []
  }
}

/**
 * Firestore Trigger: sendPostbackPageview
 * Dispara quando tracking é atualizado
 */
export const sendPostbackPageview = functions.firestore
  .document('tracking/{funnelId}/daily/{date}')
  .onUpdate(async (change, context) => {
    try {
      const after = change.after.data()
      const before = change.before.data()
      const funnelId = context.params.funnelId

      // Verificar se pageviews foi incrementado
      const pageviewsAfter = after.pageviews || 0
      const pageviewsBefore = before.pageviews || 0

      if (pageviewsAfter <= pageviewsBefore) {
        // Não houve incremento, não enviar postback
        return null
      }

      // Buscar postbacks ativos para viewPage
      const postbacks = await getActivePostbacks('viewPage', funnelId)

      if (postbacks.length === 0) {
        return null
      }

      // Preparar payload
      const payload = {
        event: 'viewPage',
        funnelId,
        pageviews: pageviewsAfter,
        timestamp: new Date().toISOString(),
      }

      // Enviar para cada postback
      const promises = postbacks.map(async (postback) => {
        const result = await sendWebhook(postback.webhookUrl, payload)

        // Registrar log
        await logPostback(
          postback.id,
          postback.userId,
          'viewPage',
          result.success ? 'success' : 'failed',
          payload,
          result.response,
          result.error
        )

        // Atualizar estatísticas do postback
        if (result.success) {
          await db
            .collection('postbacks')
            .doc(postback.id)
            .update({
              'stats.sent': FieldValue.increment(1),
              'stats.lastSent': FieldValue.serverTimestamp(),
            })
        } else {
          await db
            .collection('postbacks')
            .doc(postback.id)
            .update({
              'stats.failed': FieldValue.increment(1),
            })
        }
      })

      await Promise.all(promises)

      return null
    } catch (error) {
      console.error('Error in sendPostbackPageview:', error)
      return null
    }
  })

/**
 * Firestore Trigger: sendPostbackClick
 * Dispara quando tracking é atualizado (clicks)
 */
export const sendPostbackClick = functions.firestore
  .document('tracking/{funnelId}/daily/{date}')
  .onUpdate(async (change, context) => {
    try {
      const after = change.after.data()
      const before = change.before.data()
      const funnelId = context.params.funnelId

      // Verificar se clicks foi incrementado
      const clicksAfter = after.clicks || 0
      const clicksBefore = before.clicks || 0

      if (clicksAfter <= clicksBefore) {
        // Não houve incremento, não enviar postback
        return null
      }

      // Buscar postbacks ativos para clickButton
      const postbacks = await getActivePostbacks('clickButton', funnelId)

      if (postbacks.length === 0) {
        return null
      }

      // Preparar payload
      const payload = {
        event: 'clickButton',
        funnelId,
        clicks: clicksAfter,
        timestamp: new Date().toISOString(),
      }

      // Enviar para cada postback
      const promises = postbacks.map(async (postback) => {
        const result = await sendWebhook(postback.webhookUrl, payload)

        // Registrar log
        await logPostback(
          postback.id,
          postback.userId,
          'clickButton',
          result.success ? 'success' : 'failed',
          payload,
          result.response,
          result.error
        )

        // Atualizar estatísticas do postback
        if (result.success) {
          await db
            .collection('postbacks')
            .doc(postback.id)
            .update({
              'stats.sent': FieldValue.increment(1),
              'stats.lastSent': FieldValue.serverTimestamp(),
            })
        } else {
          await db
            .collection('postbacks')
            .doc(postback.id)
            .update({
              'stats.failed': FieldValue.increment(1),
            })
        }
      })

      await Promise.all(promises)

      return null
    } catch (error) {
      console.error('Error in sendPostbackClick:', error)
      return null
    }
  })

/**
 * Firestore Trigger: sendPostbackJoin
 * Dispara quando um lead é criado
 */
export const sendPostbackJoin = functions.firestore
  .document('leads/{leadId}')
  .onCreate(async (snap, context) => {
    try {
      const leadData = snap.data()
      const leadId = context.params.leadId

      if (!leadData || leadData.status !== 'active') {
        return null
      }

      const funnelId = leadData.funnelId

      // Buscar postbacks ativos para memberJoin
      const postbacks = await getActivePostbacks('memberJoin', funnelId)

      if (postbacks.length === 0) {
        return null
      }

      // Preparar payload
      const payload = {
        event: 'memberJoin',
        lead: {
          id: leadId,
          userId: leadData.userId,
          funnelId: leadData.funnelId,
          channelId: leadData.channelId,
          telegramUserId: leadData.telegramUserId,
          username: leadData.username,
          firstName: leadData.firstName,
          lastName: leadData.lastName,
          status: leadData.status,
          enteredAt: leadData.enteredAt,
        },
        timestamp: new Date().toISOString(),
      }

      // Enviar para cada postback
      const promises = postbacks.map(async (postback) => {
        const result = await sendWebhook(postback.webhookUrl, payload)

        // Registrar log
        await logPostback(
          postback.id,
          postback.userId,
          'memberJoin',
          result.success ? 'success' : 'failed',
          payload,
          result.response,
          result.error
        )

        // Atualizar estatísticas do postback
        if (result.success) {
          await db
            .collection('postbacks')
            .doc(postback.id)
            .update({
              'stats.sent': FieldValue.increment(1),
              'stats.lastSent': FieldValue.serverTimestamp(),
            })
        } else {
          await db
            .collection('postbacks')
            .doc(postback.id)
            .update({
              'stats.failed': FieldValue.increment(1),
            })
        }
      })

      await Promise.all(promises)

      return null
    } catch (error) {
      console.error('Error in sendPostbackJoin:', error)
      return null
    }
  })

/**
 * Firestore Trigger: sendPostbackLeft
 * Dispara quando um lead é atualizado (status para 'exited')
 */
export const sendPostbackLeft = functions.firestore
  .document('leads/{leadId}')
  .onUpdate(async (change, context) => {
    try {
      const after = change.after.data()
      const before = change.before.data()

      // Verificar se status mudou para 'exited'
      if (after.status !== 'exited' || before.status === 'exited') {
        return null
      }

      const leadId = context.params.leadId
      const funnelId = after.funnelId

      // Buscar postbacks ativos para memberLeft
      const postbacks = await getActivePostbacks('memberLeft', funnelId)

      if (postbacks.length === 0) {
        return null
      }

      // Preparar payload
      const payload = {
        event: 'memberLeft',
        lead: {
          id: leadId,
          userId: after.userId,
          funnelId: after.funnelId,
          channelId: after.channelId,
          telegramUserId: after.telegramUserId,
          username: after.username,
          firstName: after.firstName,
          lastName: after.lastName,
          status: after.status,
          enteredAt: after.enteredAt,
          exitedAt: after.exitedAt,
        },
        timestamp: new Date().toISOString(),
      }

      // Enviar para cada postback
      const promises = postbacks.map(async (postback) => {
        const result = await sendWebhook(postback.webhookUrl, payload)

        // Registrar log
        await logPostback(
          postback.id,
          postback.userId,
          'memberLeft',
          result.success ? 'success' : 'failed',
          payload,
          result.response,
          result.error
        )

        // Atualizar estatísticas do postback
        if (result.success) {
          await db
            .collection('postbacks')
            .doc(postback.id)
            .update({
              'stats.sent': FieldValue.increment(1),
              'stats.lastSent': FieldValue.serverTimestamp(),
            })
        } else {
          await db
            .collection('postbacks')
            .doc(postback.id)
            .update({
              'stats.failed': FieldValue.increment(1),
            })
        }
      })

      await Promise.all(promises)

      return null
    } catch (error) {
      console.error('Error in sendPostbackLeft:', error)
      return null
    }
  })


