# Bloco 4: plano de implementação de Planos e confiança (sem o gateway)

> **Para agentes:** a sub-skill superpowers:subagent-driven-development é obrigatória (ou, na falta dela, superpowers:executing-plans). Execute o plano uma tarefa por vez. Os passos usam checkbox (`- [ ]`).

**Objetivo:** tudo do §9 que mora dentro do produto.
- **O direito de uso:** o plano Família, o teste de 14 dias sem cartão, a cobertura da família e o "só leitura" sem plano.
- **As telas do plano** e o preço público.
- **O aviso do dia 12**, com o relatório do teste.
- **O Piloto Automático:** o que o app fez sozinho, com desfazer.
- **O Cofre aberto:** o que guardamos, exportar tudo e apagar a conta.
- **A jornada de 4 passos** depois do início do teste.

**A cobrança pelo Asaas fica para o Bloco 8**, o último, depois do 7 (decisão do dono, 23/10). Aqui não entra checkout, webhook, renovação, reembolso nem NFS-e. A tabela de assinaturas nasce pronta para recebê-los. O plano do Bloco 8 está em `docs/superpowers/plans/2026-10-23-bloco-8-cobranca-asaas.md`.

**Arquitetura:**
- **O banco decide o direito de uso.**
  - `plano_do_usuario` e `workspace_plan` respondem `familia` ou `leitura`.
  - Um gatilho barra a escrita da pessoa em `transactions`, `workspace_installment_plans` e `attachments` quando a carteira está em `leitura`.
- **O teste é calculado, não gravado.**
  - O prazo é `greatest(auth.users.created_at, billing_settings.enforced_since) + 14 dias`.
  - Com `enforced_since` nulo, que é o estado até o lançamento, todo mundo é `familia`. É isso que mantém o front de `main` intacto e faz o Bloco 4 entrar em produção sem cobrar ninguém.
- **O Piloto Automático lê `transactions.source`.** Os crons passam a gravar `recurring`.
- **O Cofre exporta no cliente:** CSV por tabela, com o `toCsv` que já existe, num ZIP sem compressão escrito à mão. Nenhuma dependência nova.
- **Telas:** entram como wireframes (`AGENTS.md`).

**Tecnologia:** Next 16 / React 19 e Supabase (Postgres, Edge em Deno, pg_cron). Vitest e Deno test. Nenhuma dependência nova.

**Spec:** `docs/superpowers/specs/2026-10-20-proposta-funcional-design.md` §9:
- "Direito de uso";
- "Regras de cobrança honesta", menos o que depende do gateway;
- "Jornada depois da compra";
- "Piloto Automático e Cofre aberto".

## Restrições globais

- **O banco de dev é o de produção.** Nenhuma tarefa roda `supabase db push`, deploy ou SQL contra o projeto. Quem publica é o orquestrador, e só com pedido explícito do dono.
- **O front de `main` continua em produção até o fim do 2.0.** Por isso:
  - as migrações só acrescentam;
  - com `billing_settings.enforced_since` nulo, nenhum comportamento de hoje muda;
  - as Edges existentes aceitam os mesmos pedidos de antes;
  - as funções dos crons mantêm a assinatura.
- **O repositório é público.** Nenhuma chave, URL de projeto, token ou dado real entra nele.
- **Valores fixos**, em `supabase/functions/_shared/plano.ts` e espelhados em `src/lib/planos/plano.ts`:

  | Constante | Valor |
  |---|---|
  | `PRECO_FAMILIA_CENTAVOS` | 35880 (12x de R$ 29,90) |
  | `PRECO_FUNDADOR_CENTAVOS` | 23880 (12x de R$ 19,90) |
  | `FIM_FUNDADORES` | `2027-02-01T03:00:00Z` (até 31/01/2027, no horário de Brasília) |
  | `TESTE_DIAS` | 14 |
  | `AVISO_TESTE_DIA` | 12 |
  | `COBERTOS_MAX` | 5 |
- **Testes:**
  - Vitest roda em ambiente `node`, só `src/**/*.test.ts`.
  - O Deno roda `supabase/functions/_shared/*.test.ts` (`npm run test:edge`).
  - Os testes de fonte usam `lerFonte` e `semComentarios` de `@/test/fonte`.
- **Edges novas:** entram em `supabase/config.toml` com `verify_jwt = false`. O cron se autentica por `secretMatches(CRON_SECRET, x-cron-secret)`.
- **Wireframe** (`AGENTS.md`):
  - fica só em `src/components/wireframe/`;
  - leva a etiqueta `WIREFRAME · Bloco 4 · <funcionalidade>`;
  - usa controles nativos, e todo `<button>` declara `type`;
  - não usa nada de `@/components/ui`;
  - funciona de verdade.
- **Mudança de jornada:** atualize `docs/JORNADAS.md` e `docs/atlas/template.html`, depois rode `python3 docs/atlas/build.py`. O orquestrador republica o Atlas.
- **Fechamento de cada tarefa:**
  - sempre: `npx tsc --noEmit && npm run lint && npm run test:unit`;
  - quando a tarefa mexe em Edge: `npm run test:edge`;
  - quando mexe em wireframe: `npm run ds:audit -- src/components/wireframe`;
  - quando mexe em tela: `npm run build`.

  Se o `tsc` acusar cópias `.next/**/* N.ts`, apague-as com `find .next -name "* [0-9]*.ts" -delete` e rode de novo.

## Decisões desta rodada (o orquestrador registra no ledger)

1. **O gateway sai deste bloco e vai para o Bloco 8** (decisão do dono, 23/10). Até lá:
   - ninguém consegue assinar;
   - `enforced_since` continua nulo, então ninguém é barrado;
   - o botão "Assinar" aparece desabilitado, com "A assinatura abre no lançamento".
2. **Uma linha por pessoa** em `billing_subscriptions` (`user_id unique`).
   - **Status:** `pending` | `active` | `past_due` | `expired`.
   - O teste (`trialing`) é calculado e não gravado.
   - Cancelar é `active` com `cancel_at_period_end`.
   - **Provedores:** `asaas` | `manual` | `apple` | `google`. O vitalício do dono e da família é `manual`, `active`, com `current_period_end` nulo, por `insert` do roteiro.
   - As colunas próprias do Asaas (cliente, token, checkout, NFS-e) entram no Bloco 8.
3. **Cobertura:**
   - ficam cobertas as até 5 pessoas distintas (fora o assinante) que entraram primeiro, por `min(joined_at)`, nas carteiras em que o assinante é `owner`;
   - não é transitiva;
   - nenhum convite é bloqueado. A 6ª pessoa só perde a cobertura da carteira pessoal dela, porque a carteira do assinante segue o dono.
4. **"Só leitura" barra a escrita da pessoa (`auth.uid()` não nulo), não a dos crons.**
   - Parcelas e assinaturas já contratadas continuam sendo lançadas.
   - O `delete-user` (service role) e a exportação (só leitura) continuam liberados.
   - Desfazer no Piloto Automático também é escrita, e fica barrado em "só leitura", com a mensagem do mapa de erros.
5. **O `source = 'recurring'` é gravado por um gatilho**, em vez de reescrever as funções dos crons.
   - O gatilho é `before insert` em `transactions`: com `auth.uid()` nulo, `source = 'app'` e `subscription_id` ou `installment_plan_id` preenchido, ele grava `recurring`.
   - A captura, que também roda sem `auth.uid()`, já grava a própria origem por `criar_plano_parcelado` e continua certa.
6. **Avisos de plano são essenciais:**
   - `deliverNotification` ganha `essencial: true`, que ignora o interruptor do tipo, o `notify_in_app` e o `notify_email`;
   - o push segue a preferência;
   - o tipo é `system`;
   - a carteira de entrega é a pessoal (`workspaces.type = 'personal' and created_by = user_id`).
7. **O preço na porta vai para a rota pública nova `/precos`**, como `/privacidade`. O `/plans` continua dentro do app, como a gestão do plano. A intenção da spec (o preço visível a quem não entrou) fica atendida sem mexer no `AuthGuard`.
8. **A jornada de 4 passos mora em `/comecar`**, dentro do app.
   - O Painel mostra um cartão "Veja o que o app faz por você" enquanto `user_settings.jornada_concluida_em` é nulo.
   - Não há redirecionamento automático. Assim nenhuma ponte de jornada existente muda.
   - O WhatsApp está adiado. O passo 4 convida pelo link e pelo e-mail que já existem.
9. **O ZIP do Cofre é "store"**, sem compressão: CRC-32 e cabeçalhos escritos à mão em `src/lib/cofre/zip.ts`. CSV comprime bem, mas a exportação é rara e pequena.

## Foco de revisão

1. **"Só leitura" ligado por engano no front de `main`.** Com `enforced_since` nulo, `plano_do_usuario` devolve `familia` para qualquer pessoa, e o gatilho não lança erro. (Tarefa 1, teste de fonte que confere o atalho no topo das duas funções.)
2. **O cron barrado pelo "só leitura".** Com `auth.uid()` nulo o gatilho deixa passar, e o lançamento de parcela e de assinatura continua mesmo sem plano. (Tarefa 1, teste de fonte.)
3. **Fila offline em "só leitura".** Um lançamento feito offline e barrado na volta fica `failed` na fila, com a mensagem "Sua conta está em só leitura…", e nunca some calado. (Tarefa 3.)
4. **A exportação incompleta.** Uma carteira com mais de 1.000 lançamentos exporta todos, porque a leitura é paginada por `range`. Um CSV com `;`, aspas ou quebra de linha numa descrição continua abrindo certo. Uma carteira sem nada exporta os arquivos só com o cabeçalho. (Tarefa 5.)
5. **O desfazer que apaga o que não devia.** Desfazer uma importação apaga só o lote dela. Desfazer um lançamento automático apaga só aquele lançamento, e só depois do `confirm()`. Num lançamento de parcela, o texto avisa que o cron não o recria. (Tarefa 4.)

---

### Tarefa 1: Migração do direito de uso, do "só leitura", da origem dos crons e do cron do teste

**Arquivos:**
- Criar: `supabase/migrations/20261025120000_planos.sql`
- Modificar: `src/types/database.ts`, `src/types/database-drift.ts`
- Teste: `src/lib/planos/migracao-planos.test.ts` (teste de fonte)

**Interfaces (produz):**
- `public.billing_settings(id boolean primary key default true check (id), enforced_since timestamptz)`.
  - A migração insere a linha única com `enforced_since` nulo.
  - RLS ligada, sem política, `revoke all` de `anon, authenticated`.
- `public.billing_subscriptions`, com estas colunas:

  | Coluna | Definição |
  |---|---|
  | `id` | `uuid pk default gen_random_uuid()` |
  | `user_id` | `uuid not null unique references auth.users on delete cascade` |
  | `provider` | `text not null check in ('asaas','manual','apple','google')` |
  | `provider_ref` | `text` |
  | `plan` | `text not null default 'familia' check (plan = 'familia')` |
  | `interval` | `text not null default 'year' check (interval = 'year')` |
  | `status` | `text not null check in ('pending','active','past_due','expired')` |
  | `current_period_end` | `timestamptz` |
  | `cancel_at_period_end` | `boolean not null default false` |
  | `price_cents` | `integer` |
  | `founder` | `boolean not null default false` |
  | `grace_until` | `timestamptz` |
  | `created_at`, `updated_at` | `timestamptz not null default now()` |

  RLS ligada, sem política, `revoke all` de `anon, authenticated`. Só a `service_role` lê e grava.
- `public.billing_avisos(user_id uuid references auth.users on delete cascade, tipo text, referencia text, enviado_em timestamptz not null default now(), primary key (user_id, tipo, referencia))`. Mesmo acesso.
- `user_settings.jornada_concluida_em timestamptz` (`add column if not exists`). A política existente de `update` da própria linha já cobre a escrita.
- `public.tem_plano_proprio(p_user_id uuid) returns boolean`: `stable`, `security definer`, `set search_path = ''`. Verdadeiro se houver linha:
  - `active` com `current_period_end` nulo ou futuro, ou
  - `past_due` com `grace_until > now()`.
- `public.plano_do_usuario(p_user_id uuid) returns text`: `stable`, `security definer`, `set search_path = ''`. A ordem é esta:
  1. Com `enforced_since` nulo, devolve `'familia'` (a primeira instrução).
  2. Se `tem_plano_proprio`, devolve `'familia'`.
  3. Se `greatest(u.created_at, enforced_since) + interval '14 days' > now()`, devolve `'familia'`.
  4. Se a pessoa está entre as 5 primeiras pessoas distintas, por `min(joined_at)`, das carteiras em que algum `s` com `tem_plano_proprio(s)` tem `role = 'owner'`, excluído o próprio `s`, devolve `'familia'`.
  5. Senão, devolve `'leitura'`.
- `public.workspace_plan(p_workspace_id uuid) returns text` (substitui o stub do 3A, mesma assinatura e mesmos grants): `'familia'` se algum `owner` da carteira tiver `plano_do_usuario = 'familia'`, senão `'leitura'`. Também começa pelo atalho do `enforced_since` nulo.
- `public.garantir_escrita() returns trigger`: `security definer`, `set search_path = ''`.
  - Se `auth.uid()` é nulo, deixa passar.
  - Senão, se `workspace_plan(coalesce(new.workspace_id, old.workspace_id)) = 'leitura'`, faz `raise exception 'workspace_somente_leitura' using errcode = 'P0001'`.
  - Gatilhos `before insert or update or delete` em `transactions` e `before insert` em `workspace_installment_plans` e `attachments`.
  - No `delete`, o retorno é `old`.
- `public.origem_do_cron() returns trigger`. É `before insert` em `transactions`. Com `auth.uid() is null`, `new.source = 'app'` e (`new.subscription_id` ou `new.installment_plan_id`) não nulo, grava `new.source := 'recurring'`.
- `public.meu_plano() returns jsonb`: `security definer`, `set search_path = ''`, grant só para `authenticated`. Lê `auth.uid()` e devolve:

  ```
  {
    plano,             -- 'familia' | 'leitura'
    origem,            -- 'livre' (enforced_since nulo) | 'assinatura' | 'vitalicio' | 'teste' | 'convite' | 'nenhuma'
    status,
    teste_ate,
    periodo_ate,
    cancelar_no_fim,
    preco_centavos,
    fundador
  }
  ```
- `public.avisos_de_teste_pendentes() returns table(user_id uuid, email text, workspace_id uuid, fim_do_teste timestamptz, relatorio jsonb)`. Só `service_role`.
  - Devolve as pessoas com `greatest(created_at, enforced_since) + 12 dias <= now() < … + 14 dias`, sem `tem_plano_proprio` e sem cobertura.
  - Vazio com `enforced_since` nulo.
  - `relatorio` é `{lancados_sozinho, a_conferir, avisos}`, contado desde o início do teste nas carteiras em que a pessoa é `owner`:
    - `transactions.source <> 'app'`;
    - `needs_review`;
    - as `notifications` da pessoa.
  - `workspace_id` é a carteira pessoal.
- `public.billing_lancar() returns void`: só `service_role`. Faz `update billing_settings set enforced_since = now() where enforced_since is null`.
- O cron `billing-daily` roda em `'0 12 * * *'` com `select public.invoke_edge_function('billing-daily')`. Use o bloco `do $cron$ … $cron$` do `20261023120000_captura.sql:158`.
- Tipos à mão em `src/types/database.ts`:
  - `billing_subscriptions`;
  - `user_settings.jornada_concluida_em`;
  - `meu_plano: { Args: Record<string, never>; Returns: Json }`;
  - mais o que o `database-drift.ts` exigir.

- [ ] **Passo 1: teste de fonte que falha.** Ele confere:
  - as três tabelas com RLS e `revoke all … from anon, authenticated`;
  - em `plano_do_usuario` e `workspace_plan`, o `enforced_since is null` antes de qualquer outra leitura;
  - `garantir_escrita` com `auth.uid() is null` antes de `workspace_plan`, `'workspace_somente_leitura'` e os três `create trigger`;
  - `origem_do_cron` com `'recurring'` e `auth.uid() is null`;
  - `billing_lancar` e `avisos_de_teste_pendentes` com grant só para `service_role`;
  - todas as funções com `set search_path = ''`;
  - o cron `billing-daily`;
  - nenhum `drop column` nem `alter column … type`.
- [ ] **Passo 2:** `npx vitest run src/lib/planos/migracao-planos.test.ts`. Esperado: FAIL.
- [ ] **Passo 3:** escrever a migração e os tipos.
- [ ] **Passo 4:** `npx tsc --noEmit && npm run test:unit`. Esperado: PASS.
- [ ] **Passo 5:** commit `feat(planos): direito de uso, teste e só leitura no banco`.

### Tarefa 2: O aviso do dia 12 e o relatório do teste (cron `billing-daily`)

**Arquivos:**
- Criar:
  - `supabase/functions/_shared/plano.ts` e `supabase/functions/_shared/plano.test.ts`;
  - `supabase/functions/billing-daily/index.ts`;
  - `src/lib/planos/edges-planos.test.ts` (teste de fonte).
- Modificar:
  - `supabase/config.toml`;
  - `supabase/functions/_shared/deliver-notification.ts`;
  - `supabase/functions/_shared/notification-types.ts` e `notification-types.test.ts`.

**Interfaces:**
- Consome da Tarefa 1: `avisos_de_teste_pendentes`, `billing_avisos` e `billing_settings`.
- Produz em `_shared/plano.ts`:
  - as constantes;
  - `export function avisoDoTeste(r: { lancados_sozinho: number; a_conferir: number; avisos: number }): { titulo: string; corpo: string }`:
    - o título é `"Seu teste termina em 2 dias"`;
    - o corpo é "Nestes dias o app lançou N gastos sozinho, separou M para conferir e mandou K avisos. Assine em Planos para continuar lançando.";
    - cada parte com zero some da frase, e a concordância continua certa (1 gasto, 1 aviso);
    - com os três zerados, o corpo é só "Assine em Planos para continuar lançando.".
- Produz em `notification-types.ts`: `export function canaisDoAviso(prefs: WorkspaceNotificationPrefs, essencial: boolean): { in_app: boolean; email: boolean; push: boolean }`.
  - Com `essencial`, `in_app` e `email` são `true` e `push` segue `prefs.notify_push`.
  - Sem ele, os três seguem as preferências.
- `deliverNotification` aceita `essencial?: boolean`. Com ele verdadeiro, pula o interruptor do tipo e usa `canaisDoAviso`.

O fluxo do `billing-daily`:
1. Confere `x-cron-secret`.
2. Lê `billing_settings`. Com `enforced_since` nulo, devolve `200 { ok: true, pulado: 'desligado' }`.
3. Para cada linha de `avisos_de_teste_pendentes()`:
   - reivindica `billing_avisos(user_id, 'teste', fim_do_teste::date)`;
   - entrega `avisoDoTeste(relatorio)` com `type: 'system'`, `essencial: true` e `metadata: { href: '/plans' }`;
   - numa falha de entrega, libera o dedupe, como o `releaseDedupe` do `review-reminder`.
4. Usa `forEachLimit(FAN_OUT_CONCURRENCY)`.
5. Devolve `{ avisos }`.

O Bloco 8 acrescenta a renovação a esta mesma Edge.

- [ ] **Passo 1: testes que falham.**
  - Deno, para `avisoDoTeste`: os casos de zero, um e muitos.
  - Deno, para `canaisDoAviso`: essencial com `notify_email: false` ainda manda e-mail.
  - Teste de fonte do `billing-daily`, que confere:
    - o `x-cron-secret`;
    - o `enforced_since` lido antes de `avisos_de_teste_pendentes`;
    - o `essencial: true`;
    - o dedupe `'teste'` com a liberação na falha.
- [ ] **Passo 2:** `npm run test:edge && npx vitest run src/lib/planos/edges-planos.test.ts`. Esperado: FAIL.
- [ ] **Passo 3:** implementar.
- [ ] **Passo 4:** `npm run test:edge && npx tsc --noEmit && npm run lint && npm run test:unit`. Esperado: PASS.
- [ ] **Passo 5:** commit `feat(planos): aviso do dia 12 com o relatório do teste`.

### Tarefa 3: Telas do plano: `/plans`, `/precos`, a faixa de "só leitura" e a mensagem de erro

**Arquivos:**
- Criar:
  - `src/lib/planos/plano.ts` e `src/lib/planos/plano.test.ts`;
  - `src/components/wireframe/planos-wireframe.tsx`;
  - `src/components/wireframe/precos-wireframe.tsx`;
  - `src/components/wireframe/somente-leitura-wireframe.tsx`;
  - `src/app/precos/page.tsx`.
- Modificar:
  - `src/app/(app)/plans/page.tsx`, que renderiza o `PlanosWireframe`; apague o `src/app/(app)/plans/page-client.tsx`, que mostrava "Gratuito";
  - `src/components/layout/sidebar-app-shell.tsx`, para montar a `SomenteLeituraWireframe` como primeiro filho do `div[data-workspace-content]`;
  - `src/lib/supabase-errors.ts` (`RAISE_MESSAGE_PT`);
  - o teste do motor offline que já cobre `failed` (procure com `graphify query "sync-engine failed mutation test"`).

**Interfaces:**
- Consome da Tarefa 1: `meu_plano`.
- Produz em `src/lib/planos/plano.ts`:
  ```ts
  export type MeuPlano = { plano: 'familia' | 'leitura'; origem: 'livre' | 'assinatura' | 'vitalicio' | 'teste' | 'convite' | 'nenhuma'
    status: 'pending' | 'active' | 'past_due' | 'expired' | null; teste_ate: string | null; periodo_ate: string | null
    cancelar_no_fim: boolean; preco_centavos: number | null; fundador: boolean }
  export function buscarMeuPlano(): Promise<MeuPlano>   // supabase.rpc('meu_plano')
  export function usePlano(): { plano: MeuPlano | null; carregando: boolean }  // busca ao montar e no foco da janela
  export function resumoDoPlano(p: MeuPlano, agora: Date): { titulo: string; linhas: string[]; podeAssinar: boolean }
  export const PRECO_FAMILIA_CENTAVOS = 35880, PRECO_FUNDADOR_CENTAVOS = 23880, FIM_FUNDADORES = '2027-02-01T03:00:00Z'
  ```
- `resumoDoPlano`, com as datas por `formatDatePtBr` e o valor por `currencyBRL(centavos / 1200)`:

  | Origem | Título | Linhas | `podeAssinar` |
  |---|---|---|---|
  | `livre` | "Plano Família" | "Tudo liberado até o lançamento da assinatura." | `false` |
  | `teste` | "Teste grátis até DD/MM" | — | `true` |
  | `assinatura` | "Plano Família" | "Renova em DD/MM: 12x de R$ X", ou "Termina em DD/MM" quando `cancelar_no_fim` | `false` |
  | `vitalicio` | "Plano Família vitalício" | — | `false` |
  | `convite` | "Coberto pelo plano da família" | — | `false` |
  | `nenhuma` | "Conta em só leitura" | "Tudo continua visível; exportar e apagar seguem liberados." | `true` |

- **`PlanosWireframe`** (`WIREFRAME · Bloco 4 · Planos`):
  - mostra o resumo e o preço do dia (o de fundador antes de `FIM_FUNDADORES`);
  - com `podeAssinar`, mostra o botão `type="button"` **desabilitado** "Assinar", com o texto "A assinatura abre no lançamento." (o Bloco 8 o liga);
  - tem um link para `/precos`.
- **`PrecosWireframe`** (`WIREFRAME · Bloco 4 · Preços`), público e estático:
  - "Plano Família, até 6 pessoas";
  - "12x de R$ 29,90 no cartão (R$ 358,80/ano)";
  - enquanto `Date.now() < FIM_FUNDADORES`, a oferta "Fundadores: 12x de R$ 19,90, congelado enquanto ativo, até 31/01/2027";
  - "14 dias grátis, sem cartão";
  - as garantias: 7 dias de arrependimento, aviso 7 dias antes de renovar, cancelar em 1 toque e "sem plano, nada se apaga: exportar e apagar seguem liberados";
  - os links "Começar o teste grátis" para `/register` e "Já tenho conta" para `/login`.
- **`SomenteLeituraWireframe`** (`WIREFRAME · Bloco 4 · Só leitura`): só renderiza com `plano === 'leitura'`. Diz "Sua conta está em só leitura. Tudo continua visível; exportar e apagar seguem liberados." e tem um link "Ver planos" para `/plans`.
- **`RAISE_MESSAGE_PT`** ganha `workspace_somente_leitura: "Sua conta está em só leitura. Assine em Planos para voltar a lançar."`.

- [ ] **Passo 1: testes Vitest que falham.**
  - `plano.test.ts`: uma linha da tabela por origem, mais o valor de fundador "12x de R$ 19,90".
  - `supabase-errors`: `formatSupabasePostgrestError({ message: 'workspace_somente_leitura' })` devolve a frase.
  - Motor offline: uma mutação que volta `{ code: 'P0001', message: 'workspace_somente_leitura' }` fica `failed` e continua na fila.
- [ ] **Passo 2:** `npx vitest run src/lib/planos src/lib/supabase-errors.test.ts`. Esperado: FAIL.
- [ ] **Passo 3:** implementar o cliente, os três wireframes, a rota `/precos` e as mudanças de `plans` e do shell.
- [ ] **Passo 4:** `npx tsc --noEmit && npm run lint && npm run test:unit && npm run ds:audit -- src/components/wireframe && npm run build`. Esperado: PASS.
- [ ] **Passo 5:** commit `feat(planos): tela do plano, preços públicos e aviso de só leitura`.

### Tarefa 4: Piloto Automático

**Arquivos:**
- Criar:
  - `src/lib/piloto/piloto.ts` e `src/lib/piloto/piloto.test.ts`;
  - `src/components/wireframe/piloto-automatico-wireframe.tsx`;
  - `src/app/(app)/piloto/page.tsx`.
- Modificar: `src/config/navigation.ts` (a rota `PILOTO: "/piloto"`). O menu não muda; a entrada vem pelo Cofre e pela jornada.

**Interfaces:**
- Consome:
  - `transactions.source`, `import_batch_id`, `created_at` e `needs_review` (Bloco 2);
  - `desfazerImportacao(supabase, workspaceId, batchId)` de `src/lib/import/importar.ts`;
  - o `recurring` da Tarefa 1.
- Produz em `src/lib/piloto/piloto.ts`:
  ```ts
  export type GrupoPiloto =
    | { tipo: 'captura'; itens: ItemPiloto[] }            // quick_text, shortcut, apple_pay, whatsapp, share
    | { tipo: 'importacao'; loteId: string; origem: string; criadoEm: string; total: number; valor: number }
    | { tipo: 'recorrente'; itens: ItemPiloto[] }         // recurring
  export type ItemPiloto = { id: string; descricao: string; valor: number; data: string; criadoEm: string
    origem: string; aConferir: boolean; categoria: string | null }
  export function agruparPiloto(linhas: LinhaPiloto[]): GrupoPiloto[]   // pura
  export function buscarPiloto(workspaceId: string, desde: string): Promise<LinhaPiloto[]>
  export function desfazerLancamento(workspaceId: string, id: string): Promise<{ ok: boolean; erro?: string }>
  export const ROTULO_DA_ORIGEM: Record<string, string>
  ```
- `ROTULO_DA_ORIGEM`:

  | Origem | Rótulo |
  |---|---|
  | `quick_text` | Frase rápida |
  | `shortcut` | Atalho do iPhone |
  | `apple_pay` | Apple Pay |
  | `whatsapp` | WhatsApp |
  | `share` | Compartilhado |
  | `import_pdf` | Fatura em PDF |
  | `import_sheet` | Planilha |
  | `import_statement` | Extrato |
  | `recurring` | Assinatura ou parcela |
- `buscarPiloto` lê `transactions` com `source <> 'app'` e `created_at >= desde` (30 dias atrás), paginada por `range` de 1000 em 1000. Os campos são `id, description, amount, date, created_at, source, import_batch_id, needs_review` e a categoria.
- `agruparPiloto`:
  - a importação vira um grupo por `import_batch_id`, com total e soma;
  - captura e recorrente viram listas, cada uma por `criadoEm` decrescente;
  - os grupos saem na ordem captura, importação e recorrente;
  - um grupo vazio não aparece.
- **O wireframe** (`WIREFRAME · Bloco 4 · Piloto Automático`) mostra, por item, a origem, a hora (`formatRelativeDayPtBr` e a hora), "a conferir" quando marcado, e "Desfazer" com `confirm()`:
  - **no lote:** "Apagar os N lançamentos desta importação?" e `desfazerImportacao`;
  - **no item:** "Apagar este lançamento?". No `recurring`, acrescenta "O app não o lança de novo." e chama `desfazerLancamento`.

  Depois de desfazer, o wireframe recarrega a lista. O erro aparece com `formatSupabasePostgrestError`.

- [ ] **Passo 1: teste Vitest de `agruparPiloto`, que falha.** Ele cobre:
  - dois lotes separados;
  - captura e recorrente misturados e ordenados;
  - o grupo vazio omitido;
  - a origem desconhecida caindo em captura com o rótulo cru.
- [ ] **Passo 2:** `npx vitest run src/lib/piloto`. Esperado: FAIL.
- [ ] **Passo 3:** implementar.
- [ ] **Passo 4:** `npx tsc --noEmit && npm run lint && npm run test:unit && npm run ds:audit -- src/components/wireframe && npm run build`. Esperado: PASS.
- [ ] **Passo 5:** commit `feat(confianca): Piloto Automático com desfazer`.

### Tarefa 5: Cofre aberto: o que guardamos, exportar tudo em ZIP e apagar a conta

**Arquivos:**
- Criar:
  - `src/lib/cofre/zip.ts` e `src/lib/cofre/zip.test.ts`;
  - `src/lib/cofre/exportar.ts` e `src/lib/cofre/exportar.test.ts`;
  - `src/components/wireframe/cofre-aberto-wireframe.tsx`;
  - `src/app/(app)/cofre/page.tsx`.
- Modificar: `src/config/navigation.ts` (a rota `COFRE: "/cofre"`) e a página `/me`, que ganha a linha "Cofre aberto" no grupo "Conta" seguindo o padrão das linhas existentes.

**Interfaces:**
- Consome: `toCsv` e `CsvColumn` de `src/lib/data-table/csv.ts`, e o fluxo de apagar a conta que já existe (procure com `graphify query "delete-user account deletion client"` e reuse a chamada atual, sem duplicá-la).
- Produz:
  ```ts
  // zip.ts
  export function crc32(bytes: Uint8Array): number
  export function zipSemCompressao(arquivos: Array<{ nome: string; conteudo: string }>): Uint8Array  // UTF-8, flag 0x0800
  // exportar.ts
  export const TABELAS_EXPORTADAS: readonly string[]
  export function lerTudo<T>(consulta: (de: number, ate: number) => Promise<{ data: T[] | null; error: unknown }>): Promise<T[]>
  export function exportarTudo(workspaceIds: string[]): Promise<Blob>   // application/zip
  ```
- `TABELAS_EXPORTADAS` é `transactions`, `categories`, `credit_cards`, `credit_card_statement_totals`, `workspace_subscriptions`, `workspace_installment_plans`, `bills`, `bill_instances`, `budgets` e `attachments` (só os metadados, sem o arquivo).
- **`lerTudo`** pede páginas de 1000 até vir uma menor que 1000. Num erro, lança.
- **`exportarTudo`:**
  - para cada tabela, lê com `.in('workspace_id', workspaceIds)` (o `bill_instances` entra pelo `bill_id` dos `bills` lidos);
  - gera um CSV com uma coluna por chave da primeira linha, ou só o cabeçalho das colunas conhecidas quando a tabela vem vazia;
  - nomeia cada arquivo `<tabela>.csv`;
  - acrescenta um `LEIA-ME.txt` com a data, as carteiras e a frase "Seus dados são seus. Este arquivo foi gerado no seu aparelho.".
- **O wireframe** (`WIREFRAME · Bloco 4 · Cofre aberto`), com estas seções:
  1. **"O que guardamos e onde"**, uma tabela fixa: dado, onde fica (Supabase; a região é dita como "a confirmar" até o roteiro conferir `sa-east-1`), quem vê (os papéis) e por que pedimos.
  2. **"Não pedimos senha de banco"** e "Não conectamos o seu banco".
  3. **"Exportar tudo":** um botão que gera o ZIP de todas as carteiras de que a pessoa é membro e baixa `finance-app-AAAA-MM-DD.zip` por `URL.createObjectURL`. Funciona em "só leitura".
  4. **"Apagar a conta":** o mesmo fluxo de hoje, com o mesmo texto de confirmação.
  5. **Um link para o Piloto Automático.**

- [ ] **Passo 1: testes Vitest que falham.**
  - `zip.test.ts`:
    - `crc32(new TextEncoder().encode('hello')) === 0x3610a686`;
    - o ZIP de dois arquivos começa com `PK\x03\x04`, tem o diretório central (`PK\x01\x02`) e termina no `PK\x05\x06` com contagem 2;
    - os tamanhos batem com os bytes UTF-8 de "Alimentação".
  - `exportar.test.ts`: `lerTudo` junta 2500 linhas em 3 páginas e propaga o erro.
- [ ] **Passo 2:** `npx vitest run src/lib/cofre`. Esperado: FAIL.
- [ ] **Passo 3:** implementar.
- [ ] **Passo 4:** `npx tsc --noEmit && npm run lint && npm run test:unit && npm run ds:audit -- src/components/wireframe && npm run build`. Esperado: PASS.
- [ ] **Passo 5:** commit `feat(confianca): Cofre aberto com exportar tudo`.

### Tarefa 6: A jornada de 4 passos (`/comecar`)

**Arquivos:**
- Criar:
  - `src/lib/jornada/jornada.ts` e `src/lib/jornada/jornada.test.ts`;
  - `src/components/wireframe/jornada-wireframe.tsx`;
  - `src/components/wireframe/jornada-cartao-wireframe.tsx`;
  - `src/app/(app)/comecar/page.tsx`.
- Modificar: o Painel (`src/app/(app)/dashboard/…`, o cliente da página), que monta o `JornadaCartaoWireframe` no topo; e `src/config/navigation.ts` (a rota `COMECAR: "/comecar"`).

**Interfaces:**
- Consome:
  - `user_settings.jornada_concluida_em` (Tarefa 1);
  - as preferências de aviso da carteira atual (`workspace_member_notification_prefs`);
  - os cartões da carteira, com `nextCloseAfter` e `estimatedDueDateForClose` de `src/lib/credit-card-billing.ts`;
  - a próxima `bill_instances` em aberto.
- Produz em `src/lib/jornada/jornada.ts`:
  ```ts
  export type Plataforma = 'iphone' | 'android' | 'computador'
  export function plataformaDe(userAgent: string): Plataforma
  export function canaisPara(p: Plataforma): Array<{ titulo: string; texto: string; href: string }>
  export function proximosAvisos(entrada: { prefs: Record<string, boolean>
    cartoes: Array<{ nome: string; closingDay: number; dueDay: number }>; proximaConta: { nome: string; data: string } | null
    hoje: Date }): Array<{ aviso: string; ligado: boolean; proximo: string | null }>
  export function concluirJornada(): Promise<void>   // update user_settings set jornada_concluida_em = now()
  ```
- `canaisPara`, sempre com o primeiro lançamento pela frase rápida (`/transactions?novo=1`) e o pedido "Envie o PDF da última fatura" (`/credit-cards`):
  - **iphone:** o Atalho do iPhone (`/account`, onde moram os tokens);
  - **android:** "Instale o app e compartilhe o comprovante com ele";
  - **computador:** "Importar extrato".

  Confirme os destinos existentes com `graphify query` e use as rotas que já abrem essas telas.
- `proximosAvisos` devolve uma linha por aviso:
  - "Fatura fechando", com a próxima data de fechamento entre os cartões;
  - "Fatura vencendo", com o próximo vencimento;
  - "Conta vencendo", com `proximaConta`;
  - "Orçamento estourando", sem data;
  - "A conferir", às 20h.

  `ligado` vem da preferência correspondente, e uma data sem cartão sai `null`.
- **O wireframe** (`WIREFRAME · Bloco 4 · Jornada`) tem quatro passos, com "Anterior", "Próximo" e "Pular":
  1. **"O que eu lanço por você":** os `canaisPara` da plataforma, com links.
  2. **"Como eu decido":** a categoria vem do histórico da descrição, e na dúvida o item vai para "a conferir" (link para a lista "A conferir").
  3. **"O que eu aviso":** a tabela de `proximosAvisos` e o link para as preferências.
  4. **"Quem vê o quê":** os papéis de hoje (dono e membro, as linhas da tabela do §12 que já valem) e o link "Convidar" para `/members`.

  "Concluir" e "Pular" chamam `concluirJornada` e levam ao Painel.
- **`JornadaCartaoWireframe`:** só renderiza com `jornada_concluida_em` nulo. Mostra "Veja o que o app faz por você" com o link para `/comecar` e um "Agora não" que conclui.

- [ ] **Passo 1: testes Vitest que falham.**
  - `plataformaDe` com UAs reais de iPhone, Android e macOS.
  - `canaisPara`: a frase rápida e o PDF sempre presentes.
  - `proximosAvisos`: dois cartões (pega o fechamento mais próximo), sem cartão (`null`) e a preferência desligada.
- [ ] **Passo 2:** `npx vitest run src/lib/jornada`. Esperado: FAIL.
- [ ] **Passo 3:** implementar.
- [ ] **Passo 4:** `npx tsc --noEmit && npm run lint && npm run test:unit && npm run ds:audit -- src/components/wireframe && npm run build`. Esperado: PASS.
- [ ] **Passo 5:** commit `feat(confianca): jornada de 4 passos do que o app faz sozinho`.

### Tarefa 7: Roteiro de publicação, privacidade, jornadas e Atlas

**Arquivos:**
- Criar: `supabase/BLOCO_4_DEPLOYMENT.md`
- Modificar: `src/components/wireframe/privacidade-wireframe.tsx`, `docs/JORNADAS.md`, `docs/atlas/template.html`, `docs/atlas/atlas-jornadas.html` (gerado)

O roteiro, na ordem:
- **§1:** aplicar a migração, conferir o cron `billing-daily` e confirmar que `enforced_since` continua nulo (`select enforced_since from billing_settings`).
- **§2:** o deploy do `billing-daily` e o redeploy de toda Edge que importa `_shared/deliver-notification.ts` ou `_shared/notification-types.ts`. A lista sai do fecho dos imports.
- **§3:** o vitalício do dono e da família, pelo `insert` com `provider 'manual'`, `status 'active'` e `current_period_end` nulo, com placeholders `<USER_ID>`.
- **§4:** conferir a região do projeto Supabase. Se for `sa-east-1`, trocar "a confirmar" por "no Brasil" no Cofre.
- **§5:** **não rodar `billing_lancar()`**. Ele é do Bloco 8, no lançamento.

As outras mudanças:
- **Privacidade:** o link para o Cofre aberto, e a frase de que o teste não pede cartão.
- **Jornadas:**
  - "Plano e só leitura": `/precos` → `/register` → teste → `/plans`, a faixa de "só leitura" e o aviso do dia 12;
  - "Confiança": Painel → `/comecar`; `/me` → `/cofre` → `/piloto`;
  - as regras técnicas de `workspace_plan`, `garantir_escrita` e `origem_do_cron`;
  - a lacuna "assinar só abre no Bloco 8".
- **Atlas:** as mesmas jornadas, os apêndices de rotas (`/precos`, `/cofre`, `/piloto`, `/comecar`) e de backend, e a capa. Depois, `python3 docs/atlas/build.py`.

- [ ] **Passo 1:** escrever o roteiro e a privacidade.
- [ ] **Passo 2:** atualizar `JORNADAS.md` e `template.html`, e rodar `python3 docs/atlas/build.py`. Esperado: o HTML gerado sem erro.
- [ ] **Passo 3:** `npx tsc --noEmit && npm run lint && npm run test:unit && npm run build`. Esperado: PASS.
- [ ] **Passo 4:** commit `docs(planos): roteiro do Bloco 4, privacidade, jornadas e Atlas`.
