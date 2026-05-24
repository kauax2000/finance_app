# Finance App - Controle de Finanças Pessoais

Um aplicativo web completo para controle de finanças pessoais, desenvolvido com Next.js, Supabase e shadcn/ui.

## 🚀 Funcionalidades

- **Autenticação**: Login/registro com email/senha e Google OAuth
- **Dashboard**: Visão geral com gráficos de receitas vs despesas
- **Carteiras**: Múltiplas contas bancárias/wallets
- **Transações**: Registro de receitas e despesas
- **Categorias**: Categorias customizáveis
- **Design Responsivo**: Funciona em desktop e mobile

## 🛠️ Tech Stack

- **Frontend**: Next.js 14+ (App Router)
- **UI**: shadcn/ui + Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Auth)
- **Gráficos**: Recharts

## 📋 Pré-requisitos

- Node.js 18+
- Conta no Supabase

## 🔧 Configuração

### 1. Clone o projeto
```bash
cd finance-app
```

### 2. Configure as variáveis de ambiente
```bash
cp .env.example .env.local
```

Edite o arquivo `.env.local` e preencha com suas credenciais do Supabase:
```env
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anon-aqui
```

**⚠️ Importante:** Nunca commite o arquivo `.env.local` no Git!

### 3. Configure o banco de dados

Execute o SQL no Supabase SQL Editor:

1. Acesse o [Supabase Dashboard](https://supabase.com/dashboard)
2. Vá em **SQL Editor** no seu projeto
3. Copie todo o conteúdo do arquivo `supabase/schema-production.sql`
4. Execute o SQL

Isso irá criar:
- Tabela `profiles` (estende auth.users)
- Tabela `wallets` (carteiras do usuário)
- Tabela `categories` (categorias de transações)
- Tabela `transactions` (transações)
- Tabela `transaction_splits` (divisão de transações)
- Políticas RLS (Row Level Security)
- Trigger para criar dados padrão para novos usuários
- Bucket de storage para avatares

### 4. Configure o Storage para Avatares

No Supabase Dashboard:
1. Vá em **Storage** > **New bucket**
2. Nome: `avatars`
3. Marque como **Public**

O schema SQL já cria as políticas necessárias para upload de avatares.

### 5. Instale dependências
```bash
npm install
```

### 6. Execute o projeto
```bash
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000) no seu navegador.

## 📁 Estrutura do Projeto

```
src/
├── app/
│   ├── (auth)/          # Páginas de autenticação
│   │   ├── login/
│   │   ├── register/
│   │   ├── forgot-password/
│   │   └── reset-password/
│   ├── (dashboard)/     # Páginas do dashboard
│   │   ├── dashboard/
│   │   ├── wallets/
│   │   ├── transactions/
│   │   ├── categories/
│   │   └── settings/
│   ├── (app)/          # Páginas da conta do usuário
│   │   ├── account/
│   │   │   ├── sessions/
│   │   │   └── activity/
│   │   ├── notifications/
│   │   └── plans/
│   └── page.tsx        # Redirecionamento
├── components/
│   ├── ui/             # Componentes shadcn
│   ├── security/       # Componentes de segurança
│   ├── skeletons/      # Skeletons de carregamento
│   └── providers.tsx   # Provider de autenticação
├── hooks/              # Custom hooks
├── lib/
│   ├── supabase.ts     # Cliente Supabase
│   └── utils.ts       # Utilitários
└── templates/          # Templates reutilizáveis
```

## 📲 PWA (iPhone e offline)

O app pode ser instalado na tela inicial (Safari → Compartilhar → **Adicionar à Tela de Início**) e funciona em modo standalone.

### Build e ícones

```bash
npm run generate:pwa-icons   # gera public/icons/* a partir de public/logo.svg
npm run build                # webpack + Serwist (gera public/sw.js)
```

Em desenvolvimento, o service worker fica desligado por padrão. Para testar localmente:

```bash
NEXT_PUBLIC_PWA_ENABLED=true npm run build && npm start
```

### Checklist manual (iPhone / Safari)

1. Abrir a URL de produção (HTTPS) e fazer login.
2. Compartilhar → Adicionar à Tela de Início.
3. Abrir pelo ícone — sem barra do Safari.
4. Ativar modo avião → abrir o app → dados em cache ainda visíveis.
5. Criar uma transação offline → chip de pendências em Configurações.
6. Desativar modo avião → sincronização automática ao voltar online.

### Testes automatizados

```bash
npm run test:unit          # inclui mutation-gateway offline
npx playwright test e2e/pwa.smoke.spec.ts
```

A migração `supabase/migrations/20260517140000_offline_client_id.sql` adiciona `client_id` para sincronização idempotente.

## 🔔 Push (Web Push + VAPID)

Notificações push usam **Web Push** com chaves VAPID e Edge Functions (`push-subscribe`, `push-unsubscribe`, `deliverNotification` nos produtores).

### Variáveis de ambiente

```bash
# Cliente (Vercel + .env.local)
NEXT_PUBLIC_VAPID_PUBLIC_KEY=<chave pública>

# Supabase secrets (nunca no repositório)
VAPID_PUBLIC_KEY=<mesma chave pública>
VAPID_PRIVATE_KEY=<chave privada>
VAPID_SUBJECT=mailto:seu@dominio.com
```

Gerar par de chaves:

```bash
npx web-push generate-vapid-keys
```

Aplicar migração:

```bash
supabase db push
```

Deploy das functions (inclui push):

```bash
npm run supabase:deploy:functions
```

### Checklist manual (push)

1. **Desktop Chrome:** Configurações → Notificações → ativar **Push no dispositivo** → criar categoria ou disparar orçamento → push + linha na central.
2. **iPhone (iOS 16.4+):** instalar pela Tela de Início → ativar push nas preferências → permissão do sistema → testar com app em background.
3. Desligar `notify_push` → sem push; central in-app continua se habilitada.
4. Revogar permissão no SO → UI mostra estado bloqueado.

### Alertas de despesa (carteira compartilhada)

Quando outro membro adiciona uma **despesa manual** em uma carteira compartilhada, os demais membros recebem notificação in-app e push (se habilitados).

**Deploy:** configure o Database Webhook em `public.transactions` (INSERT) → Edge Function `notify-transaction-created`. Detalhes em [`supabase/NOTIFICATION_DEPLOYMENT.md`](supabase/NOTIFICATION_DEPLOYMENT.md).

**Smoke test:** User B adiciona despesa na carteira compartilhada → User A vê central + push no iPhone (PWA instalada).

## 🔒 Segurança

O projeto implementa:

- **Row Level Security (RLS)**: Usuários só veem seus próprios dados
- **Autenticação via Supabase Auth**: JWT tokens para sessões
- **Validação de senhas**: Requisitos mínimos de segurança
- **Proteção contra CSRF/XSS**: Via Next.js e Supabase

### Variáveis de Ambiente de Segurança

```env
# Cliente (públicas)
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...

# Servidor (NUNCA exponha no frontend)
SUPABASE_SERVICE_ROLE_KEY=...  # Apenas para APIs server-side
```

## 🎨 Design

O projeto usa shadcn/ui com o preset `b1a1d8m2s`. Para adicionar novos componentes:
```bash
npx shadcn@latest add button
```

## 🐛 Problemas Comuns

### "Missing Supabase environment variables"
Verifique se o arquivo `.env.local` existe e contém as variáveis corretas.

### "RLS policy denied"
Certifique-se de executar o SQL do `schema-production.sql` no Supabase.

### "Avatar não carrega"
Verifique se o bucket `avatars` foi criado no Storage e está público.

## 📄 License

MIT
