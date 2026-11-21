# Frase do resumo (D3) e fatos do mês (B2) — plano

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Trocar o parágrafo da frase do resumo pelo veredito em dois tempos com rodapé (D3) e pôr três minicartões de fatos (B2) no topo de "Para ficar de olho".

**Architecture:** A conta mora em `src/lib/categoria-resumo.ts` (puro, testado). A tela compõe peças do design system em `src/components/categories/detail/resumo/`. A página (`page-client.tsx`) liga as ações: abrir o detalhe do lançamento e rolar até "Já comprometido".

**Tech Stack:** Next.js (versão do projeto, leia `node_modules/next/dist/docs/` antes de mexer em rota), React 19, Tailwind v4, vitest.

**Spec:** `docs/superpowers/specs/2026-11-21-frase-e-fatos-do-resumo-design.md`. Mockup aprovado: `.superpowers/brainstorm/75919-1795230631/content/frase-opcoes-4.html` (opções D3 e B2).

## Global Constraints
- `AGENTS.md` vale inteiro: tokens apenas, Heroicons apenas (`16/solid` em ícone de 16 ou menor), nenhum componente declarado em `src/app/`, nada de cor crua.
- Antes de buscar código, rode `graphify query "<pergunta>"`; depois de mudar código, `graphify update .`.
- O banco do dev é produção: não grave, crie, edite nem apague dados no app.
- Textos em português do Brasil, como no spec, sem o ano no nome do mês.
- Checks: `npx tsc --noEmit`, `npm run lint`, `npx vitest run src/lib/categoria-resumo.test.ts src/components/categories`, `npm run ds:audit -- src/components/categories/detail`.
- Não faça push.

## Review Focus
1. Mês aberto com previsto: o veredito diz "até agora" e "deve fechar", e a explicação diz "Ainda vêm R$ X neste mês."
2. Sem média (categoria nova): nenhum "sua média", nenhum "média dos últimos 6 meses", e o rodapé sem "e os últimos 6 meses".
3. Lançamento sem descrição ou com sufixo de parcela ("Consórcio Mãe - 3/6", "Seguro (4/12)"): o nome sai limpo, e sem descrição vira "O maior lançamento".
4. Sem "puxou" e sem próximo mês: o cartão e o botão de cada um somem; com os dois ausentes, o rodapé fica só com o texto.
5. Receita: nada de "gasto" nos textos de entrada.

---

### Task 1: A conta da frase e dos fatos

**Files:**
- Modify: `src/lib/categoria-resumo.ts` (`fraseDoResumo`, tipo `Parte`, nova `fatosDoMes`, nova `descricaoSemParcela`)
- Test: `src/lib/categoria-resumo.test.ts`

**Interfaces:**
- Produces:
  - `type Parte = { texto: string; forte?: boolean; lancamento?: true }`: `lancamento` marca a parte que é o nome do lançamento que puxou (a tela a torna clicável).
  - `fraseDoResumo(args)` com os mesmos argumentos de hoje, devolvendo `{ veredito: Parte[]; explicacao: Parte[] }` (o campo `partes` sai).
  - `descricaoSemParcela(descricao: string | null | undefined): string | null`: tira o sufixo de parcela (`" - 3/6"`, `" – 3/6"`, `" (3/6)"`, `" 3/6"` no fim) e devolve `null` para vazio.
  - `fatosDoMes(args: { tipo: TipoDaCategoria; yearMonth: string; lancado: number; media: number | null; maior: Transaction | null; compras: number; proximoMes: number }): { id: "puxou" | "previsto" | "total"; rotulo: string; titulo: string; valor: number; acao?: "lancamento" | "comprometido" }[]`

- [ ] **Step 1: Escreva os testes que falham** em `categoria-resumo.test.ts`. Troque o helper `texto` para juntar `veredito` e `explicacao`, e cubra:
  - `veredito` de `{ lancado: 3062.54, previsto: 3062.54, media: 2906.77, aberto: false, yearMonth: "2026-11" }` é exatamente `Novembro: R$ 3.062,54, em linha com a sua média.`, com o valor como parte `forte`.
  - mês aberto com `lancado: 2500, previsto: 3600, media: 3000` → veredito `Novembro até agora: R$ 2.500,00; deve fechar acima da sua média.`, e a explicação contém `Ainda vêm R$ 1.100,00 neste mês.`
  - `maior` "Consórcio Mãe - 3/6" de 2000 com `lancado: 3062.54, compras: 9` → explicação começa com `Consórcio Mãe (R$ 2.000,00) puxou o mês.`, e a parte "Consórcio Mãe" tem `lancamento: true`.
  - `proximoMes: 442.54` com `yearMonth: "2026-11"` → explicação contém `Dezembro já tem R$ 442,54 previstos.`; com `yearMonth: "2026-12"` → `Janeiro já tem`.
  - `media: 2906.77` → explicação termina com `A média dos últimos 6 meses é R$ 2.906,77.`; `media: null` → nem o veredito nem a explicação contêm "média".
  - Mês vazio: veredito é a frase "Nenhum gasto com Carro em novembro de 2026 até agora." de hoje e `explicacao` é `[]`.
  - Mantenha os casos atuais (40%, 2 compras, lançado negativo, receita com "entrou" virando o veredito sem "gasto").
  - `descricaoSemParcela`: `"Consórcio Mãe - 3/6"` → `"Consórcio Mãe"`, `"Seguro (4/12)"` → `"Seguro"`, `"Netflix"` → `"Netflix"`, `"  "` → `null`.
  - `fatosDoMes` com os dados da Carro devolve três itens, nessa ordem:
    - `{ id: "puxou", rotulo: "Puxou o mês", titulo: "Consórcio Mãe", valor: 2000, acao: "lancamento" }`;
    - `{ id: "previsto", rotulo: "Já previsto", titulo: "Dezembro", valor: 442.54, acao: "comprometido" }`;
    - `{ id: "total", rotulo: "Total do mês", titulo: "média R$ 2.906,77", valor: 3062.54 }`.

    Sem `maior` válido e sem `proximoMes`, só o "total". Sem média, o título do "total" é `novembro`. Com `lancado <= 0`, nenhum item.
- [ ] **Step 2:** `npx vitest run src/lib/categoria-resumo.test.ts` → falha.
- [ ] **Step 3:** Implemente. O nome do mês vem de `labelYearMonthPt` sem o ano (ou do helper que o projeto já tiver; procure antes); o mês seguinte por `shiftYearMonth(yearMonth, 1)`. A regra de "puxou" é a de hoje (2 compras ou mais e maior acima de 40%).
- [ ] **Step 4:** O mesmo comando passa; `npx tsc --noEmit` vai acusar a tela (Task 2 conserta) — anote, não conserte aqui.
- [ ] **Step 5:** Commit `feat(categoria): frase do resumo em dois tempos e os fatos do mês (conta)`.

### Task 2: A frase D3 e os minicartões na tela

**Files:**
- Modify: `src/components/categories/detail/resumo/frase-do-resumo.tsx`, `src/components/categories/detail/resumo/resumo-da-categoria.tsx`, `src/components/categories/detail/resumo/insights-do-resumo.tsx` (ou um arquivo novo `fatos-do-mes.tsx` na mesma pasta), `src/app/(app)/categories/[categoryId]/page-client.tsx`
- Test: um teste de render leve, se a pasta já tiver o padrão; senão, os checks.

**Interfaces:**
- Consumes: Task 1 (`fraseDoResumo` → `{ veredito, explicacao }`, `Parte.lancamento`, `fatosDoMes`).
- `ResumoDaCategoriaProps` ganha `fatos: ReturnType<typeof fatosDoMes>`, `quantosLancamentos: number`, `comMedia: boolean`, `onAbrirLancamento: (() => void) | null` (null sem "puxou").
- A página monta `fatos` no mesmo `useMemo` da `frase` e passa `onAbrirLancamento = () => txController.openTransactionDetail(maior)`. O `TransactionDetailSheet` já mora na aba Lançamentos (`forceMount`), então abre da aba Resumo.

- [ ] **Step 1: A frase (D3), medidas do mockup.**
  - Cartão: `Card variant="tinted"` e `CardHeader media` com o `ColorTile size="lg" tint="tonal"`.
  - Veredito: `p` em `font-display`, `text-xl` no telefone e `md:text-2xl`, `leading-snug`, `text-foreground`, `text-pretty`. As partes `forte` ficam em `font-sans nums font-semibold`, na tinta do `tile-tonal` da categoria (`tile-tonal text-(--tile-ink)` com `--tile-color`, como o `StatCardIcon` faz).
  - Explicação: `p` sans `text-sm md:text-base`, `text-muted-foreground`, `mt-2`. O `forte` fica em `text-foreground font-semibold nums`. A parte `lancamento` é um `Button variant="underline"` inline que chama `onAbrirLancamento`; sem a função, é texto.
  - Rodapé: `CardFooter` com uma `Caption`:
    - "Feito com os N lançamentos de <mês>", mais " e os últimos 6 meses" quando houver média;
    - N = `quantosLancamentos`, com "1 lançamento" no singular.

    À direita, dois `Button variant="secondary"`, cada um só com o fato dele:
    - "Ver o lançamento" → `onAbrirLancamento`;
    - "Ver <próximo mês em minúscula>" → rola até a seção "Já comprometido".

    Mês vazio: sem explicação e sem rodapé.
- [ ] **Step 2: A rolagem.** A seção "Já comprometido" ganha `id="ja-comprometido"` (passe pelo `Secao`/`PageSection`). O botão chama `document.getElementById(...)?.scrollIntoView({ behavior, block: "start" })`, com `behavior: "auto"` sob `prefers-reduced-motion`. Confira que o título não fica embaixo da barra do topo (`scroll-mt` pela `--top-bar-bottom` se precisar).
- [ ] **Step 3: Os minicartões (B2).**
  - Onde: no topo de "Para ficar de olho", acima dos insights, numa grade `grid gap-3 md:grid-cols-3`. A seção aparece com fatos **ou** insights.
  - Cada cartão é um `Item variant="outline"`:
    - mídia: `ColorTile size="md" tint="tonal"` com ícone `16/solid`. "puxou" leva a cor da categoria e `ArrowTrendingUpIcon`; "previsto" leva o azul da `TILE_PALETTE` e `CalendarDaysIcon`; "total" vai sem cor e com `ScaleIcon`;
    - conteúdo: o rótulo pequeno (`ItemDescription`) **acima** do título (`ItemTitle`), sem `gap` entre os dois;
    - ações: `MoneyDisplay` do valor e, com ação, `ItemChevron`.

    Com ação, o cartão inteiro é clicável pelo padrão de linha clicável do `Item` (`ItemLink` / `asChild` com `button type="button"`). "lancamento" abre o detalhe e "comprometido" rola como no Step 2.
- [ ] **Step 4:** Ajuste `category-detail-skeleton.tsx` se ele desenha a frase (altura parecida com a nova).
- [ ] **Step 5:** Checks da seção Global Constraints passando; `graphify update .`.
- [ ] **Step 6:** Commit `feat(categoria): a frase D3 e os fatos do mês na tela`.

### Depois das tarefas (sessão principal)
Passada visual: screenshot da tela real a 1440px e 375px, nos dois temas, ao lado do mockup (D3 e B2). Liste as diferenças e corrija antes de dar por feito.
