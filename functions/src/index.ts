import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'
import axios, { AxiosError } from 'axios'

admin.initializeApp()

const db = admin.firestore()
const FieldValue = admin.firestore.FieldValue

/**
 * Helper para configurar CORS
 */
function configureCORS(req: functions.Request, res: functions.Response) {
  res.set('Access-Control-Allow-Origin', '*')
  res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.set('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    res.status(204).send('')
    return true
  }
  return false
}

/**
 * Helper para obter a chave do dia atual no formato YYYY-MM-DD
 */
function getTodayKey(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Cloud Function: trackPageview
 * Recebe eventos de visualização de página e salva no Firestore
 */
export const trackPageview = functions.https.onRequest(
  async (req, res) => {
    // Configurar CORS
    if (configureCORS(req, res)) return

    try {
      // Validar método
      if (req.method !== 'POST') {
        res.status(405).json({ error: 'Method not allowed' })
        return
      }

      // Extrair dados do body
      const { funnelId, url, timestamp } = req.body

      // Validar dados obrigatórios
      if (!funnelId) {
        res.status(400).json({ error: 'funnelId is required' })
        return
      }

      // Buscar dados do funil
      const funnelDoc = await db.collection('funnels').doc(funnelId).get()

      if (!funnelDoc.exists) {
        res.status(404).json({ error: 'Funnel not found' })
        return
      }

      const funnelData = funnelDoc.data()
      if (!funnelData) {
        res.status(404).json({ error: 'Funnel data not found' })
        return
      }

      const userId = funnelData.userId
      const pixelId = funnelData.pixelId

      if (!userId || !pixelId) {
        res.status(400).json({ error: 'Funnel missing userId or pixelId' })
        return
      }

      // Obter chave do dia atual
      const todayKey = getTodayKey()

      // Referência do documento de tracking
      const trackingRef = db
        .collection('tracking')
        .doc(funnelId)
        .collection('daily')
        .doc(todayKey)

      // Atualizar ou criar documento com incremento
      await trackingRef.set(
        {
          funnelId,
          pixelId,
          userId,
          pageviews: FieldValue.increment(1),
          lastUpdated: FieldValue.serverTimestamp(),
        },
        { merge: true }
      )

      // Resposta de sucesso
      res.status(200).json({
        success: true,
        message: 'Pageview tracked',
        funnelId,
        date: todayKey,
      })
    } catch (error) {
      console.error('Error tracking pageview:', error)
      res.status(500).json({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }
)

/**
 * Cloud Function: trackClick
 * Recebe eventos de clique e salva no Firestore
 */
export const trackClick = functions.https.onRequest(async (req, res) => {
  // Configurar CORS
  if (configureCORS(req, res)) return

  try {
    // Validar método
    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method not allowed' })
      return
    }

    // Extrair dados do body
    const { funnelId, buttonId, url, timestamp } = req.body

    // Validar dados obrigatórios
    if (!funnelId) {
      res.status(400).json({ error: 'funnelId is required' })
      return
    }

    // Buscar dados do funil
    const funnelDoc = await db.collection('funnels').doc(funnelId).get()

    if (!funnelDoc.exists) {
      res.status(404).json({ error: 'Funnel not found' })
      return
    }

    const funnelData = funnelDoc.data()
    if (!funnelData) {
      res.status(404).json({ error: 'Funnel data not found' })
      return
    }

    const userId = funnelData.userId
    const pixelId = funnelData.pixelId

    if (!userId || !pixelId) {
      res.status(400).json({ error: 'Funnel missing userId or pixelId' })
      return
    }

    // Obter chave do dia atual
    const todayKey = getTodayKey()

    // Referência do documento de tracking
    const trackingRef = db
      .collection('tracking')
      .doc(funnelId)
      .collection('daily')
      .doc(todayKey)

    // Atualizar ou criar documento com incremento
    await trackingRef.set(
      {
        funnelId,
        pixelId,
        userId,
        clicks: FieldValue.increment(1),
        lastUpdated: FieldValue.serverTimestamp(),
      },
      { merge: true }
    )

    // Resposta de sucesso
    res.status(200).json({
      success: true,
      message: 'Click tracked',
      funnelId,
      date: todayKey,
      buttonId: buttonId || null,
    })
  } catch (error) {
    console.error('Error tracking click:', error)
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    })
  }
})

/**
 * Helper para buscar funil pelo groupId
 */
async function findFunnelByGroupId(
  groupId: string
): Promise<{ funnelId: string; channelId: string; userId: string } | null> {
  try {
    // Buscar canal pelo groupId
    const channelsSnapshot = await db
      .collection('channels')
      .where('groupId', '==', groupId)
      .limit(1)
      .get()

    if (channelsSnapshot.empty) {
      return null
    }

    const channelDoc = channelsSnapshot.docs[0]
    const channelData = channelDoc.data()
    const channelId = channelDoc.id

    // Buscar funil pelo channelId
    const funnelsSnapshot = await db
      .collection('funnels')
      .where('channelId', '==', channelId)
      .where('isActive', '==', true)
      .limit(1)
      .get()

    if (funnelsSnapshot.empty) {
      return null
    }

    const funnelDoc = funnelsSnapshot.docs[0]
    const funnelData = funnelDoc.data()

    return {
      funnelId: funnelDoc.id,
      channelId,
      userId: funnelData?.userId || '',
    }
  } catch (error) {
    console.error('Error finding funnel by groupId:', error)
    return null
  }
}

/**
 * Função: onMemberJoin
 * Detecta quando um novo membro entra no grupo
 */
async function onMemberJoin(
  groupId: string,
  member: {
    id: number
    username?: string
    first_name?: string
    last_name?: string
  },
  funnelId: string,
  channelId: string,
  userId: string
): Promise<void> {
  try {
    // Verificar se já existe um lead ativo para este usuário e funil
    const existingLeadsSnapshot = await db
      .collection('leads')
      .where('telegramUserId', '==', member.id)
      .where('funnelId', '==', funnelId)
      .where('status', '==', 'active')
      .limit(1)
      .get()

    // Se já existe um lead ativo, não criar duplicado
    if (!existingLeadsSnapshot.empty) {
      console.log(
        `Lead already exists for user ${member.id} in funnel ${funnelId}`
      )
      return
    }

    // Criar novo lead
    await db.collection('leads').add({
      userId,
      funnelId,
      channelId,
      telegramUserId: member.id,
      username: member.username || null,
      firstName: member.first_name || null,
      lastName: member.last_name || null,
      status: 'active',
      enteredAt: FieldValue.serverTimestamp(),
      exitedAt: null,
    })

    console.log(
      `Lead created for user ${member.id} (${member.username || 'no username'}) in funnel ${funnelId}`
    )
  } catch (error) {
    console.error('Error in onMemberJoin:', error)
    throw error
  }
}

/**
 * Função: onMemberLeft
 * Detecta quando um membro sai do grupo
 */
async function onMemberLeft(
  groupId: string,
  member: {
    id: number
    username?: string
    first_name?: string
    last_name?: string
  },
  funnelId: string
): Promise<void> {
  try {
    // Buscar lead ativo para este usuário e funil
    const leadsSnapshot = await db
      .collection('leads')
      .where('telegramUserId', '==', member.id)
      .where('funnelId', '==', funnelId)
      .where('status', '==', 'active')
      .limit(1)
      .get()

    if (leadsSnapshot.empty) {
      console.log(
        `No active lead found for user ${member.id} in funnel ${funnelId}`
      )
      return
    }

    // Atualizar lead existente
    const leadDoc = leadsSnapshot.docs[0]
    await leadDoc.ref.update({
      status: 'exited',
      exitedAt: FieldValue.serverTimestamp(),
    })

    console.log(
      `Lead updated to exited for user ${member.id} in funnel ${funnelId}`
    )
  } catch (error) {
    console.error('Error in onMemberLeft:', error)
    throw error
  }
}

/**
 * Cloud Function: telegramWebhook
 * Recebe updates do Telegram e processa eventos de chat_member
 */
export const telegramWebhook = functions.https.onRequest(
  async (req, res) => {
    try {
      // Validar método
      if (req.method !== 'POST') {
        res.status(405).json({ error: 'Method not allowed' })
        return
      }

      const update = req.body

      // Verificar se é um evento chat_member
      if (!update.chat_member) {
        // Se não for chat_member, retornar OK (pode ser outro tipo de update)
        res.status(200).json({ ok: true, message: 'Update received' })
        return
      }

      const chatMember = update.chat_member
      const chat = chatMember.chat
      const newMember = chatMember.new_chat_member
      const oldMember = chatMember.old_chat_member
      const from = chatMember.from

      // Validar dados necessários
      if (!chat || !newMember || !from) {
        res.status(400).json({ error: 'Invalid chat_member update' })
        return
      }

      const groupId = String(chat.id)
      const member = {
        id: from.id,
        username: from.username,
        first_name: from.first_name,
        last_name: from.last_name,
      }

      // Buscar funil pelo groupId
      const funnelInfo = await findFunnelByGroupId(groupId)

      if (!funnelInfo) {
        console.log(`No active funnel found for groupId: ${groupId}`)
        res.status(200).json({ ok: true, message: 'No funnel found' })
        return
      }

      const { funnelId, channelId, userId } = funnelInfo

      // Verificar status do novo membro
      const newStatus = newMember.status
      const oldStatus = oldMember?.status

      // Detectar entrada (novo membro)
      if (newStatus === 'member' && oldStatus !== 'member') {
        await onMemberJoin(groupId, member, funnelId, channelId, userId)
      }

      // Detectar saída
      if (newStatus === 'left' || newStatus === 'kicked') {
        await onMemberLeft(groupId, member, funnelId)
      }

      // Resposta de sucesso para o Telegram
      res.status(200).json({ ok: true })
    } catch (error) {
      console.error('Error processing telegram webhook:', error)
      res.status(500).json({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }
)

// Exportar funções de postback
export * from './postbacks'

