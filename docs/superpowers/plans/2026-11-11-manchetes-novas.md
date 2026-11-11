# Manchetes novas do detalhe — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A manchete do detalhe do lançamento ganha sete casos novos (N1–N7) e, nos casos que pedem uma atitude, um botão de ação dentro do `Alert` (M4).

**Architecture:** A regra continua pura em `src/lib/detalhe/contexto.ts` (`escolherManchete`): entradas novas, casos novos na ordem fixa e um campo `acao` na saída. Os blocos de `src/components/transactions/detalhe/` mandam as fatias novas pelo `useFatiaDaManchete` que já existe; o painel desenha a ação com `AlertActions placement="inline"` + `AlertAction asChild` + `Link`.

**Tech Stack:** Next 16, React 19, Tailwind v4, Vitest.

**Spec:** decidido com o dono nesta conversa (11/nov/2026). Página com os casos e o design: https://claude.ai/artifact/DUKnXMM22T9kuA2YXPYyKg. O dono pediu "todos menos o N8, e o M4 só nos que fazem sentido ter ação".

## Decisões

**Ordem (a primeira que vale ganha):** N1 → 1 → 2 → 3 → N2 → N3 → 4 → N4 → N5 → 5 → N6 → N7 → nada. (1–5 são os de hoje: 1 fechou acima, 2 passou, 3 ritmo, 4 acima da média, 5 última parcela.)

| Caso | Tom (`tom`) | Condição | Texto (exato) | Ação |
| --- | --- | --- | --- | --- |
| N1 repetido | `destructive` | outra despesa com a mesma descrição normalizada e o mesmo valor (centavos iguais) a até 2 dias de distância (antes ou depois) | `Parece repetido: há outro ${nome} de ${currencyBRL(valor)} em ${diaMesLongo}.` (ex. "10 de nov") | `Ver os 2` → lista: Descrição contém `nome` + período [data−2, data+2] |
| N2 subiu | `warning` | histórico (≥3 vezes): todas as outras vezes têm o mesmo valor (diferença ≤ R$ 0,01) e esta é maior | `${nome} subiu de ${currencyBRL(antes)} para ${currencyBRL(valor)} (+${pct}).` | `Ver cobranças` → o link do bloco Histórico |
| N3 perto | `warning` | mês corrente, com orçamento, `gasto/orcamento ≥ 0,8` e `gasto ≤ orcamento`, e o caso 3 não valeu | `${nome} já usou ${pct} do orçamento de ${mes}. Restam ${currencyBRL(orcamento − gasto)}.` | `Ver orçamento` → `categoryDetailPath(categoryId, { month: ym })` |
| N4 fatura | `info` | cartão: `valor / total da fatura ≥ 0,2` e total > 0 | `Esta compra é ${pct} da ${rotulo} (${currencyBRL(total)}).` (`rotulo` = "fatura de dezembro") | — |
| N5 mais barato | `success` | histórico: `valor / media − 1 ≤ −0,3` | `Este ${nome} saiu ${pct} mais barato que a sua média (${currencyBRL(media)}).` (pct sem sinal) | — |
| N6 receita | `success` se `total ≥ esperado`, senão `info` | receita do mês corrente com `esperado > 0` | success: `Com esta, entraram ${currencyBRL(total)} — tudo o que era previsto para ${mes}.` · info: `Com esta, entraram ${currencyBRL(total)} de ${currencyBRL(esperado)} previstos para ${mes}.` | — |
| N7 primeira parcela | `info` | parcela `k = 1` de `n > 1` | `1ª de ${n} parcelas: ${currencyBRL(valorParcela)} por mês até ${ultimaComAno}.` (ex. "outubro de 2027"; o ano sempre) | — |

**Ação (M4)** só onde a manchete pede uma atitude: N1 (conferir e apagar), 1/2/3/N3 (rever o orçamento — `Ver orçamento`, o mesmo destino) e N2 (rever a cobrança). Os informativos (4, N4, N5, 5, N6, N7) ficam sem ação: o bloco que explica está logo abaixo. Os casos 1–3 de hoje ganham a ação `Ver orçamento`.

`pct` é `Math.round(x*100)%` como o `pct` de hoje.

## Global Constraints

- Sem tocar em `src/components/ui/` nem `globals.css`: `Alert`, `AlertActions`, `AlertAction` já existem (`AlertAction` aceita `asChild`).
- Tokens só; textos em português exatamente como na tabela. Sem prettier.
- Mudar para onde um botão leva é **mudança de jornada**: `docs/JORNADAS.md` e `docs/atlas/template.html` na mesma mudança (Task 3).
- Commits terminam com `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. Nunca push. `graphify-out/graph.json` fora do commit.
- O banco de dev é o de produção: nada que grave dados.
- `src/lib/insights/acoes.test.ts` já falha antes deste plano.

## Review Focus

1. Convidado — nada de orçamento (1–3, N3) nem de fatura (N4): o bloco de fatura não monta para ele, e a Categoria já manda `orcamento: null`.
2. N1 com o próprio lançamento — a comparação exclui o `id` do alvo; dois lançamentos iguais no mesmo dia se acusam um ao outro.
3. N2 com valores flutuantes (Uber) — não vale; só quando as outras vezes são iguais.
4. Trocar de lançamento com ↑↓ — a fatia velha não fica (o painel já zera por `chaveDosBlocos`; os blocos novos usam a mesma chave e mandam `null`/vazio quando não valem).
5. Receita do mês que passou — sem N6 (só mês corrente).

---

### Task 1: a regra (`escolherManchete`) com os casos novos e a ação

**Files:**
- Modify: `src/lib/detalhe/contexto.ts`
- Modify: `src/lib/detalhe/blocos.ts` (`ultimaParcela` ganha `ultimaComAno`)
- Test: `src/lib/detalhe/contexto.test.ts`, `src/lib/detalhe/blocos.test.ts` (se não existir, o teste de `ultimaParcela` vai em `contexto.test.ts`)

**Interfaces — Produces:**
```ts
export type Acao = { href: string; label: string }
export type Manchete = { tom: "destructive" | "warning" | "info" | "success"; texto: string; acao?: Acao }
export type EntradaDaManchete = {
  mesCorrente: boolean
  hoje: Date
  categoria?: { nome: string; mes: string; gasto: number; lancado: number; orcamento: number | null; hrefOrcamento: string | null }
  historico?: { nome: string; valor: number; media: number; outros: number[]; href: string } | null
  duplicado?: { nome: string; valor: number; dia: string; href: string } | null   // dia = "10 de nov"
  fatura?: { rotulo: string; total: number; valor: number } | null
  parcela?: { ultimaNoMes: string; ultimaComAno: string; ultimaEhEsteOuProximo: boolean; valorParcela: number; primeira: { n: number } | null } | null
  receitas?: { mes: string; total: number; esperado: number } | null   // só mês corrente
}
export function duplicadoDe(alvo: Despesa, despesas: Despesa[]): Despesa | null // mesma descrição normalizada, mesmo valor em centavos, |dias| ≤ 2, id diferente; o mais perto
```
`ultimaParcela(...)` passa a devolver também `ultimaComAno: string` ("outubro de 2027").

- [ ] **Step 1: testes que falham** em `contexto.test.ts`, um `it` por caso da tabela, com os textos exatos e a `acao` (ou a falta dela). Inclua: a ordem (N1 vence orçamento estourado; 3 vence N3; N2 vence 4 quando as outras são iguais; 4 vence N5 não se aplica — use valores que só um valha), N2 não vale com outros `[28, 31, 27]`, N3 não vale com 79%, N4 não vale com 19%, N6 info com total < esperado e success com igual, N7 só com `primeira`, `duplicadoDe` acha o de 2 dias depois e ignora o de 3 dias e o próprio id. Os casos 1–3 de hoje passam a esperar `acao: { href: hrefOrcamento, label: "Ver orçamento" }` (sem ação quando `hrefOrcamento` é null).
- [ ] **Step 2:** `npx vitest run src/lib/detalhe` → FAIL.
- [ ] **Step 3:** implementar na ordem da tabela. `duplicadoDe` compara `Math.round(amount*100)` e a diferença em dias entre `YYYY-MM-DD` (use `transactionLocalYmd` se a data vier ISO).
- [ ] **Step 4:** `npx vitest run src/lib/detalhe` → PASS; `npx tsc --noEmit` mostra erros só nos consumidores (Task 2), nenhum em `src/lib`.
- [ ] **Step 5: Commit** `feat(detalhe): manchetes novas (repetido, subiu, perto do orçamento, fatura, mais barato, receita, 1ª parcela) e a ação` — só os arquivos de `src/lib/detalhe/`.

### Task 2: os blocos mandam as fatias novas, e o painel desenha a ação

**Files:**
- Modify: `src/components/transactions/detalhe/bloco-contexto.tsx` (`FatiaDaManchete` inclui `duplicado`, `fatura`, `receitas`)
- Modify: `bloco-categoria.tsx` (fatia com `hrefOrcamento`: `categoryDetailPath(categoryId, { month: ym })`, ou `null` sem `categoryId`)
- Modify: `bloco-historico.tsx` (a consulta vai até **data + 2 dias**; manda `{ historico: { …, outros, href }, duplicado }` — `outros` são os valores das outras vezes do `historicoDe`; `duplicado` vem de `duplicadoDe` sobre todas as despesas da consulta, mesmo com menos de 3 vezes; `href` do duplicado = `hrefDaLista` Descrição contém + período [data−2, data+2])
- Modify: `bloco-fatura.tsx` (recebe `onManchete`; manda `{ fatura: { rotulo, total, valor: Number(t.amount) } }`, `rotulo` = `tituloDaFatura(...)` com a inicial minúscula; erro ou sem cartão → `{ fatura: null }`)
- Modify: `bloco-parcelada.tsx` (fatia com `primeira: kn?.k === 1 && n > 1 ? { n } : null`)
- Modify: `bloco-receitas.tsx` (recebe `onManchete`; no mês corrente com `esperado > 0` manda `{ receitas: { mes, total, esperado } }`, senão `{ receitas: null }`)
- Modify: `src/components/transactions/transaction-detail-sheet.tsx` (passa `onManchete` à Fatura e às Receitas; o `Alert` da manchete desenha `<AlertActions placement="inline"><AlertAction asChild><Link href={acao.href}>{acao.label}</Link></AlertAction></AlertActions>` quando há `acao`)
- Test: `src/components/transactions/detalhe/blocos.test.ts`, `src/components/transactions/transaction-detail-sheet.test.ts`

**Interfaces — Consumes:** tudo do "Produces" da Task 1.

- [ ] **Step 1: testes que falham** (leitura da fonte, no estilo dos que existem): a Fatura e as Receitas recebem `onManchete` no painel; o painel tem `AlertActions placement="inline"` e `AlertAction asChild` dentro do `Alert` da manchete; o Histórico chama `duplicadoDe` e a consulta soma 2 dias ao fim (`addDaysYmd(ymd, 2)`); a Categoria manda `hrefOrcamento`.
- [ ] **Step 2:** rodar → FAIL.
- [ ] **Step 3:** implementar. Cada bloco que não vale manda o vazio da sua chave (`{ fatura: null }` etc.), para a fatia velha sair, como o Histórico já faz.
- [ ] **Step 4:** `npx vitest run src/components/transactions src/lib/detalhe` → PASS; `npx tsc --noEmit` e `npx eslint` dos arquivos tocados limpos.
- [ ] **Step 5: Commit** `feat(detalhe): blocos mandam as manchetes novas e a manchete ganha ação`.

### Task 3: jornada

**Files:**
- Modify: `docs/JORNADAS.md` (a aresta da manchete no fluxograma, ~linha 766, e a linha "Detalhe" da tabela, ~901: os casos novos na ordem e as ações N1 → Transações filtrada, orçamento → detalhe da categoria, N2 → Transações filtrada)
- Modify: `docs/atlas/template.html` (o parágrafo "O detalhe responde 'isso pesa?'", ~640, e a data da capa, ~282, com `11 nov 2026 · a manchete do detalhe ganha os casos repetido, subiu de preço, perto do orçamento, peso na fatura, mais barato, receita e primeira parcela, e um botão de ação nos que pedem atitude;` no começo)
- Run: `python3 docs/atlas/build.py` (gera `docs/atlas/atlas-jornadas.html`)

- [ ] **Step 1:** editar os dois documentos; ids de nó do Mermaid não podem ser palavras reservadas.
- [ ] **Step 2:** `python3 docs/atlas/build.py` → sem erro.
- [ ] **Step 3: Commit** `docs(jornadas): manchetes novas e ações do detalhe` com `docs/JORNADAS.md`, `docs/atlas/template.html`, `docs/atlas/atlas-jornadas.html`.

A republicação do Atlas no mesmo URL e a conferência no navegador são do controlador.
