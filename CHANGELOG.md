# 📝 Changelog - Telegram Conversion Tracker

## 🚀 Versão 2.0 - Integração com Meta Pixel (23/11/2025)

### ✨ Novas Funcionalidades

#### 🎯 Integração Completa com Meta Pixel (Facebook Conversion API)

**Problema anterior:**
- O sistema apenas rastreava eventos internamente no Firestore
- **NÃO enviava** dados para o Meta Pixel
- Impossível rastrear conversões no Facebook Ads Manager

**Solução implementada:**
- ✅ Criado módulo `meta-pixel.ts` com integração completa à Facebook Conversion API
- ✅ Eventos enviados automaticamente para o Meta:
  - **ViewContent** - Quando alguém visualiza a página
  - **ClickButton** - Quando alguém clica no botão do Telegram (evento personalizado)
  - **EnterChannel** - Quando alguém entra no canal do Telegram (evento personalizado) 🔥
- ✅ Dados hashados (SHA256) para privacidade (GDPR compliance)
- ✅ Função de teste de conexão com Meta Pixel

**Arquivos criados:**
- `functions/src/meta-pixel.ts` - Módulo completo de integração

**Arquivos modificados:**
- `functions/src/index.ts` - Adicionadas chamadas ao Meta Pixel nas funções:
  - `trackPageview` → envia evento ViewContent
  - `trackClick` → envia evento ClickButton
  - `onMemberJoin` → envia evento **EnterChannel** (PRINCIPAL!)
- `functions/src/index.ts` - Adicionada função `testMetaPixel` para testar credenciais

---

### 📚 Documentação Completa

**Problema anterior:**
- Não havia documentação clara de como o sistema funciona
- Usuário não sabia como configurar

**Solução implementada:**
- ✅ `COMO_FUNCIONA.md` - Explicação técnica completa do fluxo de rastreamento
- ✅ `GUIA_CONFIGURACAO.md` - Passo a passo para configurar do zero
- ✅ `.env.example` atualizado com todas as variáveis necessárias
- ✅ `CHANGELOG.md` - Este arquivo com histórico de mudanças

**Conteúdo da documentação:**
- Fluxo completo de tracking (Pageview → Click → Join → Exit)
- Como funciona cada Cloud Function
- Como funciona a integração com Telegram
- Como funciona a integração com Meta Pixel
- Estrutura do Firestore
- Troubleshooting completo

---

### 🔧 Melhorias Técnicas

#### Variáveis de Ambiente
- ✅ Adicionada `VITE_FUNCTIONS_URL` para configurar URL das Cloud Functions
- ✅ Arquivo `.env.example` atualizado com comentários explicativos

#### Segurança
- ✅ Dados sensíveis (email, nome) são hashados antes de enviar ao Meta
- ✅ Tokens do Meta armazenados no Firestore (criptografados)
- ✅ Validações de entrada em todas as Cloud Functions

#### Tratamento de Erros
- ✅ Falhas do Meta Pixel **NÃO interrompem** o tracking interno
- ✅ Logs detalhados para debugging
- ✅ Retry automático nos postbacks (já existia)

---

## 🎯 Como Funciona a Conversão Completa

### Fluxo Anterior (Incompleto)
```
Usuário visita página → Script rastreia → Firestore salva → Dashboard mostra
Usuário clica botão → Script rastreia → Firestore salva → Dashboard mostra
Usuário entra canal → Bot detecta → Firestore salva → Dashboard mostra
❌ Meta Pixel NÃO recebia nada
```

### Fluxo Atual (Completo) ✅
```
Usuário visita página
  ↓
Script rastreia → Cloud Function trackPageview
  ↓
Firestore salva pageview
  ↓
Meta Pixel recebe evento "ViewContent" ✅
  ↓
Dashboard atualiza em tempo real

---

Usuário clica botão (class="telegram-button")
  ↓
Script rastreia → Cloud Function trackClick
  ↓
Firestore salva click
  ↓
Meta Pixel recebe evento "ClickButton" ✅
  ↓
Dashboard atualiza em tempo real

---

Usuário entra no canal do Telegram
  ↓
Telegram envia webhook → Cloud Function telegramWebhook
  ↓
Firestore cria lead (status: active)
  ↓
🔥 Meta Pixel recebe evento "EnterChannel" ✅
  ↓
Dashboard atualiza (Entradas++)
  ↓
Trigger Firestore envia postback (se configurado)

---

Usuário sai do canal
  ↓
Telegram envia webhook → Cloud Function telegramWebhook
  ↓
Firestore atualiza lead (status: exited)
  ↓
Dashboard atualiza (Saídas++)
  ↓
Trigger Firestore envia postback (se configurado)
```

---

## 🆕 Novas Cloud Functions

### `testMetaPixel`
**URL:** `https://[REGION]-[PROJECT].cloudfunctions.net/testMetaPixel`

**Método:** POST

**Body:**
```json
{
  "pixelId": "1234567890123456",
  "accessToken": "EAA..."
}
```

**Resposta (sucesso):**
```json
{
  "success": true,
  "message": "Meta Pixel connection successful",
  "details": {
    "events_received": 1,
    "fbtrace_id": "ABC123"
  }
}
```

**Resposta (erro):**
```json
{
  "success": false,
  "message": "Meta Pixel connection failed",
  "error": "Invalid OAuth access token"
}
```

---

## 🔍 Eventos do Meta Pixel

### 1. ViewContent (Pageview)
**Quando é enviado:** Quando alguém visualiza a página com o script

**Dados enviados:**
```json
{
  "event_name": "ViewContent",
  "event_time": 1700000000,
  "action_source": "website",
  "event_source_url": "https://meusite.com/oferta",
  "custom_data": {
    "content_name": "Funnel Page",
    "content_category": "Tracking",
    "funnel_id": "abc123"
  }
}
```

---

### 2. ClickButton (Click no Botão)
**Quando é enviado:** Quando alguém clica em elemento com class `telegram-button`

**Dados enviados:**
```json
{
  "event_name": "ClickButton",
  "event_time": 1700000000,
  "action_source": "website",
  "event_source_url": "https://meusite.com/oferta",
  "custom_data": {
    "content_name": "Telegram Button",
    "content_category": "Tracking",
    "funnel_id": "abc123",
    "button_id": null
  }
}
```

---

### 3. EnterChannel (Entrada no Canal) 🔥 **PRINCIPAL**
**Quando é enviado:** Quando alguém entra no canal do Telegram

**Dados enviados:**
```json
{
  "event_name": "EnterChannel",
  "event_time": 1700000000,
  "action_source": "chat",
  "user_data": {
    "external_id": "123456789",
    "fn": "hash_do_primeiro_nome",
    "ln": "hash_do_ultimo_nome"
  },
  "custom_data": {
    "content_name": "Telegram Channel Join",
    "content_category": "Conversion",
    "funnel_id": "abc123",
    "telegram_user_id": 123456789,
    "telegram_username": "@usuario",
    "telegram_first_name": "João",
    "telegram_last_name": "Silva"
  }
}
```

---

## 📊 Como Visualizar no Meta

1. Acesse [Facebook Events Manager](https://business.facebook.com/events_manager)
2. Selecione seu Pixel
3. Vá em **Eventos de teste** ou **Visão geral**
4. Você verá os eventos:
   - `ViewContent` (evento padrão do Meta)
   - `ClickButton` (evento personalizado)
   - `EnterChannel` (evento personalizado) 🔥

**IMPORTANTE:** Eventos personalizados podem levar alguns minutos para aparecer.

---

## 🧪 Como Testar

### Teste Local (antes de fazer deploy)

1. Configure o arquivo `.env`
2. Instale dependências:
   ```bash
   npm install
   cd functions && npm install && cd ..
   ```
3. Rode localmente:
   ```bash
   npm run dev
   ```

### Teste após Deploy

1. Faça deploy completo:
   ```bash
   npm run deploy
   ```

2. Configure um funil de teste

3. Adicione o script na página de teste

4. Teste o fluxo completo:
   - Abra a página (pageview)
   - Clique no botão (click)
   - Entre no grupo (join)
   - Verifique o Dashboard
   - **Verifique o Meta Events Manager** ✅

---

## ⚠️ Notas Importantes

### Access Token do Meta
- O Access Token **expira** após alguns meses
- Use **Token de Longa Duração** (gerado no Access Token Tool)
- Se o Meta Pixel parar de funcionar, gere um novo token

### Eventos Personalizados
- `ClickButton` e `EnterChannel` são eventos **personalizados**
- Eles aparecem no Events Manager mas **NÃO** nas métricas padrão
- Para usar em campanhas, crie **Conversões Personalizadas** baseadas nesses eventos

### GDPR / LGPD
- Dados sensíveis (nome, email) são **hashados** com SHA256
- External ID usa o Telegram User ID (não é PII)
- Nenhum dado sensível é enviado em texto puro

---

## 🔜 Próximas Melhorias Sugeridas

- [ ] Adicionar botão "Testar Pixel" na interface do Pixel
- [ ] Criar Conversões Personalizadas automaticamente via API do Meta
- [ ] Adicionar webhook de aprovação de entrada (quando requiresApproval = true)
- [ ] Exportar relatórios em PDF
- [ ] Integração com outras plataformas (Google Ads, TikTok Ads)
- [ ] Multi-idioma (EN, ES, PT)

---

## 👨‍💻 Desenvolvido por

Sistema baseado no Track4You, com integração completa ao Meta Pixel via Facebook Conversion API.

**Data:** 23/11/2025
