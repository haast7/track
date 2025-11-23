# Telegram Tracking - Sistema de Rastreamento e Captura de Leads

Sistema completo para rastreamento de funis de vendas e captura de leads através do Telegram. Desenvolvido com React, TypeScript, Firebase e Cloud Functions.

## 📋 Descrição do Projeto

Sistema de tracking que permite:

- **Rastreamento de Pageviews e Clicks**: Script JavaScript que rastreia visualizações de página e cliques em botões
- **Captura de Leads no Telegram**: Integração com Telegram Bot para capturar leads que entram em grupos
- **Dashboard em Tempo Real**: Métricas e gráficos atualizados automaticamente
- **Sistema de Postbacks**: Webhooks configuráveis para receber eventos em tempo real
- **Gerenciamento Completo**: Interface para gerenciar Pixels, Canais, Domínios, Funis, Leads e Postbacks

## 🛠️ Stack Tecnológico

### Frontend
- **React 18** - Biblioteca UI
- **TypeScript** - Tipagem estática
- **Vite** - Build tool e dev server
- **TailwindCSS** - Estilização
- **Shadcn/ui** - Componentes UI
- **React Router** - Roteamento
- **React Hook Form + Zod** - Formulários e validação
- **Recharts** - Gráficos

### Backend
- **Firebase Authentication** - Autenticação de usuários
- **Cloud Firestore** - Banco de dados NoSQL em tempo real
- **Cloud Functions** - Funções serverless (Node.js 18)
- **Telegram Bot API** - Integração com Telegram

## 📦 Requisitos

- **Node.js** 18 ou superior
- **npm** ou **yarn**
- **Firebase CLI** (`npm install -g firebase-tools`)
- Conta no **Firebase** (Google)
- Conta no **Telegram** (para criar bot)

## 🚀 Instalação

1. **Clone o repositório** (ou baixe os arquivos)

2. **Instale as dependências do frontend:**
   ```bash
   npm install
   ```

3. **Instale as dependências das functions:**
   ```bash
   cd functions
   npm install
   cd ..
   ```

## ⚙️ Configuração

### 1. Configuração do Firebase

1. Acesse o [Firebase Console](https://console.firebase.google.com/)
2. Crie um novo projeto ou use um existente
3. Anote o **Project ID**

4. **Habilite Authentication:**
   - Vá em Authentication > Sign-in method
   - Habilite "Email/Password"

5. **Crie o Firestore Database:**
   - Vá em Firestore Database
   - Clique em "Criar banco de dados"
   - Escolha modo de produção
   - Escolha uma região (ex: us-central1)

6. **Obtenha as credenciais:**
   - Vá em Project Settings > General
   - Role até "Your apps"
   - Clique em "Web" (</>) para adicionar app
   - Copie as credenciais do Firebase

7. **Crie o arquivo `.env` na raiz do projeto:**
   ```env
   VITE_FIREBASE_API_KEY=sua_api_key_aqui
   VITE_FIREBASE_AUTH_DOMAIN=seu_projeto.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=seu_projeto_id
   VITE_FIREBASE_STORAGE_BUCKET=seu_projeto.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=seu_sender_id
   VITE_FIREBASE_APP_ID=seu_app_id
   ```

### 2. Configuração do Telegram Bot

1. **Criar o Bot:**
   - Abra o Telegram e procure por **@BotFather**
   - Envie `/newbot`
   - Siga as instruções para criar seu bot
   - **Copie o Bot Token** fornecido

2. **Obter Group ID:**
   - Adicione o bot ao grupo do Telegram
   - Adicione o bot **@userinfobot** ao grupo
   - Envie `/start` no grupo
   - O bot retornará o **Group ID** (número negativo)

3. **Configurar o Bot:**
   - Certifique-se de que o bot é **administrador** do grupo
   - Configure permissões necessárias (adicionar membros, etc.)

4. **Configurar Webhook (após deploy):**
   ```bash
   curl -X POST "https://api.telegram.org/bot<BOT_TOKEN>/setWebhook" \
     -H "Content-Type: application/json" \
     -d '{"url": "https://us-central1-<PROJECT_ID>.cloudfunctions.net/telegramWebhook"}'
   ```

## 🏃 Desenvolvimento

### Frontend
```bash
npm run dev
```
Acesse `http://localhost:5173`

### Functions (local)
```bash
cd functions
npm run serve
```

## 📦 Build

### Frontend
```bash
npm run build
```
Gera a pasta `dist/` com os arquivos otimizados.

### Functions
```bash
cd functions
npm run build
```
Compila TypeScript para JavaScript na pasta `lib/`.

## 🚀 Deploy

### Deploy Completo
```bash
npm run deploy
```
Este comando faz deploy do frontend e das functions.

### Deploy Apenas Functions
```bash
cd functions
npm run deploy
```

### Deploy Apenas Frontend
```bash
npm run deploy:frontend
```

Para mais detalhes, consulte [DEPLOY.md](./DEPLOY.md).

## 📁 Estrutura do Projeto

```
telegram/
├── src/
│   ├── components/      # Componentes React
│   ├── pages/          # Páginas da aplicação
│   ├── hooks/          # Custom hooks
│   ├── lib/            # Utilitários e configurações
│   └── types/          # Tipos TypeScript
├── functions/
│   └── src/
│       ├── index.ts    # Funções principais
│       └── postbacks.ts # Funções de postback
├── public/             # Arquivos estáticos
└── dist/               # Build de produção
```

## 🔐 Segurança

- Autenticação obrigatória para todas as rotas protegidas
- Firestore Security Rules devem ser configuradas
- Variáveis de ambiente não devem ser commitadas
- Bot Token deve ser mantido seguro

## 📚 Documentação Adicional

- [DEPLOY.md](./DEPLOY.md) - Guia completo de deploy
- [functions/README.md](./functions/README.md) - Documentação das Cloud Functions

## 🐛 Troubleshooting

### Erro de CORS
- Verifique se as Cloud Functions estão deployadas
- Confirme que o CORS está configurado nas functions

### Bot não recebe webhooks
- Verifique se o webhook foi configurado corretamente
- Confirme que a URL está acessível publicamente
- Verifique os logs das functions no Firebase Console

### Dados não aparecem em tempo real
- Verifique as regras de segurança do Firestore
- Confirme que o usuário está autenticado
- Verifique os logs do console do navegador

## 📝 Licença

Este projeto é privado.


