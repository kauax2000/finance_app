# Bloco 8: plano de implementação da cobrança pelo Asaas

> **Para agentes:** a sub-skill superpowers:subagent-driven-development é obrigatória (ou, na falta dela, superpowers:executing-plans). Execute o plano uma tarefa por vez. Os passos usam checkbox (`- [ ]`).

**Quando:** é o último bloco, depois do 7 e antes de o 2.0 ir para `main` (decisão do dono, 23/10).

**Pressupõe o Bloco 4** (`docs/superpowers/plans/2026-10-23-bloco-4-planos-e-confianca.md`), que já entregou:
- `billing_settings`, `billing_subscriptions`, `billing_avisos`;
- `plano_do_usuario`, `workspace_plan`, `meu_plano` e o gatilho de "só leitura";
- o `billing-daily`, com o aviso do teste;
- `deliverNotification` com `essencial`;
- o `/plans`, com "Assinar" desabilitado;
- o `/precos` e a faixa de "só leitura".

**Atualizado em 25/10, com os Blocos 4 a 7C já em `finance-app-2.0`.** O rascunho de 22 e 23/10 foi conferido contra o código:
- a API do Asaas foi reconfirmada na documentação pública, sem mudança. Os quatro pontos que a documentação não garante estão no §1 do roteiro;
- os nomes dos Blocos 4 a 7 foram conferidos, e as diferenças viraram as Decisões 8 a 12;
- a migração nova é `20261101120000_cobranca_asaas.sql`, depois de `20261031130000_divisao.sql`.

**Objetivo:** assinar o plano Família anual em 12x no cartão pelo Asaas. O servidor cuida de:
- renovar no aniversário;
- tentar de novo e avisar quando o cartão falhar, com 7 dias de tolerância;
- cancelar em 1 toque;
- devolver no arrependimento de 7 dias;
- emitir a NFS-e;
- avisar 7 dias antes da renovação.

**Arquitetura:**
- **Primeira venda:** uma cobrança no cartão em 12x, criada sem dados do cartão. A pessoa digita o cartão na fatura hospedada pelo Asaas, e nenhum número de cartão passa pelos nossos servidores.
- **Ativação:** o webhook ativa a assinatura e guarda o `creditCardToken`.
- **Renovação:** o `billing-daily` cobra o token no aniversário.
- **Sem token, ou com o cartão recusado:** a pessoa confirma um cartão novo na fatura hospedada.

**Tecnologia:** Supabase (Postgres, Edge em Deno, pg_cron), Next 16 e Vitest/Deno test. Nenhuma dependência nova; o Asaas é chamado por `fetch`.

**Spec:** `docs/superpowers/specs/2026-10-20-proposta-funcional-design.md` §9, "Cobrança: Asaas" e "Regras de cobrança honesta".

**Fatos da API do Asaas:** levantados só da documentação pública em 2026-10-22 e reconfirmados em 2026-10-25, sem mudança. O orquestrador os copia para o ledger desta execução. Os pontos que a documentação não garante estão no §1 do roteiro (Tarefa 8) e são testados no Sandbox antes da produção.


## Restrições globais

- **O banco de dev é o de produção.**
  - Nenhuma tarefa roda `supabase db push`, deploy ou SQL contra o projeto, e nenhuma chama o Asaas.
  - Quem publica é o orquestrador, e só com pedido explícito do dono.
- **O front de `main` continua em produção até o fim do 2.0.** Por isso:
  - as migrações só acrescentam;
  - com `billing_settings.enforced_since` nulo, nenhum comportamento de hoje muda: `workspace_plan` devolve `familia` e o gatilho não barra nada;
  - as Edges existentes aceitam os mesmos pedidos de antes.
- **O repositório é público.** Nenhuma chave, URL de projeto, token, CPF ou dado real entra nele. Os testes simulam o `fetch`, e nenhum teste chama a rede.
- **Segredos novos das Edges** (o dono cadastra; nunca vão ao cliente):
  - `ASAAS_API_URL` (`https://api-sandbox.asaas.com/v3` ou `https://api.asaas.com/v3`);
  - `ASAAS_API_KEY`;
  - `ASAAS_WEBHOOK_TOKEN`, de 32 a 255 caracteres;
  - `ASAAS_NFSE_SERVICO_CODIGO` e `ASAAS_NFSE_SERVICO_NOME`.

  Já existem `APP_BASE_URL`, `CRON_SECRET` e os do Resend.
- **O CPF não é guardado por nós.** Ele vai direto ao cliente do Asaas (`cpfCnpj`) e não entra em tabela, log nem resposta.
- **Valores fixos** (spec §9). Os de preço e de teste já moram em `_shared/plano.ts` e em `src/lib/planos/plano.ts` (Bloco 4), e `billing.ts` os importa de lá. Os de cobrança são novos e ficam em `_shared/billing.ts`:

  | Constante | Valor |
  |---|---|
  | `PRECO_FAMILIA_CENTAVOS` | 35880 (12x de R$ 29,90) |
  | `PRECO_FUNDADOR_CENTAVOS` | 23880 (12x de R$ 19,90) |
  | `PARCELAS` | 12 |
  | `FIM_FUNDADORES` | `2027-02-01T03:00:00Z` (o preço vale até 31/01/2027, inclusive, no horário de Brasília) |
  | `TESTE_DIAS` | 14 |
  | `AVISO_TESTE_DIA` | 12 |
  | `TOLERANCIA_DIAS` | 7 |
  | `AVISO_RENOVACAO_DIAS` | 7 |
  | `ARREPENDIMENTO_DIAS` | 7 |
  | `COBERTOS_MAX` | 5 |
- **Testes:**
  - Vitest roda em ambiente `node`, só `src/**/*.test.ts`.
  - O Deno roda `supabase/functions/_shared/**/*.test.ts` (`npm run test:edge`). Hoje o `--allow-env` do script é exatamente `GROQ_API_KEY,CLOUDFLARE_ACCOUNT_ID,CLOUDFLARE_API_TOKEN`; a Tarefa 2 acrescenta `ASAAS_API_URL,ASAAS_API_KEY`.
  - Para simular o `fetch`, troque `globalThis.fetch` e devolva o original no `finally`.
- **O front 2.0 roda contra o banco sem esta migração** (o dev usa produção; Ruling 8 do 7B). Os campos novos de `meu_plano()` são lidos como opcionais (`?? null`), e as Edges novas que ainda não subiram aparecem como "Ainda não disponível", nunca como erro solto.
- **Dinheiro nos textos:** `currencyBRL` (`_shared/formatters.ts`) recebe **reais**, não centavos, e põe um espaço inquebrável depois de `R$`. A parcela é `currencyBRL(centavos / 1200)`, e os testes normalizam o espaço como `src/lib/planos/plano.test.ts` já faz.
- **`_shared/plano.ts` não importa nada** e é reexportado pelo cliente (`export *`). O `billing.ts` importa dele com a extensão `.ts`, e nada novo entra no `plano.ts` que traga import.
- **Edges novas:**
  - entram em `supabase/config.toml` com `verify_jwt = false`;
  - fazem a própria autenticação, como as existentes: JWT por `bearerJwt` + `getAuthUserFromJwt` (como `ia-ler/index.ts:70-72`), cron por `secretMatches(CRON_SECRET, x-cron-secret)` e webhook por `secretMatches(ASAAS_WEBHOOK_TOKEN, asaas-access-token)`;
  - as chamadas pelo cliente seguem o CORS de `ia-ler` (`ia-ler/index.ts:24-34, 53-64`), com `x-app-session-id` na lista de cabeçalhos (o `invokeEdgeJson` o envia), e embrulham o tratamento num `try/catch` que devolve `json(500, …)` com CORS;
  - `lerCorpo(req, teto)` devolve bytes (`Uint8Array | null`): a Edge faz o `JSON.parse(new TextDecoder().decode(…))`.
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

As regras do direito de uso (status, provedores, cobertura, "só leitura", avisos essenciais e `/precos`) são do Bloco 4 e não mudam aqui.

1. **Gateway: Asaas.** A taxa no 12x é 3,99% + R$ 0,49, a menor entre os que parcelam sem mensalidade. Ele tem Pix Automático na API para depois e NFS-e. A assinatura do Asaas não aceita parcelas (resposta da equipe no fórum da documentação). Por isso o anual em 12x é uma **cobrança parcelada**, e quem renova somos nós.
2. **A linha da pessoa** em `billing_subscriptions` é atualizada a cada compra e renovação. O histórico fica em `billing_events`.
3. **`billing-cancel` é uma Edge só, com `acao`:**
   - `cancelar`: liga `cancel_at_period_end`;
   - `desfazer`: desliga, enquanto o período não acabou;
   - `reembolsar`: o arrependimento de 7 dias. Vale só para a primeira compra de um período novo, nunca para a renovação, e estorna o parcelamento inteiro.
4. **O `remoteIp` da cobrança por token** é o IP gravado no último checkout (`ultimo_ip`, o primeiro valor de `x-forwarded-for`). A documentação não diz o que enviar numa cobrança fora de sessão: o roteiro manda perguntar ao suporte do Asaas.
5. **A NFS-e fica a cargo do `billing-daily`, não do webhook.**
   - É uma nota por período, com `installment` e o valor total, enquanto `nfse_para <> provider_ref`.
   - Sem `ASAAS_NFSE_SERVICO_CODIGO`, o passo é pulado com `console.error`.
   - Uma falha tenta de novo no dia seguinte.
6. **Hospedagem:** Vercel Pro (US$ 20/mês) no dia em que a cobrança ligar, porque o Hobby proíbe uso comercial. Não há migração para Cloudflare. É ação do dono, registrada no roteiro.
7. **Ligar a cobrança é o último passo:** `billing_lancar()` roda junto com o 2.0 indo para `main`. Ela é só da `service_role`: roda no SQL Editor do painel.
8. **A renovação começa dois dias antes do fim, não no fim** (era um dia; a Ruling 20 deu duas chances antes do fim). `tem_plano_proprio` deixa de contar uma linha `active` assim que `current_period_end <= now()`, e o cron roda uma vez por dia. Renovar no fim deixaria quem paga em "só leitura" por até um dia a cada aniversário. Por isso:
   - `acaoDoDia` devolve `'renovar'` a partir de `fim - 2 dias` (Ruling 20), e o aviso de renovação vale de `fim - 7` a `fim - 2 dias`;
   - uma cobrança aceita mas ainda não confirmada grava `grace_until = fim + 7 dias` e leva um `past_due` a `active` (Tarefa 2, `aguardandoConfirmacao`, com a Ruling 4);
   - a migração redefine `tem_plano_proprio` para contar também `active` com `grace_until > now()`.

   Assim, nem a espera pelo webhook nem a recusa do cartão (que já cai em `past_due` dentro da tolerância) tiram o plano antes da hora.
9. **`meu_plano()` ganha `carencia_ate`** (o `grace_until`), para a tela dizer "Atualize o cartão até DD/MM". **As ações da tela seguem o `status`, não a `origem`:** passada a tolerância, a `origem` cai para `teste`, `convite` ou `nenhuma` enquanto o `status` continua `past_due`.
10. **Quem é convidado não assina.** O plano do convidado vem de quem o convidou (`tem_cobertura`), e o convidado pode ser menor de idade. A `billing-checkout` recusa quem tem `role = 'guest'` em alguma carteira com `409 { error: 'Seu acesso vem de quem te convidou. Peça para essa pessoa cuidar do plano.' }`, e a tela não mostra "Assinar" para ele.
11. **A "só leitura" do Bloco 4 continua cobrindo** `transactions`, `workspace_installment_plans`, `workspace_subscriptions`, `attachments` e, desde o 7C, `settlements`. **`projects`, `workspace_split_weights` e `workspace_member_limits` ficam fora**: não são lançar, capturar nem importar, que é o que a spec manda parar. Isso vira lacuna na Tarefa 8, e a migração deste bloco não mexe na lista de gatilhos.
12. **Três Edges novas:** `billing-checkout`, `asaas-webhook` e `billing-cancel`. A `billing-daily` já existe e é estendida.

## Foco de revisão

1. **Cobrança dupla.** Cada uma das 12 parcelas dispara `PAYMENT_CONFIRMED` com o mesmo `installment`. Repetir o evento, ou o cron e o webhook ativarem o mesmo parcelamento, nunca estende o período duas vezes. Um `past_due` com tentativa nos últimos 2 dias não cobra de novo. (Tarefa 2: `efeitoDoEvento` e `acaoDoDia`. Tarefa 4: o evento repetido pelo `id`.)
2. **Webhook falso ou vazado.** Sem o token certo volta 401, sem tocar no banco. Um `externalReference` de outra pessoa ou um `customer` diferente do da linha é ignorado com 200. (Tarefa 4.)
3. **Dado de cartão ou CPF onde não deve.** Nenhuma Edge recebe número de cartão. O CPF não vai a tabela nem a log. O `card_token`, o `asaas_customer_id` e o `ultimo_ip` não são legíveis pelo cliente: o cliente lê só por `meu_plano()`. (Tarefa 1, teste de fonte. Tarefa 3, teste de que o corpo enviado ao Asaas não tem `creditCard`.)
4. **Renovação sem token.** Sem `card_token`, a renovação vira `past_due` com o aviso "atualize seu cartão", e nunca cobra às cegas. (Tarefa 2, `acaoDoDia`. Tarefa 6, teste de fonte.)
5. **Preço de fundador perdido por engano.** Uma renovação, e um `past_due` recuperado, mantêm o `price_cents` da linha. Só uma compra depois de `expired` recalcula o preço. (Tarefa 3, `planoDoCheckout`.)
6. **Só leitura no dia da renovação.** Quem paga em dia nunca fica em "só leitura" no aniversário: a renovação começa dois dias antes (Ruling 20), e a espera pelo webhook mantém o plano pela `grace_until`. (Tarefa 1, teste de fonte de `tem_plano_proprio`. Tarefa 2, `acaoDoDia` em `fim - 2 dias` e `aguardandoConfirmacao`.)
7. **Convidado ou menor pagando.** A `billing-checkout` recusa quem é `guest` em alguma carteira, antes de criar cliente ou cobrança no Asaas. (Tarefa 3, teste de fonte da ordem.)

---

### Tarefa 1: Migração com as colunas do Asaas e a idempotência do webhook

**Arquivos:**
- Criar: `supabase/migrations/20261101120000_cobranca_asaas.sql`
- Modificar: `src/types/database.ts` (os tipos escritos à mão das tabelas de cobrança, `:234-300`, e a tabela nova)
- Teste: `src/lib/planos/migracao-cobranca.test.ts` (teste de fonte). O `migracao-planos.test.ts` lê só o arquivo do Bloco 4; o teste novo cobre as redefinições deste bloco, com o estado final por `src/test/migracoes.ts`.

**Interfaces (produz):**
- `billing_subscriptions` ganha, com `add column if not exists`:
  - `reembolsavel_ate timestamptz`;
  - `asaas_customer_id text`;
  - `card_token text`;
  - `card_last4 text`;
  - `card_brand text`;
  - `ultimo_ip text`;
  - `checkout_ref text`;
  - `checkout_url text`;
  - `checkout_criado_em timestamptz`;
  - `nfse_para text`.
- `public.billing_events(id text primary key, tipo text not null, recebido_em timestamptz not null default now())`. RLS ligada, sem política, `revoke all` de `anon, authenticated`.
- `meu_plano()` é recriada, a partir da versão do Bloco 4 (`20261025120000_planos.sql:320-381`), com os campos dela e mais:
  - `cartao_final`;
  - `reembolsavel_ate`;
  - `carencia_ate` (o `grace_until`; Decisão 9);
  - `checkout_url`, só quando `status in ('pending','past_due')` e `checkout_criado_em > now() - interval '1 day'`.

  Nunca devolve `card_token`, `asaas_customer_id` nem `ultimo_ip`. Os grants ficam como estão (`revoke` de `public, anon`; `execute` para `authenticated`).
- `tem_plano_proprio(uuid)` é recriada (Decisão 8), a partir da versão do Bloco 4 (`:69-86`). Ela conta `(active and (current_period_end is null or current_period_end > now() or grace_until > now())) or (past_due and grace_until > now())`, e continua só da `service_role`.

- [ ] **Passo 1: teste de fonte que falha.** Ele confere:
  - as colunas;
  - `billing_events` com RLS e `revoke`;
  - o `jsonb_build_object` de `meu_plano` com `carencia_ate` e sem `card_token`, `asaas_customer_id` e `ultimo_ip`;
  - o ramo `active … grace_until > now()` no estado final de `tem_plano_proprio`;
  - nenhum `drop column`, e a lista de gatilhos `garantir_escrita` intacta (Decisão 11).
- [ ] **Passo 2:** `npx vitest run src/lib/planos/migracao-cobranca.test.ts`. Esperado: FAIL.
- [ ] **Passo 3:** escrever a migração e os tipos.
- [ ] **Passo 4:** `npx tsc --noEmit && npm run test:unit`. Esperado: PASS.
- [ ] **Passo 5:** commit `feat(cobranca): colunas do Asaas e idempotência do webhook`.


### Tarefa 2: Regras de cobrança e cliente do Asaas (puros)

**Arquivos:**
- Criar: `supabase/functions/_shared/billing.ts`, `supabase/functions/_shared/billing.test.ts`, `supabase/functions/_shared/asaas.ts`, `supabase/functions/_shared/asaas.test.ts`
- Modificar: `package.json` (o `--allow-env` do `test:edge` ganha `ASAAS_API_URL,ASAAS_API_KEY`)

**Interfaces (produz):**

```ts
// billing.ts — importa PRECO_* e FIM_FUNDADORES de ./plano.ts; exporta TOLERANCIA_DIAS, AVISO_RENOVACAO_DIAS, ARREPENDIMENTO_DIAS e PARCELAS.
export type Status = 'pending' | 'active' | 'past_due' | 'expired'
export type Assinatura = {
  id: string; user_id: string; provider: 'asaas' | 'manual' | 'apple' | 'google'
  provider_ref: string | null; status: Status
  current_period_end: string | null; cancel_at_period_end: boolean
  price_cents: number | null; founder: boolean
  grace_until: string | null; reembolsavel_ate: string | null
  card_token: string | null; checkout_criado_em: string | null
}
export type Pagamento = {
  id: string; installment: string | null; customer: string
  externalReference: string | null; status: string
  creditCard?: { creditCardToken?: string | null; creditCardNumber?: string | null; creditCardBrand?: string | null } | null
}
export type Mudanca = Partial<Pick<Assinatura,
  'status' | 'provider_ref' | 'current_period_end' | 'grace_until' | 'reembolsavel_ate' | 'cancel_at_period_end'>> &
  { card_token?: string | null; card_last4?: string | null; card_brand?: string | null }

export function precoPara(agora: Date): { centavos: number; fundador: boolean }
export function cpfValido(cpf: string): boolean
export function efeitoDoEvento(evento: string, pagamento: Pagamento, sub: Assinatura, agora: Date): Mudanca | null
export function acaoDoDia(sub: Assinatura, agora: Date): 'avisar_renovacao' | 'renovar' | 'expirar' | null
export function podeReembolsar(sub: Assinatura, agora: Date): boolean
export function falhaNaRenovacao(sub: Assinatura, agora: Date): Mudanca
export function aguardandoConfirmacao(sub: Assinatura): Mudanca   // { grace_until: current_period_end + 7 dias }, status intacto (Decisão 8)
export const AVISOS: {
  renovacao(sub: Assinatura, final: string | null): { titulo: string; corpo: string }
  cartao(sub: Assinatura): { titulo: string; corpo: string }
  fim(): { titulo: string; corpo: string }
}
```

As regras que os testes travam:
- **`efeitoDoEvento`, renovação:** é renovação quando `sub.status` é `active` ou `past_due`, `current_period_end` não é nulo e `current_period_end + 7 dias > agora`. Senão, é compra nova.
- **`efeitoDoEvento`, pagamento confirmado:** com `PAYMENT_CONFIRMED` ou `PAYMENT_RECEIVED`, um `installment` diferente de `sub.provider_ref` e `externalReference === sub.id`, a mudança é (com a renovação feita um dia antes do fim, o "fim antigo + 1 ano" mantém o aniversário):
  - `status: 'active'`;
  - `provider_ref: installment`;
  - `grace_until: null`;
  - `cancel_at_period_end: false`;
  - o cartão: `card_token`, `card_last4` (os 4 últimos de `creditCardNumber`) e `card_brand`, quando vierem.

  O período depende do caso:
  - **renovação:** `current_period_end` = o fim antigo + 1 ano, e `reembolsavel_ate` não muda;
  - **compra nova:** `current_period_end` = `agora` + 1 ano, e `reembolsavel_ate` = `agora` + 7 dias.
- **`efeitoDoEvento`, mesmo parcelamento:** um `installment === sub.provider_ref` devolve `null`, e é isso que cobre as 12 parcelas mensais.
- **`efeitoDoEvento`, estorno e chargeback:** `PAYMENT_REFUNDED` ou `PAYMENT_CHARGEBACK_REQUESTED` no `installment === sub.provider_ref`, com `sub.status !== 'expired'`, devolve `{ status: 'expired', current_period_end: agora }`.
- **`efeitoDoEvento`, o resto:** qualquer outro evento, ou `externalReference !== sub.id`, devolve `null`.
- **`acaoDoDia`** devolve `null` para `provider !== 'asaas'` ou `current_period_end` nulo. Para os demais:
  - **`active`:**
    - com `agora >= fim` e `cancel_at_period_end`, devolve `'expirar'`;
    - com `agora >= fim - 1 dia`, sem cancelamento, devolve `'renovar'`, salvo se `checkout_criado_em` tiver menos de 2 dias (a renovação já foi tentada e espera o webhook): aí devolve `null`;
    - com `fim - 7 dias <= agora < fim - 1 dia`, sem cancelamento, devolve `'avisar_renovacao'`.
  - **`past_due`:**
    - com `agora >= grace_until`, devolve `'expirar'`;
    - senão, devolve `'renovar'` só se `checkout_criado_em` for nulo ou tiver mais de 2 dias;
    - fora disso, devolve `null`.
- **`falhaNaRenovacao`** devolve `{ status: 'past_due', grace_until: (sub.grace_until ?? current_period_end + 7 dias) }`. A tolerância não se estende a cada tentativa.
- **`podeReembolsar`** é verdadeiro com `status === 'active'`, `reembolsavel_ate` não nulo e `agora < reembolsavel_ate`.
- **`precoPara`:**
  - `agora < FIM_FUNDADORES` devolve `{ centavos: 23880, fundador: true }`;
  - senão, devolve `{ centavos: 35880, fundador: false }`.
- **`cpfValido`:** tira o que não é dígito. Exige 11 dígitos e os dois verificadores corretos, e recusa os 11 dígitos iguais.
- **Os textos de `AVISOS`**, com o valor por `currencyBRL` de `_shared/formatters.ts` dividido em 12 parcelas:
  - **renovacao:** título `"Seu plano renova em 7 dias"`. O corpo diz o valor ("12x de R$ 29,90" ou "12x de R$ 19,90") e, com `final`, "no cartão final 1234". Sem `card_token`, diz "Confirme o cartão em Planos para renovar". Sempre termina com "Cancelar é em 1 toque, em Planos.".
  - **cartao:** título `"Não conseguimos renovar seu plano"`. O corpo é "Atualize o cartão em Planos até DD/MM. Depois disso, a conta fica em só leitura." e a data é a de `grace_until`.
  - **fim:** título `"Seu plano terminou"`. O corpo é "Sua conta está em só leitura: tudo continua visível, e exportar e apagar seguem liberados. Assine em Planos para voltar a lançar."

```ts
// asaas.ts
export type AsaasConfig = { url: string; chave: string }
export function configDoAsaas(): AsaasConfig | null   // lê ASAAS_API_URL e ASAAS_API_KEY; null se faltar
export type RespostaAsaas<T> = { ok: true; dados: T } | { ok: false; status: number; erros: string[] }
export function asaas<T>(cfg: AsaasConfig, metodo: 'GET' | 'POST', caminho: string, corpo?: unknown): Promise<RespostaAsaas<T>>
export function criarCliente(cfg: AsaasConfig, c: { nome: string; cpf: string; email: string | null; userId: string }): Promise<RespostaAsaas<{ id: string }>>
export function criarCobranca(cfg: AsaasConfig, c: {
  cliente: string; centavos: number; referencia: string; vencimento: string // YYYY-MM-DD
  retorno?: string; token?: string; ip?: string | null
}): Promise<RespostaAsaas<Pagamento & { invoiceUrl: string }>>
export function estornarParcelamento(cfg: AsaasConfig, parcelamento: string): Promise<RespostaAsaas<unknown>>
export function agendarNota(cfg: AsaasConfig, n: { parcelamento: string; centavos: number; data: string;
  codigo: string; nome: string }): Promise<RespostaAsaas<{ id: string }>>
```

O que cada função envia:
- **`asaas`:**
  - os cabeçalhos `access_token`, `Content-Type: application/json` e `User-Agent: finance-app`;
  - um prazo de 15 s (`AbortSignal.timeout`);
  - numa falha HTTP, `erros` vem de `errors[].description`;
  - a falha de rede ou o prazo vira `{ ok: false, status: 0 }`.
- **`criarCliente`:** `POST /customers` com `{ name, cpfCnpj (só dígitos), email, externalReference: userId, notificationDisabled: true }`.
- **`criarCobranca`:** `POST /payments` com `{ customer, billingType: 'CREDIT_CARD', installmentCount: 12, totalValue: centavos/100, dueDate: vencimento, description: 'Finance App — Plano Família (anual)', externalReference: referencia }`.
  - com `retorno`, acrescenta `callback: { successUrl: retorno, autoRedirect: true }`;
  - com `token`, acrescenta `creditCardToken` e `remoteIp`;
  - **nunca envia `creditCard` nem `creditCardHolderInfo`**.
- **`estornarParcelamento`:** `POST /installments/{id}/refund` com corpo `{}`.
- **`agendarNota`:** `POST /invoices` com:
  - `installment`;
  - `serviceDescription: 'Assinatura anual do Finance App, Plano Família'`;
  - `observations: ''`;
  - `value: centavos/100`;
  - `deductions: 0`;
  - `effectiveDate: data`;
  - `municipalServiceCode: codigo`;
  - `municipalServiceName: nome`;
  - `taxes: { retainIss: false, iss: 0, cofins: 0, csll: 0, inss: 0, ir: 0, pis: 0 }`.

  As alíquotas reais são configuração fiscal do dono no painel. O roteiro diz como ajustar.

- [ ] **Passo 1: testes Deno que falham.**
  - `billing.test.ts`:
    - um caso por regra acima;
    - `acaoDoDia` com `agora = fim - 1 dia` devolve `'renovar'`, com `fim - 1 dia - 1 min` devolve `'avisar_renovacao'`, e com uma tentativa há 1 dia devolve `null`;
    - `aguardandoConfirmacao` devolve só `grace_until = fim + 7 dias`;
    - a 2ª parcela do mesmo `installment` devolve `null`;
    - a renovação estende a partir do fim antigo, mesmo confirmada 3 dias depois dele;
    - um `past_due` com tentativa há 1 dia devolve `null`, e há 3 dias devolve `'renovar'`;
    - `precoPara` em `2027-02-01T02:59:59Z` e em `03:00:00Z`;
    - um CPF válido, um com dígito errado e `111.111.111-11`.
  - `asaas.test.ts`, com `fetch` simulado:
    - a URL, o método e os cabeçalhos;
    - o corpo de `criarCobranca` com e sem `token`, sem nunca ter `creditCard`;
    - o `callback`;
    - um 400 com `errors`;
    - o prazo estourado.
- [ ] **Passo 2:** `npm run test:edge`. Esperado: FAIL.
- [ ] **Passo 3:** implementar os dois módulos e o ajuste do `package.json`.
- [ ] **Passo 4:** `npm run test:edge && npx tsc --noEmit && npm run lint`. Esperado: PASS.
- [ ] **Passo 5:** commit `feat(cobranca): regras de cobrança e cliente do Asaas`.

### Tarefa 3: Edge `billing-checkout`

**Arquivos:**
- Criar: `supabase/functions/billing-checkout/index.ts`
- Modificar: `supabase/config.toml`, `supabase/functions/_shared/billing.ts` (a função pura nova), `supabase/functions/_shared/billing.test.ts`

**Interfaces:**
- Consome a Tarefa 2 (`precoPara`, `cpfValido`, `criarCliente`, `criarCobranca`, `configDoAsaas`) e a Tarefa 1 (as colunas de `billing_subscriptions`).
- Produz `POST /functions/v1/billing-checkout`:
  - com o JWT da pessoa e `{ nome: string, cpf: string }`, devolve `200 { url: string }`;
  - os erros são `400 { error: 'CPF inválido.' }`, `400 { error: 'Informe o nome como no cartão.' }`, `409 { error: 'Você já tem um plano ativo.' }`, o `409` do convidado (Decisão 10), `502 { error: 'O Asaas não respondeu. Tente de novo em instantes.' }` e `503` quando `configDoAsaas()` é nulo.
- Produz em `billing.ts`: `export function planoDoCheckout(sub: Assinatura | null, agora: Date): { tipo: 'bloqueado' } | { tipo: 'reusar' } | { tipo: 'novo'; centavos: number; fundador: boolean; renovacao: boolean }`. A ordem das regras:
  1. Linha `active` sem `cancel_at_period_end` e com `current_period_end` no futuro (ou nulo, no caso do `manual`): `bloqueado`.
  2. Linha `active` com `cancel_at_period_end`: também `bloqueado`. A tela oferece "Desfazer cancelamento".
  3. Linha `pending` ou `past_due` com `checkout_criado_em` há menos de 24 h: `reusar`.
  4. Linha `past_due`: `novo` com o `price_cents` e o `founder` da linha, e `renovacao: true`.
  5. Qualquer outro caso (sem linha, `expired` ou `pending` antigo): `novo` com `precoPara(agora)`, e `renovacao: false`.

O fluxo da Edge, nesta ordem:
1. Faz `OPTIONS`/CORS como `ia-ler`.
2. Exige o JWT (`getAuthUserFromJwt`).
3. Lê o corpo com `lerCorpo(req, 4096)`.
4. Valida o nome (de 3 a 100 caracteres) e o CPF.
5. Recusa quem tem `role = 'guest'` em alguma carteira (Decisão 10), antes de qualquer chamada ao Asaas.
6. Busca a linha da pessoa e chama `planoDoCheckout`.
7. No caso `reusar`, devolve a `checkout_url` guardada.
8. Garante o cliente do Asaas (`criarCliente`, se `asaas_customer_id` for nulo) e grava o id.
9. Faz o upsert da linha, `onConflict: 'user_id'`, mantendo `status` se for `past_due` e usando `pending` nos outros casos. Grava `provider: 'asaas'`, `price_cents`, `founder` e `ultimo_ip` (o primeiro valor de `x-forwarded-for`, aparado, até 45 caracteres).
10. Chama `criarCobranca` com:
    - `referencia: linha.id`;
    - `vencimento: formatYmd(appTodayYmd())`;
    - `retorno: ${APP_BASE_URL}/plans?pago=1`.
11. Grava `checkout_ref`, `checkout_url = invoiceUrl` e `checkout_criado_em = now()`.
12. Devolve `{ url }`.

O CPF não aparece em nenhum `console.*` nem na resposta.

- [ ] **Passo 1: testes que falham.**
  - Deno, de `planoDoCheckout`, um por regra, incluindo:
    - a linha `active` cancelada;
    - o `past_due` mantém o preço de fundador depois de 31/01/2027;
    - o `expired` volta ao preço do dia.
  - Fonte (`src/lib/planos/edges-planos.test.ts`): a recusa do convidado vem antes de `criarCliente`; o CORS inclui `x-app-session-id`; nenhum `console.*` recebe o `cpf`.
- [ ] **Passo 2:** `npm run test:edge`. Esperado: FAIL.
- [ ] **Passo 3:** implementar `planoDoCheckout`, a Edge e a entrada no `config.toml`.
- [ ] **Passo 4:** `npm run test:edge && npx tsc --noEmit && npm run lint`. Esperado: PASS.
- [ ] **Passo 5:** commit `feat(cobranca): checkout do plano anual no Asaas`.

### Tarefa 4: Edge `asaas-webhook`

**Arquivos:**
- Criar: `supabase/functions/asaas-webhook/index.ts`
- Modificar: `supabase/config.toml`, `src/lib/planos/edges-planos.test.ts` (criado no Bloco 4)

**Interfaces:**
- Consome a Tarefa 2 (`efeitoDoEvento`, os tipos `Assinatura` e `Pagamento`) e as tabelas da Tarefa 1.
- Produz `POST /functions/v1/asaas-webhook` para o Asaas configurar, com `sendType: SEQUENTIALLY`.

O fluxo:
1. Só aceita `POST`; o resto volta 405.
2. Confere `secretMatches(Deno.env.get('ASAAS_WEBHOOK_TOKEN'), req.headers.get('asaas-access-token'))`; falhou, volta 401.
3. Lê o corpo com `lerCorpo(req, 65536)` e o JSON `{ id, event, payment? }`.
4. Insere em `billing_events(id, tipo)`. Num conflito (`23505`), volta 200 `{ ok: true, repetido: true }`.
5. Sem `payment.externalReference`, volta 200.
6. Busca a linha por `id = externalReference`. Volta 200 sem mudar nada se:
   - a linha não existe, ou
   - `payment.customer !== linha.asaas_customer_id`.
7. Aplica `efeitoDoEvento(event, payment, linha, new Date())`. Se não for `null`, faz o `update` com `updated_at = now()` e, se a mudança ativou, `checkout_url = null`.
8. Responde **exatamente 200** em todo caminho tratado.
9. Num erro de banco, volta 500 e apaga o `billing_events` daquele `id`, para o Asaas tentar de novo.

A regra que separa 401 de 200: só o token errado volta 401. Uma referência estranha volta 200, para não pausar a fila do Asaas.

- [ ] **Passo 1: teste de fonte que falha** (`src/lib/planos/edges-planos.test.ts`, com `lerFonte` e `semComentarios`). Ele confere em `asaas-webhook/index.ts`:
  - `secretMatches` com `ASAAS_WEBHOOK_TOKEN` e `asaas-access-token`, antes do primeiro `from(`;
  - o insert em `billing_events` antes do `update` de `billing_subscriptions`;
  - a comparação com `asaas_customer_id`;
  - o `efeitoDoEvento`;
  - o delete de `billing_events` no caminho de erro.
- [ ] **Passo 2:** `npx vitest run src/lib/planos/edges-planos.test.ts`. Esperado: FAIL.
- [ ] **Passo 3:** implementar a Edge e a entrada no `config.toml`.
- [ ] **Passo 4:** `npm run test:edge && npx tsc --noEmit && npm run lint && npm run test:unit`. Esperado: PASS.
- [ ] **Passo 5:** commit `feat(cobranca): webhook do Asaas idempotente`.

### Tarefa 5: Edge `billing-cancel` (cancelar, desfazer e reembolsar)

**Arquivos:**
- Criar: `supabase/functions/billing-cancel/index.ts`
- Modificar: `supabase/config.toml`, `src/lib/planos/edges-planos.test.ts`

**Interfaces:**
- Consome a Tarefa 2 (`podeReembolsar`, `estornarParcelamento`, `configDoAsaas`).
- Produz `POST /functions/v1/billing-cancel` com o JWT e `{ acao: 'cancelar' | 'desfazer' | 'reembolsar' }`, que devolve `200 { ok: true }`. Cada ação:
  - **`cancelar`:** exige a linha `active` com `provider = 'asaas'`. Grava `cancel_at_period_end = true`. Senão volta `409 { error: 'Não há assinatura para cancelar.' }`.
  - **`desfazer`:** exige `active`, `cancel_at_period_end` e `current_period_end > now()`. Grava `false`. Senão volta 409.
  - **`reembolsar`:**
    - exige `podeReembolsar(linha, agora)`; senão volta `409 { error: 'O prazo de 7 dias para reembolso terminou.' }`;
    - chama `estornarParcelamento(cfg, linha.provider_ref)`; numa falha volta 502;
    - com sucesso, grava `status = 'expired'`, `current_period_end = now()`, `cancel_at_period_end = true` e `reembolsavel_ate = null`.
  - Uma `acao` desconhecida volta 400.

- [ ] **Passo 1:** acrescentar ao teste de fonte as checagens de `billing-cancel`:
  - o JWT exigido;
  - o `podeReembolsar` antes do `estornarParcelamento`;
  - o `update` só depois do `ok` do estorno.
- [ ] **Passo 2:** `npx vitest run src/lib/planos/edges-planos.test.ts`. Esperado: FAIL.
- [ ] **Passo 3:** implementar.
- [ ] **Passo 4:** `npm run test:edge && npx tsc --noEmit && npm run lint && npm run test:unit`. Esperado: PASS.
- [ ] **Passo 5:** commit `feat(cobranca): cancelar em 1 toque e reembolso de arrependimento`.

### Tarefa 6: Cron `billing-daily`: renovação, avisos e NFS-e

**Arquivos:**
- Modificar: `supabase/functions/billing-daily/index.ts` (criada no Bloco 4) e `src/lib/planos/edges-planos.test.ts`.

**Interfaces:**
- Consome:
  - da Tarefa 2: `acaoDoDia`, `efeitoDoEvento`, `falhaNaRenovacao`, `AVISOS`, `criarCobranca`, `agendarNota`;
  - do Bloco 4: `billing_avisos`, `billing_settings`, `deliverNotification` com `essencial` e o passo do aviso do teste, que fica como está.

O fluxo do cron:
1. Confere `x-cron-secret`.
2. O atalho de `enforced_since` nulo passa a pular **só o passo do teste**. Hoje ele é um `return` que encerra a função inteira (`billing-daily/index.ts:61-67`): vira um `if` em volta do passo do teste. A renovação e a NFS-e rodam sempre que houver assinatura `asaas`, inclusive no Sandbox antes do lançamento.
3. **Assinaturas `asaas` com `status in ('active','past_due')`**, lidas com `todasAsPaginas` (`_shared/todas-as-paginas.ts`). Para cada uma, executa `acaoDoDia`:
   - **`avisar_renovacao`:** reivindica `billing_avisos(user_id, 'renovacao', current_period_end::date)`. Se conseguiu, entrega `AVISOS.renovacao`.
   - **`renovar`:**
     - **Com `card_token` e `configDoAsaas()`:** grava `checkout_criado_em = now()` antes de chamar. Depois chama `criarCobranca` com `token`, `ip: ultimo_ip`, `referencia: id` e o `price_cents` da linha.
       - Num `ok` com `status in ('CONFIRMED','RECEIVED')`, aplica `efeitoDoEvento('PAYMENT_CONFIRMED', resposta, linha, agora)`. O webhook que chega depois é idempotente.
       - Noutro `ok` (aceita, ainda não confirmada), grava `aguardandoConfirmacao(linha)`: o plano continua valendo pela `grace_until` até o webhook confirmar (Decisão 8).
       - Numa falha, grava `falhaNaRenovacao` e entrega `AVISOS.cartao`, com o aviso deduplicado por `('cartao', current_period_end::date)`.
     - **Sem token:** grava `falhaNaRenovacao` e `checkout_criado_em = now()`, e entrega `AVISOS.cartao`.
   - **`expirar`:** grava `status = 'expired'` e entrega `AVISOS.fim`, deduplicado por `('fim', current_period_end::date)`.
4. **NFS-e:** para as linhas `asaas` `active` com `provider_ref` não nulo e `nfse_para is distinct from provider_ref`, chama `agendarNota` com:
   - `data` de hoje;
   - `centavos = price_cents`;
   - `codigo` e `nome` dos segredos.

   Com `ok`, grava `nfse_para = provider_ref`. Sem os segredos, pula o passo inteiro com um único `console.error`.
5. Todo aviso usa:
   - `type: 'system'`;
   - `essencial: true`;
   - `metadata: { href: '/plans' }`;
   - a carteira pessoal da pessoa como `workspaceId`;
   - o e-mail de `auth.admin.getUserById`.
6. Uma entrega que falha libera o dedupe. O `claimDedupe` e o `releaseDedupe` já moram no próprio `billing-daily/index.ts:30-50`; os passos novos usam os mesmos.
7. O fan-out usa `forEachLimit(FAN_OUT_CONCURRENCY)`.
8. Devolve as contagens: `{ renovadas, falhas, expiradas, avisos, notas }`, somadas às do passo do teste.

- [ ] **Passo 1: testes que falham.**
  - Teste de fonte de `billing-daily`, que confere:
    - o `checkout_criado_em` gravado antes do `criarCobranca`;
    - o `aguardandoConfirmacao` no `ok` não confirmado;
    - o `essencial: true` nos avisos novos;
    - os tipos `renovacao`, `cartao` e `fim` de `billing_avisos`;
    - o `enforced_since` nulo não pulando a renovação.
  - **O teste de hoje trava o que esta tarefa muda** (`src/lib/planos/edges-planos.test.ts`): as linhas 14-20 exigem o `pulado: 'desligado'` do `return` antecipado, e a linha 39 exige exatamente duas ocorrências de `await releaseDedupe(admin, dedupe)`. Atualize as duas travas na mesma tarefa para a forma nova (o `if` em volta do passo do teste, e uma liberação por entrega que falha).
- [ ] **Passo 2:** `npm run test:edge && npx vitest run src/lib/planos/edges-planos.test.ts`. Esperado: FAIL.
- [ ] **Passo 3:** implementar.
- [ ] **Passo 4:** `npm run test:edge && npx tsc --noEmit && npm run lint && npm run test:unit`. Esperado: PASS.
- [ ] **Passo 5:** commit `feat(cobranca): renovação, avisos e NFS-e no cron`.

### Tarefa 7: Front: assinar, ações e retorno do pagamento

**Arquivos:**
- Modificar: `src/lib/planos/plano.ts`, `src/lib/planos/plano.test.ts` e `src/components/wireframe/planos-wireframe.tsx` (todos do Bloco 4).

**Interfaces:**
- Consome as Tarefas 1 (`meu_plano` com `cartao_final`, `reembolsavel_ate`, `carencia_ate` e `checkout_url`), 3 (`billing-checkout`) e 5 (`billing-cancel`), e o `papel` do `workspace-provider` (Bloco 7A). A assinatura fica `resumoDoPlano(p: MeuPlano, agora: Date, papel: WorkspaceRole | null)`.
- Em `src/lib/planos/plano.ts`:
  - `MeuPlano` ganha `cartao_final`, `reembolsavel_ate`, `carencia_ate` e `checkout_url`, todos `string | null`, lidos com `?? null` (o banco de produção ainda não os tem);
  - `resumoDoPlano` troca `podeAssinar` por `acoes: Array<'assinar' | 'atualizar_cartao' | 'cancelar' | 'desfazer' | 'reembolsar' | 'pagar_pendente'>`. O `podeAssinar` hoje é usado em `plano.ts:74-100`, `plano.test.ts:20-60` e `planos-wireframe.tsx:37`: os três mudam juntos;
  - **as ações seguem o `status`** (Decisão 9): um `past_due` dá `atualizar_cartao` mesmo quando a `origem` já caiu para `teste`, `convite` ou `nenhuma`;
  - **quem é convidado não vê "Assinar"** (Decisão 10): `resumoDoPlano` recebe `papel` e devolve `[]` para `guest`;
  - entram duas funções novas:
    ```ts
    export function assinar(nome: string, cpf: string): Promise<string>                 // invokeEdgeJson('billing-checkout') → url
    export function alterarAssinatura(acao: 'cancelar' | 'desfazer' | 'reembolsar'): Promise<void>
    ```
- As ações de `resumoDoPlano`, mantidos os títulos e as linhas do Bloco 4:

  | Origem ou estado | Ações |
  |---|---|
  | `teste` e `nenhuma` | `['assinar']` |
  | `assinatura` `active` | `cancelar` ou `desfazer`, mais `reembolsar` enquanto `reembolsavel_ate > agora`. A linha ganha "Cartão final 1234" quando houver |
  | `status` `past_due`, qualquer origem | título "Não conseguimos renovar", linha "Atualize o cartão até DD/MM." com a data de `carencia_ate`, ações `['atualizar_cartao']` |
  | `livre`, `vitalicio` e `convite` | nenhuma |

  Em qualquer estado, com `checkout_url` não nulo, `pagar_pendente` ("Continuar o pagamento", que abre a `checkout_url`) entra como a primeira ação e substitui `assinar` e `atualizar_cartao`.
- **`PlanosWireframe`:**
  - o "Assinar" deixa de ser o botão desabilitado e vira um `<form>` com nome (como no cartão) e CPF, que chama `assinar` e faz `window.location.assign(url)`;
  - o "Atualizar cartão" usa o mesmo formulário;
  - os botões das ações chamam `alterarAssinatura`. O reembolso pede `confirm()` nativo com "O valor volta para o cartão em até 10 dias úteis e a conta volta ao estado de antes da compra.";
  - com `?pago=1`, consulta `buscarMeuPlano` a cada 5 s por até 2 min, enquanto o status for `pending`.

- [ ] **Passo 1: testes Vitest que falham.** Uma linha de `resumoDoPlano` por estado da tabela, com:
  - o reembolso só dentro dos 7 dias;
  - o `pagar_pendente` vencendo `assinar`;
  - um `past_due` com `origem: 'nenhuma'` dando `atualizar_cartao`;
  - o `guest` sem ação nenhuma;
  - um `MeuPlano` sem os campos novos (o banco antes da migração) dando o mesmo resumo do Bloco 4.
- [ ] **Passo 2:** `npx vitest run src/lib/planos`. Esperado: FAIL.
- [ ] **Passo 3:** implementar.
- [ ] **Passo 4:** `npx tsc --noEmit && npm run lint && npm run test:unit && npm run ds:audit -- src/components/wireframe && npm run build`. Esperado: PASS.
- [ ] **Passo 5:** commit `feat(cobranca): assinar, cancelar e reembolsar na tela do plano`.

### Tarefa 8: Roteiro de publicação, privacidade, jornadas e Atlas

**Arquivos:**
- Criar: `supabase/BLOCO_8_DEPLOYMENT.md`
- Modificar: `src/components/wireframe/privacidade-wireframe.tsx`, `src/components/wireframe/cofre-aberto-wireframe.tsx`, `docs/JORNADAS.md`, `docs/atlas/template.html`, `docs/atlas/atlas-jornadas.html` (gerado)

O roteiro, na ordem:
- **§0, pré-requisitos do dono:**
  - o CNPJ e a conta Asaas aprovada;
  - o pedido ao suporte de **tokenização em produção** (a documentação diz que "depende de habilitação"), e as perguntas que a documentação não responde:
    - o que a fatura hospedada mostra numa cobrança com `installmentCount: 12` (12x fixo numa compra só, ou 12 faturas);
    - se o `creditCard.creditCardToken` vem no `PAYMENT_CONFIRMED` depois do pagamento na fatura hospedada;
    - se o `remoteIp` guardado na compra serve para a cobrança de renovação fora de sessão (ele é obrigatório);
    - a taxa, a elegibilidade e o Sandbox do Pix Automático, para depois;
  - o **domínio do app cadastrado nos dados comerciais da conta**: o `callback.successUrl` precisa estar nele;
  - a configuração fiscal (código do serviço e alíquotas) no painel;
  - o Vercel Pro antes de ligar a cobrança.
- **§1, Sandbox, antes de qualquer cliente real.** Os segredos apontam para o Sandbox. Confirme numa compra de teste:
  1. a fatura de `POST /payments` com `installmentCount: 12` mostra 12x fixo;
  2. o `PAYMENT_CONFIRMED` traz `creditCard.creditCardToken` depois do pagamento na fatura hospedada;
  3. uma cobrança com o token renova sem pedir o cartão;
  4. uma recusa de token não deixa cobrança criada;
  5. o estorno do parcelamento dispara `PAYMENT_REFUNDED`;
  6. o `callback.successUrl` volta para `/plans?pago=1`.

  **Se o item 2 falhar**, a renovação cai no caminho sem token (aviso e cartão confirmado na fatura) e o roteiro registra isso. O código não muda.
- **§2, banco:** aplicar a migração e conferir o cron `billing-daily`. O `enforced_since` continua nulo.
- **§3, segredos e deploy** das três Edges novas (`billing-checkout`, `asaas-webhook`, `billing-cancel`) e da `billing-daily` estendida, com `--use-api`. A migração vai antes da `billing-daily`, que passa a ler as colunas novas.
- **§4, webhook no painel do Asaas:**
  - a URL da `asaas-webhook`;
  - o `authToken` igual a `ASAAS_WEBHOOK_TOKEN`;
  - `sendType: SEQUENTIALLY`;
  - os eventos `PAYMENT_CONFIRMED`, `PAYMENT_RECEIVED`, `PAYMENT_REFUNDED` e `PAYMENT_CHARGEBACK_REQUESTED`.
- **§5, "bateu ou devolvemos"** no 1º mês pago: é processo manual pelo suporte. O estorno sai pelo painel do Asaas, e o webhook (`PAYMENT_REFUNDED`) leva a conta para `expired`.
- **§6, ligar a cobrança: só no lançamento do 2.0** (front em `main`):
  - `select public.billing_lancar();`, no SQL Editor do painel (a função é só da `service_role`);
  - quem já usa ganha 14 dias a partir desse instante.
- **§7, reverter:** `update billing_settings set enforced_since = null;` devolve todo mundo ao `familia`.

As outras mudanças:
- **Privacidade:** acrescentar que o CPF e o cartão vão direto ao Asaas, que guardamos só o token do Asaas, os 4 últimos dígitos, a bandeira e o IP da compra (para a renovação), e que a NFS-e é emitida pelo Asaas. Suba o `ATUALIZADA_EM`. Só acrescente: o `wireframe.test.ts:212-240` trava a lista de frases que já existe.
- **Cofre aberto:** a tabela `GUARDADO` diz "Mesma lista da /privacidade" e não tem a linha do plano: acrescente a linha da cobrança (o que o Asaas guarda e o que nós guardamos).
- **Jornadas:**
  - a jornada "Plano e só leitura" do Bloco 4 ganha a compra: `/plans` → fatura do Asaas → webhook → `/plans?pago=1` → renovação pelo cron um dia antes do fim, aviso e "atualizar cartão" → só leitura;
  - o convidado não assina (Decisão 10);
  - a lacuna "assinar só abre no Bloco 8" sai;
  - entram as lacunas:
    - "a renovação depende do token na fatura hospedada (a confirmar no Sandbox)";
    - "a só leitura não cobre `projects`, `workspace_split_weights` nem `workspace_member_limits`" (Decisão 11);
    - "a exportação do Cofre não traz a linha do plano da pessoa".
  - Siga a legenda e o `%%{init}%%` do topo.
- **Atlas:** a explicação da mesma jornada, os apêndices de rotas (`/precos`) e de backend (quatro Edges, o cron e a migração), e a data e as contagens da capa. Depois, `python3 docs/atlas/build.py`.

- [ ] **Passo 1:** escrever o roteiro e a privacidade.
- [ ] **Passo 2:** atualizar `JORNADAS.md` e `template.html`, e rodar `python3 docs/atlas/build.py`. Esperado: o HTML gerado sem erro.
- [ ] **Passo 3:** `npx tsc --noEmit && npm run lint && npm run test:unit && npm run build`. Esperado: PASS.
- [ ] **Passo 4:** commit `docs(cobranca): roteiro do Bloco 8, privacidade, jornadas e Atlas`.
