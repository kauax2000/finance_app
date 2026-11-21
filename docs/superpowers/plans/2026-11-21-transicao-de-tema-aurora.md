# Transição de tema: a aurora — plano

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** a troca de tema do `ThemeToggle` passa do círculo nítido (320ms) à aurora do vídeo: uma
cortina de arco-íris borrada desce do topo com a borda ondulada, o tema novo surge atrás dela e o
brilho some no pé (~1,1s).

**Architecture:** a mesma View Transition de hoje (`flushSync`, `.theme-reveal` no `<html>`). No
lugar do `clip-path: circle()`, o `::view-transition-new(root)` ganha um `mask-image` SVG ondulado
cuja posição desce; uma faixa fixa criada no callback ganha `view-transition-name: theme-aurora`
**inline e só durante a troca**, e anima no `::view-transition-new(theme-aurora)`. As contas ficam
numa lib pura (`src/lib/aurora-do-tema.ts`); o vidro do WebKit recebe a mesma máscara.

**Tech Stack:** Next.js 16 / React 19, Web Animations API, View Transitions API, Tailwind v4
(`@utility`), Vitest.

**Spec:** `docs/superpowers/specs/2026-11-21-transicao-de-tema-aurora-design.md`. Protótipo de
referência (valores já casados com o dono):
`/private/tmp/claude-501/-Users-kaualeandro-Desktop-Finance-App-finance-app-dev/d8ad1d0b-c83b-41f3-8854-a46d7f1896af/scratchpad/proto/index.html`
(opção A, paleta Curta).

## Global Constraints

- Branch `finance-app-2.0`. Sem push, sem merge para `main`. Commit só dos arquivos tocados.
- `view-transition-name` nunca permanente: nenhum seletor CSS o declara para a faixa; ele vai inline
  no elemento criado no callback, que é removido no `finished`.
- `AURORA = { duracao: 1100, varredura: 0.6, faixa: 0.75, opacidade: 0.9, easing: "cubic-bezier(0.45, 0, 0.2, 1)" }`.
- Paleta Curta, só tokens: `--brand-amber` → `--brand-magenta` → `--brand-violet` → `--brand-blue`,
  `in oklch` (com o sRGB declarado antes e o `in oklch` por `@supports`, como o `--brand-rainbow`).
  O volume mora em `AURORA.opacidade`, nunca nas paradas.
- Movimento reduzido, `reveal={false}` ou navegador sem `startViewTransition`: troca na hora.
- Guardas de hoje ficam: `if (revelacao.current?.valor === valor) return` e
  `finished.finally(() => { if (revelacao.current !== esta) return …`.
- Textos de catálogo e docs em português. Depois de mudar código: `graphify update .`.

## Review Focus

1. **Troca pulada no meio** (dois toques rápidos em paradas diferentes): a faixa da primeira tem de
   sumir; nunca duas faixas no DOM. Teste: `criarFaixa` remove uma faixa órfã antes de criar
   (Task 1).
2. **Telefone com a barra de baixo de vidro no iPhone**: a máscara do vidro tem de casar com a da
   página no mesmo instante, senão a barra troca de tema antes/depois do resto. Teste:
   `quadrosDaMascara(h, rect.top)` desloca a posição exatamente por `rect.top` (Task 1).
3. **Tema escuro → claro**: a faixa lê os tokens do tema **novo** (nasce no callback, depois do
   `setTheme`). Teste de fonte: `criarFaixa` é chamado depois de `setTheme` dentro do callback
   (Task 2).
4. **Altura da janela que muda** (teclado do iOS, barra do Safari): as contas usam a altura lida no
   toque, uma vez. Teste: as funções recebem `altura` como argumento; nenhuma lê `innerHeight`
   (Task 1).
5. **Página rolada**: a faixa é `position: fixed` em `top: 0`, cobre a janela, não o documento.
   Conferido na prévia (Task 4).

---

### Task 1: a lib `aurora-do-tema`

**Files:**
- Create: `src/lib/aurora-do-tema.ts`
- Create: `src/lib/aurora-do-tema.test.ts`

**Interfaces:**
- Produces:
  - `export const AURORA: { duracao: number; varredura: number; faixa: number; opacidade: number; easing: string }`
  - `export const NOME_DA_FAIXA = "theme-aurora"`
  - `export function mascaraDaAurora(invertida?: boolean): string` — `url("data:image/svg+xml,…")`.
    SVG `viewBox='0 0 100 200' preserveAspectRatio='none'`, `feGaussianBlur stdDeviation='2.2'`,
    caminho do protótipo `M-10 -10H110V100C88 112 72 93 54 104S22 116 -10 103Z` (branco = mostra o
    novo). A invertida: retângulo inteiro menos esse caminho (`fill-rule='evenodd'`), para a foto
    velha do vidro. Aspas simples dentro, `#` escapado como `%23`.
  - `export function quadrosDaMascara(altura: number, deslocamento = 0, invertida = false): Keyframe[]`
    — 3 quadros; `maskSize: "100% ${2*altura}px"`, `maskRepeat: "no-repeat"`, `maskPosition`
    `0 ${-2.1*altura - deslocamento}px` (com `easing: AURORA.easing`) → em `offset: AURORA.varredura`
    `0 ${0.1*altura - deslocamento}px` → igual. Inclui `maskImage` e as chaves `webkitMask*`
    equivalentes em cada quadro.
  - `export function quadrosDaFaixa(altura: number): Keyframe[]` — com `bh = altura * AURORA.faixa`:
    `translateY(${-bh}px)` op `AURORA.opacidade` (easing) → `offset: varredura`
    `translateY(${altura - bh*0.55}px)` op igual → `translateY(${altura - bh*0.35}px)` op `0`.
  - `export function criarFaixa(doc: Document, altura: number): () => void` — remove
    `.theme-aurora` órfã, cria `<div class="theme-aurora" aria-hidden="true">` com
    `style.height = ${altura*AURORA.faixa}px` e `style.viewTransitionName = NOME_DA_FAIXA`, anexa ao
    `body`, devolve a remoção.
  - `export function animarAurora(html: HTMLElement, altura: number, vidros: Vidro[]): void` — anima
    `::view-transition-new(root)` com `quadrosDaMascara(altura)`,
    `::view-transition-new(theme-aurora)` com `quadrosDaFaixa(altura)` e `fill: "both"`, e chama
    `revelarVidros(html, vidros, altura)` (Task 3). Tempo: `{ duration: AURORA.duracao, easing: "linear" }`.

- [ ] **Step 1: testes que falham** em `aurora-do-tema.test.ts`:
  - `AURORA` tem exatamente os valores do Global Constraints.
  - `mascaraDaAurora()` começa com `url("data:image/svg+xml,` e contém `stdDeviation='2.2'` e
    `M-10 -10H110V100C88 112 72 93 54 104S22 116 -10 103Z`; não contém `"` dentro nem `#` cru;
    `mascaraDaAurora(true)` difere e contém `evenodd`.
  - `quadrosDaMascara(1000)`: 3 quadros, `[0].maskPosition === "0 -2100px"`, `[1].offset === 0.6`,
    `[1].maskPosition === "0 100px"`, `maskSize === "100% 2000px"`.
  - `quadrosDaMascara(1000, 40)[1].maskPosition === "0 60px"` (o vidro casa com a página).
  - `quadrosDaFaixa(1000)`: `[0].transform === "translateY(-750px)"`, `[0].opacity === 0.9`,
    `[1].transform === "translateY(587.5px)"`, `[2].opacity === 0`.
  - `criarFaixa` (jsdom): chamada duas vezes deixa um só `.theme-aurora`; o elemento tem
    `style.viewTransitionName === "theme-aurora"` e `aria-hidden`; a função devolvida o remove.
  - Fonte: `lerFonte("src/lib/aurora-do-tema.ts")` não contém `innerHeight`.
  - CSS: `lerFonte("src/app/globals.css")` não contém `view-transition-name: theme-aurora`.
- [ ] **Step 2:** `npx vitest run src/lib/aurora-do-tema.test.ts` → FAIL (módulo não existe).
- [ ] **Step 3:** implementar a lib (assinaturas acima). Importa `revelarVidros` e o tipo `Vidro`
  de `./vidro-na-revelacao`; até a Task 3, `animarAurora` não é testado por execução.
- [ ] **Step 4:** mesmo comando → PASS.
- [ ] **Step 5:** commit `feat(tema): a lib da aurora (máscara, quadros e faixa)`.

### Task 2: o `ThemeToggle` usa a aurora, e o CSS da faixa

**Files:**
- Modify: `src/components/ui/theme-toggle.tsx` (`REVELACAO` ~l.90, `trocar` ~l.150-200, comentário ~l.84-89)
- Modify: `src/app/globals.css` (bloco `.theme-reveal` ~l.2389-2398)
- Modify: `src/components/ui/theme-toggle.test.ts` (~l.241-247)

**Interfaces:**
- Consumes: `AURORA`, `criarFaixa`, `animarAurora`, `NOME_DA_FAIXA` (Task 1); `nomearVidros` (existente).

- [ ] **Step 1: ajustar o teste** "o vidro à vista ganha nome…": trocar a expectativa de
  `revelarVidros(...)` por `animarAurora(html, altura, vidros.vidros)`; manter `nomearVidros(document)`
  e o `finally` com `vidros.desfazer()`. Novo `it("a aurora: a faixa nasce no callback, depois do tema, e sai no finished")`:
  - `CODIGO.indexOf("criarFaixa(document")` > `CODIGO.indexOf("setTheme(valor)")` e ambos dentro do
    callback de `doc.startViewTransition(`;
  - o `finished.finally` chama `tirarFaixa`/a função devolvida;
  - `CODIGO` não contém `REVELACAO` nem `circle(`.
  - CSS: contém `@utility theme-aurora`, `::view-transition-group(theme-aurora)` e
    `::view-transition-new(theme-aurora)` com `animation: none`; usa `var(--brand-amber)`,
    `var(--brand-magenta)`, `var(--brand-violet)`, `var(--brand-blue)`.
- [ ] **Step 2:** `npx vitest run src/components/ui/theme-toggle.test.ts` → FAIL.
- [ ] **Step 3: `trocar`**: sai a conta de x/y/raio e o `REVELACAO`; `const altura = window.innerHeight`
  lida uma vez no toque; callback = `flushSync(() => setTheme(valor)); tirarFaixa = criarFaixa(document, altura)`;
  `ready` → `animarAurora(html, altura, vidros.vidros)`; `finished.finally` → (guarda) `tirarFaixa?.()`
  junto do que já limpa. Atualizar o comentário de cima (aurora, não círculo).
- [ ] **Step 4: CSS** no bloco `.theme-reveal` (renomear o comentário para "A aurora do `ThemeToggle`"):
  - `@utility theme-aurora` (morar depois de `no-scrollbar`, regra do `glass.test.ts`):
    `position: fixed; inset-inline: -10vw; top: 0; pointer-events: none; z-index: var(--z-toast)`;
    `&::before` com `content: ""; position: absolute; inset: 0; filter: blur(36px)`;
    `border-radius: 0 0 45% 55% / 0 0 22% 30%`;
    `background: linear-gradient(180deg, transparent 0%, color-mix(in oklch, var(--brand-amber) 70%, transparent) 22%, var(--brand-magenta) 50%, var(--brand-violet) 76%, var(--brand-blue) 90%, transparent 100%)`
    e, em `@supports (background: linear-gradient(in oklch, red, blue))`, a mesma com `180deg in oklch`.
  - `.theme-reveal::view-transition-group(theme-aurora), .theme-reveal::view-transition-new(theme-aurora), .theme-reveal::view-transition-old(theme-aurora) { animation: none; }`
  - O `.theme-aurora` no componente vem por classe; conferir em `.next/dev/static/chunks/` que a regra foi servida.
- [ ] **Step 5:** testes da Task 2 e `src/components/ui/` relevantes (`glass.test.ts`,
  `brand-contour.test.ts`) → PASS.
- [ ] **Step 6:** commit `feat(tema): a troca de tema vira a aurora`.

### Task 3: o vidro do WebKit com a máscara

**Files:**
- Modify: `src/lib/vidro-na-revelacao.ts` (`recorteDeFora` e `revelarVidros`, ~l.17-22 e 87-107; comentário de cima)
- Modify: `src/lib/vidro-na-revelacao.test.ts`

**Interfaces:**
- Consumes: `quadrosDaMascara`, `mascaraDaAurora`, `AURORA` (Task 1).
- Produces: `export function revelarVidros(html: HTMLElement, vidros: Vidro[], altura: number): void`
  (assinatura nova, usada por `animarAurora`).

- [ ] **Step 1: teste**: apagar o bloco "o recorte de fora do círculo"; novo
  `it("cada vidro recebe a máscara da página, deslocada pelo topo dele")`: com um `html` falso cujo
  `animate` grava as chamadas, `revelarVidros(html, [{ nome: "vidro-0", rect: { top: 700 } }], 800)`
  faz duas chamadas: `::view-transition-new(vidro-0)` com `quadrosDaMascara(800, 700)` e
  `::view-transition-old(vidro-0)` com `quadrosDaMascara(800, 700, true)`, ambas com
  `duration: AURORA.duracao`. Fonte não contém `recorteDeFora` nem `circle(`.
- [ ] **Step 2:** `npx vitest run src/lib/vidro-na-revelacao.test.ts` → FAIL.
- [ ] **Step 3:** implementar; apagar `recorteDeFora` e `FOLGA` se ficar sem uso; o comentário de
  cima fala da máscara da aurora, não do círculo. (Import circular entre as duas libs: se aparecer,
  mova `Vidro` para `aurora-do-tema` ou passe os quadros como argumento — escolha do implementador.)
- [ ] **Step 4:** os dois arquivos de teste das libs + `theme-toggle.test.ts` → PASS.
- [ ] **Step 5:** commit `feat(tema): o vidro do iPhone passa pela aurora como a página`.

### Task 4: catálogo, registro e conferência

**Files:**
- Modify: `src/app/designsystem/docs/theme-toggle.tsx` (seção ~l.43-55, l.96, `PropsTable` `reveal` ~l.119)
- Modify: `AGENTS.md` (bullet do `ThemeToggle` em "Required primitives"; lista "Arco-íris sob texto é proibido")
- Modify: `docs/design/HISTORICO-DESIGN-SYSTEM.md` (nova `### Rodada 410 — a troca de tema vira a aurora`)

- [ ] **Step 1: catálogo**: "A revelação circular" vira "A aurora": o que acontece (desce do topo,
  ~1,1s, paleta âmbar → magenta → violeta → azul, troca na hora com movimento reduzido), o exemplo
  real (o `ThemeToggle` da seção já troca de verdade); l.96 e a descrição do `reveal` na
  `PropsTable` ("liga a aurora", padrão `true`). Só afirmações medidas.
- [ ] **Step 2: AGENTS.md**: no bullet `ThemeToggle`, `reveal` passa a ser "a troca abre a aurora
  (`lib/aurora-do-tema`): a cortina borrada de âmbar, magenta, violeta e azul desce do topo em
  1,1s pela View Transitions API com `flushSync`; a faixa ganha `view-transition-name` só durante a
  troca". Na lista de exceções do arco-íris sob texto, acrescentar a aurora (passa por cima do
  texto ~1s e não é lida; volume em `AURORA.opacidade`).
- [ ] **Step 3: histórico**: rodada 410 com o vídeo de 09/11, as opções A/B/C do protótipo, a
  paleta Curta escolhida, o que saiu (círculo, `recorteDeFora`).
- [ ] **Step 4: verificação**: `npx tsc --noEmit && npm run lint && npm run test:unit`,
  `npm run ds:audit -- src/components/ui/theme-toggle.tsx src/lib/aurora-do-tema.ts`,
  `npm run ds:docs-map` se a página mudou de seção, `graphify update .`. Tudo verde.
- [ ] **Step 5: prévia** (`dev-attach`, :3000): `/designsystem/theme-toggle` e Configurações ›
  Aparência no desktop; `/me` a 375px. Claro → escuro e escuro → claro, com a página rolada.
  Prova: quadro no meio da varredura (pausar com o patch de `Element.prototype.animate` do
  protótipo e recarregar depois). Sem erro no console; nenhum `.theme-aurora` nem
  `view-transition-name` restante no DOM depois da troca.
- [ ] **Step 6:** commit `docs(ds): a aurora no catálogo, no AGENTS e no histórico (rodada 410)`;
  parar o servidor do protótipo (`b6azrfej5`).
