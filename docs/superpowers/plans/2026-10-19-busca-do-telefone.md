# Busca do telefone Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** No telefone, a lupa do header se transforma na barra de pesquisa da paleta (no lugar da gaveta), com o teclado já aberto.

**Architecture:**
- O ramo `isMobile` do `CommandDialog` (`src/components/ui/command.tsx`) troca o `Drawer` por uma camada de tela cheia sobre o Radix Dialog: o véu, a linha da busca (a pílula e o "Cancelar") e a placa dos resultados.
- A pílula nasce do retângulo de um elemento de origem (`origin`) e se estica até a largura final, na mola, pelo `animate` do `motion`.
- O `AppHeader` passa a lupa do telefone como origem.

**Tech Stack:** Next.js 16, React 19, Tailwind v4, Radix Dialog (`radix-ui`), cmdk, `motion/react`, Vitest (testes de fonte).

**Spec:** `docs/superpowers/specs/2026-10-19-busca-do-telefone-design.md`

## Global Constraints

- **Escopo:** só o ramo `isMobile` (abaixo de `md`). O ramo do desktop do `CommandDialog` não muda nenhuma linha.
- **Tokens e literais:** nada de `#hex`, `rgb()` nem valor arbitrário de cor. Movimento por `MOLA` e `SAIDA` (`src/lib/spring.ts`) e pelos tokens `--duration-*`/`--ease-*`.
- **Peças existentes:**
  - o véu é o `DialogOverlay` (`@/components/ui/dialog`);
  - o vidro da placa é o que a pilha já veste no diálogo (`modalSurfaceClassName`);
  - a pílula é o `CommandInput` da pilha.
- **Medidas:**
  - a pílula tem 44 de altura (`h-11`);
  - a calha é de 16px (`px-4` / `left: 16`);
  - o topo da linha é `calc(env(safe-area-inset-top,0px) + 6px)`;
  - a placa fica 12px abaixo da linha.
- **"Cancelar":** o texto é exatamente "Cancelar", num `Button variant="tertiary"` com `type="button"`.
- **`data-slot`:** `command-search` (camada), `command-search-bar` (linha), `command-search-cancel` (Cancelar).
- **Prop nova:** `origin?: React.RefObject<HTMLElement | null>` no `CommandDialog`.
- **Movimento reduzido** (`useReducedMotion()`): sem viagem da pílula, só o esmaecer.
- **Banco:** o banco de desenvolvimento é produção. Nenhum teste nem verificação grava dado.
- **Commit:** a mensagem termina com `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. Nunca dar push.

## Review Focus

1. **Lupa invisível ao abrir** (o ⌘K no telefone com teclado físico, ou o `origin` com largura 0): a pílula deve entrar no lugar, com `fade`/`zoom-in-95`, sem nascer em (0,0). É o teste de `origemValida` na Task 1.
2. **Reabrir antes do fim do fechamento:** a animação anterior é parada (`controls.stop()`), e a pílula não fica presa no meio.
3. **O foco no iOS:** o `input` precisa ter o foco no `onOpenAutoFocus` (sem esperar a mola), senão o teclado não abre. Um teste de fonte na Task 1 confere isso.
4. **A rolagem da página por trás:** o Radix Dialog modal trava a rolagem; com a camada, a página não pode rolar sob a placa. Isso vem do `Dialog` modal, e a Task 2 confere na prévia.
5. **Subpágina com filtro e tela sem filtro:** a origem é sempre a lupa visível do telefone (sozinha ou na cápsula). A Task 2 confere as duas.

---

### Task 1: A camada de busca do telefone no `CommandDialog`

**Files:**
- Modify: `src/components/ui/command.tsx` (os imports de `Drawer`/`DrawerContent`; o ramo `if (isMobile)` do `CommandDialog`, hoje nas linhas ~205-235; a assinatura do `CommandDialog`; o comentário do topo que diz "No telefone o `CommandDialog` é gaveta")
- Test: `src/components/ui/command-versions.test.ts` (troque o teste da linha 84, "no telefone o diálogo é gaveta…")

**Interfaces:**
- Produces:
  - `CommandDialog` aceita `origin?: React.RefObject<HTMLElement | null>`.
  - No telefone ele renderiza `data-slot="command-search"` com `data-slot="command-search-bar"` e `data-slot="command-search-cancel"`.
  - `export function origemValida(r: DOMRect | null | undefined): r is DOMRect` em `command.tsx`: `true` só com `width > 0 && height > 0`.

- [ ] **Step 1: Write the failing tests** (em `command-versions.test.ts`, no lugar do teste "no telefone o diálogo é gaveta")

```ts
it("no telefone a lupa vira a barra: camada própria, sem gaveta, com o título ligado", () => {
  expect(CODIGO).not.toMatch(/from "@\/components\/ui\/drawer"/)
  expect(CODIGO).toMatch(/if \(isMobile\) \{[\s\S]*?data-slot="command-search"[\s\S]*?<DialogTitle>\{title\}<\/DialogTitle>/)
  expect(CODIGO).toContain('data-slot="command-search-bar"')
  expect(CODIGO).toContain('data-slot="command-search-cancel"')
  expect(CODIGO).toMatch(/>\s*Cancelar\s*</)
  expect(CODIGO).toContain("origin?: React.RefObject<HTMLElement | null>")
  // A pílula nasce do retângulo da origem e anda na mola; fecha na SAIDA.
  expect(CODIGO).toMatch(/import \{[^}]*\bMOLA\b[^}]*\bSAIDA\b[^}]*\} from "@\/lib\/spring"|import \{[^}]*\bSAIDA\b[^}]*\bMOLA\b[^}]*\} from "@\/lib\/spring"/)
  expect(CODIGO).toContain("getBoundingClientRect()")
  // O teclado: o foco vai ao campo no próprio commit, sem esperar a mola.
  expect(CODIGO).toMatch(/onOpenAutoFocus=\{[\s\S]*?preventDefault\(\)[\s\S]*?\.focus\(/)
  expect(CODIGO).toMatch(/if \(isMobile\)[\s\S]*?safe-area-inset-top/)
  // O recorte vai no próprio vidro (a pílula), nunca num ancestral, e sai no fim.
  expect(CODIGO).toMatch(/clipPath[\s\S]*?"none"/)
})

it("a origem só vale com caixa: lupa escondida não faz a pílula nascer em 0,0", async () => {
  const { origemValida } = await import("@/components/ui/command")
  expect(origemValida(null)).toBe(false)
  expect(origemValida(undefined)).toBe(false)
  expect(origemValida({ width: 0, height: 44 } as DOMRect)).toBe(false)
  expect(origemValida({ width: 44, height: 44 } as DOMRect)).toBe(true)
})
```

- [ ] **Step 2: Run to verify they fail**

Run: `npx vitest run src/components/ui/command-versions.test.ts`
Expected: FAIL. O primeiro teste falha no `not.toMatch(drawer)`, e o segundo falha porque `origemValida` não é função.

- [ ] **Step 3: Implement** em `src/components/ui/command.tsx`

**Imports e prop:**
- Tire o import de `Drawer`/`DrawerContent`.
- Importe:
  - `animate`, `useReducedMotion` e `type AnimationPlaybackControls` de `"motion/react"`;
  - `MOLA` e `SAIDA` de `"@/lib/spring"`;
  - `Button` de `"@/components/ui/button"`.
- Acrescente `origin?: React.RefObject<HTMLElement | null>` às props do `CommandDialog`, com o JSDoc: "No telefone, o elemento de onde a pílula nasce (a lupa do header); sem ele, ela entra no lugar."
- Exporte `origemValida` como na Interface.

**O ramo `if (isMobile)` devolve:**

```
<Dialog {...props}>
  <DialogPortal>
    <DialogOverlay />   // o véu com borrão; fecha ao tocar fora
    <DialogPrimitive.Content data-slot="command-search" … onOpenAutoFocus={foca o input}>
      <DialogHeader className="sr-only"><DialogTitle>{title}</DialogTitle><DialogDescription>{description}</DialogDescription></DialogHeader>
      <CommandBeamContext.Provider value>
        <Command variant="panel" autoSelectFirst={false} … {...commandProps}>{children}</Command>
      </CommandBeamContext.Provider>
    </DialogPrimitive.Content>
  </DialogPortal>
</Dialog>
```

**O `Content`:**
- `fixed inset-x-0 top-0 z-(--z-modal) flex h-dvh flex-col px-4 pt-[calc(env(safe-area-inset-top,0px)+6px)] pb-[max(--spacing(3),env(safe-area-inset-bottom))] outline-none`.
- `data-closed:[animation:presence-hold_var(--duration-fast)]` segura a desmontagem, como no ramo do desktop.
- O `pointer-events-none` vai na casca, com `pointer-events-auto` na linha e na placa, para o toque no vão chegar ao véu e fechar.

**A pilha:**
- O `Command` recebe `className="gap-3"`.
- O teto da lista é `[--command-list-ceiling:calc(100dvh-env(safe-area-inset-top,0px)-6px-44px-12px-max(--spacing(3),env(safe-area-inset-bottom)))]`.
- A transição de altura é `[--command-list-transition:var(--duration-base)]`.
- A placa leva `pointer-events-auto`.

**A linha da busca:**
- O `CommandInput` é o primeiro filho que o consumidor passa. Ninguém reordena filhos.
- A raiz da pilha recebe `relative` e `[&_[data-slot=command-input-wrapper]]:me-22`, que deixa 88px à direita da pílula.
- O "Cancelar" é posicionado `absolute top-0 right-0 h-11 w-22` na raiz. O "Cancelar" em `text-base` cabe em 88px.
- A pílula chega aos 44 sozinha: no telefone o `pointer-coarse:` vale, e o campo com piso de toque mede 44.
- O `data-slot="command-search-bar"` vai num `div` vazio `absolute inset-x-0 top-0 h-11 pointer-events-none`, que marca a linha para os testes e para a medida do topo.

**O "Cancelar":**
- `<Button type="button" variant="tertiary" data-slot="command-search-cancel" onClick={() => props.onOpenChange?.(false)} className="absolute top-0 right-0 h-11 px-3 text-base pointer-events-auto">Cancelar</Button>`.
- Entra com `animate-in fade-in-0` e `animation-delay` de 80ms.

**O gesto:**
1. Num `useLayoutEffect` que depende de `props.open`, ao abrir:
   - leia `origin?.current?.getBoundingClientRect()`;
   - se `origemValida(rect)` e sem movimento reduzido, pegue a pílula (`el`, o `[data-slot=search-input]` dentro da camada; é ela que tem o vidro) e o retângulo final dela (`final`);
   - anime `el` com `clipPath` de `inset(${rect.top-final.top}px ${final.right-rect.right}px ${final.bottom-rect.bottom}px ${rect.left-final.left}px round 22px)` até `inset(0px 0px 0px 0px round 22px)`, com `animate(el, { clipPath: [...] }, MOLA)`;
   - no fim (`.then`), ponha `el.style.clipPath = "none"`.
2. **Por que `clip-path` e por que no próprio vidro:**
   - O `clip-path` não mexe no layout do cmdk e revela a pílula conforme a borda viaja da lupa até a calha. É o "estica para a esquerda".
   - Num **ancestral** da pílula, o `clip-path` vira raiz de fundo e desliga o `backdrop-filter` dela (o problema da rodada 323). Por isso o recorte mora na própria pílula e sai no fim.
3. O ícone da pílula fica preso à esquerda. Não anime o ícone.
4. **Sem origem válida ou com movimento reduzido:** a pílula entra com `animate-in fade-in-0 zoom-in-95`, na `--duration-spring`.
5. **Ao fechar** (`props.open` vira `false`, com a casca ainda montada pelo `presence-hold`), anime o `clipPath` da pílula de volta ao retângulo da origem (relido), com `SAIDA`; se a origem não for válida, não anime e deixe o `presence-hold` esmaecer.
6. Guarde o `AnimationPlaybackControls` num ref e chame `stop()` antes de cada nova animação e no desmontar.

**O foco:**
- `onOpenAutoFocus={(e) => { e.preventDefault(); contentRef.current?.querySelector<HTMLInputElement>("[data-slot=command-input]")?.focus() }}`.
- Confirme o `data-slot` real do `input` do `CommandInput` no arquivo. Se for outro, use o real e ajuste a asserção.

**O comentário do topo:** troque "No telefone o `CommandDialog` é gaveta (`Drawer`)." por "No telefone o `CommandDialog` é a barra: a pílula nasce da lupa (`origin`) e se estica até a largura, com o teclado aberto."

- [ ] **Step 4: Run tests**

Run: `npx vitest run src/components/ui/command-versions.test.ts src/components/ui/command-reveal.test.ts src/components/ui/command-beam.test.ts src/components/ui/command-dock.test.ts && npx tsc --noEmit`
Expected: PASS, sem erro de tipo.

- [ ] **Step 5: Commit**

```bash
git add src/components/ui/command.tsx src/components/ui/command-versions.test.ts
git commit -m "feat(command): no telefone a paleta é a barra que nasce da lupa, no lugar da gaveta

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: A lupa do header como origem, docs e registro

**Files:**
- Modify: `src/components/layout/app-header.tsx` (a função `lupa`, o `TopBarActions phone`, o `<AppCommandPalette …/>`)
- Modify: `src/components/layout/app-command-palette.tsx` (`AppCommandPaletteProps` e o `<CommandDialog …>` na linha ~176)
- Modify: `src/app/designsystem/docs/command.tsx` (os textos das linhas ~95 e ~440 que dizem "gaveta")
- Modify: `AGENTS.md` (a seção **Busca**/`Command`: "no telefone é gaveta" vira a barra; e o `CommandDialog` no `TopBar`, se citado)
- Modify: `docs/design/HISTORICO-DESIGN-SYSTEM.md` (acrescente "### Rodada 337 — no telefone a lupa vira a barra de pesquisa")
- Test: `src/components/ui/top-bar-versions.test.ts` (o describe "as ações numa cápsula")

**Interfaces:**
- Consumes: `CommandDialog origin?: React.RefObject<HTMLElement | null>` (Task 1).
- Produces: `AppCommandPalette` aceita `origin?: React.RefObject<HTMLElement | null>` e o repassa ao `CommandDialog`.

- [ ] **Step 1: Write the failing test** (em `top-bar-versions.test.ts`)

```ts
it("no telefone a busca nasce da lupa do header", () => {
  const cabecalho = fonte("src/components/layout/app-header.tsx")
  expect(cabecalho).toContain("const lupaRef = React.useRef<HTMLButtonElement>(null)")
  expect(cabecalho).toMatch(/<AppCommandPalette[^>]*origin=\{lupaRef\}/)
  const paleta = fonte("src/components/layout/app-command-palette.tsx")
  expect(paleta).toContain("origin?: React.RefObject<HTMLElement | null>")
  expect(paleta).toMatch(/<CommandDialog[\s\S]*?origin=\{origin\}/)
})
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run src/components/ui/top-bar-versions.test.ts`
Expected: FAIL em `lupaRef`.

- [ ] **Step 3: Implement**

**`app-header.tsx`:**
- Crie `const lupaRef = React.useRef<HTMLButtonElement>(null)`.
- A função `lupa` ganha um parâmetro `ref?: React.Ref<HTMLButtonElement>`, repassado ao `TopBarAction`. Ele é `Button`, e o React 19 passa `ref` como prop.
- Só as duas lupas do `phone` do `TopBarActions` (a sozinha e a da cápsula com o filtro) recebem `lupaRef`.
- Passe `origin={lupaRef}` ao `<AppCommandPalette>`.

**`app-command-palette.tsx`:** acrescente `origin?: React.RefObject<HTMLElement | null>` a `AppCommandPaletteProps` e repasse `origin={origin}` ao `CommandDialog`.

**Docs do catálogo:**
- Linha ~95: troque "No telefone ela é uma gaveta de baixo, com a busca em cima do teclado — estreite a janela e abra de novo." por "No telefone ela é a barra: a pílula nasce da lupa que a abriu e se estica até a largura, com o teclado aberto — estreite a janela e abra de novo."
- Linha ~440: troque "No telefone o diálogo é gaveta, em qualquer tamanho." por "No telefone o diálogo é a barra que nasce da lupa (`origin`), em qualquer tamanho."
- Acrescente uma linha à `PropsTable` do `CommandDialog`: `origin`, tipo `RefObject<HTMLElement | null>`, descrição "No telefone, de onde a pílula nasce (a lupa do header). Sem ela, a pílula entra no lugar."

**`AGENTS.md`:** na seção `Busca`/`Command`, substitua a menção de que o `CommandDialog` "no telefone é gaveta" por:

> "no telefone é a barra: o véu do `Dialog`, a pílula de 44 na linha do header com 'Cancelar' à direita e a placa embaixo; a pílula nasce do `origin` (a lupa do header) por `clip-path` na `MOLA` e volta na `SAIDA`; o foco vai ao campo no `onOpenAutoFocus`, para o teclado abrir no mesmo toque (rodada 337)"

**Histórico:** a rodada 337, com:
- o pedido (a gaveta "ficou nada a ver"; o gesto do iOS);
- as decisões da spec;
- as medidas da verificação.

- [ ] **Step 4: Run tests and audit**

Run: `npx tsc --noEmit && npm run test:unit && npm run ds:audit -- src/components/ui/command.tsx src/components/layout/app-header.tsx src/components/layout/app-command-palette.tsx`
Expected: tudo passa; o auditor diz "Nenhum achado".

- [ ] **Step 5: Verify in the preview** (servidor `dev-start`; se o CSS parecer velho, `preview_stop`, `rm -rf .next/dev`, `preview_start dev-start`)

**Na prévia a 375px (`resize_window preset=mobile`), em `/transactions` (lupa na cápsula com o filtro):**
- Clique na lupa. A camada abre, `document.activeElement` é o `input` da pílula, e a pílula tem 44 de altura e começa a 16px da borda esquerda.
- O "Cancelar" fecha. Esc fecha.
- Digitar "Painel" e escolher a linha navega.

**Em `/dashboard`:** repita a abertura (lupa sozinha).

**Numa subpágina** (`/categories/<id>`): repita a abertura.

**A 1280px:** o `CommandDialog` do desktop abre igual a antes (`data-slot="command-dialog"`).

**No simulador iOS:** abra o app instalado, toque na lupa e confira que a pílula nasce da lupa e que o campo fica focado. O teclado só aparece com o teclado físico do simulador desligado; se ele estiver ligado, basta o foco.

- [ ] **Step 6: Commit**

```bash
git add src/components/layout/app-header.tsx src/components/layout/app-command-palette.tsx src/app/designsystem/docs/command.tsx AGENTS.md docs/design/HISTORICO-DESIGN-SYSTEM.md src/components/ui/top-bar-versions.test.ts
git commit -m "feat(header): a busca do telefone nasce da lupa do header

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```
