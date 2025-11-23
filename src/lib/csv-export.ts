import { Lead } from '@/types'

export function exportLeadsToCSV(leads: Lead[], funnels: Map<string, string>) {
  // Cabeçalho CSV
  const headers = [
    'ID',
    'Nome Completo',
    'Username',
    'Telegram User ID',
    'Funil',
    'Status',
    'Data de Entrada',
    'Data de Saída',
    'Tempo no Grupo (dias)',
  ]

  // Converter leads para linhas CSV
  const rows = leads.map((lead) => {
    const fullName =
      lead.firstName && lead.lastName
        ? `${lead.firstName} ${lead.lastName}`
        : lead.firstName || 'Sem nome'
    const username = lead.username || ''
    const funnelName = funnels.get(lead.funnelId) || 'N/A'
    const status = lead.status === 'active' ? 'Ativo' : 'Saiu'
    const enteredAt = lead.enteredAt.toLocaleString('pt-BR')
    const exitedAt = lead.exitedAt
      ? lead.exitedAt.toLocaleString('pt-BR')
      : ''

    // Calcular tempo no grupo
    const endDate = lead.exitedAt || new Date()
    const diff = endDate.getTime() - lead.enteredAt.getTime()
    const days = (diff / (1000 * 60 * 60 * 24)).toFixed(2)

    return [
      lead.id,
      fullName,
      username,
      lead.telegramUserId.toString(),
      funnelName,
      status,
      enteredAt,
      exitedAt,
      days,
    ]
  })

  // Combinar cabeçalho e linhas
  const csvContent = [headers, ...rows]
    .map((row) =>
      row
        .map((cell) => {
          // Escapar aspas e vírgulas
          const cellStr = String(cell || '')
          if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
            return `"${cellStr.replace(/"/g, '""')}"`
          }
          return cellStr
        })
        .join(',')
    )
    .join('\n')

  // Criar blob e download
  const blob = new Blob(['\ufeff' + csvContent], {
    type: 'text/csv;charset=utf-8;',
  })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  link.setAttribute('href', url)
  link.setAttribute('download', `leads_${new Date().toISOString().split('T')[0]}.csv`)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}


