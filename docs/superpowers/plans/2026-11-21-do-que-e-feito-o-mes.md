# "Do que é feito o mês" — plano

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** O detalhe da categoria ganha três peças: o "deve fechar em" na faixa, o bloco que explica o mês (fixo × variável, com a frase do porquê) e o "Quem gastou" na carteira compartilhada.

**Architecture:** A Task 1 faz a conta pura com TDD em `src/lib/composicao-do-mes.ts`. A Task 2 monta a interface e liga tudo na página.

**Tech Stack:** React 19, Tailwind v4, vitest.

**Spec:** `docs/superpowers/specs/2026-11-21-do-que-e-feito-o-mes-design.md`. Mockups: `docs/design/painel/do-que-e-feito.html` e `docs/design/painel/categoria-mais-rica.html`.

## Global Constraints
- Vale o `AGENTS.md` inteiro: tokens, design system, nenhum componente em `src/app/`, par de identidade sem `gap`, o dinheiro com `MoneyDisplay` e os helpers de `formatters`, as datas com os helpers de `transaction-date`.
- Antes de buscar código, rode `graphify query "<pergunta>"`. Depois de mudar, rode `graphify update .`.
- O banco do dev é produção: no app, só leitura.
- Checks:
  - `npx tsc --noEmit`;
  - `npm run lint`;
  - `npx vitest run`;
  - `npm run ds:audit -- src/components/categories/detail "src/app/(app)/categories"`.
- Não faça push. Faça stage só dos seus arquivos, um por um (`CLAUDE.md` e `graphify-out/graph.json` são de outra sessão).
- A Carro fica em `/categories/fdc3a58a-7d80-4cc6-a0ee-a92148f53820?type=expense&month=2026-11`.

## Review Focus
1. Mês sem nenhum fixo: sem barra, só a coluna do variável, e a frase sem falar de parcela.
2. Categoria nova, com menos de 2 meses: a frase do caso "sem média", sem porcentagem nenhuma.
3. Grupo que só aparece neste mês: "novo" no lugar da porcentagem.
4. Estorno: abate o grupo e o total, e nunca vira grupo negativo.
5. Carteira de uma pessoa só, ou uma pessoa só lançou: sem "Quem gastou".

---

### Task 1: A conta da composição do mês

**Files:**
- Create: `src/lib/composicao-do-mes.ts`
- Test: `src/lib/composicao-do-mes.test.ts`

**Interfaces (produz):**
- `chaveDoGrupo(descricao: string): string`. A regra de normalização está no spec.
- `composicaoDoMes(args: { txsDoMes: Transaction[]; historico: Transaction[]; tipo: TipoDaCategoria; yearMonth: string; lookup: CreditCardClosingLookup; parcelas: WorkspaceInstallmentPlan[]; assinaturas: WorkspaceSubscription[]; categoryId: string; media: number | null; hojeYmd: string }): ComposicaoDoMes`. O tipo devolvido tem:
  - `fixo: { total; itens: { id; nome; tipo: "parcela" | "assinatura"; valor; diaYmd; atual?; total?; novoDesdeYm?: string }[]; ultimaTerminaYm?: string; proximoMes: number }`;
  - `variavel: { total; grupos: { chave; nome; vezes; valor; normal: number | null; variacao: number | null; novo: boolean }[]; outros: { vezes; valor } | null }`;
  - `normais: { fixo: number | null; variavel: number | null }`;
  - `caso: "semMedia" | "normal" | "novo" | "fixoPuxou" | "variavelPuxou"`;
  - `direcao: "acima" | "abaixo" | null`;
  - `variacaoTotal: number | null`;
  - `destaque?: { nome; desdeYm?; variacao?; aMais? }`.
  
  Copie os tipos que já existem: `CreditCardClosingLookup` está onde o `page-client` da categoria o importa, e `Transaction`, `WorkspaceInstallmentPlan` e `WorkspaceSubscription` estão em `src/lib/supabase.ts`. Os meses do histórico seguem o mesmo corte do crédito de `categoria-resumo.ts` (`transactionCountsInExpenseMonth`). Leia como `mediaDosMeses` escolhe a janela e use a mesma.
- `fraseDaComposicao(c: ComposicaoDoMes, despesa: boolean): { texto: string; forte?: boolean; tom?: "success" | "warning" }[]`, com os seis casos do spec, em português, com `currencyBRL`/`reaisInteiros` e `percentBR`.
- `quemGastou(txsDoMes: Transaction[], tipo: TipoDaCategoria): { userId: string; valor: number }[]`, ordenado do maior para o menor.

- [ ] **Step 1: Testes primeiro.** No mínimo:
  - `chaveDoGrupo("Estacionamento Shopping (2/3)") === "estacionamento"` e `chaveDoGrupo("Consórcio Mãe - 3/6") === "consorcio"`;
  - o caso da Carro: fixo de 2.000 (um plano iniciado há 2 meses) mais 442,54; variável de 620; média de 2.907. O caso é `"novo"`, com destaque no Consórcio;
  - sem fixo: `fixo.total` 0, e o caso vem do variável;
  - um grupo só no mês dá `novo: true` e `variacao: null`;
  - o estorno abate o grupo;
  - com menos de 2 meses de histórico, o caso é `"semMedia"`;
  - dentro de ±2%, o caso é `"normal"`;
  - `quemGastou` com duas pessoas, e o estorno abatendo;
  - `fraseDaComposicao` para cada caso: confira o texto concatenado.
  
  Confira que falham.
- [ ] **Step 2:** Implemente até passar.
- [ ] **Step 3:** Rode os checks e faça o commit `feat(categoria): a conta do que é feito o mês (fixo, variável e o porquê)`.

### Task 2: O bloco, o "deve fechar em" e o "Quem gastou" na tela

**Files:**
- Create: `src/components/categories/detail/do-que-e-feito-o-mes.tsx`, `src/components/categories/detail/quem-gastou.tsx`
- Modify: `src/components/categories/detail/regua-do-mes.tsx`, com a frase "deve fechar em" e o limite, conforme o spec
- Modify: `src/app/(app)/categories/[categoryId]/page-client.tsx`, para montar os dados e seguir a ordem do spec. O `previsto` do mês já está em `mes.previsto`, e os membros e o `identityToneFor` estão onde a tela de Membros os lê.
- Modify: o esqueleto da página, com um bloco a mais
- Modify: `docs/JORNADAS.md` e `docs/atlas/template.html`, só na descrição do Detalhe do G9; rode `python3 docs/atlas/build.py`. Não republique.

**Interfaces:** consome a Task 1.

- [ ] **Step 1:** Monte o bloco com peças do DS:
  - `Card`;
  - a barra é `ChartSplit labels="none"`, com `ChartSwatch` na legenda;
  - `DateTile`;
  - `Progress size="sm" fillColor`;
  - `Badge` no "novo desde";
  - as linhas de lista com `Item`/`ItemMedia`, ou a composição mais simples do DS.
  
  As duas colunas usam `@container`.
- [ ] **Step 2:** Monte o "Quem gastou" (só com dois adultos ou mais e mais de uma pessoa no mês; sem ele para o convidado) e o "deve fechar em" na faixa.
- [ ] **Step 3: Navegador** (só leitura). Na Carro, confira a frase do caso "novo" ou "fixoPuxou", a barra, as duas colunas e o "deve fechar em". Confira também numa categoria sem parcela (procure uma no app, por exemplo pela lista de Categorias). Faça nos dois temas e a 375px. Compare com o mockup.
- [ ] **Step 4:** Rode os checks e o `graphify update .`, e faça o commit `feat(categoria): "Do que é feito o mês", o "deve fechar em" e o "Quem gastou"`.
