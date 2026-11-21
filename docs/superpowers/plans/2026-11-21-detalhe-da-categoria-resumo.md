# A aba Resumo do detalhe da categoria — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development. Steps use checkbox (`- [ ]`).

**Goal:** Reconstruir a aba **Resumo** de `/categories/[categoryId]` com as ideias do dono (21/11/2026): uma frase de resumo, gráficos úteis e bonitos no estilo dos cartões de Categorias, cartões dos gastos com ícone, parcelas e o que se repete numa visão melhor, e insights.

**Aprovado pelo dono:** o mockup `.superpowers/brainstorm/75919-1795230631/content/resumo-v2.html` ("pode construir"). Ele é a referência visual de ordem e conteúdo; a pele final é a do design system.

**Architecture:** As contas novas são funções puras em `src/lib/categoria-resumo.ts` (testadas). A UI são blocos novos em `src/components/categories/detail/resumo/`, cada um feito de peças do design system (`ChartArea`, `ChartLine`, `ChartBars`, `ChartDonut`, `StatCard`, `DateTile`, `Card`, `Item`). Os dados já chegam pelo `useCategoryDetailBundleQuery` (lançamentos do mês com descrição, forma de pagamento e cartão; `seriesSource` de 12 meses; parcelas; assinaturas). Nada muda no banco.

**Tech Stack:** React 19, Recharts via `@/components/ui/chart`, Tailwind v4, vitest.

## Global Constraints
- `AGENTS.md` vale todo (componente não nasce em `src/app/`; tokens; Heroicons só — `16/solid` ≤ size-4, `20/solid` size-5, `24/outline` size-6+; dinheiro por `MoneyDisplay`/`currencyBRL`; datas por `src/lib/transaction-date.ts`; gráficos pelas regras de "Gráficos" do AGENTS).
- **Nada em `src/components/ui/`, `globals.css`, banco ou RPC.** Faltou peça → parar e reportar.
- **Cor da categoria nos gráficos:** o dono pediu os gráficos "como o da tela de Categorias", que pinta a faísca na cor da categoria (`tileColorFor(category.color)`, exceção registrada no AGENTS para traço e área). Aqui vale o mesmo, **só em traço e área** (12 meses e ritmo); barras e rosca usam a rampa neutra `--chart-1..5` (invariante 4); nunca cor sob texto.
- Só despesa e receita com textos próprios ("gasto"/"entrada"); a receita sem limite.
- Mês passado aberto: sem ritmo "até hoje" (mês inteiro contra o anterior inteiro), sem "até o fim do mês".
- Checks antes de cada commit: `npm run ds:audit -- <arquivos>`, `npx tsc --noEmit && npm run lint && npm run test:unit` (o `carteira-forms.test.ts` pode estourar tempo sob carga: rodar sozinho).

## Review Focus
1. Categoria sem lançamentos no mês: cada bloco some ou mostra um vazio curto; a frase diz "Nenhum gasto com <categoria> em <mês> até agora."; nada de NaN.
2. Estorno no cartão: abate os totais e nunca vira "maior compra" nem "mais frequente".
3. Mês com uma compra só: "compra típica" = ela; "mais frequente" some (precisa de ≥ 2 iguais).
4. Parcela no último número ("6 de 6"): "termina este mês", sem próxima data.
5. Receita: textos de entrada; sem insight de limite.

---

### Task 1: Contas do resumo

**Files:** Create `src/lib/categoria-resumo.ts`, Test `src/lib/categoria-resumo.test.ts`.

**Interfaces (todas puras, em reais):**
```ts
import type { Transaction, WorkspaceInstallmentPlan, WorkspaceSubscription } from "@/lib/supabase"
import type { TipoDaCategoria, LinhaDeValor, Comparacao } from "@/lib/categoria-detalhe"

/** Gasto acumulado dia a dia do mês aberto e do anterior (dia 1..último). `ate` = dia de hoje no mês aberto, senão o último. */
export function ritmoDoMes(args: { rows: LinhaDeValor[]; tipo: TipoDaCategoria; yearMonth: string; hojeYmd: string; lookup: CreditCardClosingLookup }): { dia: number; atual: number | null; anterior: number }[]
/** Soma por dia da semana (0 = seg … 6 = dom), pela data da compra. */
export function porDiaDaSemana(txs: Transaction[], tipo: TipoDaCategoria): { dia: number; nome: string; total: number }[]
/** Quantas compras em cada faixa: "até R$ 50", "R$ 50–200", "R$ 200–500", "R$ 500+". */
export function porFaixaDeValor(txs: Transaction[], tipo: TipoDaCategoria): { faixa: string; quantidade: number; total: number }[]
/** A mediana dos valores (null sem lançamentos). */
export function compraTipica(txs: Transaction[], tipo: TipoDaCategoria): number | null
/** A descrição que mais aparece (≥ 2 vezes; normalizada como `descricoesRepetidas`), com contagem e total; null se nenhuma repete. */
export function maisFrequente(txs: Transaction[], tipo: TipoDaCategoria): { descricao: string; vezes: number; total: number } | null
/** O dia com maior soma: { ymd, total, quantidade }; null sem lançamentos. */
export function diaDeMaisGasto(txs: Transaction[], tipo: TipoDaCategoria): { ymd: string; total: number; quantidade: number } | null
/** Parcelas ativas da categoria com a próxima data, "n de N", e o que falta pagar; mais as assinaturas ativas com a próxima cobrança. */
export function compromissos(args: { categoryId: string; parcelas: WorkspaceInstallmentPlan[]; assinaturas: WorkspaceSubscription[]; hojeYmd: string }): {
  itens: { id: string; nome: string; tipo: "parcela" | "assinatura"; valor: number; proximaYmd: string | null; atual?: number; total?: number; terminaYm?: string | null }[]
  porMes: number; ateAcabar: number
}
/** As repetidas do mês com a cadência média em dias e a projeção até o fim do mês (só no mês aberto). */
export function repeticoes(args: { txs: Transaction[]; tipo: TipoDaCategoria; yearMonth: string; hojeYmd: string }): { descricao: string; vezes: number; total: number; aCadaDias: number | null; projecaoNoMes: number | null }[]
/** A frase de resumo, sem IA: o veredito da média, o que puxou (o maior lançamento quando > 40% do mês), e o que ainda vem/vem no mês seguinte. */
export function fraseDoResumo(args: { nomeDaCategoria: string; tipo: TipoDaCategoria; yearMonth: string; aberto: boolean; lancado: number; previsto: number; media: number | null; maior: Transaction | null; proximoMes: number }): { partes: { texto: string; forte?: boolean }[] }
/** Até 3 insights, na ordem de utilidade: parcela que termina (libera R$ X/mês a partir de <mês>), concentração (2 maiores > 70% do mês: "sem eles ficaria em R$ Y"), sugestão de limite (despesa sem limite e com média: média arredondada para cima em centenas). */
export function insights(args: { tipo: TipoDaCategoria; lancado: number; media: number | null; limite: number | null; txs: Transaction[]; compromissos: ReturnType<typeof compromissos> }): { id: string; tom: "success" | "warning" | "info"; texto: { texto: string; forte?: boolean }[]; acao?: "previsao" | "limite" }[]
```
Regras comuns: o estorno no cartão abate (mesma regra `sinalNaDespesa`/`peso` de `categoria-detalhe.ts` — reaproveite o helper, exporte se preciso); receita: só `type === "income"` fora do cartão.

- [ ] **Step 1:** testes por função (casos do Review Focus + um caso feliz com os números da Carro: 9 lançamentos, maior R$ 2.000 PIX em 9/nov, estacionamento 3×, parcelas Consórcio 3/6 R$ 2.000 e Seguro 3/12 R$ 442,54).
- [ ] **Step 2:** `npx vitest run src/lib/categoria-resumo.test.ts` → FAIL.
- [ ] **Step 3:** implementar. **Step 4:** → PASS. **Step 5:** commit `feat(categoria): as contas da aba Resumo` (inclui este plano).

### Task 2: Os blocos

**Files (novos, `src/components/categories/detail/resumo/`):**
- `frase-do-resumo.tsx` — um `Card` com ícone `SparklesIcon` (20/solid) num poço e a frase em `font-display`? **Não**: Ledger só em `.page-title`/wordmark (AGENTS). Use a sans em `text-lg`, partes fortes em `font-semibold` com os números em `nums`.
- `graficos-do-resumo.tsx` — linha 1 (grade 3fr/2fr no `md`+): **Últimos 12 meses** (`ChartArea` na cor da categoria, com `ChartReferenceLine` da média `tone="average"`, último ponto destacado) e **Ritmo do mês** (`ChartLine` duas séries: atual na cor da categoria, anterior tracejada neutra). Linha 2 (3 colunas): **Como foi pago** (`ChartDonut` com a rampa neutra + legenda com %), **Dias da semana** (`ChartBars`, o maior em destaque), **Tamanho das compras** (`ChartBars` por faixa). Cada gráfico num `Card` com título curto e a legenda/linha de apoio em `Caption`.
- `cartoes-do-gasto.tsx` — `StatCardGroup` de 4 `StatCard` com `StatCardIcon` (Heroicons 20/solid): Maior compra (`ShoppingBagIcon`), Compra típica (`ReceiptPercentIcon` ou similar), Mais frequente (`ArrowPathIcon`), Dia de mais gasto (`CalendarDaysIcon`); valor + uma linha de detalhe. Some o que não tem dado.
- `compromissos-e-repeticoes.tsx` — duas colunas no `md`+: **Parcelas e assinaturas** (título com "R$ X por mês · R$ Y até acabar"; cada item com `DateTile` da próxima data, nome, "parcela n de N · termina em <mês>", trilho de passos — use `Progress segments` se existir, senão `Progress` simples —, valor) e **O que se repete** (lista com descrição, "N× · a cada ~D dias", total; e a frase da projeção no mês aberto).
- `insights-do-resumo.tsx` — até 3 cartões (`Item variant="outline"` com `ItemMedia variant="tile" tone`), texto com partes fortes e, quando `acao`, um link: "Ver na Previsão" (`/previsao`) ou "Definir limite" (abre o diálogo do limite: recebe `onDefinirLimite`).
- `resumo-da-categoria.tsx` — compõe tudo na ordem: frase → gráficos → cartões → compromissos e repetições → insights, com `gap-6` e títulos de seção (`PageSection`) onde o mockup tem.

- [ ] **Step 1:** implementar os blocos (props recebem os resultados da Task 1; nada busca dado).
- [ ] **Step 2:** `npm run ds:audit -- src/components/categories/detail/resumo`; tsc/lint.
- [ ] **Step 3:** commit `feat(categoria): os blocos da aba Resumo`.

### Task 3: Ligar na tela e limpar

**Files:** `src/app/(app)/categories/[categoryId]/page-client.tsx` (o `analise` da aba Resumo passa a ser `<ResumoDaCategoria …/>` com as contas da Task 1 em `useMemo`; o telefone usa o mesmo, empilhado); apagar `historico-dos-meses.tsx`, `onde-e-quem.tsx`, `para-onde-vai.tsx`, `comprometido.tsx` e o `Comparacoes` do telefone **se** nada mais os usar (grep); `category-detail-skeleton.tsx` na forma nova; `docs/JORNADAS.md` §9 (a análise e o link "Definir limite"/"Ver na Previsão" dos insights) + `docs/atlas/template.html` + `python3 docs/atlas/build.py` (não republicar).
- [ ] **Step 1:** ligar e apagar o que ficou sem uso.
- [ ] **Step 2:** checks do Global Constraints.
- [ ] **Step 3:** navegador (dev já em `http://localhost:3000`; **nunca gravar no banco**): Carro (`/categories/fdc3a58a-7d80-4cc6-a0ee-a92148f53820?type=expense&month=2026-11`) a 1440px e 375px; `?month=2026-08`; tema escuro. Screenshot; criticar e corrigir.
- [ ] **Step 4:** commit `feat(categoria): a nova aba Resumo na tela`.
