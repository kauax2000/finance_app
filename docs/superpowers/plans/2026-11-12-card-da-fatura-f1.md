# Card da fatura F1 — plano

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** O card "Fatura" do detalhe do lançamento (`BlocoFatura`) passa a mostrar a F1: o total com o vencimento ao lado, a barra da fatura com a fatia desta compra acesa e a frase do peso dela.

**Architecture:** Uma função pura nova em `src/lib/detalhe/blocos.ts` escreve a frase do peso na fatura. O `BlocoFatura` monta a F1 reusando o que o card da categoria (C4) já tem: `fatiaDoLancamento`, o `Progress` com `highlight` e o invólucro com a cor da categoria.

**Tech Stack:** Next 16, React 19, Tailwind v4, Vitest.

**Spec:** a escolha do dono nesta sessão (12/11/2026): a versão F1 de https://claude.ai/artifact/BY2YsLc2D88ev6bNUAKmue. Fonte local do mockup: `/private/tmp/claude-501/-Users-kaualeandro-Desktop-Finance-App-finance-app-dev/44ca32df-bed3-45e6-82a3-c0577e2bd9ba/scratchpad/card-fatura.html` (seção F1).

## Global Constraints

- Só componentes do design system; nada novo em `src/components/ui/` nem em `globals.css`. Tokens só. Rótulos de botão em minúscula.
- A cor da fatia é a **cor da categoria**, como no card da categoria logo acima (C4): o mesmo `tile-vivid` + `--tile-color` e `--progress-highlight:var(--tile-surface)` que o `bloco-categoria.tsx` usa (veja o invólucro `barraNaCor` dele; extraia-o para um lugar comum aos dois blocos em vez de duplicar).
- Convidado: o bloco já não monta para ele; nada muda.
- Commits terminam com `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. Sem push. `git add` só dos próprios arquivos (nunca `graphify-out/`). Depois: `graphify update .`.
- Banco de dev é produção: nada grava.

## Review Focus

- Fatura com total ≤ 0 (só estornos): sem barra e sem porcentagem; a frase diz só "esta compra: R$ X".
- Compra maior que o total da fatura (estorno na janela): a porcentagem para em 100% e a fatia não sai do trilho (`fatiaDoLancamento` já limita).
- Sem vencimento conhecido (`estado?.dueYmd` nulo): o "vence" some, o resto fica.
- Lançamento que é estorno/receita no cartão: o bloco hoje só monta para despesa; continua assim.

---

### Task 1: F1 no `BlocoFatura`

**Files:**
- Modify: `src/lib/detalhe/blocos.ts` (função nova)
- Test: `src/lib/detalhe/blocos.test.ts`
- Modify: `src/components/transactions/detalhe/bloco-fatura.tsx`
- Modify: `src/components/transactions/detalhe/bloco-categoria.tsx` (só para mover o invólucro da cor, se extraído)
- Test: `src/components/transactions/detalhe/blocos.test.ts` (asserções de fonte)

**Interfaces:**
- Consumes: `fatiaDoLancamento(gasto, valor)` e `diaMesCurto(ymd)` de `src/lib/detalhe/blocos.ts`; `Progress` (`highlight`); `tileColorFor`.
- Produces: `rotuloDoPesoNaFatura(valor: number, total: number): string` em `src/lib/detalhe/blocos.ts`.

- [ ] **Step 1: Testes que falham** em `src/lib/detalhe/blocos.test.ts` (normalize o espaço do `currencyBRL` como os vizinhos):
  - `rotuloDoPesoNaFatura(253.5, 914.08)` → `"esta compra: R$ 253,50 (28% da fatura)"`.
  - `rotuloDoPesoNaFatura(60, 0)` → `"esta compra: R$ 60,00"` (sem porcentagem com total ≤ 0).
  - `rotuloDoPesoNaFatura(120, 100)` → `"esta compra: R$ 120,00 (100% da fatura)"`.
- [ ] **Step 2:** `npx vitest run src/lib/detalhe` → FAIL.
- [ ] **Step 3:** Implementar `rotuloDoPesoNaFatura` (porcentagem arredondada, no máximo 100).
- [ ] **Step 4: Render do `BlocoFatura`** (dados, link "ver fatura" e o título "Fatura de {mês}" não mudam):
  - Linha do total: `MoneyDisplay value={total} size="lg"` e, ao lado, `<Muted>vence {diaMesCurto(estado.dueYmd)}</Muted>` quando houver `dueYmd`; o `Badge` do estado à direita, como hoje.
  - Barra: só com `total > 0`, `Progress value={total} max={total} highlight={fatiaDoLancamento(total, Number(t.amount))}` dentro do invólucro da cor da categoria; `aria-label` "Esta compra na fatura de {mês}".
  - `Caption`: o ponto na cor da categoria (como no C4), `rotuloDoPesoNaFatura(Number(t.amount), total)`, " · ", o nome do cartão, " · fecha ", `diaMesCurto(ate)`. O "R$ X em parcelas" sai (a F1 não o mostra) — remova o cálculo `emParcelas` se ficar sem uso.
- [ ] **Step 5:** Teste de fonte em `blocos.test.ts`: `bloco-fatura.tsx` contém `rotuloDoPesoNaFatura(`, `highlight={fatiaDoLancamento(` e `vence`; e o invólucro da cor não está duplicado entre `bloco-fatura.tsx` e `bloco-categoria.tsx`.
- [ ] **Step 6:** `npx tsc --noEmit && npm run lint && npx vitest run src/lib/detalhe src/components/transactions && npm run ds:audit -- src/components/transactions/detalhe` → PASS. No dev server (`http://localhost:3000`), abrir o detalhe da "Zara" em /transactions e conferir o card (sem gravar nada).
- [ ] **Step 7:** Commit `feat(detalhe): card da fatura F1, a fatia da compra na fatura`.
