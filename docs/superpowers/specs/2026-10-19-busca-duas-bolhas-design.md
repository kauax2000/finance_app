# Busca do telefone: a cápsula se divide em duas bolhas

Data: 2026-10-19. Gerado por um painel de três desenhos (física de bolha, fidelidade iOS 26, risco de implementação) e um juiz; vencedor: C — One-p mitosis (two clipped glass bubbles on the same progress). Caso o dono não goste, volta-se ao commit 56fb556.

## Command phone opening: the capsule divides into two bubbles

Build on the current `CommandDialog` phone branch (commit 56fb556). Code comments in Portuguese, as in the repo. If the owner rejects the result: `git checkout 56fb556 -- <changed files>`.

### 1. The gesture in words
The header's right side is one glass capsule `[lupa | filtro]`. Tapping the lupa turns that capsule into a single viscous drop, in three phases:
1. **Fused stretch.** Its left half runs left toward the gutter while still joined to the right half by a flat seam.
2. **Pinch.** The flat inner corners round off while the halves still touch. The waist thins to one point, and the right bubble leans ~2px toward the field, held by tension.
3. **Part.** An 8px gap opens and the right bubble relaxes back to round.

The left bubble becomes the search field and carries its magnifier on its moving left edge. The right bubble stays exactly where the filter was and becomes the ×: the filter glyph (calendar or sliders, plus the active-filter dot) shrinks and blurs out while the X grows in from blur.

With no filter on screen, the lupa circle itself divides: a bud swells out of its left flank, fuses into a capsule, then pinches off and runs left as the field, while the circle stays and becomes the ×.

Closing is the same film backwards: the gap closes, the bubbles touch, the waist fills, and the capsule lands on the header capsule with the filter glyph sharp again.

Everything is one progress `p` on the existing drivers: `MOLA` to open and `VOLTA_DA_PILULA` to close. Every write goes on the two glass elements themselves or on their children, never on an ancestor.

### 2. Opening timeline (capsule case, 375px wide, MOLA 300/25)
Geometry:
- lupa: x 271..315
- filtro: x 315..359
- pill final: x 16..307
- × final: x 315..359
- R = 22, gap G = 8

Columns: L is the pill's visible left edge, `right` is its right edge, seam is the inner corner radius, lean is how far the × leans left, icon is the ghost→X mix.

| t | p | L | right | seam | gap | lean | icon |
|---|---|---|---|---|---|---|---|
| 0 | 0 | 271 | 315 | 0 | 0 | 0 | 0 (filter glyph sharp) |
| 16 | .037 | 262 | 315 | 0 | 0 | 0 | 0 (one 97px capsule) |
| 33 | .126 | 239 | 314.9 | 0.8 | 0 | .08 | .01 |
| 50 | .245 | 208 | 314.2 | 8.1 | 0 | .8 | .15 (contact 28px tall) |
| 67 | .376 | 175 | 313.2 | 18.3 | 0 | 1.8 | .44 (waist 7px) |
| 83 | .499 | 144 | 312.4 | 22 | 0.6 | 2.0 | .74 (tangent, tearing) |
| 100 | .619 | 113 | 311.0 | 22 | 2.4 | 1.5 | .95 |
| 133 | .807 | 65 | 308.4 | 22 | 6.0 | 0.5 | 1 |
| 200 | 1.0 | 16 | 307 | 22 | 8 | 0 | 1 |

- **260ms:** MOLA peaks at p 1.038. The left edge overshoot is limited by the pill's own box, the content sloshes ≤10px left (today's behaviour, kept), and the × does not move (q is clamped).
- **~480ms:** the spring rests. `bolhasEmRepouso` clears every inline style, and both rings return in the same frame, as the pill's does today.
- **Plate and rows:** the plate keeps `menu-morph` 380ms with a 60ms delay from the top, and the rows keep `command-reveal`.
- **Veil:** fades in over 300ms.
- **Focus:** goes to the input in `onOpenAutoFocus` on the same tap (unchanged).

### 3. Closing timeline (VOLTA_DA_PILULA, 280ms, [.32,.72,0,1])
- **0ms:** clip-path goes back on, so both rings drop. Plate `menu-unmorph` 210ms, veil out 300ms, layer held by `presence-hold` 300ms.
- **22ms:** p .80, gap 5.9, L 67.
- **37ms:** p .62, gap 2.4, the × leans 1.5 toward the pill (attraction).
- **47ms:** p .47, gap 0.3, seam 22: the bubbles touch.
- **57ms:** p .34, seam 15.8: fusing, waist 12px; ghost .65.
- **69ms:** p .23, seam 7.
- **86ms:** p .145, seam 1.6; ghost almost sharp.
- **113ms:** p .08, seam 0: one fused capsule [251..359].
- **152ms:** [262..359].
- **280ms:** p 0. Exactly the header capsule, with the filter glyph sharp in the ghost and the X at 0.
- **300ms:** unmount. The real header capsule underneath has the same shape and icons. `onCloseAutoFocus` returns focus to the lupa (unchanged).

### 4. Capsule case
- **Condition:** `origemValida(filtro) && |filtro.left − lupa.right| ≤ 1 && |filtro.top − lupa.top| ≤ 1`.
- **Start shape:** the × starts at the filter rect, which equals its final rect at every phone width since both are anchored 16px from the right, so it never travels.
- **Seam start:** read once with `getComputedStyle(filtroEl).borderTopLeftRadius`. It is `0px` from ButtonGroup's `rounded-l-none`.
- **Ghost:** a clone of the filter button's children (svg plus `ToolbarFilterIndicator` when active).
- **Popover-wrapped filter (month grid):** the same button. `PopoverTrigger asChild` composes `filtroRef` through Slot, and Radix Popover adds no wrapper element, so the button stays a direct child of the group. On the phone the popover is modal, so a tap on the lupa while it is open only dismisses it.
- **Disabled filter (opacity-50):** still the origin. The ghost shows at full opacity (accepted, rare).

### 5. Alone case (no filter, or filter not glued)
- **Start shape:** the × starts at the lupa rect (315..359, also its final rect), and the ghost is a clone of the lupa's magnifier. `emenda0 = min(lupa radius, R) = 22`, so at p=0 the × is a full circle.
- **Pill:** starts at zero visible width on the circle's left flank (L = lupa.left = 315, right edge = 315).
- **Budding:** `broto = emenda0·max(0, 1 − largura/2R)` flattens the shared seam as the bud widens.
  - **16ms:** 11px bud, seam 16.5.
  - **33ms:** 38px, seam 3.9: an almost fused capsule [277..359].
  - **From ~50ms:** identical to the capsule timeline.
- **Two magnifiers:** for ~30–80ms the pill's own magnifier rides out on its left edge while the ghost magnifier in the × turns into the X. If that reads as a double, move the ICONE window earlier.
- **Closing:** the bud shrinks back into the circle's flank and rounds as it goes (p .08 → seam 10, p .035 → seam 17). At p=0 the × is the circle with a sharp magnifier, on the header lupa.
- **Lupa itself invalid** (hidden, or no `origin` as in the catalog): the fallback (section 8).

### 6. Subpages
The back button is on the left and the right side is the same, so the same two cases apply and nothing else changes. After navigating from the palette, rects are measured at the start of each run. A close that starts after the new screen has rendered its header lands on the new layout (capsule or alone). A close that starts before it lands on the old one, with a small pop at unmount (accepted).

### 7. Reopen mid-close and close mid-open
- **Open:** `const de = pilula.style.clipPath ? progresso.current : 0`. While a gesture is in flight, open continues from the current p on MOLA, so there is no jump back to the lupa. At rest or on a fresh layer it starts from 0. `quadro(de)` is written synchronously in the layout effect, so the first painted frame is correct.
- **Close mid-open:** goes from `progresso.current` on VOLTA (unchanged).
- **Ghost:** re-cloned on every run with `replaceChildren`, so it never stacks.
- **Plate:** its CSS `menu-morph` still restarts from its first frame (unchanged).

### 8. Reduced motion and fallback
- **Shared reset:** the non-travel branch first calls `bolhasEmRepouso`, then sets `progresso.current = aberto ? 1 : 0`.
- **Reduced motion:**
  - Open: `animate([pilula, x], { opacity: [0, 1] }, SAIDA)`.
  - Close: `animate([pilula, x], { opacity: 0 }, SAIDA)`.
  - No travel, no pinch, no icon swap.
- **No valid lupa:**
  - Open: `animate([pilula, x], { opacity: [0, 1], scale: [0.95, 1] }, MOLA)`.
  - Close: opacity → 0 on SAIDA.
- **Travel branch:** clears any stale inline opacity first: `pilula.style.opacity = x.style.opacity = ""`.

### 9. Exact mechanics (src/components/ui/command.tsx)
Replace `quadroDaPilula`/`pilulaEmRepouso` with one pure function, one writer and one reset. Add `import { ACOPLAMENTO_Y } from "@/lib/liquid-move"`.

```ts
type Caixa = Pick<DOMRect, "left" | "right" | "top" | "bottom" | "width" | "height">
/** As fases no mesmo progresso: a emenda arredonda (pinça) antes de o vão abrir (parte). */
const PINCA = [0.08, 0.48] as const
const PARTE = [0.4, 1] as const
const ICONE = [0.1, 0.7] as const
/** O × puxado para a pílula enquanto a emenda afina (fração da largura): 2,2px a 44. 0 desliga. */
const PUXAO_DO_X = 0.05
const suave = (x: number, [de, ate]: readonly [number, number]) => {
  const t = Math.min(Math.max((x - de) / (ate - de), 0), 1)
  return t * t * (3 - 2 * t)
}
/** Um quadro das duas bolhas (0 é a cápsula do header, 1 a barra e o ×). Puro, para o teste. */
function quadroDasBolhas(m: { lupa: Caixa; deX: Caixa; pilula: Caixa; x: Caixa; emenda0: number }, p: number) {
  const q = Math.min(Math.max(p, 0), 1), resto = 1 - p, R = m.pilula.height / 2
  const pinca = suave(q, PINCA), parte = suave(q, PARTE)
  const puxao = PUXAO_DO_X * pinca * (1 - parte)
  const vao = (m.x.left - m.pilula.right) * parte
  const xdx = (m.deX.left - m.x.left) * resto, xdy = (m.deX.top - m.x.top) * resto
  const direita = m.x.left + xdx - m.x.width * puxao - vao       // a pílula nunca passa do ×
  const visivel = m.lupa.left + (m.pilula.left - m.lupa.left) * p
  const largura = Math.max(0, direita - visivel)
  const broto = m.emenda0 * Math.max(0, 1 - largura / (2 * R))   // sem filtro, o círculo brota
  return { R, dx: direita - m.pilula.right, esquerda: m.pilula.width - largura,
    topo: (m.lupa.top - m.pilula.top) * resto, base: (m.pilula.bottom - m.lupa.bottom) * resto,
    emenda: broto + (R - broto) * pinca, puxao, vao, xdx, xdy, icone: suave(q, ICONE) }
}
```

**Writer `desenharBolhas(pilula, x, iconeX, fantasma, f)`** writes only to these elements:
- **Pill `[data-slot=search-input]`:**
  - `transform = translateX(${f.dx}px)`
  - `clipPath = inset(${f.topo}px 0px ${f.base}px ${f.esquerda}px round ${f.R}px ${f.emenda}px ${f.emenda}px ${f.R}px)` (corner order tl tr br bl)
  - each child: `transform = translateX(${f.esquerda}px)` (as today)
- **× `[data-slot=command-search-cancel]`:**
  - `transform = translate(${f.xdx}px, ${f.xdy}px) scale(${1 + f.puxao}, ${1 - f.puxao * ACOPLAMENTO_Y})`, with the transform origin from the class `origin-right`
  - `clipPath = inset(0px round ${f.emenda}px ${f.R}px ${f.R}px ${f.emenda}px)`
  - Clip-path rather than border-radius keeps the ring off during flight, like the pill, and neither property is in Button's transition list.
- **Ghost `[data-slot=command-search-cancel-origin]`:**
  - `opacity = 1 − icone`
  - `filter = blur(${6·icone}px)`
  - `transform = scale(${1 − 0.3·icone})`
- **X `x.querySelector(':scope > svg')`:**
  - `opacity = icone`
  - `filter = blur(${6·(1 − icone)}px)`
  - `transform = scale(${0.7 + 0.3·icone})`
- **Blur safety:** filters on these children inside the glass do not touch the glass's backdrop-filter.

**`bolhasEmRepouso(pilula, x, iconeX, fantasma)`** clears:
- the pill's transform, clipPath and child transforms;
- the ×'s transform and clipPath;
- opacity, filter and transform on the X and on the ghost (the ghost's class `opacity-0` hides it at rest).

**The phone gesture `useLayoutEffect`.** Deps: `[aberto, camada, origin, closeOrigin, reduzido]`.
1. **Query:** `pilula`, `x`, `iconeX` and `fantasma`. Return early if `pilula` or `x` is missing.
2. **Decide:** `lupaEl = origin?.current`, `lupa = lupaEl?.getBoundingClientRect()`, `viaja = origemValida(lupa) && !reduzido`.
3. **If `viaja`:**
   - Clear stale opacity on both elements.
   - Read `filtroEl = closeOrigin?.current` and `filtro = filtroEl?.getBoundingClientRect()`. Compute `colado` with the adjacency test (section 4). Then `deXEl = colado ? filtroEl : lupaEl` and `deX = colado ? filtro : lupa`.
   - Measure both final rects with the in-flight transforms cleared and then restored (one forced layout, like today's `emCurso`).
   - `emenda0 = Math.min(parseFloat(getComputedStyle(deXEl).borderTopLeftRadius) || 0, R)`. Tailwind's `rounded-full` computes to a huge px value, which parseFloat reads fine.
   - Fill the ghost: `fantasma.replaceChildren(...[...deXEl.children].map((n) => n.cloneNode(true)))`.
   - Define `quadro = (p) => { progresso.current = p; desenharBolhas(pilula, x, iconeX, fantasma, quadroDasBolhas(m, p)) }`.
   - **Open:** `de` as in section 7, then `quadro(de)`, then `const abrindo = animate(de, 1, { ...MOLA, onUpdate: quadro })`, then `abrindo.then(() => { if (ativa) bolhasEmRepouso(pilula, x, iconeX, fantasma) })`.
   - **Close:** `animate(progresso.current, 0, { ...VOLTA_DA_PILULA, onUpdate: quadro })`.
4. **Otherwise:** the fallback in section 8.
5. **Cleanup:** `ativa = false; controle.stop()`.

**Other changes in the same file:**
- `const progresso = React.useRef(0)` (was 1).
- **Phone layer classes:**
  - Keep `[&_[data-slot=command-dialog-panel]]:origin-top` and the panel's `data-open` `menu-morph_380ms_linear_60ms_backwards`.
  - Delete `[&_[data-slot=command-search-cancel]]:origin-center` and the ×'s `data-open` `menu-morph` line.
  - Narrow the close rule to `data-closed:[&_[data-slot=command-dialog-panel]]:[animation:menu-unmorph_210ms_linear_both]`.
- **× Button:**
  - Add `origin-right bg-clip-border` to its className.
  - Before `<XMarkIcon aria-hidden />`, add `<span aria-hidden data-slot="command-search-cancel-origin" className="pointer-events-none absolute inset-0 grid place-items-center opacity-0 [&_svg]:size-5" />`. `size-5` mirrors TopBarAction's `max-md:[&_svg]:size-5`, so the cloned glyph stays 20px; the absolute dot keeps its `top-2 right-2`. React renders no children into the span, so it leaves the clones alone.
- **Exports:** add `quadroDasBolhas` to the export block next to `origemValida`.
- **Unchanged:** `onOpenAutoFocus` and `onCloseAutoFocus`, `--command-search-vh`, `presence-hold`, `VOLTA_DA_PILULA`, the desktop branch, and every `camada` style except the existing `setProperty`.

### 10. API changes and header wiring
- **`CommandDialog`:** new prop `closeOrigin?: React.RefObject<HTMLElement | null>`, documented as: "No telefone, de onde o × nasce: o filtro colado à lupa (`origin`). Sem ele, ou sem caixa, ou longe da lupa, a lupa se divide: vira o × e a pílula brota do flanco dela."
- **`AppCommandPalette`:** add the same prop to `AppCommandPaletteProps` and forward it: `closeOrigin={closeOrigin}`.
- **`app-header.tsx`:**
  - `const filtroRef = React.useRef<HTMLButtonElement>(null)` next to `lupaRef`.
  - `ref={filtroRef}` on the `TopBarAction` inside `botaoDoFiltro` (it works bare and under `PopoverTrigger asChild`).
  - `<AppCommandPalette open={searchOpen} onOpenChange={setSearchOpen} origin={lupaRef} closeOrigin={filtroRef} />`.
  - No new state; on screens without a filter React nulls the ref.
- **Docs (`src/app/designsystem/docs/command.tsx`):**
  - Update the CommandDialog description to say the × splits from the filter, or the lupa divides.
  - Add a PropsTable row `CommandDialog closeOrigin`.
- **`docs/design/HISTORICO-DESIGN-SYSTEM.md`:** add "Rodada 338 — a cápsula da lupa se divide em duas bolhas", with the measured numbers.
- **AGENTS.md:** the `Command` bullet still says "no telefone é gaveta". Replace it with one line: the bar is born from `origin`, and the × splits from `closeOrigin`.
- **Not a journey change** (no route, destination or step changes), so JORNADAS and the Atlas stay as they are.
- **Permissions:** edits under `ui/` and `designsystem/` will prompt.

### 11. Tests (src/components/ui/command-versions.test.ts)
Rewrite lines ~100–129. Keep every other assertion.

**Pure tests of `quadroDasBolhas`** (import it like `origemValida`), with plain-object rects at 375:
- **Capsule** (lupa 271..315, deX = filtro 315..359, pilula 16..307, x 315..359, all top 6 and height 44, emenda0 0):
  - p=0: visible left `pilula.left + dx + esquerda = 271`, `pilula.right + dx = 315`, emenda 0, xdx 0, icone 0.
  - p=0.05: emenda 0 (fused stretch).
  - p=0.48: emenda 22 and vao < 0.6 (pinch before part).
  - p=1: dx 0, esquerda 0, emenda 22, puxao 0, vao 8, icone 1.
  - Sweep p from 0 to 1.05 in steps of .01:
    - `pilula.right + dx ≤ x.left + xdx − x.width·puxao + 1e-6` (never overlaps);
    - `0 ≤ emenda ≤ R`;
    - the visible left edge is non-increasing.
- **Alone** (lupa = deX = 315..359, emenda0 22):
  - p=0: esquerda = pilula.width (zero width) and emenda 22.
  - p=0.15: emenda < 4 (fused).
  - p=1: equal to the capsule result.

**Source assertions:**
- `const progresso = React.useRef(0)`.
- `const de = pilula.style.clipPath ? progresso.current : 0`.
- `animate(de, 1, { ...MOLA, onUpdate: quadro })` appears exactly once.
- `animate(progresso.current, 0, { ...VOLTA_DA_PILULA, onUpdate: quadro })` and the `VOLTA_DA_PILULA` constant are kept.
- `abrindo.then(() => { if (ativa) bolhasEmRepouso(`.
- **Writer slice** (`function desenharBolhas` to `function bolhasEmRepouso`) contains:
  - the pill's `translateX(${f.dx}px)`;
  - the pill's `round ${f.R}px ${f.emenda}px ${f.emenda}px ${f.R}px`;
  - the ×'s `inset(0px round ${f.emenda}px ${f.R}px ${f.R}px ${f.emenda}px)`;
  - the children's `translateX(${f.esquerda}px)`.
- **Reset slice** clears the pill (transform, clipPath, children), the × (transform, clipPath), and the X and ghost (opacity, filter, transform).
- **CSS and markup:**
  - No `command-search-cancel]]:[animation:menu-morph`.
  - No `:is([data-slot=command-dialog-panel],[data-slot=command-search-cancel])`.
  - The panel's `menu-morph_380ms_linear_60ms_backwards` and `data-closed:[&_[data-slot=command-dialog-panel]]:[animation:menu-unmorph_210ms_linear_both]` are present.
  - `data-slot="command-search-cancel-origin"` and `replaceChildren(` are present.
  - The × className contains `bg-clip-border` and `origin-right`.
- **Imports and wiring:**
  - `import { ACOPLAMENTO_Y } from "@/lib/liquid-move"`.
  - Nothing matches `/camada\.style\.(transform|clipPath|opacity|filter)/`.
  - `closeOrigin?: React.RefObject<HTMLElement | null>` appears in command.tsx and in app-command-palette.tsx.
  - app-header.tsx contains `ref={filtroRef}` and `closeOrigin={filtroRef}`.
- **Gate:** run `npx tsc --noEmit && npm run lint && npm run test:unit`.

### 12. Acceptance measurements
**Browser preview** (the `dev-attach` server on :3000, mobile preset 375×812, light and dark). Read only; no data writes.
1. **Per-frame log (Transações: filter; Painel: calendar).** Inject a rAF sampler with javascript_tool before tapping the lupa. For 600ms after the tap, log the inline `transform`/`clipPath` of the pill and the ×, plus the ghost and X opacity, and compute visible edges. Accept:
   - frame 0: pill [271,315] and × [315,359] within ±0.5, seam 0;
   - seam ≤ 1 through ~35ms, then 22 with gap < 1 around 80–90ms;
   - gap 8 ±0.5 from 200ms;
   - pill right ≤ × left in every frame;
   - at rest: every inline style empty, × rect [315,359], computed box-shadow (ring) back on both.
2. **Glass stays lit.** In every sampled frame, the computed `backdrop-filter` of both bubbles stays `blur(24px) saturate(1.5)`, and no ancestor up to `<body>` (layer, cmdk root, input wrapper) has a non-default transform, filter, clip-path or opacity.
3. **Close via ×.** Gap closed by ~50ms, seam 0 by ~115ms, at 280ms exactly [271,315]+[315,359] with ghost opacity 1 and X 0. Unmount ≈300ms, and `document.activeElement` is the lupa.
4. **Reopen mid-close.** Close with Escape, then dispatch ⌘K 60ms later. The first frame after the reopen has a visible left edge within 3px of the last close frame (no jump to 271).
5. **Alone case** (a screen with no page filter). Frame 0 is the × circle with the ghost magnifier and a zero-width pill; emenda < 4 by ~35ms; after that the frames match the capsule case.
6. **Popover filter (Painel).**
   - With the month popover open, tapping the lupa only closes the popover.
   - The next tap starts the gesture with the calendar ghost.
   - With an active filter on Transações, the dot shows in the ghost at frame 0 and fades with it.
7. **Frame-by-frame screenshots** (`page.clock` must be installed before `goto`, or motion captures the real rAF):
   - Use Playwright (as in the visual comparison memory): install `page.clock` before `goto`, then step `runFor(16)` and screenshot the header row (0,0,375,70) from 0 to 320ms, open and close, light and dark.
   - Check: no 1px hairline at the fused seam (the bg-clip-border fix), the pinch visible across ≥3 frames, and an acceptable tint step between the modal glass and the header plate.

**iOS Simulator** (only what WebKit reproduces):
- the keyboard rises on the same tap, with the caret in the field;
- the blur stays on both bubbles while they carry clip-path, transform and scale at once: record with `xcrun simctl io booted recordVideo` and step the frames;
- no seam hairline in dark mode;
- the pinch is legible at 60Hz;
- both rings come back in the same frame;
- Settings › Accessibility › Reduce Motion gives a fade only;
- in the standalone PWA the row stays aligned with the header (top = safe-area + 6).

**Tuning knobs, if the owner wants a slower or bolder read:**
- Move `PARTE` to `[0.5, 1]` for a longer neck.
- Raise `PUXAO_DO_X` to 0.08.
- Move `ICONE` earlier for the alone-case double magnifier.
- Do not slow `MOLA`: it is the pill travel the owner already approved.
- The modal-vs-plate tint step belongs to the design system (one surface for both), not to this gesture.
