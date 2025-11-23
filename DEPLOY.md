# Guia de Deploy - Telegram Tracking

Este guia fornece um passo a passo completo para fazer o deploy do sistema.

## 📋 Pré-requisitos

- Conta no Firebase (Google)
- Node.js 18+ instalado
- Firebase CLI instalado (`npm install -g firebase-tools`)
- Git (opcional)

## 🔥 Passo 1: Criar Projeto Firebase

1. Acesse [Firebase Console](https://console.firebase.google.com/)
2. Clique em "Adicionar projeto"
3. Digite o nome do projeto (ex: `telegram-tracking`)
4. Aceite os termos e continue
5. **Anote o Project ID** (será usado mais tarde)

## 🔐 Passo 2: Habilitar Authentication

1. No Firebase Console, vá em **Authentication**
2. Clique em **Começar**
3. Vá em **Sign-in method**
4. Habilite **Email/Password**
5. Salve

## 💾 Passo 3: Criar Firestore Database

1. No Firebase Console, vá em **Firestore Database**
2. Clique em **Criar banco de dados**
3. Escolha **Modo de produção**
4. Selecione uma **região** (recomendado: `us-central1`)
5. Clique em **Ativar**

### Configurar Security Rules (Opcional - para desenvolvimento)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Permitir leitura/escrita apenas para usuários autenticados
    match /{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
    }
  }
}
```

**⚠️ ATENÇÃO**: As regras acima são básicas. Configure regras mais específicas para produção.

## 📱 Passo 4: Obter Credenciais do Firebase

1. No Firebase Console, vá em **Project Settings** (ícone de engrenagem)
2. Role até **Your apps**
3. Clique no ícone **Web** (`</>`)
4. Registre o app (nome opcional)
5. **Copie as credenciais** exibidas

## 🔧 Passo 5: Configurar Variáveis de Ambiente

1. Na raiz do projeto, crie o arquivo `.env`:
   ```env
   VITE_FIREBASE_API_KEY=sua_api_key_aqui
   VITE_FIREBASE_AUTH_DOMAIN=seu_projeto.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=seu_projeto_id
   VITE_FIREBASE_STORAGE_BUCKET=seu_projeto.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=seu_sender_id
   VITE_FIREBASE_APP_ID=seu_app_id
   ```

2. Substitua os valores pelas credenciais copiadas

## 🤖 Passo 6: Configurar Telegram Bot

1. Abra o Telegram e procure por **@BotFather**
2. Envie `/newbot`
3. Siga as instruções:
   - Escolha um nome para o bot
   - Escolha um username (deve terminar em `bot`)
4. **Copie o Bot Token** fornecido
5. Adicione o bot ao grupo do Telegram
6. Torne o bot **administrador** do grupo
7. Adicione **@userinfobot** ao grupo e envie `/start` para obter o Group ID

## ⚙️ Passo 7: Inicializar Firebase no Projeto

1. Faça login no Firebase CLI:
   ```bash
   firebase login
   ```

2. Inicialize o Firebase no projeto:
   ```bash
   firebase init
   ```

3. Selecione:
   - ✅ **Functions**
   - ✅ **Hosting** (opcional, para deploy do frontend)

4. Escolha o projeto criado anteriormente

5. Para Functions:
   - Language: **TypeScript**
   - ESLint: **Yes** (opcional)
   - Install dependencies: **Yes**

6. Para Hosting (se selecionado):
   - Public directory: **dist**
   - Single-page app: **Yes**
   - GitHub auto-deploy: **No**

## 🚀 Passo 8: Deploy das Cloud Functions

1. Entre na pasta functions:
   ```bash
   cd functions
   ```

2. Instale as dependências (se ainda não fez):
   ```bash
   npm install
   ```

3. Compile o TypeScript:
   ```bash
   npm run build
   ```

4. Faça o deploy:
   ```bash
   npm run deploy
   ```

   Ou da raiz do projeto:
   ```bash
   firebase deploy --only functions
   ```

5. **Anote as URLs das functions** exibidas no terminal:
   - `trackPageview`: `https://us-central1-<PROJECT_ID>.cloudfunctions.net/trackPageview`
   - `trackClick`: `https://us-central1-<PROJECT_ID>.cloudfunctions.net/trackClick`
   - `telegramWebhook`: `https://us-central1-<PROJECT_ID>.cloudfunctions.net/telegramWebhook`

## 🔗 Passo 9: Configurar Webhook do Telegram

1. Use a URL da function `telegramWebhook` obtida no passo anterior

2. Execute o comando (substitua `<BOT_TOKEN>` e `<PROJECT_ID>`):
   ```bash
   curl -X POST "https://api.telegram.org/bot<BOT_TOKEN>/setWebhook" \
     -H "Content-Type: application/json" \
     -d '{"url": "https://us-central1-<PROJECT_ID>.cloudfunctions.net/telegramWebhook"}'
   ```

3. Verifique se foi configurado:
   ```bash
   curl "https://api.telegram.org/bot<BOT_TOKEN>/getWebhookInfo"
   ```

## 🌐 Passo 10: Configurar URL das Functions no Frontend

1. No arquivo `.env`, adicione (opcional, se usar variável):
   ```env
   VITE_FUNCTIONS_URL=https://us-central1-<PROJECT_ID>.cloudfunctions.net
   ```

   Ou atualize diretamente em `src/lib/funnel-utils.ts` se necessário.

## 📦 Passo 11: Build do Frontend

1. Na raiz do projeto, instale as dependências (se ainda não fez):
   ```bash
   npm install
   ```

2. Faça o build:
   ```bash
   npm run build
   ```

   Isso criará a pasta `dist/` com os arquivos otimizados.

## 🚀 Passo 12: Deploy do Frontend (Firebase Hosting)

1. Se você inicializou o Hosting no passo 7:
   ```bash
   firebase deploy --only hosting
   ```

2. Ou use o script:
   ```bash
   npm run deploy:frontend
   ```

3. **Anote a URL** do site (ex: `https://seu-projeto.web.app`)

## ✅ Passo 13: Verificação

1. Acesse a URL do site deployado
2. Crie uma conta de usuário
3. Configure um Pixel, Canal e Domínio
4. Crie um Funil
5. Teste o tracking script no seu site
6. Verifique se os leads aparecem quando alguém entra no grupo

## 🔄 Atualizações Futuras

### Atualizar apenas Functions:
```bash
cd functions
npm run deploy
```

### Atualizar apenas Frontend:
```bash
npm run build
firebase deploy --only hosting
```

### Atualizar tudo:
```bash
npm run deploy
```

## 🐛 Troubleshooting

### Erro: "Functions directory does not exist"
- Certifique-se de estar na raiz do projeto
- Verifique se a pasta `functions/` existe

### Erro: "Permission denied"
- Execute `firebase login` novamente
- Verifique se tem permissões no projeto Firebase

### Erro: "Module not found" nas functions
- Entre em `functions/` e execute `npm install`
- Execute `npm run build` novamente

### Webhook não funciona
- Verifique se a function `telegramWebhook` foi deployada
- Confirme que a URL está correta
- Verifique os logs no Firebase Console > Functions > Logs

### Frontend não carrega
- Verifique se o arquivo `.env` está configurado
- Confirme que o build foi feito (`dist/` existe)
- Verifique os logs do Firebase Hosting

## 📚 Recursos Adicionais

- [Firebase Documentation](https://firebase.google.com/docs)
- [Telegram Bot API](https://core.telegram.org/bots/api)
- [Cloud Functions Documentation](https://firebase.google.com/docs/functions)


