# O ícone de cada forma (A) — plano

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** O ladrilho de cada forma no "Como foi pago" passa a mostrar o ícone na cor da forma. O PIX ganha o símbolo próprio, e a bandeira do crédito vai num selo no canto.

**Architecture:**
- Três peças novas: `PixIcon`, `paymentMethodIcon()` e `CreditCardBrandChip size="xs"`.
- A tela compõe o ladrilho.

**Tech Stack:** React 19, Heroicons, Tailwind v4, vitest.

**Spec:** `docs/superpowers/specs/2026-11-21-icone-da-forma-design.md`. Mockup: `docs/design/painel/icone-da-forma.html`, opção A.

## Global Constraints
- O `AGENTS.md` vale inteiro:
  - Heroicons por tamanho: `size-4` usa `16/solid`;
  - SVG desenhado só para marca, e na lista `DRAWN_SVG_FILES`; procure onde ela mora com `grep -rn "DRAWN_SVG_FILES" scripts src`;
  - tokens apenas.
- Antes de buscar código, rode `graphify query "<pergunta>"`. Depois de mudar, rode `graphify update .`.
- O banco do dev é produção: no app, só leitura.
- Checks:
  - `npx tsc --noEmit`;
  - `npm run lint`;
  - `npx vitest run src/components src/lib src/app/designsystem`;
  - `npm run ds:audit -- src/components/categories/detail src/components/icons src/components/credit-cards`;
  - `node scripts/payment-contrast.mjs`. O Playwright local pode pedir `npx playwright install`; se pedir, rode e diga no relatório.
- Não faça push. Faça stage só dos seus arquivos, um por um.

## Review Focus
1. Crédito sem bandeira conhecida: sem selo, só o ícone.
2. Tema claro: o ícone a 3:1 sobre o fundo de 18%.
3. O selo não é cortado pelo `overflow` do item nem do cartão.
4. Forma repetida: o ícone e o fundo seguem o tom de 60%.
5. O cartão de uma forma só usa o mesmo ícone e a mesma cor no miolo.

---

### Task 1: O ícone na cor da forma

**Files:**
- Create: `src/components/icons/pix-icon.tsx` (+ um teste curto, no padrão de `filter-lines-icon.test.ts`)
- Create: `src/lib/payment-method-icon.tsx` (+ teste)
- Modify: `src/components/credit-cards/credit-card-brand-chip.tsx` (`size?: "sm" | "xs"`; `sm` é o de hoje)
- Modify: o arquivo da `DRAWN_SVG_FILES` (o `PixIcon` entra, com o motivo)
- Modify: `scripts/payment-contrast.mjs` (o ícone sobre o fundo de 18%)
- Modify: `src/components/categories/detail/resumo/graficos-do-resumo.tsx` (os ladrilhos da lista e o miolo da forma única; sai `ICONE_DA_FORMA`)

**Interfaces (produz):**
- `PixIcon(props: React.SVGProps<SVGSVGElement>)`: o losango do PIX, em `viewBox="0 0 24 24"`, com `fill="currentColor"`, `aria-hidden` e `data-slot="icon"`. O desenho de referência é o `<symbol id="pix">` do mockup.
- `paymentMethodIcon(method: string | null | undefined): ComponentType<{ className?: string }>`. Os mapeamentos estão no spec, e o padrão é `EllipsisHorizontalIcon`.
- `CreditCardBrandChip` ganha `size="xs"`: a moldura de cerca de 12 × 18 com o logo proporcional. Sem bandeira conhecida em `xs`, devolve `null`, para não haver selo.

- [ ] **Step 1: Testes.**
  - `paymentMethodIcon("pix") === PixIcon`, `paymentMethodIcon("cash") === BanknotesIcon`, e o desconhecido devolve `EllipsisHorizontalIcon`.
  - O `PixIcon` renderiza com `aria-hidden` e `currentColor`.
  - `CreditCardBrandChip size="xs"` com marca nula devolve vazio.
  - No contraste, o ícone a ≥ 3:1 sobre o fundo de 18%, nos dois temas.

  Confira que falham.
- [ ] **Step 2:** Implemente as três peças e a entrada no `DRAWN_SVG_FILES`.
- [ ] **Step 3: A tela.**
  - O ladrilho com o fundo de 18% e o ícone na cor da forma. Respeite o tom de forma repetida que já existe na tela.
  - No crédito, o selo `xs` no canto de baixo à direita: `absolute -right-1 -bottom-1 ring-2 ring-card rounded-[...]`, com o raio da escala pequena do DS (`rounded-xs`/`rounded-sm`). O ladrilho é `relative`, e nada acima recorta o selo.
  - O miolo da forma única usa o mesmo ícone e cor.
- [ ] **Step 4: Navegador** (http://localhost:3000, só leitura). A Carro está em `/categories/fdc3a58a-7d80-4cc6-a0ee-a92148f53820?type=expense&month=2026-11`. Confira nos dois temas e compare com a opção A do mockup.
- [ ] **Step 5:** Os checks passam. Rode `graphify update .`.
- [ ] **Step 6:** Commit `feat(categoria): o ícone de cada forma na cor dela, com o PIX e a bandeira no canto`.
