# Parcelas mês a mês (P4g) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** O card de impacto da parcela troca a barra por 4 ladrilhos mês a mês com o pico marcado.

**Architecture:** `impactoDaParcela` passa a devolver `meses` (4 meses, sem e com esta compra), calculado pela mesma soma por mês de cobrança do pico. O `QuadroDoImpacto` desenha os ladrilhos a partir disso.

**Tech Stack:** Next 16, React 19, Tailwind v4, Vitest.

**Spec:** `docs/superpowers/specs/2026-11-13-parcelas-mes-a-mes-design.md`

## Global Constraints

- Nada em `src/components/ui/` nem em `globals.css`.
- Tokens só: laranja `text-warning` / `inset-ring-warning/60`; contorno claro `inset-ring-foreground/35`; nenhum hex.
- Dinheiro por `MoneyDisplay`; mês curto por `formatMonthShortPtBr` (`@/lib/transaction-date`).
- Commits terminam com `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`; `git add` só dos arquivos da tarefa; nunca `graphify-out/graph.json`; sem push.
- Rodar `graphify update .` depois de cada commit.

## Review Focus

- Compra que começa no mês seguinte (o formulário): o primeiro ladrilho é o mês da 1ª parcela, não o de hoje.
- Compra que acaba dentro da janela: os meses depois do fim mostram "sem esta" e `comEsta === semEsta`.
- Pico fora da janela de 4 meses: nenhum ladrilho marcado como pico, sem erro.
- Centavos: as somas vêm em centavos e voltam a reais (sem 0,1 + 0,2).
- Plano já em andamento no detalhe (`impactoDoPlano`): a janela começa no mês de hoje, não na 1ª parcela antiga.

---

### Task 1: `meses` no `Impacto`

**Files:**
- Modify: `src/lib/previsao/impacto-parcela.ts` (`Impacto`, `picoDasParcelas`, `impactoDaParcela`)
- Test: `src/lib/previsao/impacto-parcela.test.ts`

**Interfaces:**
- Produces: `Impacto.meses: Array<{ mes: string; semEsta: number; comEsta: number }>` — 4 itens, `mes` em `YYYY-MM`, valores em reais.

- [ ] **Step 1: Testes que falham** (no `describe("impactoDaParcela")`, com `HOJE = "2026-10-24"` e `c1` já do arquivo)

```ts
it("meses: 4 meses a partir da 1ª parcela, sem e com a compra", () => {
    const i = impactoDaParcela(dezParcelas, dados({ hojeYmd: HOJE, cartoes: [c1] }))
    expect(i.meses.map((m) => m.mes)).toEqual(["2026-11", "2026-12", "2027-01", "2027-02"])
    expect(i.meses[0]).toEqual({ mes: "2026-11", semEsta: 0, comEsta: 300 })
})

it("meses: depois do fim da compra, com e sem são iguais", () => {
    const duas: PlanoProposto = { ...dezParcelas, parcelas: 2 }
    const i = impactoDaParcela(duas, dados({ hojeYmd: HOJE, cartoes: [c1] }))
    expect(i.meses.map((m) => m.comEsta)).toEqual([300, 300, 0, 0])
    expect(i.meses[2].comEsta).toBe(i.meses[2].semEsta)
})

it("meses: começa no mês de hoje quando a 1ª parcela já passou", () => {
    const antiga: PlanoProposto = { ...dezParcelas, primeiraYmd: "2026-08-10" }
    const i = impactoDaParcela(antiga, dados({ hojeYmd: HOJE, cartoes: [c1] }))
    expect(i.meses[0].mes).toBe("2026-10")
})
```

Mais um, com um plano existente de R$ 0,10 e a compra de R$ 0,20, que espera `comEsta` `0.3` exato (centavos).

- [ ] **Step 2:** `npx vitest run src/lib/previsao/impacto-parcela.test.ts` — falha (`meses` indefinido).

- [ ] **Step 3: Implementar.** Extrair `parcelasPorMes(planos, mesDeHoje): Map<string, number>` (centavos), usada por `picoDasParcelas` e pelos `meses`. Início da janela: o maior entre `mesDeHoje` e o mês da 1ª cobrança do plano sintético. Os 4 meses por `shiftYearMonth` (já importado no arquivo). Valores ÷ 100.

- [ ] **Step 4:** o mesmo comando passa; `npx tsc --noEmit` limpo.

- [ ] **Step 5: Commit** `feat(previsao): o impacto da parcela traz os 4 meses, sem e com a compra`.

### Task 2: os ladrilhos no `QuadroDoImpacto`

**Files:**
- Modify: `src/components/transactions/impacto-da-parcela.tsx`
- Test: `src/components/transactions/impacto-da-parcela.test.ts` (novo, lendo a fonte com `lerFonte`/`semComentarios` de `@/test/fonte`)

**Interfaces:**
- Consumes: `Impacto.meses` (Task 1), `Impacto.pico.mes`.

- [ ] **Step 1: Teste da fonte que falha**

```ts
it("P4g: ladrilhos mês a mês, sem barra", () => {
    const f = semComentarios(lerFonte("src/components/transactions/impacto-da-parcela.tsx"))
    expect(f).not.toContain("<Progress")
    expect(f).toContain('titulo="Parcelas mês a mês"')
    expect(f).toContain("impacto.meses.map(")
    expect(f).toContain("· pico")
    expect(f).toContain("sem esta")
    expect(f).toContain("text-warning")
})
```

- [ ] **Step 2:** `npx vitest run src/components/transactions/impacto-da-parcela.test.ts` — falha.

- [ ] **Step 3: Implementar.** No `BlocoContexto` (título `"Parcelas mês a mês"`, link igual), trocar número grande + `Progress` + legenda por uma grade de 4 (`grid grid-cols-4 gap-1.5`), cada ladrilho com a casca da folha do plano (`rounded-row-lg bg-muted px-2.5 py-2`, grade de uma coluna): rótulo `Caption` com o mês curto (+ ` · pico` quando `m.mes === pico.mes`), `MoneyDisplay value={m.comEsta}` em `font-medium`, e a nota `Caption` — `+ {currencyBRL(desta)} esta` em `text-warning` quando `comEsta > semEsta`, senão `sem esta`. Contorno: o 1º ladrilho `inset-ring-1 inset-ring-warning/60`; o do pico (se não for o 1º) `inset-ring-1 inset-ring-foreground/35`. A grade leva `role="list"` e cada ladrilho `role="listitem"` com `aria-label` por extenso ("novembro: R$ 313,50 em parcelas, R$ 60,00 desta compra"). Sob a grade, `Caption` com `X% da renda recorrente` só quando `percentualDaRenda != null`. Tirar os imports que sobrarem (`Progress`, `Muted`, `tituloDoImpacto` se não usado). Frases e aviso intactos.

- [ ] **Step 4:** teste passa; `npx vitest run src/components/transactions src/lib/previsao` e `npx tsc --noEmit` limpos; `npx eslint` sem erro no arquivo; `npm run ds:audit -- src/components/transactions/impacto-da-parcela.tsx` sem achado.

- [ ] **Step 5: Commit** `feat(detalhe): o impacto da parcela em ladrilhos mês a mês com o pico (P4g)`.
