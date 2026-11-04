# Reativação — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Registrar o último acesso e a última abertura como app, esconder a seção "No celular" do computador enquanto o app está em uso, mostrar o diálogo de volta depois de 10 dias e mandar dois avisos de reativação (3º e 7º dia).

**Architecture:** Uma migração (duas colunas em `user_settings`, a tabela de dedupe e o cron); regras puras em `src/lib/reativacao.ts` (front) e `supabase/functions/_shared/reativacao.ts` (Edge), testadas; um componente `RegistroDeAcesso` montado na casca do app que lê o acesso anterior, grava o de hoje e abre o `DialogoDeVolta`; a Edge `reativacao` chamada pelo `pg_cron`.

**Tech Stack:** Next/React + TanStack Query, Supabase (Postgres, Edge Functions em Deno), vitest e `npm run test:edge`.

**Spec:** `docs/superpowers/specs/2026-11-04-reativacao-design.md`

## Global Constraints

- **Prazo de 10 dias** (`PRAZO_DIAS = 10`) para a seção do computador e o diálogo; avisos no **3º** (janela 3–6 dias) e no **7º** (janela 7–9) dia sem acesso, dias pela data de `America/Sao_Paulo`.
- **Nada vai ao ar sem o dono**: a migração não é aplicada e as Edges não são publicadas nesta execução (o banco de desenvolvimento é o de produção). Só código, testes e documentos.
- Gravação do acesso: no máximo uma vez por dia por aparelho (marca em `localStorage`, chave `acesso:<userId>`, valor `YYYY-MM-DD` local), `ensureUserSettingsRow` antes do `update`.
- Design system do `AGENTS.md`: só `@/components/ui/*`; nada em `src/components/ui/`, `globals.css`, `designsystem/`; tokens; Heroicons pela régua; rodapé de diálogo pela tabela (cancelar `tertiary` antes, ação `primary`).
- Não rode prettier em `src/components/account/`. Commit só dos arquivos da tarefa, por caminho explícito.

## Review Focus

- Conta nova (`ultimo_acesso_em` nulo) nunca vê o diálogo de volta.
- Duas abas ou dois componentes lendo o acesso não gravam duas vezes nem calculam "voltou" depois da própria gravação (o "voltou" usa o valor lido **antes** de gravar).
- Sem `localStorage` (navegação privada), a gravação ainda acontece no máximo uma vez por carga, e nada quebra.
- A seção "No celular" não pisca no computador enquanto o acesso carrega.
- A Edge não manda o aviso do 3º dia a quem já recebeu nesta ausência, nem o do 7º duas vezes; um novo acesso rearma.

---

### Task 1: O sinal (migração, regras e o registro do acesso)

**Files:**
- Create: `supabase/migrations/20261104120000_reativacao.sql`
- Create: `src/lib/reativacao.ts`, `src/lib/reativacao.test.ts`
- Create: `src/components/reativacao/registro-de-acesso.tsx` (só o registro nesta tarefa; o diálogo entra na Task 3)
- Create: `src/hooks/use-acesso.ts`
- Modify: `src/app/(app)/layout-client.tsx` (montar `<RegistroDeAcesso />` dentro do `SidebarAppShell`)

**Interfaces:**
- Produces:
  - SQL: `user_settings.ultimo_acesso_em timestamptz`, `user_settings.app_aberto_em timestamptz` (nulas); `public.reativacao_envios (user_id uuid references auth.users on delete cascade, marco smallint check (marco in (3,7)), referente date, enviado_em timestamptz default now(), primary key (user_id, marco, referente))` com RLS e `revoke all ... from anon, authenticated`; cron `reativacao-daily` em `'0 15 * * *'` chamando `public.invoke_edge_function('reativacao')`, no mesmo bloco `do $cron$` do lembrete das 20h (`20261023120000_captura.sql`).
  - `src/lib/reativacao.ts`: `export const PRAZO_DIAS = 10`; `export function diasDesde(iso: string, agora: Date): number` (dias inteiros pela data local); `export function voltouDeAusencia(anterior: string | null, agora: Date): boolean` (anterior não nulo e `diasDesde >= PRAZO_DIAS`); `export function appRecente(appAbertoEm: string | null, agora: Date): boolean` (não nulo e `diasDesde < PRAZO_DIAS`); `export function deveGravar(marca: string | null, hoje: string): boolean` (`marca !== hoje`).
  - `src/hooks/use-acesso.ts`: `export function useAcesso(): { carregando: boolean; ultimoAcessoEm: string | null; appAbertoEm: string | null }` — `useQuery` com chave `["acesso", user?.id]`, lê as duas colunas de `user_settings` (`maybeSingle`), `staleTime: Infinity` (o valor da sessão é o lido antes de gravar; não invalidar depois).
  - `RegistroDeAcesso`: usa `useAcesso`; quando carregou, se `deveGravar(marca, hoje)`, chama `ensureUserSettingsRow` e grava `ultimo_acesso_em = now` e, com `useDisplayMode().isStandalone`, `app_aberto_em = now`; grava a marca. Falha de rede é silenciosa (tenta de novo na próxima carga). Expõe o "voltou" para a Task 3 pelo próprio componente (estado interno calculado de `voltouDeAusencia(ultimoAcessoEm, agora)` na primeira leitura).

- [ ] **Step 1: Testes das regras** em `src/lib/reativacao.test.ts`:

```ts
import { describe, expect, it } from "vitest"
import { PRAZO_DIAS, appRecente, deveGravar, diasDesde, voltouDeAusencia } from "./reativacao"

const agora = new Date("2026-11-20T12:00:00-03:00")
describe("reativacao", () => {
    it("o prazo é de 10 dias", () => expect(PRAZO_DIAS).toBe(10))
    it("conta os dias pela data", () => {
        expect(diasDesde("2026-11-10T23:30:00-03:00", agora)).toBe(10)
        expect(diasDesde("2026-11-20T08:00:00-03:00", agora)).toBe(0)
    })
    it("voltou só depois de 10 dias, e conta nova não volta", () => {
        expect(voltouDeAusencia("2026-11-10T09:00:00-03:00", agora)).toBe(true)
        expect(voltouDeAusencia("2026-11-11T09:00:00-03:00", agora)).toBe(false)
        expect(voltouDeAusencia(null, agora)).toBe(false)
    })
    it("app recente enquanto houver uso nos últimos 10 dias", () => {
        expect(appRecente("2026-11-11T09:00:00-03:00", agora)).toBe(true)
        expect(appRecente("2026-11-10T09:00:00-03:00", agora)).toBe(false)
        expect(appRecente(null, agora)).toBe(false)
    })
    it("grava uma vez por dia", () => {
        expect(deveGravar(null, "2026-11-20")).toBe(true)
        expect(deveGravar("2026-11-19", "2026-11-20")).toBe(true)
        expect(deveGravar("2026-11-20", "2026-11-20")).toBe(false)
    })
})
```

- [ ] **Step 2: Rodar e ver falhar** — `npx vitest run src/lib/reativacao.test.ts` → FAIL.
- [ ] **Step 3: Implementar** a migração (não aplicar), `reativacao.ts`, `use-acesso.ts`, `RegistroDeAcesso` e a montagem na casca; o `localStorage` em `try/catch`.
- [ ] **Step 4: Rodar** `npx vitest run src/lib/reativacao.test.ts && npx tsc --noEmit && npx eslint src/lib/reativacao.ts src/hooks/use-acesso.ts src/components/reativacao/registro-de-acesso.tsx "src/app/(app)/layout-client.tsx"` → passam.
- [ ] **Step 5: Commit** (`feat(reativacao): o registro do último acesso e da abertura como app`), só esses arquivos.

---

### Task 2: A seção "No celular" some com o app em uso

**Files:**
- Modify: `src/components/settings/theme-settings.tsx` (hoje: `noComputador = useAparelhoDeLancar() === "computador"`)
- Test: `src/components/settings/settings-page.test.ts`

**Interfaces:**
- Consumes: `useAcesso()` e `appRecente()` (Task 1).

- [ ] **Step 1: Teste** (no `describe("Configurações: o lançamento mora no celular")`):

```ts
it("a seção No celular some enquanto o app instalado está em uso", () => {
    const t = semComentarios(lerFonte("src/components/settings/theme-settings.tsx"))
    expect(t).toContain("useAcesso()")
    expect(t).toMatch(/appRecente\(/)
    expect(t).toMatch(/carregando/)
})
```

- [ ] **Step 2: Rodar e ver falhar.**
- [ ] **Step 3:** a seção "No celular" aparece só com `noComputador && !acesso.carregando && !appRecente(acesso.appAbertoEm, new Date())`.
- [ ] **Step 4: Rodar** o teste, `tsc`, `eslint`, `npm run ds:audit -- src/components/settings/theme-settings.tsx`.
- [ ] **Step 5: Commit** (`feat(reativacao): a seção No celular some enquanto o app está em uso`).

---

### Task 3: O diálogo de volta

**Files:**
- Create: `src/components/reativacao/dialogo-de-volta.tsx`
- Modify: `src/components/reativacao/registro-de-acesso.tsx` (abrir o diálogo)
- Test: `src/components/reativacao/dialogo-de-volta.test.ts` (fonte)

**Interfaces:**
- Consumes: o "voltou" do `RegistroDeAcesso` (Task 1); `useAparelhoDeLancar()`; `InstallPwaSheet` (`@/components/pwa/install-pwa-sheet`); `QrCode` (`@/components/ui/qr-code`, com `link={false}`, como em `no-celular-cartao.tsx`); o lançamento é aberto como o "+ Adicionar" abre hoje (procure o gatilho do "+ Adicionar" e reaproveite a mesma função ou evento, sem duplicar o formulário).
- Produces: `export function DialogoDeVolta({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void })`.

Copy (spec, "O diálogo de volta"): título **"Que bom te ver de volta"** nos três; por aparelho:
- `iphone-instalado` / `android-instalado`: **"Põe os gastos em dia: quem lança todo dia sabe para onde o dinheiro vai."** · primário **"Lançar um gasto"** · secundário (link) **"Ver o que está a conferir"** → `/transactions?conferir=1` · cancelar **"Agora não"**.
- `navegador-iphone`: **"No app instalado você lança em segundos, direto da tela de início."** · primário **"Como instalar"** (abre o `InstallPwaSheet`) · **"Agora não"**.
- `navegador-android`: a mesma frase + **"No menu do navegador, toque em Instalar app."** · **"Agora não"** (só cancelar, que vira `secondary` sozinho por ser botão único).
- `computador`: **"O dia a dia do Finance é no celular: lá você lança na hora da compra."** · o QR do link de `/me#no-celular` (como o `ThemeSettings` monta) · **"Agora não"**.
- `sabendo`: não abre.

O `RegistroDeAcesso` abre o diálogo uma vez por sessão quando "voltou" é verdadeiro, depois de 1,5s, **e só se não houver outro `[role="dialog"]` aberto** naquele momento (se houver, não abre nesta sessão).

- [ ] **Step 1: Teste** de fonte com as frases acima, `/transactions?conferir=1`, `InstallPwaSheet`, `QrCode`, e no registro: `voltouDeAusencia(`, `[role="dialog"]`.
- [ ] **Step 2: Rodar e ver falhar.**
- [ ] **Step 3: Implementar.**
- [ ] **Step 4: Rodar** teste, `tsc`, `eslint`, `npm run ds:audit -- src/components/reativacao`.
- [ ] **Step 5: Commit** (`feat(reativacao): o diálogo de volta depois de 10 dias`).

---

### Task 4: Os avisos de reativação e o push recusado

**Files:**
- Create: `supabase/functions/_shared/reativacao.ts`, `supabase/functions/_shared/reativacao.test.ts`
- Create: `supabase/functions/reativacao/index.ts` (no molde de `supabase/functions/review-reminder/index.ts`: `CRON_SECRET` por `secretMatches`, cliente admin, `forEachLimit`)
- Modify: `supabase/functions/_shared/web-push-send.ts` (zerar `app_aberto_em` quando a pessoa fica sem inscrição)
- Modify: `package.json` (`reativacao` no `supabase:deploy:functions`)

**Interfaces:**
- Produces (`_shared/reativacao.ts`):
  - `export function marcoDoDia(dias: number): 3 | 7 | null` — 3 para 3–6, 7 para 7–9, senão `null`.
  - `export function textoDoAviso(marco: 3 | 7, ultimoAcessoYmd: string): { titulo: string; corpo: string }` — marco 3: `"Seus gastos estão esperando"` / `` `Leva 10 segundos lançar o que você gastou desde ${diaDaSemana}.` `` (dia da semana em pt-BR, minúsculo, de `ultimoAcessoYmd`); marco 7: `"Uma semana sem lançar"` / `"Abra o Finance e ponha o mês em dia."`.
- A Edge: lê `user_settings` com `ultimo_acesso_em` não nulo; calcula os dias pela data de Brasília (`appTodayYmd` de `_shared/credit-card-cycle.ts`); `marcoDoDia`; pula quem já tem linha em `reativacao_envios` para `(user_id, marco, referente = data do último acesso)`; exige `notify_review` ligado em pelo menos uma carteira (`workspace_member_notification_prefs`); manda pelo `sendWebPushToUser` com o `workspace_id` de `current_workspace_id` (ou a primeira carteira) e link para o Painel; grava o envio.
- `web-push-send.ts`: depois do `delete` de uma inscrição expirada, se a pessoa não tiver mais nenhuma em `push_subscriptions`, `update user_settings set app_aberto_em = null where user_id = ...`.

- [ ] **Step 1: Testes** em `_shared/reativacao.test.ts` (Deno, `assertEquals`):
  - `marcoDoDia`: 2→null, 3→3, 6→3, 7→7, 9→7, 10→null.
  - `textoDoAviso(3, "2026-11-17")` → corpo termina em `"desde terça."` (17/11/2026 é terça); `textoDoAviso(7, …)` → título `"Uma semana sem lançar"`.
- [ ] **Step 2: Rodar e ver falhar** — `npm run test:edge`.
- [ ] **Step 3: Implementar** os quatro arquivos; checar com `deno check --node-modules-dir=none supabase/functions/reativacao/index.ts`.
- [ ] **Step 4: Rodar** `npm run test:edge` e o `deno check` → passam.
- [ ] **Step 5: Commit** (`feat(reativacao): os avisos do 3º e do 7º dia e o app recusado pelo push`).

---

### Task 5: Jornadas e Atlas

**Files:** `docs/JORNADAS.md`, `docs/atlas/template.html`, gerar `docs/atlas/atlas-jornadas.html`.

- [ ] **Step 1:** a jornada de Configurações (a seção "No celular" some e volta), a do app instalado e uma subseção de reativação (o registro, o diálogo de volta por aparelho, os avisos do 3º e 7º dia, a Edge `reativacao` e o cron), com fluxograma (`%%{init}%%`, sem ids reservados) e linha de regras; a lacuna "nada publicado: migração e Edges dependem do dono".
- [ ] **Step 2:** `python3 docs/atlas/build.py`.
- [ ] **Step 3: Commit** (`docs(jornadas): reativação`). A republicação é do controlador.
