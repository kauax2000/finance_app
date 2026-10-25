# Bloco 7B — Gasto privado entre adultos e titular do cartão: plano de implementação

> **Para agentes:** SUB-SKILL OBRIGATÓRIA: use superpowers:subagent-driven-development (recomendado) ou superpowers:executing-plans para executar este plano tarefa a tarefa. Os passos usam checkbox (`- [ ]`).

**Objetivo:** um adulto pode marcar um gasto como privado. Os outros adultos veem só "Gasto pessoal de Fulana — R$ 120", sem descrição, categoria, estabelecimento nem anexo. O valor continua em todos os totais da casa. O cartão ganha um titular. O PDF e a conferência de um cartão com titular ficam com o titular e o dono.

**Pressupõe o Bloco 7A** (`2026-10-25-bloco-7a-papeis-e-limites.md`): o `is_workspace_adult`, as políticas de transação com o ramo do convidado e o `adultosDaCarteira`.

**Arquitetura:**
- **O original não fica na linha que os outros leem.**
  - Quando um lançamento é privado, um trigger `before insert or update` em `transactions` move a descrição, a categoria e o `capture_meta` para a tabela `transacoes_privadas`. Essa tabela só o autor lê.
  - Na linha da `transactions` ficam `description = 'Gasto pessoal'`, `category_id = null` e `capture_meta = null`.
  - Assim, todo leitor que já existe recebe o mascarado sem mudar uma linha: as cerca de 20 consultas do cliente, os bundles, a busca, o Cofre, as Edges com service role e o front de `main`.
  - O "não pode ser possível ler as colunas originais por `select` direto" (spec §12) vale por construção.
  - **O autor junta os detalhes** com uma consulta a `transacoes_privadas`, só nas telas em que ele vê ou edita o próprio lançamento.
- **A privada não entra no orçamento por categoria nem na tela de categoria.** Ela não tem categoria na linha. Entra no total da casa, no seguro, no fluxo, na fatura e no limite da pessoa. O mesmo número aparece em toda tela.
- **Telas:** entram como wireframes (`AGENTS.md`).

**Tecnologia:** Next 16 / React 19, Supabase (Postgres, Edge em Deno), Vitest e Deno test. Nenhuma dependência nova.

**Spec:** `docs/superpowers/specs/2026-10-20-proposta-funcional-design.md` §12, "Gasto privado entre adultos", e §15.12. **Levantamento:** `docs/superpowers/plans/2026-10-25-bloco-7-levantamento.md` (§5, §7 e §12).

## Restrições globais

- **Valem todas as do 7A** (banco de produção, front de `main` no ar, repositório público, testes, wireframe, fechamento de cada tarefa e a etiqueta `WIREFRAME · Bloco 7 · <funcionalidade>`).
- **Onde o privado vale (spec §12, literal):** a compra paga por **Pix, débito ou dinheiro** (`pix`, `debit_card`, `cash`), ou num cartão cujo **titular é o autor** (`credit_cards.holder_user_id`).
- **Só o adulto marca privado.** O gasto do convidado já é visível aos adultos pela tabela de papéis.
- **O valor entra em todos os totais.**
- **O PDF e o resultado da conferência** de um cartão com titular ficam visíveis só ao titular e ao dono da carteira. A linha do banco que casa com um gasto privado aparece mascarada para quem não é o autor.
- **A carteira pessoal continua sendo a privacidade total.** Nada muda nela.

## Decisões desta rodada (o orquestrador registra no ledger)

1. **O mecanismo:** a tabela `transacoes_privadas` e o trigger, da Arquitetura.
   - A descrição mascarada na linha é a palavra fixa `'Gasto pessoal'`.
   - A tela escreve "Gasto pessoal de {nome do autor}", com o nome tirado do diretório de membros.
   - O `main` mostra "Gasto pessoal". Os totais batem nos dois fronts.
2. **A privada não pode ter vínculo que a revele:** `subscription_id`, `installment_plan_id`, uma instância de conta ligada ou `project_id` (este, do 7C). O trigger recusa com `PRIVADO_NAO_PERMITIDO`.
3. **`holder_user_id` nulo é "cartão da casa":**
   - nele, o privado não vale;
   - a conferência e o PDF continuam como hoje, abertos a todo adulto.

   O titular é escolhido no formulário do cartão, entre os adultos da carteira. A RLS só deixa gravar um titular que seja adulto da carteira.
4. **Desmarcar o privado** devolve a descrição, a categoria e o `capture_meta` à linha, e apaga a de `transacoes_privadas`.
   - Só o autor edita ou apaga uma privada. A política de `update` e `delete` de `transactions` ganha `(not is_private or user_id = auth.uid())` no ramo do adulto.
   - Assim, um membro no `main` não consegue mexer numa privada alheia, nem pelo `update` direto.
5. **Os anexos de uma privada:** a política de `attachments` e a do storage escondem o anexo cuja transação é privada de outra pessoa.
6. **A conferência:**
   - `credit_card_statement_totals` e os anexos de fatura (`statement_total_id`): num cartão com titular, só o titular e o dono veem e escrevem;
   - na lista de resultado da conferência, a linha casada com uma privada de outra pessoa aparece como "Gasto pessoal de Fulana" com o valor.
7. **As Edges:**
   - `insights-daily` ignora `is_private` nos detectores (recorrência, atípico, duplicidade e preço): "Gasto pessoal" repetido viraria recorrência falsa;
   - o aviso de lançamento novo diz "{valor} — Gasto pessoal de {nome}";
   - o histórico da `capture` ignora as privadas de outra pessoa.

## Foco de revisão

1. **O original vaza.**
   - Depois de gravar uma privada, a linha em `transactions` tem `description = 'Gasto pessoal'`, `category_id` nulo e `capture_meta` nulo.
   - Um `select` em `transacoes_privadas` feito por outro adulto vem vazio.
   - A busca por um pedaço da descrição original não acha a privada de outra pessoa.
   - (Tarefa 1, teste de fonte do trigger e da RLS. Tarefa 2, teste da busca.)
2. **Privado onde não vale.**
   - Uma compra num cartão da casa com `is_private = true` é recusada.
   - Uma compra num cartão de outro titular também.
   - Um lançamento do convidado também.
   - Uma assinatura também.
   - (Tarefa 1.)
3. **O total da casa muda.** O total do mês, o seguro e a fatura são os mesmos antes e depois de marcar privado. Só a tela de categoria perde a linha. (Tarefa 2, teste dos números com o mesmo conjunto de lançamentos.)
4. **O autor perde o próprio dado.** Marcar privado, abrir de novo e desmarcar devolve a descrição e a categoria originais. (Tarefa 1 e Tarefa 3.)
5. **O PDF do cartão de outro titular abre para um membro** pela tabela ou pelo storage. (Tarefa 1.)

---

### Tarefa 1: Migração — titular, privado, tabela dos detalhes e as políticas

**Arquivos:**
- Criar: `supabase/migrations/20261030120000_privado.sql`
- Modificar: `src/types/database.ts`, `src/lib/supabase.ts` (os tipos de `Transaction` e `CreditCard`)
- Teste: `src/lib/privado/migracao-privado.test.ts` (fonte)

**Interfaces (produz):**
- `credit_cards.holder_user_id uuid references auth.users on delete set null`. Um trigger confere que o titular é adulto da carteira.
- `transactions.is_private boolean not null default false`.
- `public.transacoes_privadas`:
  - colunas: `transaction_id uuid primary key references transactions on delete cascade`, `workspace_id uuid not null`, `user_id uuid not null`, `description text`, `category_id uuid`, `capture_meta jsonb`, `updated_at`;
  - RLS: `select`, `insert`, `update` e `delete` só com `user_id = auth.uid()`.
- O trigger `guardar_privado()`:
  - `security definer`, `set search_path = ''`;
  - roda `before insert or update of is_private, description, category_id, capture_meta, payment_method, payment_credit_card_id`;
  - valida a Decisão 2 e as restrições, e senão `raise exception 'PRIVADO_NAO_PERMITIDO'`;
  - move os campos ou os devolve (Decisões 1 e 4).
- As políticas das Decisões 4, 5 e 6.

- [ ] **Passo 1: teste de fonte que falha.** Ele confere:
  - as colunas e a RLS de `transacoes_privadas`, só do autor;
  - o trigger com `'Gasto pessoal'`, `category_id := null` e `capture_meta := null`;
  - os métodos `pix`, `debit_card` e `cash`, e o ramo do cartão com `holder_user_id = new.user_id`;
  - a recusa para o convidado (`is_workspace_adult`) e para os vínculos;
  - o `(not is_private or user_id = auth.uid())` no `update` e no `delete`;
  - os anexos e o storage com o ramo da privada;
  - a conferência com titular ou dono;
  - nenhum `drop`.
- [ ] **Passo 2:** `npx vitest run src/lib/privado/migracao-privado.test.ts`. Esperado: FAIL.
- [ ] **Passo 3:** escrever a migração e os tipos.
- [ ] **Passo 4:** `npx tsc --noEmit && npm run test:unit`. Esperado: PASS.
- [ ] **Passo 5:** commit `feat(privado): gasto privado mora fora da linha da casa`.

### Tarefa 2: Leituras — o autor junta os detalhes, e as Edges ignoram a privada

**Arquivos:**
- Criar: `src/lib/privado/detalhes.ts` e o teste dele
- Modificar:
  - as telas do autor: a lista de transações, a folha de detalhe e o formulário de edição (veja o §7 do levantamento: `transactions-detail-sheet-query.ts`, `fetch-transactions-list-page.ts` e o formulário);
  - o Cofre (`src/lib/cofre/exportar.ts`): a exportação da pessoa traz os detalhes das privadas dela;
  - `supabase/functions/insights-daily/index.ts` e os detectores (o filtro `is_private`);
  - `_shared/process-transaction-notification.ts`;
  - `capture/index.ts`.
- Teste: `src/lib/privado/detalhes.test.ts`, `src/lib/privado/numeros-privado.test.ts`, `src/lib/privado/edges-privado.test.ts` (fonte) e um caso novo em `supabase/functions/_shared/insights/detectores.test.ts`

**Interfaces:**
- Consome: a Tarefa 1.
- Produz:
  - `comDetalhesPrivados<T extends { id: string; is_private: boolean; user_id: string }>(linhas: T[], detalhes: { transaction_id: string; description: string | null; category_id: string | null }[], meuId: string): T[]`. É pura e troca os campos só nas privadas do próprio autor;
  - `buscarDetalhesPrivados(supabase, ids: string[]): Promise<...>`, uma consulta só, por `in`;
  - `rotuloDaTransacao(t: { is_private: boolean; user_id: string; description: string | null }, nomeDoAutor: string, meuId: string): string`. Na privada de outra pessoa dá "Gasto pessoal de {nome}"; senão, a descrição.

- [ ] **Passo 1: testes que falham.**
  - `comDetalhesPrivados` troca a privada do autor e deixa a de outra pessoa.
  - `rotuloDaTransacao` dá "Gasto pessoal de Ana" para outra pessoa e a descrição original para o autor.
  - **Os números:** com o mesmo conjunto de lançamentos, `fluxoDoMes` e `seguroParaGastar` dão o mesmo total antes e depois de marcar um privado (use a forma mascarada como entrada).
  - **Os detectores:** três meses de "Gasto pessoal" privado não viram recorrência.
  - **A fonte:** o aviso de lançamento usa o nome na privada, e a `capture` filtra as privadas alheias.
- [ ] **Passo 2:** `npx vitest run src/lib/privado && npm run test:edge`. Esperado: FAIL.
- [ ] **Passo 3:** implementar. Nas listas, a busca dos detalhes roda só quando a página tem privada do próprio autor.
- [ ] **Passo 4:** `npx tsc --noEmit && npm run lint && npm run test:unit && npm run test:edge && npm run build`. Esperado: PASS.
- [ ] **Passo 5:** commit `feat(privado): o autor vê o dele, e os avisos e insights não leem a privada`.

### Tarefa 3: Telas — o "Privado" no lançamento, o titular no cartão e a conferência

**Arquivos:**
- Criar: `src/components/wireframe/gasto-privado-wireframe.tsx` (a chave "Privado" com o motivo quando não vale, e o seletor de titular para o formulário do cartão)
- Modificar:
  - o formulário de lançamento e o do cartão, que importam as peças;
  - as linhas da lista, do Painel e do detalhe do cartão, que usam `rotuloDaTransacao`;
  - `src/components/wireframe/conferir-fatura-wireframe.tsx` e `a-conferir-lista-wireframe.tsx`: a linha casada com uma privada de outra pessoa.
- Teste: `src/lib/privado/pode-ser-privado.test.ts`

**Interfaces:**
- Consome: as Tarefas 1 e 2.
- Produz: `podeSerPrivado({ papel, metodo, cartao, autorId }): { pode: true } | { pode: false; motivo: string }`. É a mesma regra do trigger, para a tela explicar antes de salvar. Os motivos, exatos:
  - "No cartão da casa o titular vê a fatura no banco.";
  - "Só o titular do cartão pode marcar como privado.";
  - "Quem é convidado não marca gasto privado.";
  - "Assinatura, parcela e conta não podem ser privadas."

- [ ] **Passo 1: testes que falham:** um caso para cada motivo e um para cada caminho permitido (`pix`, `debit_card`, `cash` e o cartão do próprio titular).
- [ ] **Passo 2:** `npx vitest run src/lib/privado/pode-ser-privado.test.ts`. Esperado: FAIL.
- [ ] **Passo 3:** implementar.
  - A chave fica desabilitada, com o motivo embaixo, quando não pode.
  - O erro `PRIVADO_NAO_PERMITIDO` do banco vira a mesma frase em `src/lib/supabase-errors.ts`.
- [ ] **Passo 4:** `npx tsc --noEmit && npm run lint && npm run test:unit && npm run ds:audit -- src/components/wireframe && npm run build`. Esperado: PASS.
- [ ] **Passo 5:** commit `feat(privado): marcar privado, titular do cartão e conferência mascarada`.

### Tarefa 4: Roteiro, jornadas e Atlas

**Arquivos:**
- Criar: `supabase/BLOCO_7B_DEPLOYMENT.md`
- Modificar: `docs/JORNADAS.md`, `docs/atlas/template.html`, `docs/atlas/atlas-jornadas.html` (gerado)

**O roteiro:**
1. Aplicar a migração, depois das do 7A.
2. Redeploy da `insights-daily` (só com o front 2.0, como no 6B), da Edge do aviso de lançamento e da `capture`.
3. Conferir:
   - nenhuma linha de `transactions` com `is_private` e uma descrição diferente de "Gasto pessoal";
   - `transacoes_privadas` com o mesmo número de linhas que as privadas.

**As jornadas:**
- "Lançar um gasto privado": a chave, o motivo quando não vale e o que os outros veem;
- "Titular do cartão";
- "Conferir a fatura" com o titular;
- as regras técnicas (o mecanismo, onde vale, os totais);
- a lacuna: a privada não aparece na tela de categoria nem no orçamento por categoria, por construção.

**O Atlas:** as mesmas jornadas, as lacunas e a capa. Depois, `python3 docs/atlas/build.py`.

- [ ] **Passo 1:** escrever o roteiro.
- [ ] **Passo 2:** atualizar `JORNADAS.md` e `template.html`, e rodar o `build.py`.
- [ ] **Passo 3:** `npx tsc --noEmit && npm run lint && npm run test:unit && npm run build`. Esperado: PASS.
- [ ] **Passo 4:** commit `docs(privado): roteiro do Bloco 7B, jornadas e Atlas`.
