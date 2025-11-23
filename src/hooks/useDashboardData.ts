import { useState, useEffect } from 'react'
import {
  collection,
  query,
  where,
  onSnapshot,
  Timestamp,
  doc,
} from 'firebase/firestore'
import { db } from '@/lib/firebase/config'
import { useAuth } from './useAuth'
import { TrackingData, Lead, Funnel } from '@/types'

interface DailyTracking {
  date: string
  pageviews: number
  clicks: number
}

interface DailyLeads {
  date: string
  entries: number
  exits: number
}

export function useDashboardData(selectedFunnelId?: string, days: number = 30) {
  const { user } = useAuth()
  const [funnels, setFunnels] = useState<Funnel[]>([])
  const [trackingData, setTrackingData] = useState<DailyTracking[]>([])
  const [leadsData, setLeadsData] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)

  // Carregar funis
  useEffect(() => {
    if (!user) return

    const q = query(
      collection(db, 'funnels'),
      where('userId', '==', user.uid),
      where('isActive', '==', true)
    )

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const funnelsData: Funnel[] = []
      snapshot.forEach((doc) => {
        const data = doc.data()
        funnelsData.push({
          id: doc.id,
          userId: data.userId,
          name: data.name,
          pixelId: data.pixelId,
          channelId: data.channelId,
          domainId: data.domainId,
          urls: data.urls || [],
          requiresApproval: data.requiresApproval || false,
          trackingScript: data.trackingScript || '',
          telegramLink: data.telegramLink || '',
          isActive: data.isActive ?? true,
          createdAt: data.createdAt?.toDate() || new Date(),
        })
      })
      setFunnels(funnelsData)
    })

    return () => unsubscribe()
  }, [user])

  // Carregar dados de tracking
  useEffect(() => {
    if (!user || funnels.length === 0) {
      setLoading(false)
      return
    }

    const funnelIds = selectedFunnelId
      ? [selectedFunnelId]
      : funnels.map((f) => f.id)

    if (funnelIds.length === 0) {
      setLoading(false)
      return
    }

    const unsubscribes: (() => void)[] = []
    const trackingMap = new Map<string, DailyTracking>()

    // Calcular datas dos últimos N dias
    const dates: string[] = []
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateKey = date.toISOString().split('T')[0]
      dates.push(dateKey)
      trackingMap.set(dateKey, {
        date: dateKey,
        pageviews: 0,
        clicks: 0,
      })
    }

    funnelIds.forEach((funnelId) => {
      dates.forEach((date) => {
        const trackingRef = doc(
          db,
          'tracking',
          funnelId,
          'daily',
          date
        )

        const unsubscribe = onSnapshot(trackingRef, (docSnapshot) => {
          if (docSnapshot.exists()) {
            const data = docSnapshot.data()
            const existing = trackingMap.get(date) || {
              date,
              pageviews: 0,
              clicks: 0,
            }
            trackingMap.set(date, {
              date,
              pageviews: existing.pageviews + (data.pageviews || 0),
              clicks: existing.clicks + (data.clicks || 0),
            })
            setTrackingData(Array.from(trackingMap.values()))
          }
        })
        unsubscribes.push(unsubscribe)
      })
    })

    return () => {
      unsubscribes.forEach((unsub) => unsub())
    }
  }, [user, funnels, selectedFunnelId, days])

  // Carregar leads
  useEffect(() => {
    if (!user) return

    const q = query(collection(db, 'leads'), where('userId', '==', user.uid))

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const leadsData: Lead[] = []
      snapshot.forEach((doc) => {
        const data = doc.data()
        if (!selectedFunnelId || data.funnelId === selectedFunnelId) {
          leadsData.push({
            id: doc.id,
            userId: data.userId,
            funnelId: data.funnelId,
            channelId: data.channelId,
            telegramUserId: data.telegramUserId,
            username: data.username || null,
            firstName: data.firstName || null,
            lastName: data.lastName || null,
            status: data.status || 'active',
            enteredAt: data.enteredAt?.toDate() || new Date(),
            exitedAt: data.exitedAt?.toDate() || null,
          })
        }
      })
      setLeadsData(leadsData)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [user, selectedFunnelId])

  // Calcular métricas
  const totalPageviews = trackingData.reduce(
    (sum, day) => sum + day.pageviews,
    0
  )
  const totalClicks = trackingData.reduce((sum, day) => sum + day.clicks, 0)
  
  // Total de entradas (todos os leads criados)
  const totalEntries = leadsData.length
  // Total de saídas (leads com status exited)
  const totalExits = leadsData.filter((l) => l.status === 'exited').length
  // Membros ativos (leads com status active)
  const activeMembers = leadsData.filter((l) => l.status === 'active').length

  const ctr = totalPageviews > 0 ? (totalClicks / totalPageviews) * 100 : 0
  const entryRate = totalClicks > 0 ? (totalEntries / totalClicks) * 100 : 0
  const conversionRate =
    totalPageviews > 0 ? (totalEntries / totalPageviews) * 100 : 0
  const retentionRate =
    totalEntries > 0 ? (activeMembers / totalEntries) * 100 : 0

  // Preparar dados diários para gráfico
  const dailyData = trackingData.map((tracking) => {
    const date = new Date(tracking.date)
    const dateKey = tracking.date
    
    // Leads que entraram neste dia
    const dayEntries = leadsData.filter((lead) => {
      const leadDate = lead.enteredAt.toISOString().split('T')[0]
      return leadDate === dateKey && lead.status === 'active'
    }).length

    // Leads que saíram neste dia
    const dayExits = leadsData.filter((lead) => {
      if (!lead.exitedAt) return false
      const exitDate = lead.exitedAt.toISOString().split('T')[0]
      return exitDate === dateKey && lead.status === 'exited'
    }).length

    return {
      date: tracking.date,
      formattedDate: date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
      }),
      pageviews: tracking.pageviews,
      clicks: tracking.clicks,
      entries: dayEntries,
      exits: dayExits,
    }
  })

  // Preparar dados de retenção por dia
  const retentionData = dailyData.map((day) => {
    // Calcular retenção: (entradas - saídas) / entradas * 100
    const retention =
      day.entries > 0
        ? ((day.entries - day.exits) / day.entries) * 100
        : 0
    return {
      date: day.date,
      formattedDate: day.formattedDate,
      entries: day.entries,
      exits: day.exits,
      retention: Math.max(0, Math.min(100, retention)),
    }
  })

  return {
    funnels,
    trackingData,
    leadsData,
    dailyData,
    retentionData,
    metrics: {
      totalPageviews,
      totalClicks,
      totalEntries,
      totalExits,
      activeMembers,
      ctr,
      entryRate,
      conversionRate,
      retentionRate,
    },
    loading,
  }
}

