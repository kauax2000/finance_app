# Aurora pela borda do tema — plano

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** a aurora do `ThemeToggle` passa a ter sentido pelo destino (escuro cai do topo, claro
sobe do pé), paleta pelo destino, borda que ondula de lado e uma faixa mais leve.

**Architecture:** a mesma View Transition da rodada 410 (`lib/aurora-do-tema.ts`,
`lib/vidro-na-revelacao.ts`, `theme-toggle.tsx`, `@utility theme-aurora`). Muda a geometria da
máscara (onda periódica em `repeat-x`, imagem de 3 alturas com a borda no meio), os quadros ganham
`sentido`, e a faixa lê o sentido por `data-sentido`.

**Tech Stack:** Next.js 16 / React 19, Web Animations API, View Transitions API, Tailwind v4, Vitest.

**Spec:** `docs/superpowers/specs/2026-11-21-aurora-pela-borda-do-tema-design.md` (e, por trás, a
da rodada 410: `docs/superpowers/specs/2026-11-21-transicao-de-tema-aurora-design.md`). Protótipo
aprovado, opção B:
`/private/tmp/claude-501/-Users-kaualeandro-Desktop-Finance-App-finance-app-dev/d8ad1d0b-c83b-41f3-8854-a46d7f1896af/scratchpad/proto/v2.html`.

## Global Constraints

- Branch `finance-app-2.0`; sem push, sem merge; commit só dos arquivos tocados, por caminho.
- `AURORA = { duracao: 1100, varredura: 0.6, faixa: 0.6, opacidade: 0.85, easing: "cubic-bezier(0.45, 0, 0.2, 1)" }`.
- Sentido: destino escuro → `"desce"` (borda do topo ao pé); destino claro → `"sobe"`. "Sistema"
  segue o tema resultante, lido de `html.classList.contains("dark")` **depois** do `setTheme`.
- Paleta só por tokens: `sobe` (claro) = `--brand-amber` → `--brand-coral` → `--brand-magenta`;
  `desce` (escuro) = `--brand-violet` → `--brand-indigo` → `--brand-blue`. `in oklch` por
  `@supports`, sRGB antes. Borrão 24px. Volume só em `AURORA.opacidade`.
- Fica da rodada 410: `view-transition-name` só inline e só na troca; a faixa sai 50ms antes no
  `finished` da animação dela; guardas do toque duplo e da troca pulada; troca na hora com
  movimento reduzido, `reveal={false}` ou sem API. Sem `*` em nome de classe/variável em docs.

## Review Focus

1. **Tema "sistema"**: o sentido vem do tema resultante, não do valor tocado. Teste de fonte: o
   sentido é lido de `classList.contains("dark")` depois de `setTheme` (Task 1).
2. **Pontas da tela nos dois sentidos**: no primeiro quadro nada da página nova aparece; no último a
   imagem cobre a janela inteira. Teste numérico: para `altura=1000`, a imagem (posição y,
   tamanho 3000) cobre `[0, 1000]` no último quadro de `desce` e de `sobe` (Task 1).
3. **Vidro do iPhone**: a foto velha recebe a imagem oposta, mesmas posições. Teste: `revelarVidros`
   anima `new` com `acima` e `old` com `abaixo` em `desce`, e o contrário em `sobe` (Task 1).
4. **Ondulação sem emenda**: a onda tem período de exatamente metade da imagem (dois períodos em
   200 unidades) e `repeat-x`. Teste: o `d` do SVG contém a onda `Q25 138 50 150 T100 150 T150 150 T200 150` e o quadro tem `maskRepeat: "repeat-x"` (Task 1).
5. **Troca pulada no meio**: uma faixa só no DOM (o teste da rodada 410 continua) (Task 1).

---

### Task 1: sentido, paleta, borda viva e faixa leve

**Files:**
- Modify: `src/lib/aurora-do-tema.ts` (tudo), `src/lib/vidro-na-revelacao.ts` (`revelarVidros`),
  `src/components/ui/theme-toggle.tsx` (`trocar`, ~l.150-185), `src/app/globals.css`
  (`@utility theme-aurora`, ~l.2408-2445)
- Test: `src/lib/aurora-do-tema.test.ts`, `src/lib/vidro-na-revelacao.test.ts`,
  `src/components/ui/theme-toggle.test.ts`

**Interfaces (produz; substituem as atuais):**
- `export type Sentido = "desce" | "sobe"`
- `export function mascaraDaAurora(lado: "acima" | "abaixo"): string` — SVG
  `viewBox='0 0 200 300' preserveAspectRatio='none'`, `feGaussianBlur stdDeviation='2.2'`, borda
  em y=150 com a onda periódica `M-10 150L0 150 Q25 138 50 150 T100 150 T150 150 T200 150L210 150`
  fechada por `V-10H-10Z` (`acima`: branco acima) ou `V310H-10Z` (`abaixo`). Mesma codificação do
  data-URI de hoje.
- `export function quadrosDaMascara(altura: number, largura: number, sentido: Sentido, lado: "novo" | "velho" = "novo", caixa = { x: 0, y: 0 }): Keyframe[]`
  - imagem: `novo` em `desce` = `acima`, em `sobe` = `abaixo`; `velho` = a oposta.
  - `maskSize`/`webkitMaskSize` = `${2*largura}px ${3*altura}px`; `maskRepeat` = `"repeat-x"`.
  - borda Y: `desce` `-0.15h` → (offset `varredura`) `1.15h` → `1.15h`; `sobe` `1.15h` → `-0.15h` → `-0.15h`.
  - deslize X: `0` → `-0.8*largura` → `-1.2*largura`.
  - `maskPosition` = `${dx - caixa.x}px ${bordaY - 1.5*altura - caixa.y}px`; primeiro quadro com
    `easing: AURORA.easing`; espelhos `webkit*`; `maskClip`/`webkitMaskClip: "no-clip"` só quando
    `caixa` foi passada (o vidro).
- `export function quadrosDaFaixa(altura: number, sentido: Sentido): Keyframe[]` — `bh = altura*AURORA.faixa`:
  `desce`: `translateY(y - bh*0.85)` com y `-0.15h` → `0.95h` → `1.1h`;
  `sobe`: `translateY(y - bh*0.15)` com y `1.15h` → `0.05h` → `-0.1h`;
  opacidade `AURORA.opacidade`, `AURORA.opacidade`, `0`; offsets `0`, `varredura`, `1`.
- `export function criarFaixa(doc: Document, altura: number, sentido: Sentido): () => void` — como
  hoje, mais `data-sentido={sentido}`.
- `export function animarAurora(html: HTMLElement, altura: number, largura: number, sentido: Sentido, vidros: Vidro[]): Animation`
- `revelarVidros(html, vidros, altura, largura, sentido)` — por vidro: `new` com
  `quadrosDaMascara(altura, largura, sentido, "novo", { x: rect.left, y: rect.top })`, `old` com
  `"velho"`; mesmo tempo da raiz.

- [ ] **Step 1: testes** (ajuste os da rodada 410 que pinam valores antigos; os novos):
  - `AURORA` igual ao Global Constraints.
  - `mascaraDaAurora("acima")` ≠ `("abaixo")`; ambas contêm `viewBox='0 0 200 300'` e
    `Q25 138 50 150 T100 150 T150 150 T200 150`; sem `"` nem `#` cru.
  - `quadrosDaMascara(1000, 400, "desce")`: `[0].maskPosition === "0px -1650px"`,
    `[1].offset === 0.6`, `[1].maskPosition === "-320px -350px"`, `[2].maskPosition === "-480px -350px"`,
    `maskSize === "800px 3000px"`, `maskRepeat === "repeat-x"`, imagem = `mascaraDaAurora("acima")`.
  - `quadrosDaMascara(1000, 400, "sobe")`: `[0].maskPosition === "0px -350px"`,
    `[1].maskPosition === "-320px -1650px"`, imagem = `mascaraDaAurora("abaixo")`.
  - Cobertura (Review Focus 2): no último quadro, `y = -350` (desce) e `-1650` (sobe) com altura de
    imagem 3000 cobrem `[0, 1000]`: `y <= 0 && y + 3000 >= 1000`.
  - `quadrosDaMascara(1000, 400, "desce", "velho", { x: 20, y: 700 })`: imagem `abaixo`,
    `[0].maskPosition === "-20px -2350px"`, `maskClip === "no-clip"`; a página (sem `caixa`) não
    tem `maskClip`.
  - `quadrosDaFaixa(1000, "desce")`: `[0].transform === "translateY(-660px)"`,
    `[1].transform === "translateY(440px)"`, `[2].opacity === 0`; `"sobe"`:
    `[0].transform === "translateY(1060px)"`, `[1].transform === "translateY(-40px)"`.
  - `criarFaixa(doc, 1000, "sobe")`: `data-sentido="sobe"`, uma faixa só depois de duas chamadas.
  - `revelarVidros` (html falso que grava `animate`): `desce` → `new` com imagem `acima`, `old`
    com `abaixo`; `sobe` → o contrário.
  - `theme-toggle.test.ts`: o sentido sai de `classList.contains("dark")` dentro do callback, depois
    de `setTheme(valor)`, e chega a `criarFaixa(document, altura, sentido)` e a
    `animarAurora(html, altura, largura, sentido, vidros.vidros)`.
  - CSS: o bloco `@utility theme-aurora` contém `blur(24px)`, `[data-sentido="sobe"]` (ou
    `&[data-sentido=sobe]`) e os seis tokens das duas paletas; não contém `view-transition-name`.
- [ ] **Step 2:** `npx vitest run src/lib/aurora-do-tema.test.ts src/lib/vidro-na-revelacao.test.ts src/components/ui/theme-toggle.test.ts` → FAIL.
- [ ] **Step 3:** implementar as interfaces. No `theme-toggle.tsx`, dentro do callback:
  `flushSync(() => setTheme(valor)); sentido = html.classList.contains("dark") ? "desce" : "sobe"; tirarFaixa = criarFaixa(document, altura, sentido)`;
  no `ready`, `animarAurora(html, altura, largura, sentido, vidros.vidros)`. Comentários do topo
  dos três arquivos e do CSS dizem o sentido e a paleta pelo destino.
- [ ] **Step 4:** CSS: `--aurora-1..3` frias por padrão (`violet`, `indigo`, `blue`) e quentes em
  `&[data-sentido="sobe"]` (`amber`, `coral`, `magenta`); `::before` com
  `filter: blur(24px)`, sem `border-radius`, degradê `transparent 0%, var(--aurora-1) 30%, var(--aurora-2) 55%, var(--aurora-3) 78%, transparent 100%`
  (sRGB e, por `@supports`, `180deg in oklch`); em `sobe` o `::before` leva `scale: 1 -1` (a cor
  da frente fica na borda). Conferir a regra no CSS servido (`.next/dev/static/chunks/`).
- [ ] **Step 5:** focused → PASS; `npx tsc --noEmit && npm run lint && npm run test:unit` → verde; `graphify update .`.
- [ ] **Step 6:** commit `feat(tema): a aurora cai no escuro e sobe no claro, com a paleta do destino`.

### Task 2: catálogo, AGENTS e histórico

**Files:** `src/app/designsystem/docs/theme-toggle.tsx` (seção "A aurora"), `AGENTS.md` (bullet do
`ThemeToggle`; a exceção da aurora em "Arco-íris sob texto" só se o texto citar valor que mudou),
`docs/design/HISTORICO-DESIGN-SYSTEM.md` (`### Rodada 411 — a aurora pela borda do tema`).

- [ ] **Step 1:** catálogo e AGENTS dizem: escuro cai do topo em paleta fria (violeta, índigo,
  azul), claro sobe do pé em paleta quente (âmbar, coral, magenta); a borda ondula de lado; a
  cortina anda em ~0,66s e o brilho some até 1,1s. Só valores do código.
- [ ] **Step 2:** rodada 411: as cinco melhorias propostas, o protótipo v2 (A duas bordas do
  toque, B da borda pelo tema, C atual, D onda circular), a escolha B, o que saiu (a onda do toque
  não entrou; o truque das 4,8 alturas; o raio da ponta da faixa), os novos valores (faixa 0,6,
  opacidade 0,85, borrão 24px, imagem de 3 alturas).
- [ ] **Step 3:** `npx tsc --noEmit && npm run lint && npm run test:unit`, `npm run ds:audit -- src/components/ui/theme-toggle.tsx src/lib/aurora-do-tema.ts src/app/designsystem/docs/theme-toggle.tsx`, `npm run ds:docs-map` → sem diff inesperado.
- [ ] **Step 4:** commit `docs(ds): a aurora pela borda do tema (rodada 411)`.
- [ ] **Step 5 (controlador):** prévia em `/designsystem/theme-toggle`: claro → escuro cai do topo
  em frio; escuro → claro sobe do pé em quente; nenhuma `.theme-aurora` nem nome restante depois.
