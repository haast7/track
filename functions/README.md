# Cloud Functions - Tracking

Cloud Functions para rastreamento de pageviews e cliques nos funis.

## Funções

### trackPageview
Endpoint HTTPS que recebe eventos de visualização de página.

**Request:**
```json
{
  "funnelId": "string",
  "url": "string",
  "timestamp": "number (opcional)"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Pageview tracked",
  "funnelId": "string",
  "date": "YYYY-MM-DD"
}
```

### trackClick
Endpoint HTTPS que recebe eventos de clique em botões.

**Request:**
```json
{
  "funnelId": "string",
  "buttonId": "string (opcional)",
  "url": "string",
  "timestamp": "number (opcional)"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Click tracked",
  "funnelId": "string",
  "date": "YYYY-MM-DD",
  "buttonId": "string | null"
}
```

## Estrutura de Dados

Os dados são salvos em:
```
/tracking/{funnelId}/daily/{YYYY-MM-DD}
```

Com os campos:
- `funnelId`: string
- `pixelId`: string
- `userId`: string
- `pageviews`: number (incrementado)
- `clicks`: number (incrementado)
- `lastUpdated`: timestamp

## Instalação

```bash
cd functions
npm install
```

## Build

```bash
npm run build
```

## Deploy

```bash
npm run deploy
```

## Desenvolvimento Local

```bash
npm run serve
```

## Funções do Telegram

### telegramWebhook
Endpoint HTTPS que recebe updates do Telegram e processa eventos de chat_member.

**Eventos processados:**
- Entrada de membro (`new_chat_member.status === 'member'`)
- Saída de membro (`new_chat_member.status === 'left'` ou `'kicked'`)

### onMemberJoin
Detecta quando um novo membro entra no grupo e cria um lead no Firestore.

### onMemberLeft
Detecta quando um membro sai do grupo e atualiza o lead existente.

## Configuração do Webhook

Para configurar o webhook do Telegram, use a API do Telegram:

```bash
curl -X POST "https://api.telegram.org/bot<BOT_TOKEN>/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://us-central1-<PROJECT_ID>.cloudfunctions.net/telegramWebhook"
  }'
```

Substitua:
- `<BOT_TOKEN>`: Token do bot do Telegram
- `<PROJECT_ID>`: ID do projeto Firebase

## Estrutura de Dados - Leads

Os leads são salvos em:
```
/leads/{leadId}
```

Com os campos:
- `userId`: string (do dono do funil)
- `funnelId`: string
- `channelId`: string
- `telegramUserId`: number
- `username`: string | null
- `firstName`: string | null
- `lastName`: string | null
- `status`: 'active' | 'exited'
- `enteredAt`: timestamp
- `exitedAt`: timestamp | null

## Funções de Postback (Triggers)

### sendPostbackPageview
Firestore Trigger que dispara quando tracking é atualizado (pageviews incrementado).

**Trigger:** `onUpdate` em `/tracking/{funnelId}/daily/{date}`

**Payload enviado:**
```json
{
  "event": "viewPage",
  "funnelId": "string",
  "pageviews": number,
  "timestamp": "ISO string"
}
```

### sendPostbackClick
Firestore Trigger que dispara quando tracking é atualizado (clicks incrementado).

**Trigger:** `onUpdate` em `/tracking/{funnelId}/daily/{date}`

**Payload enviado:**
```json
{
  "event": "clickButton",
  "funnelId": "string",
  "clicks": number,
  "timestamp": "ISO string"
}
```

### sendPostbackJoin
Firestore Trigger que dispara quando um lead é criado.

**Trigger:** `onCreate` em `/leads/{leadId}`

**Payload enviado:**
```json
{
  "event": "memberJoin",
  "lead": {
    "id": "string",
    "userId": "string",
    "funnelId": "string",
    "channelId": "string",
    "telegramUserId": number,
    "username": "string | null",
    "firstName": "string | null",
    "lastName": "string | null",
    "status": "active",
    "enteredAt": "timestamp"
  },
  "timestamp": "ISO string"
}
```

### sendPostbackLeft
Firestore Trigger que dispara quando um lead é atualizado (status para 'exited').

**Trigger:** `onUpdate` em `/leads/{leadId}`

**Payload enviado:**
```json
{
  "event": "memberLeft",
  "lead": {
    "id": "string",
    "userId": "string",
    "funnelId": "string",
    "channelId": "string",
    "telegramUserId": number,
    "username": "string | null",
    "firstName": "string | null",
    "lastName": "string | null",
    "status": "exited",
    "enteredAt": "timestamp",
    "exitedAt": "timestamp"
  },
  "timestamp": "ISO string"
}
```

### Helper: sendWebhook
Função auxiliar para enviar webhooks com retry e timeout.

**Parâmetros:**
- `url`: string - URL do webhook
- `payload`: any - Dados a serem enviados

**Retorno:**
```typescript
{
  success: boolean
  response?: { status: number, data: any }
  error?: string
}
```

**Características:**
- Timeout: 5 segundos
- Retry: 3 tentativas
- Exponential backoff entre tentativas
- Registra logs em `/postback_logs`
- Atualiza estatísticas do postback (`stats.sent`, `stats.failed`)

### Filtragem de Postbacks
- Busca postbacks ativos com `eventType` correspondente
- Se `funnelIds` é `null`, envia para todos os funis
- Se `funnelIds` é array, envia apenas se contém o `funnelId` do evento

## Requisitos

- Node.js 18
- Firebase CLI
- Firebase Project configurado
- axios (para envio de webhooks)

