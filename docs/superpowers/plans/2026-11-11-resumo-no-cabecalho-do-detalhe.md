# Resumo no cabeçalho do detalhe — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ao rolar o painel de detalhe do lançamento, o centro da barra do topo mostra um resumo (ladrilho, nome e valor em cinza) quando o nome sai por baixo dela, para a pessoa saber qual lançamento está vendo.

**Architecture:** O `DialogHeaderRow` (`src/components/ui/dialog.tsx`) ganha um slot `center`, centrado na placa inteira e escondido até `centerShown`; um hook `useDialogHeaderDock` (no mesmo arquivo) diz quando um elemento do `DialogBody` passou por baixo da borda de cima do corpo. O detalhe (`transaction-detail-sheet.tsx`) observa o nome do topo e passa o resumo.

**Tech Stack:** Next 16, React 19, Tailwind v4, Vitest (testes que leem a fonte e `renderToStaticMarkup`).

**Spec:** decidido com o dono nesta conversa (11/nov/2026), sem documento à parte — as decisões estão em "Decisões", abaixo. Mockups: https://claude.ai/artifact/KbtK7Hk8m2XQqeMPrC8XMY (versões H2a e A5).

## Decisões (do dono)

- Conteúdo **H2a**: `ColorTile size="xs"` da categoria, o nome (truncado em `…`), o valor com sinal em `MoneyDisplay tone="muted"`. Ordem: ladrilho, nome, valor.
- Alinhamento **A5**: centrado na **largura da placa**, não no vão entre ↑↓ e ⋯ ×.
- Entra quando o nome do topo sai por baixo da borda de cima do corpo; sai quando volta. O gesto é o do título que sobe à barra (`TopBarPageTitle`): sobe 6px (`translate-y-1.5` → `0`), do desfoque (`blur-xs` → `blur-none`) e da opacidade 0, em `--duration-base` / `--ease-out`.

## Global Constraints

- `src/components/ui/` exige autorização: o dono aprovou o resumo; o slot novo no `DialogHeaderRow` é a forma dele. Registre na página do catálogo `src/app/designsystem/docs/dialog.tsx` (invariante 8: peça nova documentada na mesma mudança).
- Tokens só (sem `#hex`, sem `px` arbitrário). Ícones Heroicons. Sem prettier. `graphify-out/graph.json` não entra em commit.
- Commits terminam com `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. Nunca push.
- O banco de dev é o de produção: nada que grave dados.
- `src/lib/insights/acoes.test.ts` já falha antes deste plano; não é regressão.

## Review Focus

1. Nome longo ("Mercado da semana no Atacadão") — o nome corta em `…`, ladrilho e valor ficam inteiros, nada passa por cima de ↑↓ nem de ⋯ ×.
2. Movimento reduzido — sem deslocamento nem desfoque; só aparece/some.
3. Leitor de tela — o resumo repete o título: `aria-hidden` e `inert`, sem segundo anúncio nem parada de Tab.
4. Trocar de lançamento com ↑↓ já rolado — o resumo mostra o lançamento novo (o conteúdo segue as props; a visibilidade segue a rolagem nova).
5. Diálogo sem `center` — nada muda (sem nó vazio, sem `relative` que mexa no layout).

---

### Task 1: `center` no `DialogHeaderRow` e `useDialogHeaderDock`

**Files:**
- Modify: `src/components/ui/dialog.tsx` (`DialogHeaderRow`, ~linha 534; exportar o hook)
- Modify: `src/app/designsystem/docs/dialog.tsx` (nota e exemplo junto do `DialogHeaderRow`, ~linha 181)
- Test: `src/components/ui/dialog-versions.test.ts`

**Interfaces:**
- Produces:
  - `DialogHeaderRow` props novas: `center?: React.ReactNode`, `centerShown?: boolean` (padrão `false`).
  - `useDialogHeaderDock<T extends HTMLElement>(): [ref: (el: T | null) => void, docked: boolean]` — `docked` é `true` quando o elemento saiu **por cima** da borda de cima do `[data-slot="dialog-body"]` mais próximo.

- [ ] **Step 1: Testes que falham** em `dialog-versions.test.ts`:

```ts
it("o centro do cabeçalho: centrado na placa, escondido até centerShown, fora da leitura", () => {
  const fechado = renderToStaticMarkup(h(DialogHeaderRow, { center: "Uber" }, null))
  expect(fechado).toContain('data-slot="dialog-header-center"')
  expect(fechado).toContain('aria-hidden="true"')
  expect(fechado).toMatch(/data-slot="dialog-header-center"[^>]*inert/)
  expect(fechado).not.toContain("data-shown")
  const aberto = renderToStaticMarkup(h(DialogHeaderRow, { center: "Uber", centerShown: true }, null))
  expect(aberto).toContain("data-shown")
  expect(aberto).not.toMatch(/data-slot="dialog-header-center"[^>]*inert/)
  expect(renderToStaticMarkup(h(DialogHeaderRow, {}, null))).not.toContain("dialog-header-center")
})

it("o centro entra como o título que sobe à barra: 6px, do desfoque, sem movimento no reduzido", () => {
  expect(CODIGO).toContain("translate-y-1.5 opacity-0 blur-xs")
  expect(CODIGO).toContain("data-shown:translate-y-0 data-shown:opacity-100 data-shown:blur-none")
  expect(CODIGO).toContain("motion-reduce:translate-y-0 motion-reduce:blur-none")
})

it("useDialogHeaderDock observa contra o corpo do diálogo", () => {
  expect(CODIGO).toMatch(/function useDialogHeaderDock/)
  expect(CODIGO).toMatch(/export \{[^}]*useDialogHeaderDock/)
  expect(CODIGO).toContain('closest<HTMLElement>(\'[data-slot="dialog-body"]\')')
})
```

(Ajuste a import do topo para trazer `DialogHeaderRow`. Se o `inert` do React 19 renderizar como `inert=""`, a regex acima já casa.)

- [ ] **Step 2:** `npx vitest run src/components/ui/dialog-versions.test.ts` — FAIL nos três.

- [ ] **Step 3: Implementar em `dialog.tsx`.**
  - `DialogHeaderRow`: com `center != null`, a linha ganha `relative` e um `<div data-slot="dialog-header-center" aria-hidden inert={!centerShown || undefined} data-shown={centerShown || undefined}>` com `pointer-events-none absolute inset-y-0 inset-x-19 flex min-w-0 items-center justify-center gap-2` + a troca `transition-[opacity,translate,filter] duration-(--duration-base) ease-(--ease-out) translate-y-1.5 opacity-0 blur-xs data-shown:translate-y-0 data-shown:opacity-100 data-shown:blur-none motion-reduce:translate-y-0 motion-reduce:blur-none`. `inset-x-19` (76px) é a folga dos dois lados (as setas 32+4+32 e o ⋯ × têm a mesma largura), e por ser simétrica o centro é o da placa. Comentário de uma linha com o porquê do 76. Sempre `aria-hidden` (repete o título); `inert` enquanto escondido.
  - `useDialogHeaderDock`: estado `[el, setEl]` por ref de função; `useEffect` com `IntersectionObserver` da janela do próprio nó (`el.ownerDocument.defaultView`, para o iframe do catálogo), `root` = `el.closest('[data-slot="dialog-body"]')`, `threshold: 0`; `docked = !e.isIntersecting && e.boundingClientRect.top < (e.rootBounds?.top ?? 0)`. Sem corpo, `docked` fica `false`. Exportar no bloco `export { … }`.

- [ ] **Step 4:** a página `src/app/designsystem/docs/dialog.tsx`: depois do parágrafo do `DialogHeaderRow` (~181), um parágrafo curto ("`center` + `centerShown` + `useDialogHeaderDock`: o resumo que entra na linha do cabeçalho quando o título do corpo passa por baixo dela — o detalhe do lançamento") e um trecho de código no mesmo estilo do exemplo ao lado. Sem demo nova.

- [ ] **Step 5:** `npx vitest run src/components/ui/dialog-versions.test.ts src/app/designsystem` → PASS; `npx tsc --noEmit` limpo; `npx eslint src/components/ui/dialog.tsx src/app/designsystem/docs/dialog.tsx src/components/ui/dialog-versions.test.ts` limpo.

- [ ] **Step 6: Commit**

```bash
git add src/components/ui/dialog.tsx src/components/ui/dialog-versions.test.ts src/app/designsystem/docs/dialog.tsx
git commit -m "feat(dialog): centro do cabeçalho que entra quando o título do corpo passa por baixo

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

### Task 2: o resumo no detalhe do lançamento

**Files:**
- Modify: `src/components/transactions/transaction-detail-sheet.tsx` (o `DialogHeaderRow` ~linha 318; o bloco do topo ~linha 357)
- Test: `src/components/transactions/transaction-detail-sheet.test.ts`

**Interfaces:**
- Consumes: `DialogHeaderRow` `center` / `centerShown` e `useDialogHeaderDock` da Task 1.

- [ ] **Step 1: Teste que falha** em `transaction-detail-sheet.test.ts` (no `describe("fonte do detalhe")`):

```ts
it("ao rolar, o cabeçalho resume o lançamento: ladrilho, nome e valor em cinza (H2a/A5, 11/nov/2026)", () => {
  const f = fonte(SHEET)
  expect(f).toContain("useDialogHeaderDock")
  expect(f).toMatch(/centerShown=\{nomeSubiu\}/)
  expect(f).toMatch(/<ColorTile size="xs"/)
  expect(f).toMatch(/<MoneyDisplay[^>]*size="md"[^>]*tone="muted"|<MoneyDisplay[^>]*tone="muted"[^>]*size="md"/)
})
```

- [ ] **Step 2:** `npx vitest run src/components/transactions/transaction-detail-sheet.test.ts` — FAIL.

- [ ] **Step 3: Implementar.**
  - `const [nomeRef, nomeSubiu] = useDialogHeaderDock<HTMLDivElement>()` e o `ref={nomeRef}` no `div` que embrulha o `DialogTitle` e o chip k/n (a linha do nome, dentro do par nome/valor).
  - No `DialogHeaderRow`: `centerShown={nomeSubiu}` e `center={…}` com `<ColorTile size="xs" color={t.category?.color}><CategoryIconPreview name={normalizeCategoryIcon(t.category?.icon)} /></ColorTile>`, o nome em `<span className="min-w-0 truncate text-sm font-medium">{descricao}</span>` e `<MoneyDisplay size="md" signed tone="muted" value={valorComSinal(t)} className="shrink-0" />` (receita também em cinza: o tom do resumo é sempre o apagado, decisão H2a).
  - Comentário de uma linha: `H2a/A5 (11/nov/2026): ao rolar, o resumo entra no centro da barra`.

- [ ] **Step 4:** `npx vitest run src/components/transactions` → PASS; `npx tsc --noEmit` e `npx eslint src/components/transactions/transaction-detail-sheet.tsx src/components/transactions/transaction-detail-sheet.test.ts` limpos.

- [ ] **Step 5: Commit**

```bash
git add src/components/transactions/transaction-detail-sheet.tsx src/components/transactions/transaction-detail-sheet.test.ts
git commit -m "feat(detalhe): ao rolar, o cabeçalho resume o lançamento (ladrilho, nome e valor)

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

A conferência no navegador (rolar o Uber da carteira "Teste · Detalhe", nome longo, movimento reduzido) é do controlador, depois da revisão final.
