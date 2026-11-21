# Aurora: o acabamento — plano

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** a aurora do `ThemeToggle` ganha a cor colada na borda, o aro aceso, um ritmo por
sentido, a parada tocada acesa, a volta no meio da troca, a onda sem emenda e ondas curtas.

**Architecture:** tudo segue na mesma View Transition (`lib/aurora-do-tema.ts`,
`lib/vidro-na-revelacao.ts`, `theme-toggle.tsx`, `@utility theme-aurora`). A paleta do destino
passa da faixa para o `<html>` durante a troca (`data-aurora`), para a faixa, o aro e a parada
lerem as mesmas variáveis. Elementos novos (o aro, a parada) ganham `view-transition-name` só
durante a troca, como a faixa.

**Tech Stack:** Next.js 16 / React 19, Web Animations API, View Transitions API, Tailwind v4, Vitest.

**Spec:** `docs/superpowers/specs/2026-11-22-aurora-acabamento-design.md` (sobre a rodada 411:
`docs/superpowers/specs/2026-11-21-aurora-pela-borda-do-tema-design.md`). Protótipo aprovado:
`/private/tmp/claude-501/-Users-kaualeandro-Desktop-Finance-App-finance-app-dev/d8ad1d0b-c83b-41f3-8854-a46d7f1896af/scratchpad/proto/v3.html` (opção "Nova").

## Global Constraints

- Branch `finance-app-2.0`; sem push/merge; commit só dos arquivos tocados, por caminho.
- `AURORA = { varredura: 0.6, faixa: 0.6, opacidade: 0.85 }` e
  `RITMO = { desce: { duracao: 1250, easing: "cubic-bezier(0.55, 0, 0.15, 1)" }, sobe: { duracao: 950, easing: "cubic-bezier(0.3, 0, 0.2, 1)" } }` (saem `AURORA.duracao` e `AURORA.easing`).
- A página velha **não** escurece nem se afasta (recusado pelo dono).
- `view-transition-name` só inline, só durante a troca (faixa, aro, parada); nenhum seletor CSS o declara.
- Só tokens; nenhuma cor crua (o claro do aro vem de um token branco nos dois temas — ver Task 1).
- Fica: a faixa sai 50ms antes do fim da animação dela; as guardas; troca na hora com movimento
  reduzido, `reveal={false}` ou sem API. Sem `*` em nome de classe/variável em docs.

## Review Focus

1. **A volta no meio** (tocar a parada de antes enquanto a troca anda): o tema volta, as animações
   invertem, e no fim nada fica (faixa, aro, nome da parada, `data-aurora`, `.theme-reveal`). Teste
   de fonte na Task 2.
2. **Tocar a volta antes do `ready`** (animações ainda não existem): cai no caminho normal (nova
   troca), sem erro. Teste de fonte na Task 2.
3. **Tema "sistema"**: o sentido e a paleta saem do tema resultante (já coberto; o `data-aurora`
   é escrito depois do `setTheme`). Teste na Task 1.
4. **Várias instâncias do seletor na tela** (o catálogo): acende a parada do seletor tocado, não
   a de outro. Teste de fonte na Task 2 (a parada vem de um ref da raiz do seletor).
5. **Emenda da onda**: período inteiro dentro do tile e prolongamento de um período de cada lado.
   Teste na Task 1.

---

### Task 1: onda curta, ritmo, faixa colada, aro e paleta no `<html>`

**Files:** `src/lib/aurora-do-tema.ts`, `src/lib/vidro-na-revelacao.ts`,
`src/components/ui/theme-toggle.tsx` (só o necessário para compilar e ligar o aro e o
`data-aurora`), `src/app/globals.css` (`@utility theme-aurora` e a nova `@utility theme-aurora-aro`),
testes `src/lib/aurora-do-tema.test.ts`, `src/lib/vidro-na-revelacao.test.ts`,
`src/components/ui/theme-toggle.test.ts`.

**Interfaces (produz):**
- `export const RITMO: Record<Sentido, { duracao: number; easing: string }>` (valores acima).
- `ONDA` = `"M-100 150Q-75 144 -50 150T0 150T50 150T100 150T150 150T200 150T250 150T300 150"`;
  `mascaraDaAurora(lado)` fecha com `V-30H-100Z` (`acima`) ou `V330H-100Z` (`abaixo`), mesmo
  `viewBox='0 0 200 300'` e borrão 2.2.
- `quadrosDaMascara(altura, largura, sentido, lado?, caixa?)`: `maskSize` =
  `${2*largura/3}px ${3*altura}px` (três ondas por tela); deslize X `0` → `-0.8*largura/3` →
  `-1.2*largura/3`; Y como hoje; primeiro quadro com `easing: RITMO[sentido].easing`.
- `quadrosDaFaixa(altura, sentido)`: `bh = altura*AURORA.faixa`; `desce`:
  `translateY(y - 0.92*bh)` com y `-0.15h` → `1.15h` → `1.25h`; `sobe`: `translateY(y - 0.08*bh)`
  com y `1.15h` → `-0.15h` → `-0.25h`; opacidade `0.85, 0.85, 0`; easing do `RITMO`.
- `export const NOME_DO_ARO = "theme-aurora-aro"`;
  `export function mascaraDoAro(): string` — SVG `viewBox='0 130 200 40' preserveAspectRatio='none'`,
  `path` só traço (`fill='none' stroke='white' stroke-width='3' vector-effect='non-scaling-stroke'`)
  com a `ONDA`;
  `export function criarAro(doc: Document, altura: number, largura: number): () => void` — `div`
  `.theme-aurora-aro`, `aria-hidden`, `height: 0.4*altura px`, `mask-image`/`-webkit-mask-image`
  `mascaraDoAro()`, `mask-size` `${2*largura/3}px ${0.4*altura}px`, `repeat-x`,
  `viewTransitionName = NOME_DO_ARO`; remove órfão antes; devolve a remoção.
- `export function quadrosDoAro(altura: number, sentido: Sentido): Keyframe[]` —
  `translateY(y - 0.2*altura)`, y como a borda (`-0.15h`→`1.15h` no `desce`, o inverso no
  `sobe`), opacidade `1, 1, 0`.
- `animarAurora(html, altura, largura, sentido, vidros, aro?: HTMLElement): Animation[]` — anima
  raiz, faixa (`RITMO[sentido].duracao - 50`, `fill: "both"`, **primeira do array**), aro (pseudo
  `::view-transition-new(theme-aurora-aro)` com `quadrosDoAro` + o próprio elemento `aro` com a
  `mask-position` X deslizando na escala da onda) e vidros; devolve todas as animações.
- `revelarVidros(html, vidros, altura, largura, sentido)` — mesma geometria nova e o tempo do `RITMO`.
- Paleta: o `theme-toggle` escreve `html.dataset.aurora = sentido` no callback, depois do
  `setTheme`, e apaga no `finally`. O CSS declara `--aurora-1..3` frias em `.theme-reveal` e
  quentes em `.theme-reveal[data-aurora="sobe"]` (saem do bloco da faixa); a faixa vira no `sobe`
  por `html[data-aurora="sobe"] .theme-aurora::before` (ou equivalente aninhado).
- `@utility theme-aurora-aro` (depois de `no-scrollbar`): `position: fixed; left: 0; top: 0;
  width: 100vw; pointer-events: none; z-index: var(--z-toast)`; fundo
  `color-mix(in oklch, var(--aurora-3) 45%, <token branco>)`, `filter: blur(1.5px)
  drop-shadow(0 0 6px color-mix(in oklch, var(--aurora-3) 70%, <token branco>))`. O token branco
  nos dois temas: procure com `npm run ds:catalog` (candidatos: `--scrim-foreground`); se nenhum
  for branco nos dois, use `--primary-foreground` no escuro e `--background` no claro por
  `:root`/`.dark` **numa variável local da utility**, e registre a escolha no relatório.
- `.theme-reveal::view-transition-*(theme-aurora-aro)` e `(theme-aurora-parada)` com `animation: none`.

- [ ] **Step 1: testes** (ajuste os da rodada 411; novos):
  - `RITMO` e `AURORA` iguais ao Global Constraints; `AURORA` sem `duracao`/`easing`.
  - `mascaraDaAurora("acima")` contém `Q-75 144 -50 150` e `T300 150` e `H-100Z`.
  - `quadrosDaMascara(1000, 600, "desce")`: `maskSize === "400px 3000px"`,
    `[0].maskPosition === "0px -1650px"`, `[1].maskPosition === "-160px -350px"`,
    `[2].maskPosition === "-240px -350px"`, `[0].easing === RITMO.desce.easing`.
  - `quadrosDaFaixa(1000, "desce")`: `-702px`, `598px`, `698px`; `"sobe"`: `1102px`, `-198px`, `-298px`.
  - `quadrosDoAro(1000, "desce")[0].transform === "translateY(-350px)"`, `[1]` `translateY(950px)`, `[2].opacity === 0`.
  - `criarAro`: um só depois de duas chamadas; `viewTransitionName === "theme-aurora-aro"`; `aria-hidden`.
  - `mascaraDoAro()` contém `viewBox='0 130 200 40'` e `non-scaling-stroke`.
  - `revelarVidros` com `sentido` usa `RITMO[sentido].duracao`.
  - `theme-toggle.test.ts`: `dataset.aurora = sentido` depois de `setTheme(valor)` no callback e
    `delete html.dataset.aurora` (ou equivalente) no `finally`; `criarAro(document, altura, largura)`
    no callback; o aro é tirado no `finally`.
  - CSS: `@utility theme-aurora-aro` existe, sem `view-transition-name`; `.theme-reveal[data-aurora="sobe"]`
    traz as três quentes; `blur(1.5px)`.
- [ ] **Step 2:** `npx vitest run src/lib/aurora-do-tema.test.ts src/lib/vidro-na-revelacao.test.ts src/components/ui/theme-toggle.test.ts` → FAIL.
- [ ] **Step 3:** implementar.
- [ ] **Step 4:** focados + `glass.test.ts` + `brand-contour.test.ts` → PASS; `npx tsc --noEmit && npm run lint && npm run test:unit` (falhas em arquivos de outras sessões: relatar, não mexer); `graphify update .`; conferir a regra no CSS servido.
- [ ] **Step 5:** commit `feat(tema): a aurora com ondas curtas, a cor na borda, o aro e o ritmo do sentido`.

### Task 2: a parada acesa e a volta no meio

**Files:** `src/components/ui/theme-toggle.tsx`, `src/components/ui/theme-toggle.test.ts`.

**Interfaces:**
- Consome: `animarAurora(...): Animation[]` (Task 1).
- Um `ref` na raiz do trilho do seletor; a parada acesa é
  `raiz.querySelector('[data-parada="<valor>"]')` **desse** seletor.
- `revelacao.current` passa a `{ valor: Tema; antes: Tema; anims: Animation[] }`.

- [ ] **Step 1: testes de fonte**:
  - a parada recebe `style.viewTransitionName = "theme-aurora-parada"` dentro do callback e perde
    no `finally`; é achada pelo ref da raiz (não por `document.querySelector`).
  - o brilho é `parada.animate(...)` com três quadros, o do meio em `offset: 0.25`, usando
    `var(--aurora-3)` (anel de 3px) e `var(--aurora-1)` (halo de 18px), na duração do `RITMO[sentido]`,
    e entra no array de animações da troca.
  - a volta: com `revelacao.current` ativo, `anims.length > 0` e `valor === revelacao.current.antes`,
    o código chama `setTheme(valor)` (dentro de `flushSync`), `reverse()` em cada animação, troca
    `valor`/`antes` e move o polegar (`setPedido(valor)`), sem nova `startViewTransition`.
  - sem animações ainda (antes do `ready`), a volta não acontece e segue o caminho de hoje.
  - a guarda do toque duplo e a do `finished.finally` seguem.
- [ ] **Step 2:** `npx vitest run src/components/ui/theme-toggle.test.ts` → FAIL.
- [ ] **Step 3:** implementar.
- [ ] **Step 4:** focado → PASS; tsc, lint, unit; `graphify update .`.
- [ ] **Step 5:** commit `feat(tema): a parada tocada acende e o toque de volta inverte a aurora`.

### Task 3: catálogo, AGENTS e histórico

**Files:** `src/app/designsystem/docs/theme-toggle.tsx` ("A aurora"), `AGENTS.md` (bullet do
`ThemeToggle`), `docs/design/HISTORICO-DESIGN-SYSTEM.md` (`### Rodada 412 — o acabamento da aurora`).

- [ ] **Step 1:** catálogo e AGENTS: a cor colada na borda, o aro aceso, três ondas por tela,
  o escuro cai em 1,25s e o claro sobe em 0,95s, a parada tocada acende, tocar a de antes no meio
  inverte; a página velha fica parada. Só valores do código.
- [ ] **Step 2:** rodada 412: as sete propostas, o protótipo v3, a recusa do afundar (o dono) e a
  troca da curva única por ondas curtas ("parecia o site indo para trás").
- [ ] **Step 3:** tsc, lint, unit, `npm run ds:audit -- src/components/ui/theme-toggle.tsx src/lib/aurora-do-tema.ts src/app/designsystem/docs/theme-toggle.tsx`, `npm run ds:docs-map`.
- [ ] **Step 4:** commit `docs(ds): o acabamento da aurora (rodada 412)`.
- [ ] **Step 5 (controlador):** quadros sem cabeça (Playwright) do app em `/designsystem/theme-toggle`
  nos dois sentidos; nada sobrando depois.
