# Insights com foco no dado ou na ação: plano de implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** cada um dos 9 insights do detalhe da categoria lidera pelo dado (com um mini visual e um link no canto) ou pela ação (com um botão secundário de largura toda no pé).

**Architecture:**
- O detector `sazonal` ganha `dataYmd`. O deploy fica com o controlador, com o sim do dono.
- A lib `insights-da-categoria.ts` ganha `foco` e um `corpo` tipado por insight, mais os rótulos novos.
- O componente desenha o corpo de cada insight com peças do design system e põe o botão no pé dos insights de ação.
- A página passa `txs` à lib e abre o diálogo de limite com um valor inicial.

**Tech Stack:** Next 16, React 19, Tailwind v4, vitest, componentes de `src/components/ui/` (`Progress`, `DateTile`, `ChartSplit`, `Button`, `Skeleton`, `Caption`).

**Spec:** `docs/superpowers/specs/2026-11-24-insights-com-foco-design.md` (a tabela "Os 9" é literal). Mockup: `docs/design/painel/insights-foco.html`.

## Global Constraints

- **Insights de ação (1, 2, 4, 6, 7, 8):**
  - `Button variant="secondary"` de largura toda, no pé do slide, acima dos pontos;
  - sem `CardAction` de botão;
  - o canto mostra `Caption` quando a tabela diz (o total no 2, "~R$ X" no 6).
- **Insights de dado (3, 5, 9):** a ação fica em `CardAction`, com `Button tertiary sm`, como hoje.
- **Rótulos, literais:**
  - 1: "Ver os dois na lista";
  - 2: "Conferir agora";
  - 3: "Ajustar limite";
  - 4: "Criar conta do {Termo}";
  - 5: "Ver na Previsão";
  - 6: "Virar assinatura" ou "Virar conta a pagar";
  - 7: "Atualizar para R$ {para}" (com centavos, `currencyBRL`);
  - 8: "Definir R$ {sugerido}";
  - 9: "Ver os dois".
- **Linhas, literais:**
  - 3: "Fecha em R$ Y · limite R$ Z";
  - 4: "Foi o que você pagou em {mês/aa}";
  - 5: "{nome} · {atual} de {total} · termina em {mês}" (o mês com a regra de ano de hoje, `mesComAno`);
  - 7: "+R$ X por ano" ou "−R$ X por ano";
  - 8: "Este mês: R$ Y · pela média de 6 meses";
  - 9: "{A} e {B} · resto R$ X".
- **Títulos:** os mesmos de hoje.
- **Design system:**
  - só peças de `src/components/ui/`, com o raio da escala (a caixinha do duplicado é `bg-muted rounded-row`);
  - sem `primary` e sem arco-íris;
  - peça que faltar entra no design system, com registry, página e teste.
- **Banco de produção, só leitura** na conferência. Não fazer push nem deploy. Não fazer stage de `CLAUDE.md` nem de `graphify-out/graph.json`. Nada de `git stash` nem de `prettier --write` em arquivo inteiro.
- Commits terminam com `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Review Focus

- O sazonal sem `dataYmd` (payload antigo) desenha sem a folhinha, sem quebrar. Teste na Tarefa 2.
- A recorrência com a leitura dos lançamentos falhando ou vazia: sem colunas e sem erro na tela. Tarefa 3.
- A conferir com 1 lançamento: sem a linha "e mais". Com 5: duas linhas e "e mais 3". Teste na Tarefa 2.
- O preço que cai fica no tom de sucesso, com "−". Teste na Tarefa 2.
- O convidado continua sem os insights que gravam (`paraQuemLe`). Os testes existentes devem seguir verdes.

---

### Task 1: o sazonal guarda a data

**Files:**
- Modify: `supabase/functions/_shared/insights/detectores.ts` (`detectarSazonais`, ~344)
- Test: `supabase/functions/_shared/insights/detectores.test.ts`

**Interfaces:**
- Produces: `detectarSazonais` devolve também `dataYmd: string`, a menor `dateYmd` dos `achados` do `mesAnterior`. O arquivo continua sem import.

- [ ] **Step 1:** Escreva o teste: IPVA em 2025-01-20 e 2025-01-15 dá `dataYmd: "2025-01-15"`. Ajuste os testes existentes do sazonal.
- [ ] **Step 2:** `npx vitest run supabase/functions/_shared/insights/detectores.test.ts`. Esperado: FAIL.
- [ ] **Step 3:** Implemente.
- [ ] **Step 4:** O mesmo comando. Esperado: PASS.
- [ ] **Step 5:** Commit: `feat(insights): o sazonal guarda a data do gasto do ano passado`. **Sem deploy.**

### Task 2: foco, corpo e rótulos na lib

**Files:**
- Modify: `src/lib/insights-da-categoria.ts`
- Modify: `src/lib/insights-da-categoria.test.ts`

**Interfaces:**
- Consumes: `payload.dataYmd` do sazonal (Tarefa 1), opcional.
- Produces:
  ```ts
  export type CorpoDoInsight =
      | { tipo: "duplicado"; lancamentos: { descricao: string; dataYmd: string; forma: string; valor: number }[] }
      | { tipo: "conferir"; linhas: { dia: string; descricao: string; valor: number }[]; resto: number; total: number }
      | { tipo: "ritmo"; lancado: number; previsto: number; limite: number }
      | { tipo: "sazonal"; dataYmd: string | null; valor: number }
      | { tipo: "parcela"; atual: number; total: number }
      | { tipo: "recorrencia"; insightId: string; valorMedio: number }
      | { tipo: "preco"; de: number; para: number }
      | { tipo: "limite"; lancado: number; sugerido: number }
      | { tipo: "concentracao"; partes: { nome: string; valor: number }[]; resto: number }
  // InsightDaCategoria ganha: foco: "dado" | "acao"; corpo: CorpoDoInsight
  // AcaoDoInsight: { tipo: "limite"; valor?: number }  (o 8 leva o sugerido; o 3 sem valor)
  // insightsLocais(a) ganha `txs` já existente; insightsDaCaixa(linhas, c) ganha `txs: Transaction[]` no contexto
  ```
  - A `forma` do duplicado vem do rótulo da forma de pagamento que a lib já usa (`paymentMethodLabel`, em `lib/payment-methods`); com cartão, o nome do cartão se a lib o tiver, senão o rótulo.
  - O `dia` do conferir é "dd/mm".
  - As 2 primeiras linhas saem por data, da mais recente; `resto` é o total menos 2.

- [ ] **Step 1:** Testes:
  - **Foco:** `foco` é `"acao"` nas ordens 1, 2, 4, 6, 7 e 8, e `"dado"` nas 3, 5 e 9.
  - **Rótulos e linhas** literais dos Global Constraints, um caso por insight. O preço que cai dá "−R$ 24 por ano".
  - **Conferir:** 1 lançamento dá `linhas.length` 1 e `resto` 0; 5 lançamentos dão 2 e 3.
  - **Sazonal:** sem `dataYmd` dá `corpo.dataYmd` `null`.
  - **Limite:** o 8 tem `acao` `{ tipo: "limite", valor: sugerido }`.
- [ ] **Step 2:** `npx vitest run src/lib/insights-da-categoria.test.ts`. Esperado: FAIL.
- [ ] **Step 3:** Implemente. O `numero`, o `tom` e o `titulo` de hoje continuam, porque o componente ainda os usa.
- [ ] **Step 4:** `npx vitest run src/lib && npx tsc --noEmit`. Esperado: PASS e tsc limpo. A página passa `txs` à lib, a mudança mínima para compilar.
- [ ] **Step 5:** Commit: `feat(categoria): cada insight diz o seu foco e o dado do corpo`.

### Task 3: os corpos e o botão no pé

**Files:**
- Create: `src/components/categories/detail/resumo/corpo-do-insight.tsx` (um componente por `CorpoDoInsight["tipo"]`, num `switch`)
- Modify: `src/components/categories/detail/resumo/insights-da-categoria.tsx`
- Modify: `src/app/(app)/categories/[categoryId]/page-client.tsx` (o `openLimitDialog`, ~200, e o `onAcaoDoInsight`)
- Modify: `docs/JORNADAS.md` e `docs/atlas/template.html`, só se a frase dos insights citar rótulos que mudaram. Depois, `python3 docs/atlas/build.py`.

**Interfaces:**
- Consumes: Tarefa 2 (`foco`, `corpo`, `acao.valor`); `lancamentosDaRecorrencia(insight)` de `@/lib/insights/acoes` (o 6 recebe a linha da caixa pelo `insightId`, das `linhas` que a página já tem).
- Produces:
  - `openLimitDialog(valorInicial?: number)`: com valor, o campo do limite abre preenchido com `formatMoneyBrlInput(valorInicial)`.
  - `CorpoDoInsight` (componente) com props `{ corpo; corDaSerie: string; linhaDaCaixa?: Insight }`.

- [ ] **Step 1: Os corpos**, cada um com a peça do design system da tabela do spec:
  - 1, o duplicado: duas caixinhas `bg-muted rounded-row` lado a lado;
  - 2, a conferir: as linhas, mais o "e mais N";
  - 3, o ritmo: `Progress` com `value`/`projected`/`max`;
  - 4, o sazonal: `DateTile size="md"` quando há `dataYmd`, ao lado do valor;
  - 5, a parcela: `Progress segments segmentShape="tile" size="lg" fillColor`;
  - 6, a recorrência:
    - colunas por mês, a partir de `lancamentosDaRecorrencia`, lido ao montar;
    - use a peça de barras de `ui/chart` (`ChartBars` ou `ChartSparkline bars`), com `selectedColor`/`color` na cor da categoria para o último mês;
    - durante a leitura, `Skeleton` do mesmo tamanho; com erro ou vazio, nada;
  - 7, o preço: o antigo riscado e o novo;
  - 8, o limite: `Progress` com `fillColor`;
  - 9, a concentração: `ChartSplit labels="none"`.

  Cada visual tem `aria-label` que diz o dado.
- [ ] **Step 2: O slide.**
  - **Insight de ação:** o cabeçalho sem `CardAction` de botão (`Caption` no canto do 2 e do 6), o corpo, e no pé `<Button variant="secondary" className="w-full">` com o `rotulo` (a ação `link`, por `asChild` + `Link`; a `previsao` não ocorre em insight de ação).
  - **Insight de dado:** como hoje.
  - Os slides continuam com a altura do maior, e o corpo assenta no pé (`mt-auto`), acima do botão.
- [ ] **Step 3: Página.** O `openLimitDialog` aceita o `valorInicial`, e a ação `limite` passa `acao.valor`.
- [ ] **Step 4: Verificação.** `npx tsc --noEmit && npm run lint && npx vitest run src/lib src/components && npm run ds:audit -- src/components/categories/detail/resumo`. Esperado:
  - tsc limpo;
  - lint sem erros;
  - vitest verde, menos a falha conhecida de `src/lib/papeis/migracao-papeis.test.ts`;
  - auditor sem achado.
- [ ] **Step 5:** Commit: `feat(categoria): insights de ação com botão no pé e de dado com o mini visual`.
