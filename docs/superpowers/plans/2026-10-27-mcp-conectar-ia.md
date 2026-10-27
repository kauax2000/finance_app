# MCP do Finance App — plano de implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Um servidor MCP remoto (Edge Function `mcp`) que Claude e ChatGPT conectam só com a URL, com login OAuth 2.1 do Supabase Auth, lendo e registrando lançamentos como a própria pessoa (RLS).

**Architecture:** Lógica pura em `supabase/functions/_shared/mcp/` (testada com Deno); a Edge Function `supabase/functions/mcp/index.ts` só consulta o banco com o cliente da pessoa e chama essa lógica, dentro do `pipeline([withOAuthProtectedResource(), withSupabase({ auth: 'user' })])`. No front, a tela de consentimento `/oauth/consent` e a lista "IAs conectadas" em Minha conta, ambas wireframes.

**Tech Stack:** Deno (Supabase Edge Runtime), `npm:@modelcontextprotocol/server@^2`, `npm:@supabase/middleware@1`, `npm:@supabase/server@^1.6`, `npm:zod@^4.3.6`, `jsr:@std/assert@1.0.19`; Next.js 16 + `@supabase/supabase-js` 2.99.3 (`supabase.auth.oauth.*`).

**Spec:** `docs/superpowers/specs/2026-10-27-mcp-conectar-ia-design.md`

## Global Constraints

- Nenhum caminho de ferramenta usa `service_role`; todo acesso vai pelo cliente que o `withSupabase` entrega (JWT da pessoa).
- Nenhuma ferramenta edita ou exclui dado existente. A única escrita é `registrar_lancamento`.
- Lançamento da IA: `source = 'ia_externa'`, `needs_review = true`, `capture_meta = { "via": "mcp", "client_id": <claim client_id do JWT ou null> }`.
- Valores saem como `{ valor: number, texto: string }` (reais, 2 casas; `texto` por `currencyBRL` de `_shared/formatters.ts`). Contas em centavos inteiros por dentro.
- Datas `YYYY-MM-DD`, mês `YYYY-MM`. "Hoje" é `appTodayYmd()` de `_shared/credit-card-cycle.ts`.
- Textos, nomes de ferramenta e de campo em português.
- Leitura: `annotations: { readOnlyHint: true }`. Escrita: `annotations: { readOnlyHint: false, destructiveHint: false }`.
- Imports Deno por URL (`npm:`/`jsr:`), sem `deno.json`; testes com `Deno.test('mcp: …')` + `assertEquals` de `jsr:@std/assert@1.0.19`.
- Front: wireframe só em `src/components/wireframe/`, controles nativos, todo `<button>` com `type`, cara tracejada `font-mono` com etiqueta `WIREFRAME · MCP · <funcionalidade>` (use o `WireframeBox` que já existe).
- Nada é publicado em produção (`db push`, `functions deploy`, painel) neste plano. **Nunca** `supabase config push`.
- Banco de dev é o de produção: nenhum teste grava dado real.

## Review Focus

1. Pessoa com mais de uma carteira e sem `carteira_id`: a ferramenta escolhe a `personal` (senão a primeira por nome) e diz qual usou — teste em `escolherCarteira` (Tarefa 1).
2. Convidado (guest) pede orçamentos/contas/assinaturas: o RLS devolve vazio, e a resposta é lista vazia, não erro — teste nas funções puras com entrada vazia (Tarefas 1 e 2).
3. Carteira só leitura no plano: o insert falha com `workspace_somente_leitura` e a IA recebe a frase clara — teste em `mensagemDoErroDoBanco` (Tarefa 1).
4. Estorno no cartão (receita no cartão) não vira receita do mês e abate a despesa da categoria — teste em `resumoDoMes` (Tarefa 1).
5. Cartão citado pelo nome que casa com dois cartões ou nenhum: o lançamento não chuta; devolve erro pedindo o cartão exato com a lista de nomes — teste em `montarLancamentoDaIA` (Tarefa 3).

---

### Tarefa 1: Base pura — período, resposta, carteira e resumo do mês

**Files:**
- Create: `supabase/functions/_shared/mcp/periodo.ts`, `resposta.ts`, `resumo.ts`
- Test: `supabase/functions/_shared/mcp/periodo.test.ts`, `resposta.test.ts`, `resumo.test.ts`

**Interfaces:**
- Produces (`periodo.ts`):
  - `mesDe(hoje: string): string` — `'2026-10-27'` → `'2026-10'`
  - `intervaloDoMes(mes: string): { inicio: string; fim: string }` — fim é o último dia; lança `Error('mes_invalido')` fora de `^\d{4}-(0[1-9]|1[0-2])$`
  - `mesAnterior(mes: string): string`
  - `dataValida(s: string): boolean` — `YYYY-MM-DD` de calendário real
- Produces (`resposta.ts`):
  - `type Dinheiro = { valor: number; texto: string }`; `dinheiro(centavos: number): Dinheiro`
  - `ok(dados: Record<string, unknown>)` → `{ content: [{ type: 'text', text: JSON.stringify(dados) }], structuredContent: dados }`
  - `falha(mensagem: string)` → `{ content: [{ type: 'text', text: mensagem }], isError: true }`
  - `mensagemDoErroDoBanco(e: { code?: string; message?: string }): string`
  - `type Carteira = { id: string; name: string; type: 'personal' | 'shared' }`; `escolherCarteira(carteiras: Carteira[], pedida?: string): { carteira: Carteira } | { erro: string }`
- Produces (`resumo.ts`):
  - `type LinhaLancamento = { amount: string | number; type: 'income' | 'expense'; date: string; category_id: string | null; payment_method: string | null; payment_credit_card_id: string | null }`
  - `type Categoria = { id: string; name: string; type: 'income' | 'expense' }`
  - `resumoDoMes(doMes: LinhaLancamento[], doAnterior: LinhaLancamento[], categorias: Categoria[])` → `{ receitas: Dinheiro; despesas: Dinheiro; saldo: Dinheiro; por_categoria: { categoria_id: string | null; nome: string; total: Dinheiro }[]; mes_anterior: { receitas: Dinheiro; despesas: Dinheiro; saldo: Dinheiro } }`
  - `orcamentosDoMes(orcamentos: { category_id: string; amount: string | number }[], doMes: LinhaLancamento[], categorias: Categoria[])` → `{ categoria_id: string; nome: string; orcado: Dinheiro; gasto: Dinheiro; percentual: number }[]`

- [ ] **Step 1: Escrever os testes que falham**

`periodo.test.ts`: `intervaloDoMes('2026-02')` → `{ inicio: '2026-02-01', fim: '2026-02-28' }`; `intervaloDoMes('2028-02').fim === '2028-02-29'`; `mesAnterior('2026-01') === '2025-12'`; `mesDe('2026-10-27') === '2026-10'`; `assertThrows(() => intervaloDoMes('2026-13'))`; `dataValida('2026-02-30') === false`, `dataValida('2026-02-28') === true`.

`resposta.test.ts`: `dinheiro(76950)` → `{ valor: 769.5, texto: currencyBRL(769.5) }`; `ok({ a: 1 }).structuredContent` igual a `{ a: 1 }` e `content[0].text === '{"a":1}'`; `falha('x').isError === true`.
`mensagemDoErroDoBanco({ message: 'workspace_somente_leitura' })` === `'Sua carteira está só leitura no plano atual. Para registrar, a pessoa titular precisa reativar o plano no app.'`; `{ code: '42501' }` → `'Você não tem permissão para isso nessa carteira.'`; `{}` → `'Não foi possível concluir. Tente de novo.'`.
`escolherCarteira`: com `[{id:'b',name:'Casa',type:'shared'},{id:'a',name:'Eu',type:'personal'}]` e sem pedida → carteira `a`; sem `personal` → a primeira por `name` em ordem alfabética; pedida `'b'` → `b`; pedida `'zzz'` → `{ erro: 'Carteira não encontrada. Use listar_carteiras para ver os ids.' }`; lista vazia → `{ erro: 'Você ainda não participa de nenhuma carteira.' }`.

`resumo.test.ts` com categorias A (expense), B (expense), S (income) e as linhas do mês: receita 1000 (cat S, pix); despesa 200 (A); despesa 50.50 (B); estorno no cartão 20 (type income, `payment_method: 'credit_card'`, `payment_credit_card_id: 'c1'`, cat A); despesa 10 sem categoria. Esperado: `receitas.valor 1000`, `despesas.valor 240.5`, `saldo.valor 759.5`, `por_categoria` = `[A 180, B 50.5, Sem categoria 10]` nessa ordem (nome `'Sem categoria'`, `categoria_id: null`). Mês anterior vazio → os três `valor: 0`.
`orcamentosDoMes([{ category_id: 'A', amount: '300' }], linhas, cats)` → `[{ categoria_id: 'A', nome: 'A', orcado.valor 300, gasto.valor 180, percentual: 60 }]`; `orcamentosDoMes([], [], [])` → `[]`.

- [ ] **Step 2: Rodar e ver falhar**

Run: `deno test --allow-read supabase/functions/_shared/mcp/`
Expected: FAIL (módulos não existem)

- [ ] **Step 3: Implementar os três módulos**

`resumoDoMes`: receitas = soma das `income` que **não** são `ehEstornoNoCartao`; despesas e `por_categoria` = soma de `sinalNaDespesa(l) * amount` (ambos de `_shared/credit-card-cycle.ts`), em centavos (`Math.round(Number(amount) * 100)`); `por_categoria` só com total ≠ 0, ordenado do maior para o menor. `percentual` = `Math.round(gasto / orcado * 100)`.

- [ ] **Step 4: Rodar e ver passar**

Run: `deno test --allow-read supabase/functions/_shared/mcp/`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add supabase/functions/_shared/mcp/
git commit -m "feat(mcp): base pura de período, resposta e resumo do mês"
```

### Tarefa 2: Faturas, contas a pagar e assinaturas (puras)

**Files:**
- Create: `supabase/functions/_shared/mcp/faturas.ts`, `compromissos.ts`
- Test: `supabase/functions/_shared/mcp/faturas.test.ts`, `compromissos.test.ts`

**Interfaces:**
- Consumes: `dinheiro`, `Dinheiro` (Tarefa 1); `CardTxRow`, `Ymd`, `openInvoiceWindow`, `previousStatementCloseBefore`, `invoiceWindowEndingAt`, `estimatedDueYmdForClose`, `cardInvoiceNetInWindow`, `escolherTotal`, `statementTotalKey`, `formatYmd` de `_shared/credit-card-cycle.ts`.
- Produces (`faturas.ts`):
  - `type Cartao = { id: string; name: string; closing_day: number; due_day: number; last_four: string | null }`
  - `faturaDoCartao(cartao: Cartao, linhas: CardTxRow[], totaisDoBanco: Map<string, number | string>, hoje: Ymd)` → `{ cartao_id: string; nome: string; final: string | null; aberta: { inicio: string; fim: string; vencimento: string; total: Dinheiro }; ultima_fechada: { inicio: string; fechamento: string; vencimento: string; total: Dinheiro; do_banco: boolean } }`
  - `janelaDasFaturas(cartoes: Cartao[], hoje: Ymd): { inicio: string; fim: string }` — da menor `ultima_fechada.inicio` à maior `aberta.fim`, para o `index.ts` buscar as linhas numa consulta só.
- Produces (`compromissos.ts`):
  - `contasAPagar(instancias: { id: string; nome: string; due_date: string; amount: string | number | null; status: 'pending' | 'paid' | 'skipped' }[], hoje: string, dias: number)` → `{ vencidas: Item[]; a_vencer: Item[]; total: Dinheiro }` com `Item = { id: string; nome: string; vencimento: string; valor: Dinheiro | null }`
  - `assinaturasAtivas(linhas: { id: string; name: string; amount: string | number; billing_interval: 'weekly' | 'monthly' | 'bimonthly' | 'yearly'; next_billing_date: string | null; is_active: boolean }[])` → `{ itens: { id: string; nome: string; valor: Dinheiro; intervalo: string; proxima_cobranca: string | null }[]; total_mensal: Dinheiro }`

- [ ] **Step 1: Escrever os testes que falham**

`faturas.test.ts`: cartão `{ id: 'c1', name: 'Nubank', closing_day: 10, due_day: 17, last_four: '1234' }`, hoje `{ y: 2026, m: 10, d: 27 }`, linhas: despesa 100 em `2026-10-15` no `c1`; despesa 40 em `2026-10-05` no `c1`; estorno 10 (income, credit_card, `c1`) em `2026-10-20`; despesa 999 em `2026-10-15` no `c2`. Sem totais do banco:
`aberta` = `{ inicio: '2026-10-11', fim: '2026-11-10', vencimento: '2026-11-17', total.valor 90 }`; `ultima_fechada` = `{ inicio: '2026-09-11', fechamento: '2026-10-10', vencimento: '2026-10-17', total.valor 40, do_banco: false }`.
Com `totaisDoBanco = new Map([[statementTotalKey('c1', '2026-10-10'), '45.30']])` → `ultima_fechada.total.valor 45.3`, `do_banco: true`.
`janelaDasFaturas([cartao], hoje)` → `{ inicio: '2026-09-11', fim: '2026-11-10' }`.

`compromissos.test.ts`: hoje `'2026-10-27'`, dias 30; instâncias: pendente `2026-10-20` 100 (vencida); pendente `2026-11-05` 50 (a vencer); pendente `2026-12-30` 70 (fora); paga `2026-10-25` 30 (fora); pendente `2026-11-01` `amount: null`. Esperado: `vencidas` = `[2026-10-20]`; `a_vencer` = `[2026-11-01 (valor null), 2026-11-05]` ordenadas por data; `total.valor 150`. Lista vazia → `{ vencidas: [], a_vencer: [], total.valor 0 }`.
`assinaturasAtivas`: mensal 39.90, anual 120, semanal 10, inativa 999 → itens só das 3 ativas; `total_mensal.valor` = `39.9 + 10 + 43.33` = `93.23` (semanal × 52 / 12 arredondado a centavo; anual / 12; bimestral / 2).

- [ ] **Step 2: Rodar e ver falhar**

Run: `deno test --allow-read supabase/functions/_shared/mcp/`
Expected: FAIL nos dois arquivos novos

- [ ] **Step 3: Implementar `faturas.ts` e `compromissos.ts`**

`aberta` = `openInvoiceWindow(hoje, closing_day)`; o fechamento da `ultima_fechada` é `addCalendarDays(aberta.start, -1)` e a janela dela é `invoiceWindowEndingAt(fechamento, closing_day)`; vencimentos por `estimatedDueYmdForClose(fechamento, due_day)`; totais por `cardInvoiceNetInWindow` e, na fechada, `escolherTotal` com a chave `statementTotalKey(id, formatYmd(fechamento))`.

- [ ] **Step 4: Rodar e ver passar**

Run: `deno test --allow-read supabase/functions/_shared/mcp/`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add supabase/functions/_shared/mcp/
git commit -m "feat(mcp): faturas, contas a pagar e assinaturas puras"
```

### Tarefa 3: Montar o lançamento da IA (puro) + migração do `source`

**Files:**
- Create: `supabase/functions/_shared/mcp/lancamento.ts`, `supabase/migrations/20261103120000_mcp.sql`
- Test: `supabase/functions/_shared/mcp/lancamento.test.ts`

**Interfaces:**
- Consumes: `dataValida` (Tarefa 1); `casarCartao`, `CartaoParaCasar`, `preencherPeloHistorico`, `LinhaHistorico`, `normalizarDescricao` de `_shared/frase.ts`.
- Produces:
  - `type PedidoDaIA = { valor: number; descricao: string; tipo: 'despesa' | 'receita'; data?: string; categoria?: string; cartao?: string; forma_de_pagamento?: 'pix' | 'debito' | 'credito' | 'dinheiro' | 'ted' | 'outro'; parcelas?: number }`
  - `type ContextoDaIA = { userId: string; carteiraId: string; hoje: string; categorias: { id: string; name: string; type: 'income' | 'expense' }[]; cartoes: CartaoParaCasar[]; historico: LinhaHistorico[]; clientId: string | null }`
  - `montarLancamentoDaIA(p: PedidoDaIA, ctx: ContextoDaIA)` → `{ linha: LinhaDaIA; parcelas: null | { total: number; valor_parcela: number; valor_final: number; primeira: string } } | { erro: string }`
  - `type LinhaDaIA = { user_id: string; workspace_id: string; category_id: string | null; type: 'income' | 'expense'; amount: number; description: string; date: string; payment_method: string | null; payment_credit_card_id: string | null; source: 'ia_externa'; needs_review: true; capture_meta: { via: 'mcp'; client_id: string | null } }`

- [ ] **Step 1: Conferir os valores aceitos de `transactions.payment_method`**

Run: `grep -n "transactions_payment_method" supabase/migrations/*.sql`
Expected: a lista do check. O mapa é `pix→pix`, `debito→debit_card`, `credito→credit_card`, `dinheiro→cash`, `ted→ted`, `outro→other`; se o check usar outros nomes, o mapa segue o check.

- [ ] **Step 2: Escrever os testes que falham**

Contexto: hoje `'2026-10-27'`, categorias `Mercado` (expense, id `m`) e `Salário` (income, id `s`), cartões `Nubank` (`c1`, ativo) e `Nubank Ultravioleta` (`c2`, ativo, last_four `2222`), histórico com `padaria` → categoria `m`, `debit_card`.
- `{ valor: 42, descricao: 'Padaria', tipo: 'despesa' }` → linha com `category_id 'm'` (pelo histórico), `payment_method 'debit_card'`, `date '2026-10-27'`, `amount 42`, `source 'ia_externa'`, `needs_review true`, `capture_meta { via: 'mcp', client_id: ctx.clientId }`, `parcelas null`.
- `categoria: 'mercado'` (sem acento/caixa) casa `m`; `categoria: 'Viagem'` → `{ erro: 'Categoria "Viagem" não existe nessa carteira. Categorias: Mercado.' }` (só as do tipo do lançamento).
- `cartao: 'Nubank'` casa dois → `{ erro: 'Mais de um cartão casa com "Nubank": Nubank, Nubank Ultravioleta. Diga o nome exato ou os 4 últimos dígitos.' }`; `cartao: '2222'` → `c2` com `payment_method 'credit_card'`; `cartao: 'Inter'` → `{ erro: 'Cartão "Inter" não encontrado. Cartões: Nubank, Nubank Ultravioleta.' }`.
- `valor: 0` → `{ erro: 'O valor precisa ser maior que zero.' }`; `data: '2026-02-30'` → `{ erro: 'Data inválida: use AAAA-MM-DD.' }`; `parcelas: 3` sem cartão → `{ erro: 'Parcelado só no cartão de crédito: diga o cartão.' }`.
- `{ valor: 100, parcelas: 3, cartao: '2222', … }` → `parcelas` = `{ total: 3, valor_parcela: 33.33, valor_final: 33.34, primeira: '2026-10-27' }`.

- [ ] **Step 3: Rodar e ver falhar**

Run: `deno test --allow-read supabase/functions/_shared/mcp/lancamento.test.ts`
Expected: FAIL

- [ ] **Step 4: Implementar `montarLancamentoDaIA`**

Casar categoria por `normalizarDescricao` igual entre as do tipo; sem `categoria`, `preencherPeloHistorico` (que também sugere forma e cartão quando o pedido não diz). Cartão: `casarCartao`; quando ele devolve `null`, distinguir "nenhum" de "mais de um" filtrando os ativos cujo nome normalizado contém o texto. `cartao` implica `credit_card`.

- [ ] **Step 5: Migração `20261103120000_mcp.sql`**

Recria `transactions_source_check` com a lista atual (de `20261022120000_fatura_que_bate.sql:13-16`) **mais** `'ia_externa'`, com `drop constraint if exists` antes, no mesmo estilo. Comentário de uma linha no topo dizendo que é o lançamento vindo do MCP.

- [ ] **Step 6: Rodar e ver passar**

Run: `npm run test:edge`
Expected: PASS (inclui os testes antigos de `_shared`)

- [ ] **Step 7: Commit**

```bash
git add supabase/functions/_shared/mcp/lancamento.ts supabase/functions/_shared/mcp/lancamento.test.ts supabase/migrations/20261103120000_mcp.sql
git commit -m "feat(mcp): lançamento da IA e source ia_externa"
```

### Tarefa 4: A Edge Function `mcp` com as nove ferramentas

**Files:**
- Create: `supabase/functions/mcp/index.ts`, `supabase/functions/mcp/consultas.ts`
- Modify: `supabase/config.toml` (bloco `[functions.mcp]`), `package.json` (`supabase:deploy:functions` ganha `mcp`), `package.json` (`test:edge` continua igual)

**Interfaces:**
- Consumes: tudo das Tarefas 1–3.
- Produces: o endpoint `…/functions/v1/mcp` com as ferramentas `listar_carteiras`, `listar_categorias`, `listar_lancamentos`, `resumo_do_mes`, `orcamentos_do_mes`, `faturas_dos_cartoes`, `contas_a_pagar`, `assinaturas`, `registrar_lancamento`.
- `consultas.ts`: `carteirasDaPessoa(supabase, userId): Promise<Carteira[]>` e as demais leituras, uma função por tabela, recebendo o cliente do `withSupabase` e devolvendo as linhas tipadas das Tarefas 1–3. `index.ts` só registra ferramentas.

- [ ] **Step 1: `index.ts` no formato do guia oficial**

`Deno.serve(pipeline([withOAuthProtectedResource(), withSupabase({ auth: 'user' })], async (req, ctx) => createMcpHandler(() => servidor(ctx)).fetch(req)))`, `McpServer({ name: 'finance-app', version: '1.0.0' })`. O `userId` e o `client_id` saem das claims que o `withSupabase` expõe (ver a referência do `@supabase/server`; sem claim `client_id`, `null`). Cada ferramenta: `inputSchema` em `zod`, `carteira_id` opcional resolvido por `escolherCarteira`, resposta por `ok`/`falha`, erro do PostgREST por `mensagemDoErroDoBanco`, e `carteira: { id, nome }` em toda resposta.

Entradas (todas opcionais salvo dito):
- `listar_lancamentos`: `de`, `ate` (padrão: o mês de hoje), `tipo` (`despesa|receita`), `categoria_id`, `cartao_id`, `busca` (`ilike` em `description`), `limite` 1–100 (padrão 50); ordem por `date` desc; cada item com `id, data, descricao, valor: Dinheiro, tipo, categoria, cartao, forma, precisa_conferir`.
- `resumo_do_mes`, `orcamentos_do_mes`: `mes` (padrão o atual).
- `contas_a_pagar`: `dias` 1–90 (padrão 30).
- `registrar_lancamento`: os campos de `PedidoDaIA`, `valor` e `descricao` e `tipo` obrigatórios. Sem parcelas: `insert` da `linha` e `select('id').single()`. Com parcelas: `rpc('create_workspace_installment_plan', { p_workspace_id, p_category_id, p_description, p_payment_method: 'credit_card', p_payment_credit_card_id, p_total_installments, p_installment_amount, p_final_installment_amount, p_next_billing_date })` e, como o formulário faz em `src/components/transactions/transaction-form-persistence.ts:56-66`, `update({ source, needs_review, capture_meta }).eq('installment_plan_id', id)`. Resposta: `{ id, resumo: "<descricao> · <valor> · <data>" , precisa_conferir: true }`.

Descrições das ferramentas: uma frase dizendo quando usar, em português (ex.: `resumo_do_mes`: "Receitas, despesas, saldo e gasto por categoria de um mês, com o mês anterior para comparar.").

- [ ] **Step 2: `config.toml` e `package.json`**

Acrescentar, com o comentário no estilo dos vizinhos:
```toml
# O MCP (Claude, ChatGPT): a descoberta OAuth chega sem token; o `withSupabase` confere o JWT.
[functions.mcp]
verify_jwt = false
```
e `mcp` no fim da lista de `supabase:deploy:functions`.

- [ ] **Step 3: Checar tipos**

Run: `deno check supabase/functions/mcp/index.ts`
Expected: sem erros

- [ ] **Step 4: Rodar a função em memória contra uma requisição sem token**

Teste `supabase/functions/_shared/mcp/sem-token.test.ts` que importa o handler exportado de `mcp/index.ts` (exporte `handler` e chame `Deno.serve(handler)` só sob `import.meta.main`) e faz `POST` de `initialize` sem `Authorization`, com `SUPABASE_URL=http://127.0.0.1:54321` no env do teste. Esperado: status `401` e cabeçalho `www-authenticate` contendo `resource_metadata=`. Acrescente `SUPABASE_URL`, `SUPABASE_ANON_KEY` e `SUPABASE_PUBLISHABLE_KEYS` ao `--allow-env` e `--allow-net=127.0.0.1` ao `test:edge` se o teste pedir.

Run: `npm run test:edge`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add supabase/functions/mcp supabase/functions/_shared/mcp supabase/config.toml package.json
git commit -m "feat(mcp): edge function mcp com nove ferramentas"
```

### Tarefa 5: Tela de consentimento `/oauth/consent`

**Files:**
- Create: `src/components/wireframe/mcp-consentimento-wireframe.tsx`, `src/app/(app)/oauth/consent/page.tsx`, `src/app/(app)/oauth/consent/loading.tsx`
- Test: `src/components/wireframe/mcp-consentimento-wireframe.test.ts`

**Interfaces:**
- Consumes: `supabase.auth.oauth.getAuthorizationDetails(id)`, `approveAuthorization(id)`, `denyAuthorization(id)` (supabase-js 2.99.3); `useAuth` de `@/components/providers`; `WireframeBox`.
- Produces: `McpConsentimentoWireframe({ authorizationId }: { authorizationId: string | null })` e a função pura exportada `destinoDosDetalhes(d: unknown): { tipo: 'redirecionar'; url: string } | { tipo: 'perguntar'; cliente: string; redirect: string } | { tipo: 'erro' }`.

- [ ] **Step 1: Teste da função pura**

`destinoDosDetalhes({ redirect_url: 'https://claude.ai/cb?code=x' })` → `{ tipo: 'redirecionar', url: 'https://claude.ai/cb?code=x' }`; `{ authorization_id: 'a', client: { name: 'Claude' }, redirect_uri: 'https://claude.ai/cb' }` → `{ tipo: 'perguntar', cliente: 'Claude', redirect: 'https://claude.ai/cb' }`; `null` → `{ tipo: 'erro' }`. (Confira os nomes exatos dos campos no `lib/types.d.ts` do `@supabase/auth-js`, linhas ~1790–1860, e ajuste o teste a eles.)

Run: `npx vitest run src/components/wireframe/mcp-consentimento-wireframe.test.ts` → FAIL; depois PASS.

- [ ] **Step 2: O wireframe**

Etiqueta `WIREFRAME · MCP · Conectar uma IA`. Sem `authorizationId` → "Link de autorização inválido." Carregando → "Carregando…". `redirecionar` → `window.location.assign(url)`. `perguntar` → título "**<cliente>** quer acessar sua conta do Finance App", a conta logada (e-mail), o texto do spec ("Poderá ler seus lançamentos, cartões, contas e orçamentos de todas as carteiras em que você participa, e registrar lançamentos que ficam para você conferir."), o destino (`redirect`) em `font-mono` pequeno, e dois botões `type="button"`: **Permitir** (`approveAuthorization` → `window.location.assign(data.redirect_url)`) e **Recusar** (`denyAuthorization` → idem). Erro de qualquer chamada → "Não foi possível concluir. Tente conectar de novo pela IA." Os dois botões ficam desabilitados enquanto um pedido corre.

- [ ] **Step 3: A rota**

`page.tsx` lê `authorization_id` do `searchParams` e renderiza o wireframe dentro de `<AdiarMontagem fallback={<Loading />}>` como as outras páginas de `(app)`; `loading.tsx` é o esqueleto mínimo (pode reexportar o vazio de `(app)/loading.tsx`). Siga o guia do Next em `node_modules/next/dist/docs/` para `searchParams` nesta versão.

- [ ] **Step 4: Verificar**

Run: `npx tsc --noEmit && npm run lint && npm run test:unit`
Expected: PASS (inclui `form-submit-owner.test.ts` e `adiar-montagem.test.ts`)

- [ ] **Step 5: Ver no navegador**

Com o servidor externo em :3000 (memória: `dev-attach`), abrir `/oauth/consent` sem parâmetro e conferir "Link de autorização inválido." e a etiqueta do wireframe. (O fluxo com `authorization_id` real só existe com o OAuth Server ligado.)

- [ ] **Step 6: Commit**

```bash
git add src/components/wireframe/mcp-consentimento-wireframe.tsx src/components/wireframe/mcp-consentimento-wireframe.test.ts "src/app/(app)/oauth"
git commit -m "feat(mcp): tela de consentimento oauth em wireframe"
```

### Tarefa 6: "IAs conectadas" em Minha conta

**Files:**
- Create: `src/components/wireframe/ias-conectadas-wireframe.tsx`
- Modify: `src/app/(app)/account/page-client.tsx:190` (montar logo depois do `<CapturaTokensWireframe />`)
- Test: `src/components/wireframe/ias-conectadas-wireframe.test.ts`

**Interfaces:**
- Consumes: `supabase.auth.oauth.listGrants()`, `revokeGrant(...)` (confira a assinatura em `@supabase/auth-js` `lib/types.d.ts` ~1844–1860); `useQuery` como o `CapturaTokensWireframe`.
- Produces: `IasConectadasWireframe()` e a pura `urlDoMcp(supabaseUrl: string): string`.

- [ ] **Step 1: Teste da pura**

`urlDoMcp('https://abc.supabase.co/')` === `'https://abc.supabase.co/functions/v1/mcp'`; sem barra no fim, o mesmo.

- [ ] **Step 2: O wireframe**

Etiqueta `WIREFRAME · MCP · IAs conectadas`. Bloco "Conectar": a URL (`urlDoMcp(process.env.NEXT_PUBLIC_SUPABASE_URL)`) num `<input readOnly>` com botão **Copiar** (`navigator.clipboard.writeText`, vira "Copiado" por 2 s) e três linhas: "Claude: Configurações › Conectores › Adicionar conector personalizado, cole a URL."; "ChatGPT: Configurações › Conectores (modo desenvolvedor ligado), cole a URL."; "Claude Code: `claude mcp add --transport http finance-app <url>`". Bloco "Conectadas": lista dos grants (nome do cliente, "desde <data>" por `formatDatePtBr`), vazio "Nenhuma IA conectada.", e **Revogar** com `window.confirm('Desconectar <cliente>? Ela perde o acesso na hora.')`, invalidando a query depois.

- [ ] **Step 3: Verificar**

Run: `npx tsc --noEmit && npm run lint && npm run test:unit` → PASS. Abrir `/account` no :3000 e ver o bloco, a URL certa e a lista (vazia, com o OAuth Server desligado a chamada pode falhar: o wireframe mostra "Não foi possível carregar as conexões." em vez de quebrar).

- [ ] **Step 4: Commit**

```bash
git add src/components/wireframe/ias-conectadas-wireframe.tsx src/components/wireframe/ias-conectadas-wireframe.test.ts "src/app/(app)/account/page-client.tsx"
git commit -m "feat(mcp): ias conectadas em minha conta"
```

### Tarefa 7: Jornada, Atlas, roteiro de publicação e grafo

**Files:**
- Create: `supabase/MCP_DEPLOYMENT.md`
- Modify: `docs/JORNADAS.md`, `docs/atlas/template.html`, `docs/atlas/atlas-jornadas.html` (gerado), `graphify-out/` (gerado)

- [ ] **Step 1: `docs/JORNADAS.md`**

Nova jornada "Conectar uma IA" com fluxograma no padrão do arquivo (legenda do topo, `%%{init}%%`, nenhum id de nó reservado): IA → `…/functions/v1/mcp` (401) → descoberta → registro dinâmico → `/auth/v1/oauth/authorize` → `/oauth/consent` (sem sessão → `/login?next=…` → volta) → Permitir/Recusar → volta à IA → chamadas de ferramenta. E o ramo Minha conta › IAs conectadas › Revogar. Tabela de regras técnicas (rota, Edge Function, RPCs `create_workspace_installment_plan`, `source = ia_externa`, `needs_review`). Mapa geral: a ponte com a conferência (Bloco 9), que recebe os lançamentos da IA.

- [ ] **Step 2: Atlas**

Mesma jornada em `docs/atlas/template.html` (como funciona, resumo, pontos de atenção, apêndice de rotas `/oauth/consent` e de backend `mcp`), data e contagens da capa. Run: `python3 docs/atlas/build.py` → gera `docs/atlas/atlas-jornadas.html` sem erro.

- [ ] **Step 3: `supabase/MCP_DEPLOYMENT.md`**

No formato dos `BLOCO_*_DEPLOYMENT.md`: os seis passos do spec (seção "Publicação"), o aviso em negrito para **não** rodar `supabase config push`, os `curl` de conferência (`/functions/v1/mcp` sem token → 401 com `www-authenticate`; `/functions/v1/mcp/oauth-protected-resource`; `/auth/v1/.well-known/oauth-authorization-server` deixa de responder `feature_disabled`) e o teste no Claude e no ChatGPT.

- [ ] **Step 4: Grafo**

Run: `graphify update .` → termina sem erro.

- [ ] **Step 5: Commit**

```bash
git add docs/JORNADAS.md docs/atlas supabase/MCP_DEPLOYMENT.md graphify-out
git commit -m "docs(mcp): jornada conectar uma IA, atlas e roteiro de publicação"
```

(A republicação do Atlas no artifact é do orquestrador, depois desta tarefa.)
