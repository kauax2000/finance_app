# Jornada de acesso: redesenho

Data: 2026-10-12 · Branch: `finance-app-2.0`

## Objetivo

Redesenhar as telas de acesso — `/login`, `/register`, `/forgot-password`,
`/reset-password`, `/invites/accept` — para ficarem mais marcantes, completas,
consistentes e boas no telefone, **só com componentes**: o que não for
componente vira componente.

**Fora do escopo:** mudar a autenticação (continua e-mail e senha no Supabase,
sem login social), mudar a marca (preto e branco, arco-íris como único acento),
o `ChangePasswordDialog` (ele herda o `PasswordRequirements` novo, mas a lacuna
G1 continua à parte).

Referências: Mobbin (Lovable, Buffer, StackAI, Cal.com, Relevance AI,
Hootsuite, Obvious, Cloudflare) — tela dividida, status de "confira seu
e-mail" com o endereço em destaque, checklist de senha que risca o cumprido.

## Arquitetura

O `AuthShell` (`src/components/layout/auth-shell.tsx`) ganha duas props:

- `scene: ReactNode` — a cena do painel de marca, passada por cada tela.
  `AuthBrandPanel` passa a receber a cena como filho em vez de desenhar a
  carteira fixa.
- `media?: ReactNode` — repassado ao `SplitShell`.

E passa `asideMobile="logo"` ao `SplitShell`: no telefone, só o wordmark.

### Mudança no design system (aprovada)

`SplitShell` ganha `media?: ReactNode`: o ícone em ladrilho acima do título,
dentro do `<header>`, com o mesmo respiro do `media` do `PageHeaderTitleRow`.
Entra completo: página `/designsystem/split-shell` (eixo/interruptor "media" e
nota), `split-shell-versions.test.ts`, bullet do `AGENTS.md` e rodada no
`HISTORICO-DESIGN-SYSTEM.md`.

### Peças novas (camada do app, fora de `ui/`)

Todas em `src/components/auth/`, compostas só de peças do DS, sem cor ou
medida crua.

| Peça | O que é | Composta de |
|---|---|---|
| `scenes/login-scene.tsx` | "Seu mês de relance": saldo com a faísca do mês e as próximas contas a vencer | `Card`, `StatCard` + `StatCardChart`, `Item`, `Badge`, `MoneyDisplay` |
| `scenes/register-scene.tsx` | O que a pessoa ganha: entradas × saídas do mês, um orçamento perto do limite, a pilha de quem divide a casa | `StatCard` + `StatCardSplit`, `Progress bands` (`lib/budget-bands`), `AvatarGroup` |
| `scenes/recovery-scene.tsx` | `Timeline` ao vivo — Código enviado → Código conferido → Nova senha — recebendo o passo atual (`email` \| `code` \| `password` \| `done`) | `Card`, `Timeline` (`state` done/current/upcoming) |
| `scenes/invite-scene.tsx` | O espaço compartilhado: ladrilho e nome, membros, o que é dividido | `Card`, `ColorTile`, `AvatarGroup`, `Item` |
| `auth-status.tsx` | Tela de status unificada: `AuthShell` com `media` (ícone num `ColorTile`/ladrilho do DS), título, descrição com o e-mail em destaque, ação primária e secundária | `AuthShell`, `Button` |
| `resend-button.tsx` + `src/hooks/use-cooldown.ts` | Reenviar com contagem de 60 s; desabilitado mostra "Reenviar em 0:42"; ao reenviar, toast e a contagem recomeça; falha não zera a contagem | `Button`, `@/lib/toast` |
| `password-requirements.tsx` (ampliada) | Ganha a barra de força acima do checklist; o checklist fica visível enquanto se digita | `Progress` (`tone` pela nota), `FieldChecklist` |

Os dados de exemplo das cenas são constantes em cada cena, com um
`CardNote` "Números de exemplo." onde houver dinheiro. Nenhum texto mora
direto sobre o campo de marca — tudo dentro de `Card`.

**Movimento:** uma entrada só das cenas (`stagger-ladder` + `rise`), zerada
no movimento reduzido. A timeline da recuperação é o único elemento que se
mexe depois (ao mudar de passo, o `state` muda e o DS anima). Sem outros
efeitos.

## Telas e fluxos

- **Login** — "Entrar" / "Bem-vindo de volta." · cena de login. "Esqueceu a
  senha?" vira `Button variant="link" asChild` (sai a classe à mão). Avisos
  de `reason` seguem como `Alert`. Ids `#email` e `#password` mantidos.
- **Cadastro** — nome, e-mail, senha com `PasswordRequirements` ampliado.
  Sem sessão → `AuthStatus` "Confira seu e-mail" (e-mail em destaque,
  `ResendButton` "Reenviar e-mail" via `supabase.auth.resend({ type:
  "signup", email, options: { emailRedirectTo } })`, secundária "Usar outro
  e-mail" que volta ao formulário). O `secondary` do sucesso vira `tertiary`.
- **Recuperação** — e-mail → código (`ResendButton` "Reenviar código", que
  chama `resetPasswordForEmail` de novo) → nova senha (`PasswordRequirements`)
  → `AuthStatus` "Senha atualizada" (leva ao login em 3 s, com botão
  "Entrar agora"). Entrada por link sem token válido → `AuthStatus` "Link
  expirado" com "Pedir novo código" (`/forgot-password`, com `next`).
- **`next` na recuperação** — `PasswordRecoveryForm` lê `?next=` via
  `getSafeInternalNextPath`, carrega em `redirectTo`
  (`/reset-password?next=…`) e devolve em `/login?reason=password-updated&next=…`
  e nos links de volta ao login.
- **Convite** — fallback do `Suspense` vira `AuthShell` + `AuthFormSkeleton`
  com a cena de convite (acaba o layout que piscava). O par de botões vira
  `primary` + `tertiary` sem `div` de layout à mão. Aceito → `AuthStatus`
  antes de seguir ao app (o redirecionamento atual não muda de destino).

### Força da senha

Nota = regras do `PASSWORD_RULES` cumpridas (0–5). `< 3` → `destructive`,
`3–4` → `warning`, `5` → `success`. Função pura `passwordStrength(password)`
em `src/lib/password-policy.ts`, ao lado da política.

## Erros

Tudo por `formatAuthErrorMessagePt`. Reenvio que falha → `Alert`
destrutivo no lugar, contagem preservada. Limite de taxa do Supabase
(`over_email_send_rate_limit` / 429) ganha frase em português no formatador,
se ainda não tiver.

## Testes e verificação

- Unit: `use-cooldown.test.ts` (fake timers), `password-policy.test.ts`
  (`failedPasswordRules`, `passwordStrength`), `auth-return-path` segue.
- Fonte: `split-shell-versions.test.ts` cobre `media`; as cenas passam no
  `ds:audit`.
- `npx tsc --noEmit && npm run lint && npm run test:unit`.
- Preview: as cinco telas e os status, desktop e telefone (375), claro e
  escuro, sem gravar nada no banco (o dev usa o Supabase de produção).

## Documentação

- `docs/JORNADAS.md` §1: reenviar no código e no "confira seu e-mail"; `next`
  atravessando a recuperação; §11 com as lacunas fechadas (next perdido,
  sem reenviar, fallback do convite).
- `docs/atlas/template.html` → `python3 docs/atlas/build.py` → republicar o
  Atlas no mesmo URL.
