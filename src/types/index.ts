// Tipos do projeto
export interface User {
  uid: string
  email: string | null
  displayName: string | null
}

export interface Pixel {
  id: string
  userId: string
  name: string
  pixelId: string
  accessToken: string
  isActive: boolean
  createdAt: Date
}

export interface TelegramChannel {
  id: string
  userId: string
  name: string
  botToken: string
  groupId: string
  isActive: boolean
  createdAt: Date
}

export interface Domain {
  id: string
  userId: string
  url: string
  createdAt: Date
}

export interface Funnel {
  id: string
  userId: string
  name: string
  pixelId: string
  channelId: string
  domainId: string
  urls: string[]
  requiresApproval: boolean
  trackingScript: string
  telegramLink: string
  isActive: boolean
  createdAt: Date
}

export interface TrackingData {
  funnelId: string
  pixelId: string
  userId: string
  pageviews: number
  clicks: number
  lastUpdated: Date
}

export interface Lead {
  id: string
  userId: string
  funnelId: string
  channelId: string
  telegramUserId: number
  username: string | null
  firstName: string | null
  lastName: string | null
  status: 'active' | 'exited'
  enteredAt: Date
  exitedAt: Date | null
}

export interface Postback {
  id: string
  userId: string
  name: string
  webhookUrl: string
  eventType: 'viewPage' | 'clickButton' | 'memberJoin' | 'memberLeft'
  funnelIds: string[] | null
  isActive: boolean
  stats: {
    sent: number
    failed: number
    lastSent: Date | null
  }
  createdAt: Date
}

export interface PostbackLog {
  id: string
  postbackId: string
  userId: string
  eventType: string
  status: 'success' | 'failed'
  payload: any
  response: any
  error: string | null
  createdAt: Date
}

