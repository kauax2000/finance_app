# "Lançar ao pagar" (Apple Pay) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Tirar o passo 7 (a automação do Apple Pay) do guia "Conectar o iPhone" e dar a ela uma seção própria em Minha conta, "Lançar ao pagar", logo abaixo de "Lançar sem abrir o app", com um guia curto no mesmo formato.

**Architecture:** As peças visuais do guia (a janela do aparelho, a onda do desfoque, os pontos e a caixa de altura animada) saem de `guia-do-atalho.tsx` para `passo-a-passo.tsx`, e os dois guias as usam. A lista de aparelhos passa para um hook, `useAparelhosDeCaptura`, que as duas seções leem (a mesma `queryKey`). A seção nova só oferece configurar quando há aparelho conectado: a automação roda o atalho "Lançar gasto", que o primeiro guia instala.

**Tech Stack:** Next 16, React 19, `motion/react`, componentes de `src/components/ui/`, TanStack Query, vitest por leitura de fonte (`src/test/fonte.ts`).

**Spec:** o pedido do dono em 2026-11-03 ("Separe o passo 7, uma nova feature, logo abaixo"; ele pulou as perguntas). As decisões do Claude, ditas a ele: seção nova com o mesmo formato de guia, o passo 7 sai do guia do iPhone.

## Global Constraints

- Texto em português, sem jargão; nunca "token" na tela.
- Design system: só `ui/` e tokens; Heroicons pela régua; todo `<button>` cru declara `type`; um `primary` por tela; nada novo em `src/components/ui/`, `globals.css` ou `src/app/designsystem/`.
- O movimento do passo é o de hoje: a onda do desfoque (`PECA`, 30ms entre peças, 500ms, `--ease-out`), sem deslocamento lateral; a altura anda pela `useAlturaAnimada` com `data-altura-em-voo`; movimento reduzido troca na hora.
- Telas: só as que já existem em `src/components/account/assets/` (o passo final usa `atalho-6-apple-pay.webp`); passo sem tela não leva imagem. Nada de logo da Apple.
- O banco de desenvolvimento é o de produção: nenhum agente cria dado nem abre o navegador.
- Commits só com os arquivos de cada tarefa (`git add <arquivos>`); a árvore tem trabalho alheio sem commit.
- Mudança de jornada: `docs/JORNADAS.md` e `docs/atlas/template.html` editados e o Atlas regerado (`python3 docs/atlas/build.py`); esses três ficam **sem commit** (carregam linhas do selo), e a republicação é da sessão principal.

## Review Focus

1. **Sem aparelho conectado**: a seção nova não abre um guia que manda usar um atalho que a pessoa não tem. Teste: com `tokens.length === 0` o texto é "Conecte o iPhone primeiro, em Lançar sem abrir o app." e não há botão de configurar.
2. **Lista com erro ou carregando**: a seção nova não pisca entre os dois estados. Teste: enquanto `isPending`, um esqueleto; com `isError`, o mesmo texto de erro curto da seção de cima.
3. **Guia do iPhone com 6 passos**: nada no guia do iPhone ainda fala do passo 7 ("de 7", "Lance ao pagar"). Teste em `conta.test.ts`.
4. **Uma `queryKey` só**: as duas seções não fazem duas buscas diferentes nem desencontram depois de conectar/desconectar. Teste: o hook usa `["capture_tokens", user?.id]` e o `aoCriar`/`revogar` invalida essa chave.
5. **Fechar e reabrir o guia novo** volta ao passo 1. Teste: `setPasso(0)` ao abrir.

---

### Task 1: O motor do passo a passo, e o guia do iPhone com 6 passos

**Files:**
- Create: `src/components/account/passo-a-passo.tsx`
- Modify: `src/components/account/guia-do-atalho.tsx` (passa a importar as peças; o passo 7 sai)
- Test: `src/components/account/conta.test.ts`

**Interfaces:**
- Produces (em `passo-a-passo.tsx`):
  - `export type Tela = { imagem: StaticImageData; ponto?: { x: number; y: number }; ancora: "topo" | "baixo" }`
  - `export const PECA: Variants` (a de hoje, movida)
  - `export function JanelaDoAparelho({ tela, compacta }: { tela: Tela; compacta?: boolean })` (movida, igual)
  - `export function CaixaDoPasso({ chave, entrar, children }: { chave: string; entrar: boolean; children: ReactNode })` — a caixa de altura animada (`useAlturaAnimada` + `data-altura-em-voo=""`) com o bloco do passo (`motion.div` com `initial={entrar ? "oculto" : false}`, `animate="visivel"`, `staggerChildren: 0.03`, `delayChildren: 0.04`, `flex flex-col gap-4`); `entrar` já embute o movimento reduzido de quem chama.
  - `export function PecaDoPasso({ className, children }: { className?: string; children: ReactNode })` — `motion.div variants={PECA}`.
  - `export function PontosDoPasso({ total, atual }: { total: number; atual: number })` — os pontos de hoje, `aria-hidden`.
- `TELA_DA_NOTIFICACAO` fica exportada de `passo-a-passo.tsx` (`{ imagem: atalho-6-apple-pay, ancora: "topo" }`); `atalho-secao.tsx` passa a importá-la de lá.

- [ ] **Step 1: Testes** — em `conta.test.ts`: o guia do iPhone tem 6 passos (`PASSOS` com 6 entradas; não contém "Lance ao pagar" nem "de 7"); `guia-do-atalho.tsx` importa `CaixaDoPasso`, `PecaDoPasso`, `PontosDoPasso` e `JanelaDoAparelho` de `./passo-a-passo` e não declara mais `useAlturaAnimada` nem `const PECA`; `passo-a-passo.tsx` contém `data-altura-em-voo=""` e `staggerChildren: 0.03`. Ajuste os testes que hoje leem essas peças em `guia-do-atalho.tsx` para ler `passo-a-passo.tsx`.
- [ ] **Step 2:** rodar, ver falhar.
- [ ] **Step 3:** mover as peças sem mudar o comportamento; tirar o passo 7 (a entrada de `PASSOS`, o texto em `textos`); o último passo passa a ser o 6, e o botão do fim continua "Pronto".
- [ ] **Step 4:** `npx tsc --noEmit && npx vitest run src/components/account && npx eslint src/components/account && node .claude/skills/design-system-guard/scripts/audit.mjs src/components/account` — verde.
- [ ] **Step 5:** commit `refactor(conta): o passo a passo vira peça, e o guia do iPhone fica em 6 passos`.

### Task 2: A seção "Lançar ao pagar" e o guia dela

**Files:**
- Create: `src/components/account/aparelhos-de-captura.ts` (o hook), `src/components/account/apple-pay-secao.tsx`, `src/components/account/guia-do-apple-pay.tsx`
- Modify: `src/components/account/atalho-secao.tsx` (usa o hook), `src/app/(app)/account/page-client.tsx` (a seção nova logo depois de `<AtalhoSecao />`)
- Test: `src/components/account/conta.test.ts`

**Interfaces:**
- Consumes: as peças da Task 1.
- Produces: `export function useAparelhosDeCaptura()` → o `useQuery` de hoje de `atalho-secao.tsx` (mesmas `COLUNAS`, `queryKey: ["capture_tokens", user?.id]`, `retry: false`, `meta: { errorToast: false }`), mais `ativos: CaptureToken[]` (os sem `revoked_at`). `export function ApplePaySecao()`. `export function GuiaDoApplePay({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void })`.

A seção (`SettingsSection titulo="Lançar ao pagar"`, um `Card padding="none"` com um `Item variant="flush"`):
- com aparelho: título "Lançar ao pagar com Apple Pay", texto "Cada compra com o iPhone vira um gasto no Finance, sozinha." e o `Button variant="secondary"` "Configurar" no `ItemActions`, que abre o guia;
- sem aparelho: o mesmo título, o texto "Conecte o iPhone primeiro, em Lançar sem abrir o app." e nenhum botão;
- carregando: `SkeletonGroup` como a seção de cima; com erro: `CardMessage tone="destructive"` "Não foi possível ver os aparelhos.".

O guia (`Dialog surface="auto"`, título "Lançar ao pagar", descrição "O Lançar gasto roda sozinho a cada compra com Apple Pay."), três passos, mesma mecânica do guia do iPhone (`CaixaDoPasso`, `PecaDoPasso`, `PontosDoPasso`, Voltar `tertiary` / Próximo e Pronto `primary`, `aria-live` "Passo N de 3: título"):
1. "Abra o Lançar gasto" · "No app **Atalhos**, toque e segure o **Lançar gasto** e escolha **Editar**." · sem tela
2. "Crie a automação da Carteira" · "Toque em **Adicionar automação**, escolha **Carteira** e marque os cartões que você usa no iPhone." · sem tela
3. "Marque Executar imediatamente" · "Assim ele não pergunta nada a cada compra. Pague com o iPhone e o gasto aparece: **Gasto lançado: R$ 42,90**." · `TELA_DA_NOTIFICACAO`
Comentário `shortcut:` nos passos 1 e 2: sem captura real do iOS 27 (o simulador não tem Apple Pay); trocar pelo print do iPhone quando houver.

- [ ] **Step 1: Testes** — `apple-pay-secao.tsx` lê `useAparelhosDeCaptura` (e não `supabase.from` direto); mostra "Conecte o iPhone primeiro, em Lançar sem abrir o app." no ramo `ativos.length === 0` e "Configurar" no outro; `atalho-secao.tsx` também usa o hook; o hook tem `queryKey: ["capture_tokens", user?.id]` e `COLUNAS`; `guia-do-apple-pay.tsx` tem 3 passos, usa `CaixaDoPasso`, reinicia com `setPasso(0)` ao abrir, e importa `TELA_DA_NOTIFICACAO`; `page-client.tsx` tem `<ApplePaySecao />` logo depois de `<AtalhoSecao />`; nenhum dos novos tem "token" em texto de tela.
- [ ] **Step 2:** rodar, ver falhar.
- [ ] **Step 3:** implementar.
- [ ] **Step 4:** a mesma linha de verificação da Task 1, mais `src/app/(app)/account` no vitest.
- [ ] **Step 5:** commit `feat(conta): Lançar ao pagar, a automação do Apple Pay numa seção própria`.

### Task 3: Jornadas e o guia do dono

**Files:**
- Modify: `docs/JORNADAS.md`, `docs/atlas/template.html`, `docs/captura/atalho-iphone.md`

- [ ] **Step 1:** nas jornadas, o guia do iPhone passa a 6 passos; nasce a seção "Lançar ao pagar" (com aparelho, "Configurar" abre o guia de 3 passos; sem aparelho, o texto que manda conectar antes); no `atalho-iphone.md`, a parte da automação aponta para a seção nova.
- [ ] **Step 2:** `python3 docs/atlas/build.py` → `ok`.
- [ ] **Step 3:** commit só de `docs/captura/atalho-iphone.md`: `docs(captura): a automação do Apple Pay na seção própria`.
