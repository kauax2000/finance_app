# "Tamanho das compras" (L) — plano

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Trocar as barras por faixa pela fileira de concentração: uma frase com o N de compras que fazem 80% e um bloco por compra, na largura do valor.

**Architecture:**
- Uma função pura nova em `src/lib/categoria-resumo.ts`.
- O `ChartSplit` ganha `size="lg"` e `tooltip`, ou nasce a `ChartStrip` (ver o spec).
- A página passa as compras ao resumo.

**Tech Stack:** React 19, Tailwind v4, vitest.

**Spec:** `docs/superpowers/specs/2026-11-21-tamanho-das-compras-design.md`. Mockup: `docs/design/painel/tamanho-das-compras-3.html`, opção L.

## Global Constraints
- Vale o `AGENTS.md` inteiro: tokens, invariante 8, raio da escala, `hover:` com par de toque e nenhum componente em `src/app/`.
- Antes de buscar código, `graphify query "<pergunta>"`; depois de mudar, `graphify update .`.
- O banco do dev é produção: no app, só leitura.
- Checks:
  - `npx tsc --noEmit`;
  - `npm run lint`;
  - `npx vitest run src/components/ui src/components/categories src/lib src/app/designsystem`;
  - `npm run ds:audit -- src/components/ui/chart.tsx src/components/categories/detail`.
- Não faça push. Faça stage só dos seus arquivos, um por um.

## Review Focus
1. Uma compra só: a frase "1 compra fez o mês inteiro" e um bloco cheio na cor.
2. Valores iguais (10 compras de R$ 50): o N é 8, e os blocos têm a mesma largura.
3. Mais de 40 compras: o rabo junta num bloco "outras M compras", e a fileira cabe em 264px sem rolar.
4. Estorno: não entra nas compras nem no total.
5. Receita: "entradas" na frase e no `aria-label`.

---

### Task 1: A fileira de concentração

**Files:**
- Modify: `src/lib/categoria-resumo.ts` (+ o teste dele)
- Modify: `src/components/ui/chart.tsx` (`ChartSplit size="lg"` + `tooltip`, ou a `ChartStrip` nova)
- Modify: `src/app/designsystem/docs/chart.tsx`
- Modify: `AGENTS.md` (seção "Gráficos", uma linha)
- Test: `src/components/ui/chart-versions.test.ts`
- Modify: `src/app/(app)/categories/[categoryId]/page-client.tsx` (por volta da linha 485: `faixas` vira `concentracao`)
- Modify: `src/components/categories/detail/resumo/resumo-da-categoria.tsx` (repassa a prop)
- Modify: `src/components/categories/detail/resumo/graficos-do-resumo.tsx` (o cartão "Tamanho das compras"/"Tamanho das entradas"; o `comFaixas` vira `comCompras`)

**Interfaces (produz):**
- `concentracaoDasCompras(txs: Transaction[], tipo: TipoDaCategoria, opts?: { max?: number }): { compras: { id: string; descricao: string; data: string; valor: number }[]; outras: { quantidade: number; valor: number } | null; quantidade: number; total: number; n80: number }`
  - `max` vale 40 por padrão.
  - `compras` tem no máximo `max - 1` itens quando há rabo; o resto vai para `outras`.
  - `quantidade` é o total real de compras.
  - `n80` é contado sobre a lista inteira, antes de juntar o rabo.
  - O dinheiro é em centavos, como o resto do arquivo.

- [ ] **Step 1: Testes.**
  - Na lib:
    - [2000, 240, 210, 180, 150, 120, 100, 85, 70, 55, 40, 35, 30, 25, 18, 12] dá `n80` 5 e `total` 3370;
    - uma compra só dá `n80` 1;
    - 10 compras de R$ 50 dão `n80` 8;
    - 45 compras dão 39 em `compras` e `outras.quantidade` 6;
    - o estorno fica fora.
  - No `chart-versions`: o tamanho `lg` (ou a peça nova) e a dica por segmento.
  
  Confira que os testes falham.
- [ ] **Step 2:** Implemente a lib e a peça. Depois a página de docs (um exemplo de concentração) e a linha no `AGENTS.md`.
- [ ] **Step 3:** Faça a tela conforme o spec: a frase, a fileira com as N primeiras na `corDaSerie` e o resto em `--muted`, e embaixo "maiores · menores". A data da dica usa os helpers de `src/lib/transaction-date.ts`. A página e o resumo passam a prop.
- [ ] **Step 4: Navegador** (http://localhost:3000, só leitura). A Carro está em `/categories/fdc3a58a-7d80-4cc6-a0ee-a92148f53820?type=expense&month=2026-11`. Confira no tema escuro e no claro, e a 375px. Compare com a L do mockup.
- [ ] **Step 5:** Os checks passam. Rode `graphify update .`.
- [ ] **Step 6:** Commit `feat(categoria): "Tamanho das compras" mostra a concentração do mês`.
