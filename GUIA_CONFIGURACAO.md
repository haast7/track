# 🚀 Guia de Configuração Rápida

Este guia vai te ajudar a configurar o sistema do zero em poucos passos.

---

## ✅ Checklist de Configuração

- [ ] 1. Criar projeto no Firebase
- [ ] 2. Configurar arquivo `.env`
- [ ] 3. Criar bot no Telegram
- [ ] 4. Fazer deploy das Cloud Functions
- [ ] 5. Configurar webhook do Telegram
- [ ] 6. Obter credenciais do Meta Pixel
- [ ] 7. Testar o sistema completo

---

## 📋 Passo 1: Criar Projeto no Firebase

1. Acesse [Firebase Console](https://console.firebase.google.com/)
2. Clique em "Adicionar projeto"
3. Digite um nome para o projeto (ex: `track4you-clone`)
4. **Desabilite** Google Analytics (opcional, não é necessário)
5. Clique em "Criar projeto"
6. Aguarde a criação (leva ~30 segundos)

### Habilitar Authentication

1. No menu lateral, clique em **Authentication**
2. Clique em "Get started"
3. Vá em **Sign-in method**
4. Clique em **Email/Password**
5. **Ative** o provedor
6. Clique em "Save"

### Criar Firestore Database

1. No menu lateral, clique em **Firestore Database**
2. Clique em "Criar banco de dados"
3. Escolha **Modo de produção**
4. Escolha uma região (ex: `us-central1` ou `southamerica-east1` para Brasil)
5. Clique em "Ativar"

### Obter Credenciais

1. Clique no ícone de **engrenagem** ⚙️ no topo > **Configurações do projeto**
2. Role até "Seus aplicativos"
3. Clique no botão **Web** (`</>`)
4. Digite um nome para o app (ex: `Track4You Web`)
5. **NÃO marque** "Configurar Firebase Hosting"
6. Clique em "Registrar app"
7. **COPIE** as credenciais que apareceram na tela

---

## 📋 Passo 2: Configurar Arquivo `.env`

1. Na raiz do projeto, copie o arquivo `.env.example`:
   ```bash
   cp .env.example .env
   ```

2. Abra o arquivo `.env` e preencha com as credenciais do Firebase:
   ```env
   VITE_FIREBASE_API_KEY=AIzaSyC...
   VITE_FIREBASE_AUTH_DOMAIN=seu-projeto.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=seu-projeto-id
   VITE_FIREBASE_STORAGE_BUCKET=seu-projeto.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
   VITE_FIREBASE_APP_ID=1:123456789:web:abc123
   VITE_FUNCTIONS_URL=https://us-central1-seu-projeto-id.cloudfunctions.net
   ```

   **IMPORTANTE:** Substitua `us-central1-seu-projeto-id` pela região e ID do seu projeto.

3. **NÃO commite** o arquivo `.env` no Git (ele já está no `.gitignore`)

---

## 📋 Passo 3: Criar Bot no Telegram

### Criar o Bot

1. Abra o Telegram
2. Procure por **@BotFather**
3. Envie o comando: `/newbot`
4. Digite um nome para o bot (ex: `Track4You Bot`)
5. Digite um username (ex: `track4you_tracker_bot`) - precisa terminar com `_bot`
6. **COPIE o Bot Token** que apareceu (ex: `123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11`)

### Criar Grupo do Telegram

1. Crie um novo grupo no Telegram
2. Dê um nome (ex: `Grupo VIP - Método X`)
3. Adicione o bot que você criou ao grupo
4. **Torne o bot administrador** do grupo:
   - Clique no nome do grupo
   - Clique em "Editar"
   - Clique em "Administradores"
   - Adicione o bot
   - Dê permissão de **"Adicionar novos membros"**

### Obter Group ID

1. Adicione o bot **@userinfobot** ao grupo
2. Envie `/start` no grupo
3. O bot retornará informações, incluindo o **Chat ID** (ex: `-1001234567890`)
4. **COPIE** esse número (é o Group ID)
5. Remova o @userinfobot do grupo

---

## 📋 Passo 4: Deploy das Cloud Functions

### Instalar Firebase CLI

```bash
npm install -g firebase-tools
```

### Fazer Login no Firebase

```bash
firebase login
```

### Configurar o Projeto

```bash
firebase use --add
```

Selecione o projeto que você criou e dê um alias (ex: `default`)

### Build e Deploy

```bash
# Instalar dependências do frontend
npm install

# Instalar dependências das functions
cd functions
npm install
cd ..

# Build do frontend
npm run build

# Deploy completo (frontend + functions)
npm run deploy
```

**IMPORTANTE:** Anote as URLs das Cloud Functions que aparecerão no terminal:
```
✔  functions[trackPageview(us-central1)]: https://us-central1-seu-projeto.cloudfunctions.net/trackPageview
✔  functions[trackClick(us-central1)]: https://us-central1-seu-projeto.cloudfunctions.net/trackClick
✔  functions[telegramWebhook(us-central1)]: https://us-central1-seu-projeto.cloudfunctions.net/telegramWebhook
```

### Atualizar arquivo .env

Atualize a variável `VITE_FUNCTIONS_URL` no arquivo `.env` com a URL base:
```env
VITE_FUNCTIONS_URL=https://us-central1-seu-projeto.cloudfunctions.net
```

### Fazer Deploy Novamente

Após atualizar o `.env`, faça deploy do frontend novamente:
```bash
npm run build
firebase deploy --only hosting
```

---

## 📋 Passo 5: Configurar Webhook do Telegram

Execute o comando abaixo substituindo:
- `<BOT_TOKEN>` pelo token do bot
- `<PROJECT_ID>` pelo ID do seu projeto Firebase
- `<REGION>` pela região (ex: `us-central1`)

```bash
curl -X POST "https://api.telegram.org/bot<BOT_TOKEN>/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://<REGION>-<PROJECT_ID>.cloudfunctions.net/telegramWebhook",
    "allowed_updates": ["chat_member"]
  }'
```

**Exemplo:**
```bash
curl -X POST "https://api.telegram.org/bot123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://us-central1-meu-projeto.cloudfunctions.net/telegramWebhook",
    "allowed_updates": ["chat_member"]
  }'
```

**Resposta esperada:**
```json
{
  "ok": true,
  "result": true,
  "description": "Webhook was set"
}
```

### Verificar Webhook

```bash
curl "https://api.telegram.org/bot<BOT_TOKEN>/getWebhookInfo"
```

Deve retornar a URL configurada.

---

## 📋 Passo 6: Obter Credenciais do Meta Pixel

### Criar Pixel do Meta

1. Acesse [Facebook Events Manager](https://business.facebook.com/events_manager)
2. Clique em "Conectar fontes de dados"
3. Selecione "Web" → "Meta Pixel"
4. Digite um nome (ex: `Track4You Pixel`)
5. Clique em "Criar"
6. **COPIE o Pixel ID** (número de 15 dígitos, ex: `1234567890123456`)

### Obter Access Token

1. Acesse [Meta for Developers](https://developers.facebook.com/)
2. Vá em "Meus aplicativos" → Selecione ou crie um app
3. Vá em **Ferramentas** → **Graph API Explorer**
4. Selecione seu app no dropdown
5. Em "Permissões", adicione: `ads_management` e `ads_read`
6. Clique em "Generate Access Token"
7. **COPIE o Access Token** (começa com `EAA...`)

**IMPORTANTE:** Este token expira! Para um token de longa duração:
- Vá em **Access Token Tool**
- Clique em "Extend Access Token"
- Copie o novo token

### Configurar no Sistema

1. Faça login no sistema
2. Vá em **Pixels** → Clique em **"+ Novo"**
3. Preencha:
   - **Nome:** Track4You
   - **Pixel ID:** `1234567890123456` (cole o ID do pixel)
   - **Access Token:** `EAA...` (cole o token)
4. Clique em "Salvar"

---

## 📋 Passo 7: Testar o Sistema Completo

### 7.1. Criar um Domínio

1. Vá em **Domínios** → Clique em **"+ Novo"**
2. Digite a URL do seu domínio (ex: `https://meusite.com`)
3. Clique em "Salvar"

### 7.2. Configurar Canal

1. Vá em **Canal** → Clique em **"+ Novo"**
2. Preencha:
   - **Nome do Canal:** Grupo VIP
   - **Bot Token:** (cole o token do bot)
   - **Group ID:** (cole o ID do grupo, ex: `-1001234567890`)
3. Clique em "Salvar"

### 7.3. Criar Funil

1. Vá em **Funis** → Clique em **"+ Novo Funil"**
2. Preencha:
   - **Nome:** Funil Teste
   - **Pixel:** Selecione o pixel criado
   - **Domínio:** Selecione o domínio criado
   - **URLs:** Digite as URLs onde o script vai funcionar (ex: `https://meusite.com/oferta`)
   - **Ativar Solicitação de Entrada:** Marque se quiser que usuários precisem de aprovação
3. Clique em "Salvar"

### 7.4. Pegar o Script e o Link

1. No card do funil criado, clique em **"Tutorial"**
2. Você verá:
   - **Script de Tracking:** Copie e cole no `<head>` da sua página
   - **Link do Telegram:** Use esse link no seu botão

### 7.5. Adicionar na Página

Adicione o script no `<head>` da sua página:

```html
<!DOCTYPE html>
<html>
<head>
  <!-- Seu script de tracking aqui -->
  <script>
  (function() {
    const funnelId = 'abc123...';
    // ... resto do script
  })();
  </script>
</head>
<body>
  <h1>Minha Oferta</h1>
  <a href="https://t.me/+ABC123..." class="telegram-button">
    Entrar no Grupo VIP
  </a>
</body>
</html>
```

**IMPORTANTE:** O botão precisa ter a classe `telegram-button` para o click ser rastreado.

### 7.6. Testar

1. **Teste Pageview:**
   - Abra a página no navegador
   - Verifique se o pageview apareceu no Dashboard

2. **Teste Click:**
   - Clique no botão com class `telegram-button`
   - Verifique se o click apareceu no Dashboard

3. **Teste Entrada no Canal:**
   - Use o link do Telegram para entrar no grupo
   - Verifique se o lead apareceu em **Leads**
   - Verifique se "Entradas" aumentou no Dashboard
   - **VERIFIQUE NO META:** Vá no Events Manager e veja se o evento "EnterChannel" apareceu

4. **Teste Saída do Canal:**
   - Saia do grupo
   - Verifique se o status mudou para "exited" em **Leads**
   - Verifique se "Saídas" aumentou no Dashboard

---

## 🔧 Troubleshooting

### Dashboard não atualiza em tempo real

**Solução:**
- Verifique se você está logado
- Abra o Console do navegador (F12) e veja se há erros
- Verifique se as Cloud Functions estão deployadas

### Pageviews não são contados

**Possíveis causas:**
1. **Script não foi adicionado:** Verifique se o script está no `<head>` da página
2. **URL não está nas URLs do funil:** Verifique se a URL atual está na lista de URLs permitidas
3. **VITE_FUNCTIONS_URL incorreta:** Verifique se a URL no `.env` está correta
4. **CORS bloqueado:** Verifique os logs das Cloud Functions no Firebase Console

**Como debugar:**
```javascript
// Abra o Console do navegador (F12) e execute:
fetch('https://us-central1-seu-projeto.cloudfunctions.net/trackPageview', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ funnelId: 'SEU_FUNNEL_ID', url: window.location.href })
})
  .then(r => r.json())
  .then(console.log)
  .catch(console.error)
```

### Bot não detecta entradas no grupo

**Possíveis causas:**
1. **Bot não é administrador:** O bot precisa ser admin do grupo
2. **Webhook não configurado:** Execute novamente o comando `setWebhook`
3. **Group ID incorreto:** Verifique se o Group ID está correto (número negativo)

**Como debugar:**
1. Verifique se o webhook está ativo:
   ```bash
   curl "https://api.telegram.org/bot<BOT_TOKEN>/getWebhookInfo"
   ```

2. Verifique os logs das Cloud Functions:
   - Vá em Firebase Console → Functions → Logs
   - Procure por erros na função `telegramWebhook`

### Meta Pixel não recebe eventos

**Possíveis causas:**
1. **Access Token expirado:** Gere um novo token de longa duração
2. **Pixel ID incorreto:** Verifique se o ID está correto
3. **Permissões insuficientes:** Certifique-se de que o token tem permissões `ads_management`

**Como debugar:**
1. Vá em Firebase Console → Functions → Logs
2. Procure por mensagens de erro relacionadas ao Meta Pixel
3. Use o [Events Manager](https://business.facebook.com/events_manager) para testar eventos

---

## 📚 Próximos Passos

Após configurar tudo:

1. **Configure Postbacks** para receber webhooks quando eventos acontecerem
2. **Exporte dados** para CSV usando a funcionalidade de exportação
3. **Crie múltiplos funis** para diferentes ofertas
4. **Monitore métricas** no Dashboard em tempo real

---

## 🆘 Precisa de Ajuda?

- Leia a documentação completa em `COMO_FUNCIONA.md`
- Verifique os logs no Firebase Console
- Teste cada funcionalidade isoladamente
