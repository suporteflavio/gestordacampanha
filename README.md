# CampanhaOS

Sistema SaaS multi-tenant para gestão de campanhas eleitorais. Desenvolvido com Next.js 14, TypeScript, Tailwind CSS, Prisma ORM e PostgreSQL.

## Funcionalidades

- **Multi-tenancy**: Uma plataforma, múltiplas campanhas isoladas
- **CRM Político**: Gestão de lideranças e eleitores com hierarquia
- **Financeiro**: Controle de receitas, despesas e saldo
- **Reuniões e Eventos**: Agendamento com check-in por GPS e QR Code
- **Vale-Combustível**: Emissão e controle de vouchers digitais
- **Demandas**: Registro e acompanhamento de demandas da comunidade
- **Concorrentes**: Mapeamento estratégico da concorrência
- **Metas de Votos**: Distribuição de metas por município
- **Auditoria**: Histórico completo de ações no sistema
- **Configurações**: Gestão de usuários e identidade visual

## Requisitos

- Node.js 20+
- PostgreSQL 15+
- npm 10+

## Setup Local

### 1. Clone e instale dependências

```bash
git clone <repo-url>
cd gestordacampanha
npm install
```

### 2. Configure variáveis de ambiente

```bash
cp .env.example .env
# Edite o .env com suas configurações
```

Variáveis obrigatórias:

```
DATABASE_URL="postgresql://user:password@localhost:5432/campanhaos"
JWT_SECRET="sua-chave-secreta-de-pelo-menos-32-caracteres"
JWT_REFRESH_SECRET="outra-chave-secreta-de-pelo-menos-32-caracteres"
ROOT_CPF="000.000.000-00"
ROOT_PASSWORD="sua-senha-root"
```

### 3. Configure o banco de dados

```bash
# Criar o banco
createdb campanhaos

# Aplicar o schema
npx prisma db push

# Popular com dados iniciais
npm run db:seed
```

### 4. Inicie o servidor de desenvolvimento

```bash
npm run dev
```

Acesse: http://localhost:3000

## Credenciais de Primeiro Acesso

Após rodar o seed, use:
- **Demo Admin**: CPF `000.000.000-00`, Senha `demo123`
- **Root**: CPF e senha definidos em ROOT_CPF e ROOT_PASSWORD no .env

## Deploy no Railway

### Passo a passo para leigos

1. **Crie uma conta** em https://railway.app

2. **Crie um novo projeto** e clique em "Deploy from GitHub repo"

3. **Adicione os serviços**:
   - Clique em "+ New" → "Database" → "PostgreSQL"
   - Clique em "+ New" → "GitHub Repo" → selecione seu repositório

4. **Configure as variáveis de ambiente** no painel do Railway (aba "Variables"):
   ```
   DATABASE_URL        → (copiado automaticamente do PostgreSQL)
   JWT_SECRET          → (gere com: openssl rand -base64 32)
   JWT_REFRESH_SECRET  → (gere com: openssl rand -base64 32)
   ROOT_CPF            → 000.000.000-00
   ROOT_PASSWORD       → sua-senha-segura
   NODE_ENV            → production
   ```

5. **Configure o build command**:
   - Build Command: `npm run build`
   - Start Command: `npm start`
   - Watch Paths: `/`

6. **Após o primeiro deploy**, abra o terminal do Railway e rode:
   ```bash
   npx prisma db push
   npm run db:seed
   ```

7. **Health check**: Aponte o Railway healthcheck para `/api/health`

### URL do sistema

Após o deploy, o Railway fornecerá uma URL tipo: `https://seu-projeto.up.railway.app`

## Criando a Primeira Campanha

1. Faça login com as credenciais root
2. Você será direcionado ao painel root (em desenvolvimento)
3. Como alternativa, use as credenciais demo: `000.000.000-00` / `demo123`

## Estrutura de Pastas

```
src/
├── app/
│   ├── (auth)/login/         # Página de login
│   ├── (dashboard)/          # Área autenticada
│   │   ├── dashboard/        # Dashboard principal
│   │   ├── leaders/          # Módulo de lideranças
│   │   ├── voters/           # Módulo de eleitores
│   │   ├── meetings/         # Módulo de reuniões
│   │   ├── finance/          # Módulo financeiro
│   │   ├── fuel-vouchers/    # Vale-combustível
│   │   ├── demands/          # Demandas
│   │   ├── competitors/      # Concorrentes
│   │   ├── vote-goals/       # Metas de votos
│   │   ├── audit/            # Auditoria
│   │   └── settings/         # Configurações
│   └── api/                  # Rotas de API
├── components/
│   ├── layout/               # Header, Sidebar, MobileNav
│   ├── contacts/             # Componentes de contatos
│   └── ui/                   # Componentes reutilizáveis
├── lib/
│   ├── auth.ts               # JWT e autenticação
│   ├── db.ts                 # Cliente Prisma
│   └── utils.ts              # Utilitários
└── middleware.ts             # Proteção de rotas
prisma/
├── schema.prisma             # Schema do banco
└── seed.ts                   # Dados iniciais
```

## Decisões Técnicas

- **Next.js 14 App Router**: Framework full-stack com suporte a Server Components
- **JWT + HttpOnly Cookies**: Autenticação segura sem exposição de tokens ao JavaScript
- **tenant_id em todas as tabelas**: Isolamento garantido na camada de aplicação
- **bcrypt cost 12**: Bom equilíbrio entre segurança e performance
- **Prisma ORM**: Type-safe queries com migrations gerenciadas
- **Tailwind CSS dark mode**: Interface moderna e responsiva

## Segurança

- Tokens JWT com expiração de 15 minutos + refresh token de 7 dias
- Bloqueio de conta após 5 tentativas de login incorretas
- Todas as rotas de API validam `tenantId` da sessão
- CPF e dados sensíveis nunca expostos em logs
- Senhas hasheadas com bcrypt (cost factor 12)
