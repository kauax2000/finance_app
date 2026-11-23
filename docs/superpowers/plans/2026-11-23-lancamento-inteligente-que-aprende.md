# Lançamento inteligente que aprende — Plano de implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** a frase dita ou digitada no Atalho do iPhone sai tão completa quanto no app, entende a fala ("gastei 80 na farmácia"), liga palavras do mesmo assunto ("abastecimento" = "posto" = "gasolina") e aprende a categoria com tudo o que a pessoa já lançou e corrigiu.

**Architecture:** o parser (`_shared/frase.ts`, sem imports, roda no Deno e no Node) ganha a leitura da fala, um vocabulário de conceitos e um voto por palavra sobre o histórico. O histórico deixa de ser "as últimas 300 linhas" e vira um resumo agregado de 24 meses (RPC `historico_da_frase`), lido igual pelo app e pela Edge `capture`. A Edge passa a usar o mesmo casamento de categoria e de cartão do app; o que ainda sobra sem categoria vai à IA (`categorizar`, que o Importar já usa).

**Tech Stack:** Deno (Edges, `npm run test:edge`), Next/React + Vitest (`npm run test:unit`), Postgres/Supabase (migração + pgTAP, `npm run test:db`).

**Spec:** a seção 0 deste plano (o diagnóstico medido em 23/11/2026). Não há spec separada.

---

## 0. Diagnóstico (o porquê de cada tarefa)

Medido rodando `interpretarFrase` + `casarCategoria` (o app) e `preencherPeloHistorico` (o atalho) com as categorias Transporte, Alimentação, Mercado, Saúde e Carro e uma linha de histórico "Posto Shell → Carro":

| Frase | Descrição lida | "Cartão" lido | Categoria no app | Categoria no atalho |
| --- | --- | --- | --- | --- |
| gastei 200 reais de abastecimento | Gastei de abastecimento | — | — | — |
| abasteci 150 no posto | Abasteci | posto | — | — |
| paguei 80 na farmácia | Paguei | farmacia | — | — |
| comprei pão 12,50 | Comprei | pao | — | — |
| Dei 30 reais pro flanelinha | Dei pro | flanelinha | — | — |
| 50 gasolina | Gasolina | — | Transporte (comum) | **—** |
| uber 23,90 | Uber | — | Transporte (comum) | **—** |
| almoço 35 no débito | Almoço | — | Alimentação (comum) | **—** |
| posto ipiranga 180 | Posto | ipiranga | Carro (palavra) | Carro |

Quatro causas, nesta ordem de peso:

1. **A Edge do atalho não usa o casamento de categoria do app.** `montarLancamento` (`_shared/captura.ts:363`) chama só `preencherPeloHistorico`: sem a mesma descrição (ou a mesma 1ª palavra) no histórico, a categoria fica nula. O app chama `casarCategoria` (nome da categoria + palavras comuns). Também falta no atalho o `cartaoDoCredito` ("no crédito" sem nome) e a palavra devolvida à descrição perde o acento (`cartaoTexto` normalizado no lugar de `cartaoPalavra`). É a "perda" entre o atalho e o app, e foi decisão antiga ("A Edge `capture` segue só com o histórico", `docs/JORNADAS.md`).
2. **O parser não entende a fala.** O verbo de abertura ("gastei", "paguei", "comprei", "abasteci", "dei") vira a descrição, e a última palavra solta vira "cartão" mesmo sem cartão com esse nome — "farmácia", "pão", "posto" saem da descrição.
3. **Não há sinônimos.** "abastecimento" não está em `COMUNS`, e "posto" não ensina "abastecimento": o vocabulário é uma lista de palavras soltas, sem conceito.
4. **O "aprendizado" é raso.** O histórico só casa a descrição inteira ou a **primeira** palavra, nas últimas 300 linhas. Corrigir "Abastecimento" para Carro uma vez não ensina "abastecimento no shell", e o que é anual (IPVA) sai da janela.

A IA da frase (`interpretar`) nunca escolhe categoria: só extrai valor, data, descrição, forma e cartão.

## Global Constraints

- `supabase/functions/_shared/frase.ts` continua **sem nenhum import** (o app o reexporta por `src/lib/captura/frase.ts`; o Deno exige `.ts` e o Next não o aceita). Todo código novo do parser, do vocabulário e do voto mora nele.
- Banco: só aditivo (uma função nova), compatível com o front de `main`. **Nada roda contra produção sem pedido explícito do dono** (migração, deploy de Edge, consulta): o dev usa o banco de produção.
- Branch `finance-app-2.0`; nada vai para `main`.
- Textos em português do Brasil. Rótulos novos de motivo: `aprendido` → "pelo que você já lançou"; `ia` → "sugerida pela IA".
- Toda categoria escolhida pertence à carteira de destino e ao tipo do lançamento (despesa/receita); categoria apagada nunca volta.
- No atalho, `needs_review` fica `false` só quando a categoria veio de `historico`, `aprendido` ou `nome`; `comum` e `ia` deixam a conferir (o atalho não tem tela para a pessoa ver o palpite).
- Verificação de cada tarefa: `npm run test:edge`, `npm run test:unit`, `npx tsc --noEmit`, `npm run lint` (os que a tarefa toca).
- Depois de mudar código: `graphify update .`.
- Mudança de jornada (a Edge chama RPC e IA novas): `docs/JORNADAS.md` + atlas na mesma entrega (Task 7).

## Review Focus

1. **Cartão com nome de palavra comum** ("Mercado Pago" + "50 compras no mercado"): continua casando parcial e a conferir, nunca vira despesa limpa no cartão errado — teste na Task 2.
2. **Convidado**: o voto do atalho usa só as linhas do próprio convidado (a RLS não vale para a service role) — teste na Task 5 (pgTAP) e na Task 3 (Edge passa `p_user_id`).
3. **Receita × despesa e carteira errada**: "recebi 200 reembolso" nunca recebe categoria de despesa; voto de uma carteira não escolhe categoria de outra — testes na Task 5.
4. **IA fora (cota, sem chave, provedor caído)**: o atalho grava igual, sem categoria e a conferir, sem 500 — teste na Task 6.
5. **Frase só com verbo e valor** ("gastei 50"): o verbo não vira descrição; fica a dúvida `descricao` e o caminho da IA de hoje segue — teste na Task 2.

---

### Task 1: Linha de base medida (somente leitura, com ok do dono)

Sem número de antes, não há como dizer que melhorou. Nenhum código de produto.

**Files:**
- Create: `docs/produto/lancamento-inteligente/2026-11-23-linha-de-base.md`
- Create: `scripts/frases/linha-de-base.sql`

**Interfaces:**
- Produces: os números de referência que a Task 7 compara.

- [ ] **Step 1: Escrever `scripts/frases/linha-de-base.sql`** — uma consulta só de leitura, dos últimos 60 dias, agrupada por `source` (`shortcut`, `apple_pay`, `quick_text`, nulo = formulário): total, `% category_id is null`, `% needs_review`, `% payment_method is null`. Nenhuma coluna de texto livre no resultado (sem `description`, sem `capture_meta.texto`).
- [ ] **Step 2: Pedir ao dono, com `AskUserQuestion`, o ok para rodar a consulta no banco** (é produção). Sem ok, pule para o Step 4 e registre "linha de base não medida".
- [ ] **Step 3: Rodar** — `supabase db query --linked -f scripts/frases/linha-de-base.sql` (fora do sandbox; ver a memória "Supabase CLI fora do sandbox"). Esperado: uma linha por `source`.
- [ ] **Step 4: Registrar** a tabela do Step 3 e a tabela da seção 0 deste plano em `linha-de-base.md`.
- [ ] **Step 5: Commit** — `git add scripts/frases docs/produto/lancamento-inteligente && git commit -m "docs(captura): linha de base do lançamento inteligente"`

---

### Task 2: O parser entende a fala

**Files:**
- Modify: `supabase/functions/_shared/frase.ts` (`interpretarFrase`, constantes do topo)
- Modify: `supabase/functions/_shared/captura.ts:190-194` (`precisaDeIA`) e `:298` (chamada em `montarLancamento`)
- Modify: `src/lib/captura/frase-no-form.ts:101,121` (as duas chamadas)
- Create: `supabase/functions/_shared/frase-falada.test.ts`
- Test: `supabase/functions/_shared/frase.test.ts` (tem de seguir verde sem mudança)

**Interfaces:**
- Produces:
  - `interpretarFrase(texto: string, hoje: string, palavrasDeCartao?: ReadonlySet<string>): FraseInterpretada` — com o conjunto, a última palavra solta só vira `cartaoTexto` se estiver nele (ou for 4 dígitos); sem o conjunto, o comportamento de hoje.
  - `palavrasDosCartoes(cartoes: CartaoParaCasar[]): Set<string>` — palavras normalizadas (3+ letras, não numéricas) de `name` e `wallet_alias` dos ativos.
  - `precisaDeIA(pedido: PedidoCaptura, hoje: string, cartoes: CartaoParaCasar[]): boolean` (captura.ts).

- [ ] **Step 1: Escrever o teste que falha** em `frase-falada.test.ts`:

```ts
import { assertEquals } from 'jsr:@std/assert@1.0.19'
import { interpretarFrase, palavrasDosCartoes, type CartaoParaCasar } from './frase.ts'

const HOJE = '2026-11-23'
const cartao = (name: string): CartaoParaCasar => ({ id: name, name, wallet_alias: null, last_four: null, workspace_id: 'w', is_active: true })
const CARTOES = palavrasDosCartoes([cartao('Nubank'), cartao('Mercado Pago')])
const ler = (s: string) => interpretarFrase(s, HOJE, CARTOES)

Deno.test('fala: o verbo de abertura não vira descrição', () => {
  assertEquals([ler('gastei 200 reais de abastecimento').descricao, ler('gastei 200 reais de abastecimento').valor], ['Abastecimento', 200])
  assertEquals(ler('paguei 80 na farmácia').descricao, 'Farmácia')
  assertEquals(ler('comprei pão 12,50').descricao, 'Pão')
  assertEquals(ler('Dei 30 reais pro flanelinha').descricao, 'Flanelinha')
})

Deno.test('fala: o verbo que nomeia vira a descrição', () => {
  assertEquals(ler('abasteci 150 no posto').descricao, 'Abastecimento no posto')
  assertEquals(ler('almocei 35').descricao, 'Almoço')
})

Deno.test('fala: palavra solta só é cartão se for de um cartão', () => {
  assertEquals(ler('paguei 80 na farmácia').cartaoTexto, null)
  assertEquals(ler('posto ipiranga 180').descricao, 'Posto ipiranga')
  assertEquals(ler('200 abastecimento nubank').cartaoTexto, 'nubank')
  assertEquals(ler('200 abastecimento nubank').descricao, 'Abastecimento')
  // Review Focus 1: "mercado" é de um cartão, e o casamento parcial segue a conferir em quem chama.
  assertEquals(ler('50 compras no mercado').cartaoTexto, 'mercado')
})

Deno.test('fala: só verbo e valor fica com dúvida de descrição', () => {
  const f = ler('gastei 50')
  assertEquals(f.valor, 50)
  assertEquals(f.duvidas.includes('descricao'), true)
})

Deno.test('fala: sem o conjunto de cartões, o comportamento de antes', () => {
  assertEquals(interpretarFrase('paguei 80 na farmácia', HOJE).cartaoTexto, 'farmacia')
})
```

- [ ] **Step 2: Rodar e ver falhar** — `npm run test:edge -- --filter fala:` → FAIL (`palavrasDosCartoes` não existe).
- [ ] **Step 3: Implementar em `frase.ts`:**
  - `VERBOS_DE_ABERTURA = new Set(['gastei','paguei','comprei','dei','foi','custou','deu','saiu','torrei','fiz','tive'])`: no começo da frase (antes de qualquer palavra da descrição), são consumidos e não entram na descrição.
  - `VERBOS_QUE_NOMEIAM = new Map([['abasteci','Abastecimento'],['almocei','Almoço'],['jantei','Jantar'],['lanchei','Lanche']])`: viram a 1ª palavra da descrição.
  - Some `'pro','pra','para'` a `CONECTIVOS`; conectivos que sobram no começo ou no fim da descrição saem ("de abastecimento" → "Abastecimento").
  - A regra da "última palavra = cartão" passa a pedir `palavrasDeCartao.has(chave)` quando o conjunto vem; senão a palavra fica na descrição, com o acento.
  - `palavrasDosCartoes` como no bloco de Interfaces.
- [ ] **Step 4: Passar o conjunto nos chamadores** — `captura.ts` (`precisaDeIA` ganha `cartoes`; `montarLancamento` usa `ctx.cartoes`), `capture/index.ts:304` (`precisaDeIA(pedido, hoje, cartoes)`), `frase-no-form.ts:101,121` (com os `cartoes` que já recebem).
- [ ] **Step 5: Rodar tudo** — `npm run test:edge && npm run test:unit && npx tsc --noEmit` → PASS, com `frase.test.ts` e `captura.test.ts` sem mudança.
- [ ] **Step 6: Commit** — `git commit -am "feat(frase): o parser entende a frase falada"` (com o arquivo de teste novo adicionado).

---

### Task 3: O atalho escolhe como o app (paridade)

**Files:**
- Modify: `supabase/functions/_shared/captura.ts` (`ContextoCaptura`, `MetaCaptura`, `montarLancamento`)
- Modify: `supabase/functions/capture/index.ts` (lê as categorias das carteiras da pessoa)
- Test: `supabase/functions/_shared/captura.test.ts`

**Interfaces:**
- Consumes: `interpretarFrase(…, palavrasDeCartao)` e `palavrasDosCartoes` (Task 2); `casarCategoria`, `cartaoDoCredito` (já existem em `frase.ts`).
- Produces:
  - `ContextoCaptura.categoriasPorCarteira: Record<string, CategoriaParaCasar[]>` (despesa e receita de cada carteira da pessoa).
  - `MetaCaptura.categoria?: MotivoDaCategoria` — gravado em `capture_meta` sempre que houve categoria; é a métrica da Task 7.
  - `montarLancamento` devolve também `semCategoria: boolean` (descrição real e categoria nula), que a Task 6 usa.

- [ ] **Step 1: Escrever os testes que falham** em `captura.test.ts` (use o contexto de teste que o arquivo já monta, acrescido de `categoriasPorCarteira`):
  - `'paridade: "42 mercado" sem histórico pega a categoria Mercado pelo nome'` → `linha.category_id === 'mercado'`, `capture_meta.categoria === 'nome'`, `needs_review === false`.
  - `'paridade: "50 gasolina" cai em Transporte pela palavra comum, a conferir'` (só Transporte na carteira, sem Carro, para o teste não mudar com a Task 4) → `category_id === 'transporte'`, `needs_review === true`, `capture_meta.categoria === 'comum'`.
  - `'paridade: "30 no crédito" usa o cartão do último crédito do histórico'` → `payment_credit_card_id` igual ao da linha de crédito mais recente com cartão ativo.
  - `'paridade: a palavra que não é cartão volta com acento'` → texto `"80 farmácia"` sem cartão Farmácia → `description === 'Farmácia'`.
  - `'paridade: categoria de outra carteira não vale'` → histórico/categorias da carteira B, lançamento na A → `category_id === null`.
  - `'paridade: receita não pega categoria de despesa'` → `"recebi 200 reembolso"` com só categorias de despesa → `category_id === null`.
- [ ] **Step 2: Rodar e ver falhar** — `npm run test:edge -- --filter paridade:` → FAIL.
- [ ] **Step 3: Implementar em `montarLancamento`** — no lugar de `historico?.categoryId`, `casarCategoria(descricao, tipoDaCategoria(...), ctx.categoriasPorCarteira[carteira] ?? [], ctx.historicoPorCarteira[carteira] ?? [], ctx.hoje)` (o 5º argumento entra na Task 5; até lá, sem ele); forma e cartão seguem do `preencherPeloHistorico`, mais o `cartaoDoCredito(ctx.cartoes da carteira, historico, null)` para crédito sem nome e para parcelas sem forma, como em `frase-no-form.ts:203-221`; a palavra devolvida usa `cartaoPalavra ?? cartaoTexto`; `needs_review` segue a regra das Global Constraints. O Apple Pay passa pelo mesmo `casarCategoria` com o `merchant`.
- [ ] **Step 4: Ler as categorias na Edge** — em `capture/index.ts`, junto da leitura dos cartões: `admin.from('categories').select('id, name, type, workspace_id').in('workspace_id', carteirasDaPessoa)`, agrupadas em `categoriasPorCarteira`; erro → 500 com `internalError('capture: categorias', …)`.
- [ ] **Step 5: Rodar** — `npm run test:edge` → PASS.
- [ ] **Step 6: Commit** — `git commit -am "feat(capture): o atalho casa categoria e cartão como o app"`

---

### Task 4: Vocabulário de conceitos (sinônimos)

**Files:**
- Modify: `supabase/functions/_shared/frase.ts` (`COMUNS` vira `CONCEITOS`; `casarCategoria` passo 4)
- Test: `supabase/functions/_shared/frase.test.ts`

**Interfaces:**
- Produces:
  - `CONCEITOS: { id: string; palavras: string[]; nomes: string[] }[]` — cada grupo ganha um `id` estável (`'combustivel'`, `'mercado'`, `'restaurante'`…).
  - `conceitoDe(palavraNormalizada: string): string | null` — o `id` do conceito da palavra (com e sem o "s" final), usado pelo voto da Task 5.

- [ ] **Step 1: Escrever os testes que falham** (`describe` "conceitos"):
  - `'conceito: abastecimento, posto, shell e etanol são combustível'` → `conceitoDe` de cada um === `'combustivel'`.
  - `'conceito: combustível prefere Carro a Transporte quando os dois existem'` → `casarCategoria('Abastecimento', 'expense', [Transporte, Carro], [])` → `{ categoryId: 'carro', motivo: 'comum' }`.
  - `'conceito: uber continua em Transporte'` → com Transporte e Carro → `'transporte'`.
  - `'conceito: drogaria raia é Saúde'`, `'conceito: pão de açúcar é Mercado'` (multi-palavra: casar a sequência normalizada).
- [ ] **Step 2: Rodar e ver falhar.**
- [ ] **Step 3: Implementar** — separar o grupo de transporte em três conceitos: `combustivel` (gasolina, etanol, alcool, diesel, gnv, combustivel, abastecimento, abasteci, posto, shell, ipiranga, petrobras, ale; nomes `combustivel, carro, veiculo, automovel, transporte, mobilidade`), `carro` (estacionamento, pedagio, oficina, ipva, licenciamento, lavagem, mecanico, multa, seguro auto, sem parar, veloe; nomes `carro, veiculo, automovel, transporte`) e `transporte` (uber, 99, taxi, onibus, metro, trem, cabify, patinete, bilhete; nomes `transporte, mobilidade`). Ampliar os demais grupos com marcas e variantes brasileiras (mercado: pão de açúcar, extra, dia, oxxo, sams, makro, mateus, guanabara; saúde: raia, drogaraia, pague menos, panvel, unimed, plano de saude; restaurante: ze delivery, outback, coco bambu, habibs, bobs, burger king; casa: gas, botijao, ultragaz, conta de luz, conta de agua; pets: cobasi, petz). Entradas de duas palavras casam a sequência na descrição normalizada.
- [ ] **Step 4: Rodar** `npm run test:edge && npm run test:unit` → PASS. Se um teste antigo quebrar **só** porque uma palavra de combustível passou a preferir Carro, atualize a expectativa e diga isso no commit; qualquer outra quebra é bug.
- [ ] **Step 5: Commit** — `git commit -am "feat(frase): vocabulário de conceitos liga sinônimos à categoria"`

---

### Task 5: Aprender com tudo o que a pessoa já lançou

**Files:**
- Create: `supabase/migrations/20261123120000_historico_da_frase.sql`
- Create: `supabase/tests/database/historico_da_frase.test.sql`
- Modify: `supabase/functions/_shared/frase.ts` (`LinhaHistorico.n`, `MotivoDaCategoria`, `casarCategoria`, novo `votarCategoria`)
- Modify: `supabase/functions/capture/index.ts:276-294` (o histórico vem da RPC)
- Modify: `src/lib/captura/frase-no-form.ts:253-258,380-395` (rótulo e loader)
- Modify: `src/lib/import/importar.ts:44-49` (`'palavra'` → `'aprendido'`; passa `hoje`)
- Test: `supabase/functions/_shared/frase.test.ts`, `src/lib/captura/frase-no-form.test.ts`

**Interfaces:**
- Consumes: `conceitoDe` (Task 4).
- Produces:
  - SQL `public.historico_da_frase(p_workspace_id uuid, p_user_id uuid default null) returns table(description text, type text, category_id uuid, payment_method text, payment_credit_card_id uuid, date timestamptz, n integer)` — `security invoker`, `stable`; agrupa `transactions` da carteira dos últimos 24 meses por `(description, type, category_id, payment_method, payment_credit_card_id)`, `date = max(date)`, `n = count(*)`, filtra `user_id = p_user_id` quando dado, `order by max(date) desc limit 2000`; `grant execute` a `authenticated` e `service_role`. (Confirme o tipo de `transactions.date` na migração dele e devolva o mesmo tipo.)
  - `LinhaHistorico.n?: number` (ausente = 1).
  - `MotivoDaCategoria = 'historico' | 'aprendido' | 'nome' | 'comum' | 'ia'` (`'palavra'` sai).
  - `casarCategoria(descricao, tipo, categorias, historico, hoje: string)` — ordem: histórico exato → `aprendido` → nome → comum.
  - `votarCategoria(descricao: string, tipo: 'expense' | 'income', categorias: CategoriaParaCasar[], historico: LinhaHistorico[], hoje: string): string | null`.
  - `carregarHistoricoDaFrase(workspaceId, signal?)` passa a chamar `supabase.rpc('historico_da_frase', { p_workspace_id })`, mesmo retorno.

O voto (o único algoritmo que as assinaturas não determinam):

```
termos(s)  = palavras de 3+ letras de s, sem PALAVRAS_VAZIAS, cada uma trocada por conceitoDe(p) ?? p
peso(l)    = (l.n ?? 1) * 0.5 ** (mesesEntre(l.date, hoje) / 6)
para cada termo t da descrição:
  votos[t][c] = soma de peso(l) das linhas do tipo, com categoria válida, cujos termos contêm t
score[c]   = soma sobre t de votos[t][c] / soma de votos[t][*]
T          = nº de termos com algum voto
vence c*   = argmax score, se score[c*] >= 0.6 * T  e  score[c*] - segundo >= 0.5
```

`PALAVRAS_VAZIAS`: compra, compras, pagamento, gasto, conta, valor, reais, real, coisa, coisas, hoje, ontem, cartao, credito, debito, pix, dinheiro, loja, parcela.

- [ ] **Step 1: Escrever os testes que falham** (`describe` "aprendido"):
  - `'aprendido: "Posto Shell" em Carro ensina "abastecimento"'` → `casarCategoria('Abastecimento', 'expense', [Carro, Transporte], [posto shell → carro], HOJE)` → `{ categoryId: 'carro', motivo: 'aprendido' }` (o conceito liga as duas).
  - `'aprendido: o costume da pessoa vence o nome da categoria'` → categorias Mercado e Alimentação; histórico 3× "mercado extra" → Alimentação; `'mercado dia'` → `'alimentacao'`, motivo `aprendido`.
  - `'aprendido: empate não escolhe'` → 1× A e 1× B com a mesma palavra → cai para os passos seguintes (sem nome nem comum: `null`).
  - `'aprendido: o recente pesa mais'` → "farmacia" → Saúde há 30 meses (n=3) e → Beleza há 1 mês (n=1) → `'beleza'`.
  - `'aprendido: n agrega'` → uma linha `n: 5` → A, uma `n: 1` → B → `'a'`.
  - `'aprendido: palavra vazia não vota'` → histórico "compra no cartao" → A; `'compra'` → `null`.
  - `'aprendido: receita não vota em despesa'` (Review Focus 3).
  - pgTAP `historico_da_frase.test.sql`: agrega `n`; respeita os 24 meses; com `p_user_id` devolve só as linhas da pessoa (Review Focus 2); um `authenticated` de outra carteira recebe zero linhas (RLS).
- [ ] **Step 2: Rodar e ver falhar** — `npm run test:edge -- --filter aprendido:` e `npm run test:db` → FAIL.
- [ ] **Step 3: Escrever a migração e `votarCategoria`/`casarCategoria`** como nas Interfaces.
- [ ] **Step 4: Trocar os dois loaders** — app: `carregarHistoricoDaFrase` pela RPC; Edge: `admin.rpc('historico_da_frase', { p_workspace_id: w, p_user_id: convidadoEm.has(w) ? userId : null })` no lugar da consulta de 300 linhas (apague `HISTORICO_POR_CARTEIRA`). Rótulo `aprendido: "pelo que você já lançou"` em `MOTIVO_DA_CATEGORIA`; `importar.ts` trata `'aprendido'` como trata `'palavra'` hoje.
- [ ] **Step 5: Rodar** — `npm run test:edge && npm run test:unit && npm run test:db && npx tsc --noEmit && npm run lint` → PASS.
- [ ] **Step 6: Commit** — `git commit -am "feat(frase): a categoria aprende com 24 meses de lançamentos"` (com a migração e o teste SQL adicionados).

---

### Task 6: A IA escolhe o que ainda sobrar

**Files:**
- Modify: `supabase/functions/_shared/captura.ts` (`aplicarCategoriaDaIA`)
- Modify: `supabase/functions/capture/index.ts` (depois de `montarLancamento`)
- Modify: `src/components/transactions/use-leitura-do-lancamento.ts`
- Modify: `src/lib/captura/frase-no-form.ts` (rótulo `ia`)
- Test: `supabase/functions/_shared/captura.test.ts`, `src/lib/captura/frase-no-form.test.ts`

**Interfaces:**
- Consumes: `montarLancamento(...).semCategoria` (Task 3); `categorizar(ctx, itens, categorias)` (`_shared/ia.ts:588`); `categorizarComIA(workspaceId, itens, categorias)` (`src/lib/ia/ler.ts:81`).
- Produces: `aplicarCategoriaDaIA(linha: LinhaCaptura, sugestao: string | null, categorias: CategoriaParaCasar[]): LinhaCaptura` — casa o nome sugerido (normalizado) com uma categoria do tipo da linha; achou: `category_id`, `capture_meta.categoria = 'ia'`, `needs_review = true`; senão devolve a linha igual.

- [ ] **Step 1: Escrever os testes que falham:**
  - `'ia: a sugestão vira a categoria e deixa a conferir'` → sugestão "Carro" → `category_id === 'carro'`, `needs_review === true`, `capture_meta.categoria === 'ia'`.
  - `'ia: nome que não existe na carteira é ignorado'` → sugestão "Viagem" sem essa categoria → linha igual.
  - `'ia: sugestão de despesa numa receita é ignorada'`.
  - `'ia: sem IA a linha grava igual'` (Review Focus 4) → `sugestao = null` → `category_id === null`, `needs_review === true`.
- [ ] **Step 2: Rodar e ver falhar.**
- [ ] **Step 3: Implementar** `aplicarCategoriaDaIA` e, em `capture/index.ts`, só quando `montado.semCategoria`: `categorizar({ admin, userId, hoje, nomes }, [{ i: 0, descricao: linha.description, tipo: linha.type }], { expense, income })` com os nomes das categorias da carteira de destino; `ok: false` só loga (`console.error('capture: ia categoria', motivo)`). A chamada usa o `nomesDosMembros` que a frase já usa (sem nomes, sem IA).
- [ ] **Step 4: No app** — em `use-leitura-do-lancamento.ts`, no mesmo ponto em que o hook já decide chamar a IA da frase (com a mesma espera e a mesma guarda de resposta velha): se `categoryId` é nulo, a descrição é real e a categoria não foi editada (`editados`), chamar `categorizarComIA` uma vez por `(descricao, tipo)` e preencher `categoryId` com `motivoDaCategoria: 'ia'` e a dúvida `ia`. Rótulo `ia: "sugerida pela IA"` em `MOTIVO_DA_CATEGORIA`.
- [ ] **Step 5: Rodar** — `npm run test:edge && npm run test:unit && npx tsc --noEmit && npm run lint` → PASS.
- [ ] **Step 6: Commit** — `git commit -am "feat(captura): a IA sugere a categoria que as regras não acharam"`

---

### Task 7: Jornada, atlas, medição e publicação

**Files:**
- Modify: `docs/JORNADAS.md` (linhas "Frase rápida" e "Captura" da seção 5c; o fluxograma da captura)
- Modify: `docs/atlas/template.html`
- Generate: `docs/atlas/atlas-jornadas.html`
- Create: `scripts/frases/acompanhamento.sql`
- Modify: `docs/produto/lancamento-inteligente/2026-11-23-linha-de-base.md`

**Interfaces:**
- Consumes: `capture_meta.categoria` (Task 3), a RPC (Task 5), a IA de categoria (Task 6).

- [ ] **Step 1: Atualizar `docs/JORNADAS.md`** — trocar "A Edge `capture` segue só com o histórico" pelo caminho novo: parser da fala, `casarCategoria` + `cartaoDoCredito` na Edge, histórico pela RPC `historico_da_frase` (24 meses, agregado), ordem histórico → aprendido → nome → comum → IA (`categorizar`), e a regra de `needs_review`. Fluxograma da captura com os dois nós novos (RPC e IA de categoria), no tema escuro, sem id reservado do Mermaid.
- [ ] **Step 2: Atlas** — mesma explicação em `docs/atlas/template.html` (jornada, apêndice de backend com a RPC, data da capa); `python3 docs/atlas/build.py`; republicar `docs/atlas/atlas-jornadas.html` no URL do Atlas (https://claude.ai/artifact/1N43LFYP1YSVsWaRMaNTRL) com a ferramenta de Artifact.
- [ ] **Step 3: `scripts/frases/acompanhamento.sql`** — a consulta da Task 1 mais a distribuição de `capture_meta->>'categoria'` nas capturas novas.
- [ ] **Step 4: Publicar, só com ok explícito do dono (`AskUserQuestion`)** — `supabase db push` da migração e `supabase functions deploy capture --use-api` (ia-ler não muda). Sem ok, registrar no fim da tarefa que a migração e a Edge esperam publicação.
- [ ] **Step 5: Depois de uma semana de uso** (com ok do dono para ler o banco), rodar `acompanhamento.sql` e anotar antes × depois em `linha-de-base.md`.
- [ ] **Step 6: `graphify update .` e commit** — `git commit -am "docs(jornadas): captura com aprendizado e IA de categoria"`.
