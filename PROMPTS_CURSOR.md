# 🎯 Prompts para Cursor - Telegram Conversion Tracker

Sistema completo de tracking de conversões do Telegram com integração Meta Pixel.
Stack: Next.js 15 + TypeScript + Tailwind + shadcn/ui + Drizzle ORM + PostgreSQL + Vercel

---

## 📋 PARTE 1: Setup Inicial do Projeto

```
Crie um novo projeto Next.js 15 com App Router usando TypeScript e as seguintes configurações:

1. Inicialize com: npx create-next-app@latest telegram-tracker
   - TypeScript: Yes
   - ESLint: Yes
   - Tailwind CSS: Yes
   - src/ directory: Yes
   - App Router: Yes
   - Import alias: @/*

2. Instale as dependências principais:
   - shadcn/ui (init completo com theme)
   - lucide-react (ícones)
   - zod (validação)
   - react-hook-form + @hookform/resolvers
   - next-auth (autenticação)
   - drizzle-orm + drizzle-kit
   - @vercel/postgres
   - axios (para chamadas API)

3. Configure shadcn/ui:
   - Tema: default
   - CSS variables: yes
   - Adicione os componentes: button, input, label, select, dialog, tabs, switch, checkbox, avatar, card

4. Estruture as pastas:
   - src/app/(auth)/login
   - src/app/(auth)/register
   - src/app/(dashboard)/dashboard
   - src/app/(dashboard)/pixels
   - src/app/(dashboard)/canais
   - src/app/(dashboard)/dominios
   - src/app/(dashboard)/funis
   - src/app/(dashboard)/leads
   - src/app/(dashboard)/postbacks
   - src/components/ui (shadcn)
   - src/components/layout
   - src/lib
   - src/types

5. Configure o Tailwind para usar dark mode com class strategy

6. Crie o arquivo .env.local com:
   - NEXTAUTH_URL
   - NEXTAUTH_SECRET
   - POSTGRES_URL
   - NEXT_PUBLIC_APP_URL

Por favor, execute todos os comandos necessários e mostre a estrutura final criada.
```

---

## 📋 PARTE 2: Database Schema com Drizzle ORM

```
Configure o Drizzle ORM com PostgreSQL (Vercel Postgres) e crie todos os schemas do sistema:

1. Configure drizzle.config.ts para usar Vercel Postgres

2. Crie o schema completo em src/db/schema.ts com as seguintes tabelas:

**users**
- id (uuid, primary key, default: gen_random_uuid())
- email (varchar, unique, not null)
- password (varchar, not null) - hash bcrypt
- name (varchar)
- createdAt (timestamp, default: now())

**pixels**
- id (uuid, primary key)
- userId (uuid, foreign key -> users.id)
- name (varchar, not null)
- pixelId (varchar, not null) - ID do Meta Pixel
- accessToken (text, not null) - Access Token do Meta
- isActive (boolean, default: true)
- createdAt (timestamp)

**telegram_channels**
- id (uuid, primary key)
- userId (uuid, foreign key)
- name (varchar, not null)
- botToken (text, not null)
- groupId (varchar, not null) - ID do grupo/canal Telegram
- isActive (boolean, default: true)
- createdAt (timestamp)

**domains**
- id (uuid, primary key)
- userId (uuid, foreign key)
- url (varchar, not null)
- createdAt (timestamp)

**funnels**
- id (uuid, primary key)
- userId (uuid, foreign key)
- name (varchar, not null)
- pixelId (uuid, foreign key -> pixels.id)
- channelId (uuid, foreign key -> telegram_channels.id)
- domainId (uuid, foreign key -> domains.id)
- urls (jsonb) - array de URLs do funil
- requiresApproval (boolean, default: false)
- trackingScript (text) - Script gerado automaticamente
- telegramLink (varchar) - Link do grupo
- isActive (boolean, default: true)
- createdAt (timestamp)

**leads**
- id (uuid, primary key)
- userId (uuid, foreign key)
- funnelId (uuid, foreign key -> funnels.id)
- channelId (uuid, foreign key)
- telegramUserId (bigint, not null)
- username (varchar)
- firstName (varchar)
- lastName (varchar)
- status (varchar) - 'active' | 'exited'
- enteredAt (timestamp)
- exitedAt (timestamp, nullable)

**postbacks**
- id (uuid, primary key)
- userId (uuid, foreign key)
- name (varchar, not null)
- webhookUrl (text, not null)
- eventType (varchar) - 'viewPage' | 'clickButton' | 'memberJoin' | 'memberLeft'
- funnelIds (jsonb, nullable) - array de IDs ou null (todos)
- isActive (boolean, default: true)
- statsSent (integer, default: 0)
- statsFailed (integer, default: 0)
- statsLastSent (timestamp, nullable)
- createdAt (timestamp)

**postback_logs**
- id (uuid, primary key)
- postbackId (uuid, foreign key -> postbacks.id)
- userId (uuid, foreign key)
- eventType (varchar)
- status (varchar) - 'success' | 'failed'
- payload (jsonb)
- response (jsonb, nullable)
- error (text, nullable)
- createdAt (timestamp)

**tracking_events**
- id (uuid, primary key)
- funnelId (uuid, foreign key)
- eventType (varchar) - 'pageview' | 'click'
- metadata (jsonb)
- createdAt (timestamp)
Índices: funnelId, createdAt

3. Crie src/db/index.ts para exportar a conexão drizzle

4. Crie os scripts em package.json:
   - "db:generate": "drizzle-kit generate"
   - "db:migrate": "drizzle-kit migrate"
   - "db:push": "drizzle-kit push"
   - "db:studio": "drizzle-kit studio"

5. Crie src/types/index.ts com todos os tipos TypeScript derivados do schema

Execute a geração e push do schema para o banco.
```

---

## 📋 PARTE 3: Autenticação com NextAuth

```
Implemente autenticação completa com NextAuth v5 (Auth.js):

1. Crie src/app/api/auth/[...nextauth]/route.ts:
   - Provider: Credentials (email/password)
   - Session strategy: JWT
   - Hash de senha com bcrypt
   - Queries com Drizzle ORM

2. Crie src/lib/auth.ts:
   - Export auth, signIn, signOut
   - Helper getUserSession()
   - Middleware de proteção

3. Crie middleware.ts na raiz:
   - Proteja todas as rotas /(dashboard)/*
   - Redirecione para /login se não autenticado
   - Redirecione para /dashboard se já autenticado em /login

4. Implemente as páginas de autenticação:

**src/app/(auth)/login/page.tsx**
- Form com react-hook-form + zod
- Campos: email, password
- Botão de login
- Link para registro
- Design moderno com shadcn/ui
- Logo "Telegram Tracking" no topo
- Card centralizado, fundo gradient

**src/app/(auth)/register/page.tsx**
- Form: name, email, password, confirmPassword
- Validação com zod
- Hash com bcrypt
- Insert no DB com Drizzle
- Redirect para /login após sucesso
- Mesmo design do login

5. Crie src/app/api/auth/register/route.ts para POST

Use o design elegante com card centralizado, gradients sutis, e componentes shadcn/ui.
```

---

## 📋 PARTE 4: Layout do Dashboard

```
Crie o layout completo do dashboard com sidebar responsivo:

1. **src/components/layout/AppSidebar.tsx**
   - Sidebar fixa 256px width no desktop
   - Overlay mobile com drawer
   - Menu items:
     * Dashboard (LayoutDashboard icon)
     * Pixels (Square icon)
     * Canais (MessageSquare icon)
     * Domínios (Globe icon)
     * Funis (GitBranch icon)
     * Leads (Users icon)
     * Postbacks (Webhook icon)
   - Logo "Telegram Tracking" no topo
   - Active state com bg-primary
   - Botão Sair no bottom
   - Use lucide-react para ícones

2. **src/components/layout/DashboardHeader.tsx**
   - Header com título da página (prop)
   - Avatar do usuário (direita)
   - Dropdown com email e logout
   - Border bottom

3. **src/app/(dashboard)/layout.tsx**
   - Flex container: sidebar + main
   - Sidebar escondida em mobile
   - Mobile: hamburger menu abre sidebar
   - Header sempre visível
   - Main com padding e overflow-auto
   - Use "use client"

4. **src/components/layout/DashboardCard.tsx**
   - Card wrapper reutilizável
   - Props: title, description?, action?, children
   - Header com título e botão de ação opcional
   - Body com children

5. Mantenha o mesmo design visual do projeto atual:
   - Dark mode ready
   - Cores: zinc para backgrounds
   - Border sutil
   - Transições suaves
   - Responsivo

Teste o layout criando uma página dashboard básica que use esses componentes.
```

---

## 📋 PARTE 5: CRUD de Pixels

```
Implemente o CRUD completo de Pixels (Meta/Facebook):

1. **src/app/api/pixels/route.ts**
   - GET: lista pixels do usuário (com getUserSession)
   - POST: cria novo pixel
   - Validação com zod
   - Queries com Drizzle

2. **src/app/api/pixels/[id]/route.ts**
   - GET: busca pixel por ID
   - PATCH: atualiza pixel
   - DELETE: deleta pixel (soft delete: isActive = false)

3. **src/app/(dashboard)/pixels/page.tsx**
   - Lista de pixels em cards
   - Cada card mostra:
     * Nome do pixel
     * Pixel ID
     * Status (badge: ativo/inativo)
     * Data de criação
     * Botões: editar, toggle ativo/inativo, deletar
   - Botão "Novo Pixel" (top right)
   - Empty state quando sem pixels
   - Loading state

4. **src/components/modals/PixelFormModal.tsx**
   - Dialog do shadcn/ui
   - Form: nome, pixelId, accessToken
   - Validação com zod
   - Submit para API
   - Revalida lista após sucesso
   - Loading no botão

5. **src/lib/validations/pixel.ts**
   - Schema zod: createPixelSchema, updatePixelSchema

6. Use React Query ou SWR para cache das listagens (opcional mas recomendado)

Design: cards em grid, badges coloridos para status, confirmação para delete.
```

---

## 📋 PARTE 6: CRUD de Canais Telegram

```
Implemente o CRUD completo de Canais do Telegram:

1. **src/app/api/channels/route.ts**
   - GET: lista canais
   - POST: cria canal
   - Validação: name, botToken, groupId

2. **src/app/api/channels/[id]/route.ts**
   - GET, PATCH, DELETE

3. **src/app/(dashboard)/canais/page.tsx**
   - Grid de cards
   - Card: nome, groupId, status badge, botão test connection
   - Empty state
   - Botão "Novo Canal"

4. **src/components/modals/ChannelFormModal.tsx**
   - Fields: name, botToken, groupId
   - Info helper: como obter bot token
   - Info helper: como obter group ID
   - Validação

5. **src/lib/validations/channel.ts**
   - Schemas zod

6. Função auxiliar: testTelegramConnection
   - Testa se bot token e group ID são válidos
   - Usa Telegram Bot API
   - Mostra toast de sucesso/erro

Use o mesmo padrão do CRUD de Pixels.
```

---

## 📋 PARTE 7: CRUD de Domínios

```
Implemente o CRUD de Domínios (simplificado):

1. **src/app/api/domains/route.ts**
   - GET, POST
   - Validação: URL válida (zod.string().url())

2. **src/app/api/domains/[id]/route.ts**
   - DELETE

3. **src/app/(dashboard)/dominios/page.tsx**
   - Tabela simples (ou lista)
   - Colunas: URL, Data criação, Ações (delete)
   - Botão "Adicionar Domínio"

4. **src/components/modals/DomainFormModal.tsx**
   - Field: url
   - Validação URL

Domínios são apenas URLs cadastradas para uso nos funis.
```

---

## 📋 PARTE 8: CRUD de Funis (Core)

```
Implemente o CRUD de Funis - a feature central do sistema:

1. **src/app/api/funnels/route.ts**
   - GET: lista funis com joins (pixel, channel, domain names)
   - POST: cria funil e gera tracking script automaticamente

2. **src/app/api/funnels/[id]/route.ts**
   - GET, PATCH, DELETE

3. **src/app/(dashboard)/funis/page.tsx**
   - Cards de funis
   - Card mostra:
     * Nome do funil
     * Pixel vinculado
     * Canal vinculado
     * Domínio
     * Status (ativo/inativo)
     * Badges: requer aprovação?
     * Link do Telegram (copy to clipboard)
   - Botão "Novo Funil"

4. **src/components/modals/FunnelFormModal.tsx**
   - Select: pixel (lista do DB)
   - Select: canal
   - Select: domínio
   - Input: nome
   - Input: URLs do funil (array, add/remove)
   - Toggle: requer aprovação
   - Input: link do grupo Telegram

5. **Geração do tracking script**:
   Crie src/lib/tracking-script.ts com função:
   ```
   generateTrackingScript(funnelId: string, urls: string[]): string
   ```
   Script deve:
   - Verificar se URL atual está na lista
   - Enviar pageview para /api/tracking/pageview
   - Detectar clicks em botões
   - Enviar click para /api/tracking/click
   - Ser minificado e pronto para copiar

6. **Tutoriais**:
   Crie src/components/modals/FunnelTutorialModal.tsx:
   - Tabs: "Como Configurar" | "Como Instalar Script" | "Como Testar"
   - Instruções passo a passo
   - Code blocks com syntax highlight

Design: cards coloridos, badges, copy buttons, tooltips explicativos.
```

---

## 📋 PARTE 9: Sistema de Tracking (API Routes)

```
Implemente as APIs de tracking que o script JS chama:

1. **src/app/api/tracking/pageview/route.ts**
   - POST
   - Body: { funnelId, url, metadata? }
   - Insere em tracking_events
   - Dispara postbacks se configurados
   - Envia evento para Meta Pixel (Conversions API)
   - Não requer autenticação (público)

2. **src/app/api/tracking/click/route.ts**
   - POST
   - Body: { funnelId, url, buttonId?, metadata? }
   - Mesmo fluxo: insert + postbacks + meta pixel

3. **src/lib/meta-pixel.ts**
   - sendConversionEvent(pixelId, accessToken, event)
   - Usa Meta Conversions API
   - Event types: ViewContent, Lead, etc
   - Hash de dados de usuário (SHA256)

4. **src/lib/postback-sender.ts**
   - sendPostback(url, payload)
   - Retry logic (3 tentativas)
   - Salva log em postback_logs

5. Adicione rate limiting com upstash/ratelimit (opcional)

6. Adicione CORS headers permitindo qualquer origem (necessário para script)

Teste com curl simulando pageview e click.
```

---

## 📋 PARTE 10: Webhook do Telegram (Leads)

```
Implemente a captura de leads via Telegram Bot webhooks:

1. **src/app/api/telegram/webhook/route.ts**
   - POST (webhook do Telegram)
   - Valida signature (opcional mas recomendado)
   - Parse update do Telegram
   - Eventos:
     * member_joined: cria lead (status: active)
     * member_left: atualiza lead (status: exited, exitedAt)

2. **src/lib/telegram.ts**
   - parseWebhookUpdate(body)
   - validateTelegramSignature(token, body, signature)
   - setWebhook(botToken, webhookUrl)

3. **Script de configuração**: src/scripts/setup-telegram-webhooks.ts
   - Lê todos os canais do DB
   - Para cada canal: seta webhook para /api/telegram/webhook
   - URL: ${NEXT_PUBLIC_APP_URL}/api/telegram/webhook

4. Adicione npm script:
   - "telegram:setup": "tsx src/scripts/setup-telegram-webhooks.ts"

5. **src/app/(dashboard)/leads/page.tsx**
   - Tabela de leads
   - Filtros: funil, canal, status, data
   - Colunas:
     * Username (@user)
     * Nome (firstName lastName)
     * Funil
     * Canal
     * Status (badge)
     * Entrada (data/hora)
     * Saída (data/hora ou "-")
   - Export CSV
   - Paginação

6. **src/lib/csv-export.ts**
   - exportLeadsToCSV(leads): string (CSV content)

Teste criando leads manualmente e verificando a listagem.
```

---

## 📋 PARTE 11: CRUD de Postbacks

```
Implemente o sistema de Postbacks (webhooks de saída):

1. **src/app/api/postbacks/route.ts**
   - GET: lista postbacks com stats
   - POST: cria postback

2. **src/app/api/postbacks/[id]/route.ts**
   - PATCH, DELETE

3. **src/app/(dashboard)/postbacks/page.tsx**
   - Cards de postbacks
   - Card mostra:
     * Nome
     * Webhook URL (truncada, copy button)
     * Event type (badge)
     * Stats: enviados, falhas, último envio
     * Status ativo/inativo
   - Botão "Novo Postback"

4. **src/components/modals/PostbackFormModal.tsx**
   - Input: nome
   - Input: webhook URL
   - Select: event type (viewPage, clickButton, memberJoin, memberLeft)
   - Multi-select: funis (ou "Todos")
   - Toggle: ativo

5. **src/app/api/postbacks/[id]/test/route.ts**
   - POST: envia payload de teste
   - Retorna resposta do webhook
   - Útil para debugging

6. **src/app/api/postbacks/[id]/logs/route.ts**
   - GET: lista últimos 100 logs do postback
   - Exibir em modal ou página separada

Design: stats em destaque, badges coloridos por status, botão test bem visível.
```

---

## 📋 PARTE 12: Dashboard & Analytics

```
Implemente o dashboard principal com métricas e gráficos:

1. **src/app/(dashboard)/dashboard/page.tsx**
   - Cards de métricas (grid 4 colunas em desktop):
     * Total de Funis
     * Total de Leads (ativos)
     * Pageviews (últimos 7 dias)
     * Clicks (últimos 7 dias)
   - Gráfico de linha: Pageviews vs Clicks (últimos 30 dias)
   - Tabela: Top 5 funis por conversão
   - Tabela: Últimos leads

2. **src/components/dashboard/MetricCard.tsx**
   - Reutilizável
   - Props: title, value, icon, trend?, trendValue?
   - Design: card com ícone colorido, valor grande, trend

3. **src/components/dashboard/ChartCard.tsx**
   - Wrapper para gráficos
   - Use recharts (já instalado)
   - LineChart para pageviews/clicks

4. **src/app/api/dashboard/stats/route.ts**
   - GET
   - Retorna:
     * totalFunnels
     * totalActiveLeads
     * pageviewsLast7Days
     * clicksLast7Days
     * chartData (array de {date, pageviews, clicks})
     * topFunnels (array)
     * recentLeads (array)

5. **src/lib/analytics.ts**
   - getPageviewsCount(funnelId?, startDate, endDate)
   - getClicksCount(...)
   - getChartData(startDate, endDate)
   - Uses Drizzle aggregations

6. Filtros de data:
   - Tabs: 7 dias | 30 dias | 90 dias
   - Atualiza stats e gráfico

Design: clean, cards com shadow, gráfico com cores primárias, loading skeletons.
```

---

## 📋 PARTE 13: Retention Table (Análise Cohort)

```
Adicione análise de retenção de leads ao dashboard:

1. **src/components/dashboard/RetentionTable.tsx**
   - Tabela de cohort por data de entrada
   - Linhas: data de entrada (semana ou mês)
   - Colunas: D0, D1, D3, D7, D14, D30
   - Células: % de leads ainda ativos
   - Heatmap: verde (alta retenção) -> vermelho (baixa)

2. **src/app/api/dashboard/retention/route.ts**
   - GET
   - Query params: period (week|month), funnelId?
   - Retorna matrix de retenção

3. **src/lib/retention.ts**
   - calculateRetention(period, funnelId?)
   - SQL complexa:
     * Group leads por cohort (data entrada)
     * Para cada cohort, calcular % ativos em D0, D1, etc
     * Retornar matriz

4. Adicione ao dashboard abaixo dos gráficos

Use shadcn/ui Table component e Tailwind para o heatmap.
```

---

## 📋 PARTE 14: Detalhes de Lead (Modal)

```
Crie um modal de detalhes do lead:

1. **src/components/modals/LeadDetailsModal.tsx**
   - Trigger: click na row da tabela de leads
   - Exibe:
     * Avatar com iniciais
     * Nome completo
     * Username
     * Telegram User ID
     * Funil atual
     * Canal
     * Status (badge grande)
     * Data/hora entrada
     * Data/hora saída (se exited)
     * Tempo no funil (duration)
   - Timeline de eventos:
     * Entrou no grupo
     * Visualizou página X
     * Clicou botão Y
     * Saiu do grupo
   - Botão: Export histórico (CSV)

2. **src/app/api/leads/[id]/events/route.ts**
   - GET
   - Retorna todos eventos relacionados ao lead
   - Join tracking_events com leads

3. Design: modal grande, sidebar com info do lead, content com timeline

Use lucide-react icons e shadcn/ui Timeline (ou crie custom).
```

---

## 📋 PARTE 15: Integrações Avançadas

```
Implemente features avançadas de integração:

1. **Meta Conversions API - Eventos customizados**:
   - src/app/api/meta/send-custom-event/route.ts
   - POST: permite enviar eventos customizados para o Meta
   - Body: { pixelId, eventName, eventData }

2. **Teste de Pixel**:
   - src/app/api/pixels/[id]/test/route.ts
   - POST: envia evento de teste para o Meta
   - Retorna sucesso/erro

3. **Telegram Bot Commands**:
   - src/app/api/telegram/commands/route.ts
   - Webhook recebe commands: /start, /stats
   - Responde com info do funil

4. **Logs de sistema**:
   - src/app/(dashboard)/logs/page.tsx
   - Lista postback_logs
   - Filtros: status, data, postback
   - Details em modal

5. **Notificações**:
   - src/components/NotificationBell.tsx
   - Badge com contagem de leads novos
   - Dropdown com últimos 5 leads

Adicione essas features ao menu e teste cada uma.
```

---

## 📋 PARTE 16: Testes & Validação

```
Configure testes para garantir qualidade:

1. **Setup de testes**:
   - Instale: vitest, @testing-library/react, @testing-library/jest-dom
   - Configure vitest.config.ts
   - Scripts: "test", "test:watch", "test:coverage"

2. **Testes de API Routes**:
   - src/app/api/__tests__/pixels.test.ts
   - Testa GET, POST, PATCH, DELETE
   - Mock da database

3. **Testes de componentes**:
   - src/components/__tests__/PixelFormModal.test.tsx
   - Testa form validation
   - Testa submit

4. **Testes E2E** (opcional):
   - Playwright
   - Fluxo: login -> criar pixel -> criar funil -> ver dashboard

5. **Validação de tipos**:
   - Execute: tsc --noEmit
   - Corrija todos os erros de tipo

6. **Linting**:
   - Configure ESLint + Prettier
   - Rules: import order, unused vars, etc
   - Pre-commit hook com husky (opcional)

Execute todos os testes e garanta 100% de sucesso antes do deploy.
```

---

## 📋 PARTE 17: Performance & SEO

```
Otimize performance e SEO:

1. **Images**:
   - Use next/image para avatars
   - Otimize logo e icons

2. **Fonts**:
   - Use next/font para Google Fonts
   - Preload fonts

3. **Metadata**:
   - Adicione metadata em cada page.tsx
   - Title, description, og:image

4. **Loading states**:
   - Crie loading.tsx em cada rota
   - Skeleton loaders

5. **Error boundaries**:
   - Crie error.tsx global
   - Error.tsx específico em cada rota

6. **Streaming**:
   - Use Suspense para seções do dashboard
   - Lazy load modals

7. **Bundle size**:
   - Analise com @next/bundle-analyzer
   - Code split grandes libs

8. **Database**:
   - Adicione índices (já feito no schema)
   - Use prepared statements

Execute Lighthouse e atinja score > 90 em todas as métricas.
```

---

## 📋 PARTE 18: Deploy na Vercel

```
Faça deploy completo do projeto na Vercel:

1. **Preparação**:
   - Crie repositório Git
   - Push do código
   - Adicione .gitignore (.env.local, node_modules, .next)

2. **Vercel Postgres**:
   - No dashboard Vercel, crie novo Postgres database
   - Copie POSTGRES_URL
   - Execute migrations: npm run db:push

3. **Variáveis de ambiente**:
   - Adicione no Vercel dashboard:
     * POSTGRES_URL (auto)
     * NEXTAUTH_SECRET (generate: openssl rand -base64 32)
     * NEXTAUTH_URL (auto-detectado)
     * NEXT_PUBLIC_APP_URL

4. **Deploy**:
   - Conecte repo ao Vercel
   - Framework: Next.js
   - Root directory: ./
   - Build command: npm run build
   - Deploy!

5. **Pós-deploy**:
   - Configure domínio customizado (opcional)
   - Setup Telegram webhooks: npm run telegram:setup
   - Teste o app em produção

6. **Monitoring**:
   - Configure Vercel Analytics
   - Configure Sentry (error tracking)
   - Setup uptime monitoring

7. **CI/CD**:
   - Push to main = auto deploy
   - Preview deployments em PRs

Documente a URL final e envie para teste!
```

---

## 📋 PARTE 19: Documentação

```
Crie documentação completa do projeto:

1. **README.md**:
   - Descrição do projeto
   - Features principais
   - Stack tecnológica
   - Setup local (passo a passo)
   - Variáveis de ambiente
   - Scripts disponíveis
   - Deploy
   - Screenshots

2. **ARCHITECTURE.md**:
   - Diagrama da arquitetura
   - Fluxo de dados
   - Database schema
   - API endpoints
   - Integrations

3. **API.md**:
   - Documentação de todas as routes
   - Request/Response examples
   - Authentication
   - Error codes

4. **SETUP.md**:
   - Como configurar Meta Pixel
   - Como criar Telegram Bot
   - Como obter Group ID
   - Como configurar webhooks

5. **TROUBLESHOOTING.md**:
   - Problemas comuns
   - Soluções

6. **CONTRIBUTING.md** (se open source):
   - Como contribuir
   - Code style
   - Pull request process

Use Markdown com syntax highlight e emojis para melhor UX.
```

---

## 📋 PARTE 20: Melhorias Finais

```
Implemente melhorias de UX e polish final:

1. **Toasts & Notifications**:
   - Instale sonner
   - Toast em todas as ações: sucesso, erro, info
   - Confirmações para ações destrutivas

2. **Empty states**:
   - Ilustrações ou ícones grandes
   - Textos friendly
   - CTA clara

3. **Animations**:
   - Framer Motion para modals
   - Transições suaves em cards
   - Hover effects

4. **Keyboard shortcuts**:
   - Cmd+K: command palette
   - N: novo item
   - /: search

5. **Bulk actions**:
   - Checkbox selection em tabelas
   - Bulk delete, bulk activate/deactivate

6. **Export features**:
   - Export leads para CSV
   - Export analytics para PDF (opcional)

7. **Dark/Light mode toggle**:
   - Botão no header
   - Persiste preferência

8. **Mobile optimization**:
   - Teste em diferentes devices
   - Ajuste layouts mobile
   - Touch-friendly buttons

9. **Accessibility**:
   - ARIA labels
   - Keyboard navigation
   - Screen reader support

10. **Polish**:
    - Copy refinement
    - Microcopy
    - Helpful tooltips

Faça uma revisão completa da UX e ajuste detalhes!
```

---

## ✅ Checklist Final

Antes de considerar o projeto completo, verifique:

- [ ] Autenticação funcionando (login/register/logout)
- [ ] CRUD de Pixels completo
- [ ] CRUD de Canais completo
- [ ] CRUD de Domínios completo
- [ ] CRUD de Funis completo
- [ ] Geração de tracking script
- [ ] API de tracking (pageview/click)
- [ ] Integração Meta Conversions API
- [ ] Webhooks Telegram configurados
- [ ] Leads sendo capturados
- [ ] CRUD de Postbacks completo
- [ ] Dashboard com métricas
- [ ] Gráficos funcionando
- [ ] Retention table
- [ ] Export CSV
- [ ] Testes passando
- [ ] Deploy na Vercel
- [ ] Variáveis de ambiente configuradas
- [ ] Webhooks em produção
- [ ] Documentação completa
- [ ] UX polido
- [ ] Performance otimizada

---

## 🎯 Ordem Recomendada de Execução

Execute os prompts nesta ordem para melhor resultado:

1. Parte 1: Setup Inicial
2. Parte 2: Database Schema
3. Parte 3: Autenticação
4. Parte 4: Layout Dashboard
5. Parte 5-8: CRUDs (Pixels, Canais, Domínios, Funis)
6. Parte 9: Sistema de Tracking
7. Parte 10: Webhook Telegram
8. Parte 11: Postbacks
9. Parte 12-13: Dashboard & Analytics
10. Parte 14: Lead Details
11. Parte 15: Integrações Avançadas
12. Parte 16: Testes
13. Parte 17: Performance
14. Parte 18: Deploy
15. Parte 19: Documentação
16. Parte 20: Polish Final

---

## 💡 Dicas para uso no Cursor

1. **Cole um prompt por vez** no Cursor e aguarde a conclusão
2. **Revise o código gerado** antes de prosseguir
3. **Teste cada feature** antes da próxima parte
4. **Ajuste o prompt** se necessário para seu caso específico
5. **Mantenha o contexto** mencionando partes anteriores se necessário
6. **Use Cursor Chat** para esclarecer dúvidas durante a implementação

---

## 🚀 Stack Final

- **Frontend**: Next.js 15 + React 19 + TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **Database**: PostgreSQL (Vercel Postgres)
- **ORM**: Drizzle ORM
- **Auth**: NextAuth v5
- **Deploy**: Vercel
- **Forms**: React Hook Form + Zod
- **Charts**: Recharts
- **Icons**: Lucide React
- **Integrations**: Meta Conversions API + Telegram Bot API

---

**Custo estimado**: ~$5-20/mês (Vercel Hobby + Postgres) vs $50-300/mês (Firebase Blaze)
**Performance**: 10x mais rápido que Firebase
**Type Safety**: 100% com TypeScript + Drizzle
**DX**: Perfeito no Cursor com autocomplete total
