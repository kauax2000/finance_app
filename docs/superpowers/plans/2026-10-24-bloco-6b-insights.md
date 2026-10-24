# Bloco 6B — Motor de insights: plano de implementação

> **Para agentes:** SUB-SKILL OBRIGATÓRIA: use superpowers:subagent-driven-development (recomendado) ou superpowers:executing-plans para executar este plano tarefa a tarefa. Os passos usam checkbox (`- [ ]`).

**Objetivo:** o app avisa o que a pessoa não veria sozinha, com uma ação em um toque e sem virar ruído. O bloco entrega:
- o resumo da fatura que fechou;
- o relatório de valor do mês;
- a recorrência detectada (virar assinatura ou conta a pagar);
- o gasto atípico;
- a assinatura que mudou de preço;
- a possível duplicidade;
- as parcelas acabando;
- o seguro para gastar baixo;
- o sazonal;
- o "a conferir" acumulando.

**Pressupõe o Bloco 6A** (`docs/superpowers/plans/2026-10-24-bloco-6a-contas-a-pagar.md`): a recorrência única das contas e o `ligar_pagamento_da_conta`.

**Arquitetura:**
- **A regra decide e o texto sai de modelos pt-BR** (spec §11; a IA não entra).
- Os detectores e os modelos de frase são **funções puras sem import** em `supabase/functions/_shared/insights/`. O cron `insights-daily` usa essas funções, e o cliente as reexporta para mostrar e para testar.
- **Os insights que dependem do "seguro para gastar"** (o seguro baixo e o "seguro cumprido" do relatório) são calculados **no cliente** com `seguroParaGastar`, a fonte única do Bloco 5. O seguro baixo é gravado pela RPC `registrar_insight` quando o Painel abre e não manda push. Assim o número não é reimplementado em Deno.
- **Uma caixa de insights no Painel** (wireframe) mostra os novos e os vistos, com a ação, o "Entendi" e o "Não mostrar mais este tipo".
- **O push passa por um teto de 3 por pessoa por semana.** O que passar do teto fica só no app.
- **Telas:** entram como wireframes (`AGENTS.md`).

**Tecnologia:** Next 16 / React 19, Supabase (Postgres, Edge em Deno, pg_cron), Vitest e Deno test. Nenhuma dependência nova.

**Spec:** `docs/superpowers/specs/2026-10-20-proposta-funcional-design.md` §11, nas partes "Motor de insights", "Catálogo inicial" e "Regra de sugestão de recorrência".

## Restrições globais

- **O banco de dev é o de produção.** Nenhuma tarefa roda `supabase db push`, deploy ou SQL contra o projeto. Quem publica é o orquestrador, e só com o pedido explícito do dono.
- **O front de `main` continua em produção até o fim do 2.0.** Por isso:
  - as migrações só acrescentam;
  - o tipo novo de notificação, `'insight'`, entra no check sem tirar nenhum;
  - **o `insights-daily` só é publicado junto com o front 2.0**, porque os links dele (`/previsao`, a caixa do Painel) não existem no front antigo. É a mesma regra do alerta de fatura alta (Bloco 5, Ruling 7).
- **O repositório é público.** Nenhuma chave, URL de projeto ou dado real entra nele.
- **Regras da spec, literais:**
  - todo insight tem **uma ação** ou um "entendi";
  - existe o "não mostrar mais este tipo";
  - o teto é de **3 push por semana** por pessoa, e o resto fica só no app;
  - o tom é neutro, nunca sermão: "culpado" é proibido.
- **Números do catálogo (spec §11):**
  - **recorrência:** a mesma descrição e o valor dentro de **±10%** em **3 meses seguidos**, ou **2 meses no mesmo dia ±3**, sem vínculo;
  - **gasto atípico:** acima de **2× a média de 3 meses**;
  - **seguro baixo:** abaixo de **10% da renda do ciclo**;
  - **"a conferir":** mais de **5** itens.
- **A sugestão de recorrência:**
  - cartão de crédito ou débito automático (`credit_card` ou `debit_card`) vira **assinatura**;
  - Pix ou boleto (`pix`, `ted`, `cash`, `other`) vira **conta a pagar**.
- **Data do app:** `America/Sao_Paulo`. No servidor valem `app_today()` e `appTodayYmd()`.
- **Testes:**
  - Vitest roda em ambiente `node`, só `src/**/*.test.ts`.
  - O Deno roda `supabase/functions/_shared/**/*.test.ts` (`npm run test:edge`; confira se o glob do script pega a subpasta `insights/` e ajuste-o se não pegar).
  - Os módulos `_shared/insights/*.ts` **não importam nada**, e o cliente os reexporta, como `src/lib/planos/plano.ts` faz.
- **Wireframe:**
  - fica só em `src/components/wireframe/`;
  - usa a etiqueta `WIREFRAME · Bloco 6 · <funcionalidade>`;
  - usa controles nativos, com `type` declarado em todo `<button>`;
  - não usa nada de `@/components/ui`.
- **Mudança de jornada:** a Tarefa 5 atualiza `docs/JORNADAS.md` e `docs/atlas/template.html` e roda `python3 docs/atlas/build.py`.
- **Fechamento de cada tarefa:**
  - sempre `npx tsc --noEmit && npm run lint && npm run test:unit`;
  - mais `npm run test:edge` quando mexe em `supabase/functions`;
  - mais `npm run ds:audit -- src/components/wireframe` quando mexe em wireframe;
  - mais `npm run build` quando mexe em tela.

  Não ponha `graphify-out/` no stage, e reverta qualquer mudança no `deno.lock`.

## Decisões desta rodada (o orquestrador registra no ledger)

1. **Ficam para o Bloco 7:**
   - o "limite da pessoa", porque o limite por pessoa ainda não existe;
   - "o convidado recebe só os insights do próprio limite", porque o papel `guest` ainda não existe.
   O motor nasce com `user_id` opcional para servir os dois.
2. **Quem produz:**
   - **O cron diário (`insights-daily`, `0 13 * * *`, 10h de Brasília)** produz o resumo da fatura (quando um cartão fechou ontem ou anteontem), o relatório do mês (no dia 1), a recorrência, o gasto atípico, a mudança de preço, a duplicidade, as parcelas acabando, o sazonal e o "a conferir".
   - **O cliente, ao abrir o Painel,** produz o seguro baixo, pela RPC `registrar_insight`.
   - **O evento "lançamento novo"** é coberto pelo cron do dia seguinte (latência até 1 dia), e não por gatilho. É desvio consciente: assim o caminho do lançamento fica sem mais uma chamada.
3. **O "seguro cumprido" do relatório** é calculado na hora de mostrar, no cliente, com `fluxoDoMes` do mês anterior. O payload do servidor não o traz.
4. **Dedupe e teto.**
   - Cada insight tem `dedupe_key`, e `(workspace_id, coalesce(user_id, zero-uuid), kind, dedupe_key)` é único. Um insight descartado não volta com a mesma chave.
   - O teto de push é a tabela `insights_push_semana(user_id, semana date, enviados int)`, com a semana começando na segunda (Brasília).
   - O cron reivindica um envio somando 1 só se `enviados < 3`. Quem não reivindicou é entregue sem push (in-app). Para isso, a Tarefa 3 acrescenta `semPush?: boolean` ao `deliverNotification`.
5. **"Não mostrar mais este tipo"** é a tabela `insights_silenciados(user_id, kind, pk)`. O cron e o `registrar_insight` não criam insight de um tipo silenciado para a pessoa. Num insight da carteira (`user_id` nulo), quem silenciou não o vê: o filtro é na leitura.
6. **A ação "Criar com 1 toque, ligando os lançamentos passados"** é uma RPC por destino:
   - **`virar_assinatura(p_insight_id uuid, p_nome text, p_valor numeric, p_dia smallint, p_payment_method text, p_card_id uuid, p_category_id uuid)`:** cria a assinatura com `next_billing_date` no próximo dia depois de hoje e grava `subscription_id` nos lançamentos do payload do insight. A partir do Bloco 5, eles viram `recurring` pela regra do pai que já existia.
   - **`virar_conta(p_insight_id uuid, p_nome text, p_dia smallint, p_valor_variavel boolean, p_category_id uuid)`:** cria a conta, mais uma instância `paid` para cada lançamento do payload (com `transaction_id`, `paid_amount` e `paid_at`), mais a próxima `pending`.
   - Os dois marcam o insight `acted`.
   - Um lançamento que já tem `subscription_id`, ou que já está ligado a uma instância, é ignorado.
7. **A descrição normalizada** (a chave da recorrência, da duplicidade e do preço) é `normalizarDescricao(s)`: minúsculas, sem acento, sem dígitos e sem pontuação, com os espaços colapsados e as palavras de até 2 letras tiradas. O par "Netflix.com 12/10" e "NETFLIX" dá "netflix".
8. **O sazonal** procura, entre 1º de janeiro e 15 de fevereiro, os lançamentos de janeiro a março do ano anterior com estas palavras na descrição normalizada: `ipva`, `iptu`, `material escolar`, `matricula`, `licenciamento`. A sugestão é "Criar conta a pagar" para cada termo achado que não tem conta ativa parecida.

## Foco de revisão

1. **Push demais.**
   - A 4ª notificação de insight da semana para a mesma pessoa vai só in-app.
   - Duas carteiras da mesma pessoa somam no mesmo teto.
   - Um tipo silenciado não cria nada.
   - (Tarefa 1, teste de fonte. Tarefa 3, teste do teto.)
2. **Recorrência falsa.**
   - Dois cafés de R$ 8 no mesmo mês não são recorrência.
   - Um lançamento já ligado a assinatura ou conta não entra.
   - O valor que varia 12% não casa.
   - O dia 12 contra o 16 não é "mesmo dia ±3".
   - (Tarefa 2.)
3. **Duplicidade em parcela, assinatura ou estorno.**
   - Duas parcelas do mesmo plano não são duplicidade.
   - Dois lançamentos da mesma assinatura em dias diferentes não são.
   - Uma despesa e o estorno dela não são.
   - (Tarefa 2.)
4. **Insight duplicado no dia seguinte.** O cron de hoje e o de amanhã sobre o mesmo fato dão um insight só, pela `dedupe_key`. Um insight descartado não reaparece. (Tarefa 1, teste de fonte do índice único. Tarefa 3.)
5. **Sermão.** Nenhum modelo de frase contém "culpado", "irresponsável", "deveria", "cuidado" ou "!". O "↑/↓ %" sai com sinal e uma casa. (Tarefa 2, teste que varre todos os modelos.)

---

### Tarefa 1: Migração — insights, silenciados, teto de push e as RPCs

**Arquivos:**
- Criar: `supabase/migrations/20261028120000_insights.sql`
- Modificar: `src/types/database.ts`, `supabase/functions/_shared/notification-types.ts` (o tipo `'insight'` e o `notify_insights`), `src/lib/notifications.ts` (o tipo no cliente) e o hook de preferências de aviso (procure `notify_review` em `src/hooks/`)
- Teste: `src/lib/insights/migracao-insights.test.ts` (teste de fonte)

**Interfaces (produz):**
- **`public.insights`**, com as colunas:
  - `id uuid pk default gen_random_uuid()`;
  - `workspace_id uuid not null references workspaces on delete cascade`;
  - `user_id uuid references auth.users on delete cascade`;
  - `kind text not null check in ('fatura_fechou','relatorio_mes','recorrencia','gasto_atipico','preco_assinatura','duplicidade','parcelas_acabando','seguro_baixo','sazonal','a_conferir')`;
  - `dedupe_key text not null`;
  - `payload jsonb not null default '{}'`;
  - `status text not null default 'new' check in ('new','seen','dismissed','acted')`;
  - `created_at` e `updated_at`.

  Ela tem o índice único `insights_dedupe_uidx` em `(workspace_id, coalesce(user_id, '00000000-0000-0000-0000-000000000000'::uuid), kind, dedupe_key)`.
  - **RLS:** `select` para o membro da carteira, quando `user_id is null or user_id = auth.uid()` e o tipo não está silenciado pela pessoa.
  - Não há `insert`, `update` nem `delete` direto. Só as RPCs abaixo escrevem.
- **`public.insights_silenciados(user_id uuid references auth.users on delete cascade, kind text, criado_em timestamptz default now(), primary key (user_id, kind))`**, com RLS: a pessoa lê, insere e apaga só as próprias.
- **`public.insights_push_semana(user_id uuid, semana date, enviados integer not null default 0, primary key (user_id, semana))`**, com RLS ligada, sem política e `revoke all` de `anon, authenticated`.
- **`public.reivindicar_push_de_insight(p_user_id uuid, p_semana date) returns boolean`:** só `service_role`. É um upsert atômico que soma 1 só se `enviados < 3`.
- **`public.marcar_insight(p_id uuid, p_status text) returns void`:** `security definer`, `set search_path = ''`, grant para `authenticated`. Aceita só `'seen' | 'dismissed' | 'acted'`. A pessoa precisa ver o insight pelas mesmas regras da RLS.
- **`public.registrar_insight(p_workspace_id uuid, p_kind text, p_dedupe_key text, p_payload jsonb) returns uuid`:** `security definer`, grant para `authenticated`.
  - Exige ser membro da carteira.
  - Aceita só `p_kind = 'seguro_baixo'`.
  - Grava com `user_id = auth.uid()` e `on conflict … do nothing`.
  - Não cria nada para um tipo silenciado.
- **`public.virar_assinatura(...)` e `public.virar_conta(...)`**, nas assinaturas da Decisão 6:
  - são `security invoker`, para a RLS das tabelas valer, com `set search_path = public`;
  - são idempotentes: um insight já `acted` dá `raise exception 'INSIGHT_JA_USADO'`.
- **As notificações:**
  - `notifications_type_check` é refeito com `'insight'` a mais (`not valid` e depois `validate`, como em `20261023120000_captura.sql:143`);
  - `workspace_member_notification_prefs.notify_insights boolean not null default true`;
  - `isTypeAllowedForPrefs` cobre `'insight'` com `notify_insights`, e o `PREFS_COLUMNS` do `deliver-notification.ts` ganha a coluna.
- **O cron `insights-daily`** roda em `'0 13 * * *'` com `select public.invoke_edge_function('insights-daily')`, usando o bloco `do $cron$`.
  - Ele é criado na migração, mas a Edge só sobe com o front (está no roteiro).
  - Até lá, o `invoke_edge_function` de uma função ausente só registra o erro. Se isso enche o log de erro, o roteiro manda aplicar a parte do cron só no lançamento. A Tarefa 5 decide pelo que o `invoke_edge_function` faz.

- [ ] **Passo 1: teste de fonte que falha.** Ele confere:
  - o índice único com o `coalesce`;
  - a RLS de `insights` sem política de escrita;
  - `insights_push_semana` com `revoke`;
  - o `enviados < 3` na RPC;
  - o `marcar_insight` restrito a três status;
  - o `registrar_insight` restrito a `seguro_baixo`;
  - o `INSIGHT_JA_USADO`;
  - o check de notificação com os oito tipos;
  - o `notify_insights`;
  - nenhum `drop column`.
- [ ] **Passo 2:** `npx vitest run src/lib/insights/migracao-insights.test.ts`. Esperado: FAIL.
- [ ] **Passo 3:** escrever a migração, os tipos e o `notification-types`.
- [ ] **Passo 4:** `npm run test:edge && npx tsc --noEmit && npm run test:unit`. Esperado: PASS.
- [ ] **Passo 5:** commit `feat(insights): tabela, silenciados, teto de push e as RPCs`.

### Tarefa 2: Detectores e modelos de frase (puros)

**Arquivos:**
- Criar:
  - `supabase/functions/_shared/insights/detectores.ts` e `detectores.test.ts`;
  - `supabase/functions/_shared/insights/textos.ts` e `textos.test.ts`;
  - `src/lib/insights/insights.ts`, que reexporta.

**Interfaces (produz), sem imports:**
```ts
export type Lanc = { id: string; type: 'income' | 'expense'; amount: number; dateYmd: string; description: string | null
  category_id: string | null; payment_method: string | null; payment_credit_card_id: string | null
  subscription_id: string | null; installment_plan_id: string | null; ligadoAConta: boolean; needs_review: boolean }
export function normalizarDescricao(s: string | null): string
export function detectarRecorrencias(lancs: Lanc[], hojeYmd: string): Array<{ chave: string; nome: string; valorMedio: number; dia: number
  destino: 'assinatura' | 'conta'; lancamentos: string[]; payment_method: string | null; card_id: string | null; category_id: string | null }>
export function detectarAtipicos(lancs: Lanc[], hojeYmd: string, nomesCategoria: Record<string, string>): Array<{ chave: string; alvo: 'categoria' | 'descricao'; nome: string; mes: number; media3: number }>
export function detectarDuplicidades(lancs: Lanc[]): Array<{ chave: string; ids: [string, string]; valor: number; descricao: string; dataYmd: string }>
export function detectarPrecoDeAssinatura(lancs: Lanc[], assinaturas: Array<{ id: string; name: string; amount: number; is_active: boolean; kind?: string }>): Array<{ chave: string; assinaturaId: string; nome: string; de: number; para: number; lancamentoId: string }>
export function detectarParcelasAcabando(planos: Array<{ id: string; description: string; installment_amount: number; total_installments: number; generated_count: number; next_billing_date: string; is_active: boolean }>, hojeYmd: string): Array<{ chave: string; planoId: string; descricao: string; mesFim: string; liberaPorMes: number }>
export function detectarSazonais(lancs: Lanc[], hojeYmd: string, contasAtivas: string[]): Array<{ chave: string; termo: string; mesAnterior: string; valor: number }>
export function resumoDaFatura(e: { cardNome: string; closeYmd: string; total: number; fechadasAnteriores: number[]; porCategoria: Array<{ nome: string; total: number }>
  maiores: Array<{ descricao: string; valor: number }>; parcelasNovas: string[]; parcelasAcabaram: string[]; estornos: number; bancoTotal: number | null }): Record<string, unknown>
```
```ts
// textos.ts
export type Texto = { titulo: string; corpo: string; acao: { rotulo: string; href: string } | null }   // null = "Entendi"
export function textoDoInsight(kind: string, payload: Record<string, unknown>): Texto
export const PALAVRAS_PROIBIDAS: readonly string[]   // ['culpado','irresponsável','deveria','cuidado']
```

**As regras dos detectores:**
- **Recorrência:**
  - Agrupa por `normalizarDescricao`, só despesas sem `subscription_id`, sem `installment_plan_id` e com `ligadoAConta = false`.
  - É recorrência se houver um lançamento em cada um de 3 meses seguidos (o mais recente sendo o mês atual ou o anterior), todos dentro de ±10% da média. Ou se houver 2 meses seguidos com o dia a no máximo 3 de distância e valores dentro de ±10%.
  - `destino` sai pela forma de pagamento da Restrição global.
  - A chave é `rec:{descricaoNormalizada}`.
- **Gasto atípico:**
  - Por categoria e por descrição normalizada, o mês corrente até hoje contra a média dos 3 meses anteriores completos.
  - Dispara com `mes > 2 × media3` e `media3 > 0`.
  - A chave é `atip:{alvo}:{nome}:{ym}`.
- **Duplicidade:**
  - Mesmo `amount`, mesma descrição normalizada não vazia e mesmo `dateYmd`, só despesas, sem `installment_plan_id` e com `subscription_id` diferente ou nulo nos dois.
  - A chave é `dup:{idMenor}:{idMaior}`.
- **Preço de assinatura:**
  - Um lançamento dos últimos 40 dias sem `subscription_id`, cuja descrição normalizada contém o nome normalizado de uma assinatura ativa `expense`, com `amount` diferente do da assinatura em mais de R$ 0,01 e menos de 50%.
  - A chave é `preco:{assinaturaId}:{para}`.
- **Parcelas acabando:**
  - O último vencimento cai no mês corrente ou no seguinte.
  - `liberaPorMes = installment_amount`.
  - A chave é `fim:{planoId}`.
- **Sazonal:** pela Decisão 8. A chave é `saz:{termo}:{ano}`.

**Os modelos de frase** (o tom é neutro e o valor sai por `currencyBRL`, reimplementado sem import com `Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })`):

| kind | Título | Corpo | Ação |
|---|---|---|---|
| `fatura_fechou` | "Fatura do {cartão} fechou: {R$ total}" | "{↑/↓ x,x%} contra a média e {↑/↓ y,y%} contra o mês anterior. Pesaram mais {c1}, {c2} e {c3}." Seguido, quando houver, de "Parcelas novas: …", "Acabaram: …", "Estornos: R$ …" e "Diferença para o banco: R$ …". | "Ver fatura" → `/credit-cards/{id}` |
| `relatorio_mes` | "Seu mês de {mês}" | "O app lançou {n} sozinho, a conferência achou {m} diferenças e {k} avisos chegaram antes do vencimento." | "Ver mês" → `/previsao` |
| `recorrencia` | "{Nome} todo mês" | "Virar assinatura?" ou "Virar conta a pagar?" | "Criar" (a ação abre o diálogo de confirmação da Tarefa 4) |
| `gasto_atipico` | "{Nome} acima do comum" | "Este mês: {R$}. A média dos 3 anteriores: {R$}." | "Ver lançamentos" → `/transactions?busca={nome}`, ou o filtro de categoria que já existe |
| `preco_assinatura` | "{Nome} mudou de preço" | "De {R$ de} para {R$ para}." | "Atualizar valor" |
| `duplicidade` | "Possível lançamento repetido" | "{descrição} · {R$} em {dd/mm}, duas vezes." | "Apagar um" |
| `parcelas_acabando` | "Em {mês} acaba {descrição}" | "Sobram {R$} por mês." | "Ver previsão" → `/previsao` |
| `seguro_baixo` | "Pouco espaço até o fim do mês" | "O seguro para gastar está em {R$}, abaixo de 10% da renda do mês." | "Ver o que pesa" → `/previsao` |
| `sazonal` | "{Termo} chega no começo do ano" | "No ano passado foi {R$} em {mês}." | "Criar conta a pagar" → `/bills?nova=1&nome={termo}` |
| `a_conferir` | "{n} lançamentos para conferir" | "Eles foram salvos e só precisam de uma olhada." | "Conferir agora" → `/transactions?conferir=1` |

Confirme com `graphify` os parâmetros de URL que já existem para busca, conferir e nova conta. Use os reais e registre a diferença.

- [ ] **Passo 1: testes Deno que falham.** Um caso por regra, mais:
  - os casos do Foco 2 e do Foco 3;
  - `normalizarDescricao("Netflix.com 12/10") === "netflix"`;
  - um teste que varre `textoDoInsight` de todos os `kind`, com um payload de exemplo, contra `PALAVRAS_PROIBIDAS` e `!`;
  - o "↑ 12,5%" e o "↓ 3,0%".
- [ ] **Passo 2:** `npm run test:edge`. Esperado: FAIL.
- [ ] **Passo 3:** implementar, e o `src/lib/insights/insights.ts` reexporta.
- [ ] **Passo 4:** `npm run test:edge && npx tsc --noEmit && npm run lint && npm run test:unit`. Esperado: PASS.
- [ ] **Passo 5:** commit `feat(insights): detectores e modelos de frase`.

### Tarefa 3: O cron `insights-daily`

**Arquivos:**
- Criar: `supabase/functions/insights-daily/index.ts`
- Modificar:
  - `supabase/config.toml`;
  - `supabase/functions/_shared/deliver-notification.ts` (o `semPush?: boolean`, se for preciso);
  - `src/lib/insights/edge-insights.test.ts` (teste de fonte).

**Interfaces:**
- Consome a Tarefa 1 (as tabelas e `reivindicar_push_de_insight`) e a Tarefa 2 (detectores e textos).
- **O fluxo:**
  1. Confere o `x-cron-secret`.
  2. Para cada carteira com movimento nos últimos 120 dias (paginada), lê os lançamentos dos últimos 4 meses, paginados por `.order('id').range()` em 1000. Lê também as assinaturas, os planos, os cartões, as instâncias de conta ligadas (`transaction_id`), as `needs_review` e as categorias.
  3. Roda os detectores.
  4. Monta o resumo da fatura dos cartões fechados ontem ou anteontem, com a mesma janela e o total do banco do `credit-card-calendar-alerts`, reusando os helpers do `_shared/credit-card-cycle.ts`.
  5. No dia 1, monta o relatório do mês anterior:
     - `lancados_sozinho`: as transações com `source <> 'app'`;
     - `diferencas`: os `credit_card_statement_totals` do mês com `bank_total` diferente do calculado (`cardInvoiceNetInWindow`);
     - `avisos_em_dia`: as `bill_instances` pagas até o vencimento, mais as `credit_card_invoice_payments` pagas até o vencimento estimado.
  6. Insere cada achado em `insights`, com `on conflict do nothing` no índice único. A carteira inteira tem `user_id` nulo.
  7. Para cada insight inserido agora, entrega a notificação `type: 'insight'`, `metadata: { kind, insight_id, href }`, a cada membro da carteira que não silenciou o tipo.
     - O push só vai a quem `reivindicar_push_de_insight(user, segunda-feira da semana)` devolve `true`. Os outros recebem só in-app.
     - O e-mail não vai, porque insight não é essencial.
  8. Devolve `{ carteiras, novos, push, inApp }`.
- **Desempenho:** no máximo 20 carteiras em paralelo (`forEachLimit`). Cada carteira é envolvida em `try/catch`, para uma falha não parar as outras.

- [ ] **Passo 1: testes que falham.**
  - Teste de fonte:
    - o `x-cron-secret`;
    - a paginação `.range(`;
    - o `on conflict` do insert;
    - a reivindicação antes de pedir o push;
    - o `try/catch` por carteira;
    - nenhum e-mail para `insight`.
  - Teste Deno de um helper puro `segundaDaSemana(ymd)` (terça 2026-10-27 dá 2026-10-26; domingo 2026-11-01 também dá 2026-10-26).
- [ ] **Passo 2:** `npm run test:edge && npx vitest run src/lib/insights/edge-insights.test.ts`. Esperado: FAIL.
- [ ] **Passo 3:** implementar.
- [ ] **Passo 4:** `npm run test:edge && npx tsc --noEmit && npm run lint && npm run test:unit`. Esperado: PASS.
- [ ] **Passo 5:** commit `feat(insights): cron diário com teto de push`.

### Tarefa 4: A caixa de insights e as ações

**Arquivos:**
- Criar:
  - `src/lib/insights/use-insights.ts`;
  - `src/lib/insights/acoes.ts` e o teste dele;
  - `src/components/wireframe/insights-wireframe.tsx`.
- Modificar:
  - o cliente do Painel (`src/app/(app)/dashboard/page-client.tsx`), que monta a caixa;
  - a tela de preferências de aviso, que ganha a chave "Insights" pelo `notify_insights`, num wireframe pequeno dentro da tela existente;
  - `src/lib/notification-actions.ts`, para o `type 'insight'` abrir o `metadata.href`.

**Interfaces:**
- Consome:
  - a Tarefa 1 (`marcar_insight`, `virar_assinatura`, `virar_conta`, `insights_silenciados`);
  - a Tarefa 2 (`textoDoInsight`);
  - o Bloco 5 (`fluxoDoMes` e `seguroParaGastar`, por `usePrevisao`);
  - o Bloco 6A (`ligar_pagamento_da_conta`, não usado aqui) e a mutação de atualizar assinatura que já existe.
- **`useInsights(workspaceId)`:**
  - lê os insights `new` e `seen` da carteira, até 20, do mais novo ao mais velho;
  - marca `seen` os novos que ficaram visíveis;
  - expõe `entendi(id)` (`dismissed`), `silenciar(kind)` e `agir(id)`.
- **`acoes.ts`:**
  - `virarAssinatura(insight, ajustes)` e `virarConta(insight, ajustes)` chamam as RPCs;
  - `atualizarPrecoDaAssinatura(insight)` usa a mutação de assinatura que já existe;
  - `apagarUm(insight)` apaga o lançamento de id maior pela mutação de apagar lançamento que já existe, com `confirm()`.
  - Cada ação marca `acted` só com sucesso.
- **O seguro baixo, produzido no cliente:** quando o Painel abre no mês corrente, se `seguroParaGastar(dados).seguro < 0,10 × (receitas.recebidas + receitas.previstas)` e a renda é maior que 0, chama `registrar_insight(ws, 'seguro_baixo', 'seguro:{ym}', { seguro, renda })` uma vez por sessão e mês.
- **`InsightsWireframe({ itens, onAcao, onEntendi, onSilenciar })`**, etiqueta `WIREFRAME · Bloco 6 · Insights`:
  - cada item mostra o título, o corpo e um botão com o rótulo da ação, ou "Entendi" quando não há ação;
  - o "Não mostrar mais este tipo" fica num menu nativo `<details>`;
  - o relatório do mês acrescenta a linha "Seguro para gastar: cumprido" ou "Seguro para gastar: passou {R$}", calculada com `fluxoDoMes` do mês anterior;
  - a recorrência abre um `<dialog>` nativo com o nome, o valor, o dia, a categoria e o destino (assinatura ou conta, já sugerido e trocável).

- [ ] **Passo 1: testes que falham.**
  - `acoes.ts`: cada ação chama a RPC ou mutação certa e só marca `acted` com sucesso, e `INSIGHT_JA_USADO` vira "Isso já foi feito.".
  - A regra do seguro baixo dispara abaixo de 10% e não sem renda.
  - Teste de fonte da caixa no Painel.
- [ ] **Passo 2:** `npx vitest run src/lib/insights`. Esperado: FAIL.
- [ ] **Passo 3:** implementar.
- [ ] **Passo 4:** `npx tsc --noEmit && npm run lint && npm run test:unit && npm run ds:audit -- src/components/wireframe && npm run build`. Esperado: PASS.
- [ ] **Passo 5:** commit `feat(insights): caixa no Painel e as ações de um toque`.

### Tarefa 5: Roteiro, jornadas e Atlas

**Arquivos:**
- Criar: `supabase/BLOCO_6B_DEPLOYMENT.md`
- Modificar: `docs/JORNADAS.md`, `docs/atlas/template.html`, `docs/atlas/atlas-jornadas.html` (gerado)

**O roteiro:**
1. Aplicar a migração.
2. Fazer o redeploy das Edges que importam o `deliver-notification.ts` ou o `notification-types.ts`, pelo fecho dos imports.
3. **Subir o `insights-daily` só junto com o front 2.0.**
4. Decidir o cron:
   - se o `invoke_edge_function` de uma função ausente gera erro no log, o cron entra no lançamento;
   - se não gera, ele já fica na migração.
5. Confirmar que, até o lançamento, o front antigo não lê `insights`.

**As jornadas:**
- "Insights": cron → caixa no Painel e notificação → ação (virar assinatura ou conta, atualizar preço, apagar um, ver fatura, ver previsão, conferir);
- as regras técnicas do teto e do silenciar;
- as lacunas: o limite da pessoa e o convidado ficam para o Bloco 7, e o lançamento novo é visto no dia seguinte.

**O Atlas:** a mesma jornada e a capa. Depois, `python3 docs/atlas/build.py`.

- [ ] **Passo 1:** escrever o roteiro.
- [ ] **Passo 2:** atualizar `JORNADAS.md` e `template.html`, e rodar o `build.py`.
- [ ] **Passo 3:** `npx tsc --noEmit && npm run lint && npm run test:unit && npm run build`. Esperado: PASS.
- [ ] **Passo 4:** commit `docs(insights): roteiro do Bloco 6B, jornadas e Atlas`.
