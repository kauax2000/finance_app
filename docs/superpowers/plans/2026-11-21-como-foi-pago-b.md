# "Como foi pago" (B) — plano

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Trocar a rosca de várias formas do "Como foi pago" pela barra dividida com destaque e uma lista com ícone, nome, %, diferença e valor.

**Architecture:**
- Duas peças pequenas entram no design system, em `src/components/ui/chart.tsx`: `ChartSplit labels="none"` e `ChartSwatch`, se ainda não houver uma amostra exportada.
- A tela compõe o cartão em `graficos-do-resumo.tsx`.

**Tech Stack:** React 19, Recharts via `@/components/ui/chart`, Tailwind v4, vitest.

**Spec:** `docs/superpowers/specs/2026-11-21-como-foi-pago-b-design.md`. Mockup: `docs/design/painel/como-foi-pago-v3.html`, opção B.

## Global Constraints
- O `AGENTS.md` vale inteiro:
  - só tokens e Heroicons (`size-4` e menos: `16/solid`; `size-6`: `24/outline`);
  - nenhum componente declarado em `src/app/`;
  - par de identidade sem `gap`;
  - componente mudado entra com docs (`src/app/designsystem/docs/chart.tsx`), teste (`src/components/ui/chart-versions.test.ts`) e uma linha na seção "Gráficos" do `AGENTS.md`.
- Antes de buscar código, rode `graphify query "<pergunta>"`. Depois de mudar, rode `graphify update .`.
- O banco do dev é produção: no app, só leitura.
- Os checks:
  - `npx tsc --noEmit`;
  - `npm run lint`;
  - `npx vitest run src/components/ui src/components/categories src/lib`;
  - `npm run ds:audit -- src/components/ui/chart.tsx src/components/categories/detail`.
- Não faça push.
- Faça stage só dos arquivos que você mudou, um por um: há mudanças de outra sessão no working tree.

## Review Focus
1. Uma forma só: o cartão de hoje (anel e "Tudo no …") não muda.
2. Sem mês anterior (`diferencas` null): a linha de baixo mostra só o %, e o cabeçalho fica sem "vs outubro".
3. Forma com 3% ou menos: o segmento ainda aparece (`min-w-1`), e a linha da lista também.
4. Nome longo ("Bradesco Visa Infinity") numa coluna de 375px: cabe numa linha, e o valor não quebra (`whitespace-nowrap`).
5. O % do destaque e o da lista somam 100 e batem com a barra (o mesmo `splitPercents`).

---

### Task 1: A barra e a lista do "Como foi pago"

**Files:**
- Modify: `src/components/ui/chart.tsx` (`ChartSplit` `labels="none"`; `ChartSwatch` se preciso; exporte `splitPercents` se a tela precisar)
- Modify: `src/app/designsystem/docs/chart.tsx`
- Modify: `AGENTS.md` (seção "Gráficos", uma linha)
- Test: `src/components/ui/chart-versions.test.ts`
- Modify: `src/components/categories/detail/resumo/graficos-do-resumo.tsx` (o ramo de várias formas, por volta da linha 425, e o cabeçalho do cartão)

**Interfaces:**
- Consome, do arquivo da tela:
  - `porPagamento` (`{ chave, nome, forma, cardId, valor, compras }`, já ordenado do maior ao menor);
  - `diferencas` e `diferencaDaForma(d, despesa)`;
  - `ICONE_DA_FORMA`, `CreditCardBrandChip`, `cartoes`, `configPagamento`, `reaisInteiros`, `mesAnterior`, `aberto`.
- O cabeçalho é montado pelo `CartaoDoGrafico` (no mesmo pacote `resumo/`). Leia-o e use a ação ou o apoio que ele já tiver. Se não houver um lugar para a legenda à direita, acrescente uma prop no `CartaoDoGrafico`, mirando como os outros cartões da tela fazem.
- Produz: `ChartSplit labels?: "below" | "legend" | "none"`. E, se nascer, `ChartSwatch({ color, className? })`, a amostra redonda de 8px que a legenda usa.

- [ ] **Step 1: Os testes.** No padrão de `chart-versions.test.ts`, escreva testes que conferem:
  - com `labels="none"`, o `ChartSplit` não tem `chart-legend-content` nem a fileira de rótulos, e o `aria-label` mantém o resumo;
  - se `ChartSwatch` nascer, ele é exportado e é a amostra que a legenda usa.

  Confira que os testes falham.
- [ ] **Step 2:** Implemente em `chart.tsx`. Depois faça a página de docs (um exemplo de "forma de pagamento" com `labels="none"`) e a linha no `AGENTS.md`.
- [ ] **Step 3: A tela.** Monte o ramo de várias formas conforme o spec (§ "Como fica"):
  - destaque;
  - `ChartSplit labels="none"`;
  - lista com `Item`/`ItemMedia`/`ItemContent` do DS, se servirem para a linha. Senão, use a composição mais simples com peças do DS. Nada de `function` de componente novo dentro de `src/app/`.

  O cartão de uma forma não muda.
- [ ] **Step 4: Confira no navegador.** Dev em http://localhost:3000. A Carro está em `/categories/fdc3a58a-7d80-4cc6-a0ee-a92148f53820?type=expense&month=2026-11`, com PIX e Bradesco Visa Infinity. Só leitura. Compare com a opção B do mockup.
- [ ] **Step 5:** Os checks passam. Rode `graphify update .`.
- [ ] **Step 6:** Commit `feat(categoria): "Como foi pago" com a barra dividida e a lista`.
