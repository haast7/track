# 🔍 Como Funciona o Sistema de Tracking

## Visão Geral

Este sistema rastreia a jornada completa do usuário desde a visualização da página até a entrada no canal do Telegram, enviando eventos para o Meta Pixel.

---

## 📊 Fluxo Completo de Rastreamento

### 1. **Pageview (Visualização de Página)**

```
Usuário visita página
    ↓
Script detecta pageview
    ↓
POST /trackPageview
    ↓
Firestore: tracking/{funnelId}/daily/{date} → pageviews++
    ↓
Dashboard atualiza em tempo real
    ↓
Meta Pixel recebe evento "ViewContent" (IMPLEMENTAR)
```

**Código do Script:**
- Localização: `src/lib/funnel-utils.ts`
- O script é gerado automaticamente quando você cria um funil
- É adicionado no `<head>` da página de destino

**Cloud Function:**
- Localização: `functions/src/index.ts` → `trackPageview`
- Recebe: `{ funnelId, url, timestamp }`
- Incrementa contador no Firestore
- Ativa trigger para postbacks

---

### 2. **Click (Clique no Botão)**

```
Usuário clica em botão com class="telegram-button"
    ↓
Script detecta clique
    ↓
POST /trackClick
    ↓
Firestore: tracking/{funnelId}/daily/{date} → clicks++
    ↓
Dashboard atualiza em tempo real
    ↓
Meta Pixel recebe evento "ClickButton" (IMPLEMENTAR)
```

**Como usar:**
Adicione a classe `telegram-button` no botão que redireciona para o Telegram:
```html
<a href="[LINK_DO_TELEGRAM]" class="telegram-button">
  Entrar no Grupo
</a>
```

**Cloud Function:**
- Localização: `functions/src/index.ts` → `trackClick`
- Recebe: `{ funnelId, buttonId, url, timestamp }`
- Incrementa contador no Firestore

---

### 3. **Entrada no Canal (Join Channel)**

```
Usuário clica no link do Telegram
    ↓
Entra no grupo
    ↓
Telegram envia webhook → /telegramWebhook
    ↓
Cloud Function detecta chat_member.status = "member"
    ↓
Cria lead no Firestore (status: "active")
    ↓
Trigger: sendPostbackJoin envia postback
    ↓
Meta Pixel recebe evento "EnterChannel" (IMPLEMENTAR)
```

**Como funciona:**
1. O bot do Telegram precisa estar como **administrador** do grupo
2. O webhook do bot precisa apontar para:
   ```
   https://[REGION]-[PROJECT_ID].cloudfunctions.net/telegramWebhook
   ```
3. O Telegram envia eventos `chat_member` quando alguém entra/sai

**Cloud Function:**
- Localização: `functions/src/index.ts` → `telegramWebhook`
- Detecta novos membros
- Cria documento em `leads` collection
- Função auxiliar: `onMemberJoin`

**Trigger de Postback:**
- Localização: `functions/src/postbacks.ts` → `sendPostbackJoin`
- Dispara automaticamente quando um lead é criado no Firestore
- Envia webhook configurado pelo usuário

---

### 4. **Saída do Canal (Leave Channel)**

```
Usuário sai do grupo
    ↓
Telegram envia webhook → /telegramWebhook
    ↓
Cloud Function detecta chat_member.status = "left" ou "kicked"
    ↓
Atualiza lead no Firestore (status: "exited", exitedAt: timestamp)
    ↓
Trigger: sendPostbackLeft envia postback
    ↓
Dashboard mostra na tabela de retenção
    ↓
Meta Pixel NÃO recebe evento (apenas tracking interno)
```

**Cloud Function:**
- Localização: `functions/src/index.ts` → `telegramWebhook`
- Atualiza status do lead existente
- Função auxiliar: `onMemberLeft`

**Trigger de Postback:**
- Localização: `functions/src/postbacks.ts` → `sendPostbackLeft`
- Dispara automaticamente quando status muda para "exited"

---

## 🎯 Dashboard em Tempo Real

**Como funciona:**
- Localização: `src/hooks/useDashboardData.ts`
- Usa `onSnapshot` do Firestore para escutar alterações em tempo real
- Não precisa recarregar a página
- Atualiza automaticamente quando:
  - Alguém visualiza a página
  - Alguém clica no botão
  - Alguém entra no canal
  - Alguém sai do canal

**Métricas calculadas:**
```typescript
- totalPageviews: Soma de todos pageviews
- totalClicks: Soma de todos clicks
- totalEntries: Total de leads criados
- totalExits: Total de leads com status "exited"
- activeMembers: Leads com status "active"
- ctr: (clicks / pageviews) * 100
- entryRate: (entries / clicks) * 100
- conversionRate: (entries / pageviews) * 100
- retentionRate: (activeMembers / totalEntries) * 100
```

---

## 📱 Meta Pixel Integration (FALTANDO)

**O que precisa ser implementado:**

### Facebook Conversion API

O sistema precisa enviar eventos para o Meta usando a **Conversion API**.

**Eventos a enviar:**
1. **ViewContent** - Quando alguém visualiza a página
2. **ClickButton** - Quando alguém clica no botão (evento personalizado)
3. **EnterChannel** - Quando alguém entra no canal (evento personalizado)

**Como implementar:**
```typescript
// Exemplo de código que precisa ser adicionado
import axios from 'axios'

async function sendToMetaPixel(
  pixelId: string,
  accessToken: string,
  eventName: string,
  eventData: any
) {
  const url = `https://graph.facebook.com/v18.0/${pixelId}/events`

  await axios.post(url, {
    data: [{
      event_name: eventName,
      event_time: Math.floor(Date.now() / 1000),
      action_source: 'website',
      event_source_url: eventData.url,
      user_data: {
        // Dados do usuário (hashed)
      },
      custom_data: eventData
    }],
    access_token: accessToken
  })
}
```

**Onde adicionar:**
- `functions/src/index.ts` → Após incrementar tracking
- `functions/src/postbacks.ts` → Quando lead é criado

---

## 🔐 Segurança e Configuração

### Variáveis de Ambiente Necessárias

**Frontend (.env):**
```env
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_FUNCTIONS_URL=https://[REGION]-[PROJECT_ID].cloudfunctions.net
```

**Functions (configurar no Firebase Console):**
- Tokens e IDs sensíveis devem ser armazenados no Firestore, não em variáveis de ambiente
- Bot tokens do Telegram ficam criptografados no Firestore

### Firestore Collections

```
users/
  {uid}/
    - email
    - createdAt

pixels/
  {pixelId}/
    - userId
    - name
    - pixelId (Meta Pixel ID)
    - accessToken (Meta Access Token)
    - isActive
    - createdAt

channels/
  {channelId}/
    - userId
    - name
    - botToken
    - groupId
    - isActive
    - createdAt

domains/
  {domainId}/
    - userId
    - url
    - createdAt

funnels/
  {funnelId}/
    - userId
    - name
    - pixelId
    - channelId
    - domainId
    - urls[]
    - requiresApproval
    - trackingScript
    - telegramLink
    - isActive
    - createdAt

tracking/
  {funnelId}/
    daily/
      {YYYY-MM-DD}/
        - funnelId
        - pixelId
        - userId
        - pageviews
        - clicks
        - lastUpdated

leads/
  {leadId}/
    - userId
    - funnelId
    - channelId
    - telegramUserId
    - username
    - firstName
    - lastName
    - status (active | exited)
    - enteredAt
    - exitedAt

postbacks/
  {postbackId}/
    - userId
    - name
    - webhookUrl
    - eventType
    - funnelIds[]
    - isActive
    - stats
      - sent
      - failed
      - lastSent

postback_logs/
  {logId}/
    - postbackId
    - userId
    - eventType
    - status
    - payload
    - response
    - error
    - createdAt
```

---

## 🚀 Checklist de Deploy

- [ ] Criar projeto no Firebase
- [ ] Configurar arquivo `.env`
- [ ] Deploy das Cloud Functions
- [ ] Configurar webhook do Telegram Bot
- [ ] Adicionar integração com Meta Pixel
- [ ] Testar fluxo completo
- [ ] Configurar Firestore Security Rules

---

## 📝 Notas Importantes

1. **O bot NÃO rastreia o ID do grupo automaticamente**
   - Você precisa obter o Group ID manualmente usando @userinfobot
   - Adicionar no campo ao configurar o canal

2. **Link de convite do Telegram**
   - É gerado dinamicamente pela API do Telegram
   - Cada funil tem seu próprio link único
   - Permite rastrear qual funil trouxe cada lead

3. **Script de tracking**
   - Deve ser adicionado no `<head>` da página
   - Funciona apenas nas URLs configuradas no funil
   - Rastreia automaticamente pageviews
   - Rastreia clicks em elementos com class `telegram-button`

4. **Postbacks**
   - São webhooks que você configura para receber eventos
   - Podem ser filtrados por funil específico
   - Têm retry automático (3 tentativas)
   - Logs completos são salvos no Firestore
