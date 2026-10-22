# Bloco 3A — Captura sem abrir o app: plano de implementação

> **Para agentes:** SUB-SKILL OBRIGATÓRIA: use superpowers:subagent-driven-development (recomendado) ou superpowers:executing-plans para executar este plano tarefa a tarefa. Os passos usam checkbox (`- [ ]`).

**Objetivo:** lançar um gasto em segundos sem abrir o formulário. Os caminhos são:
- uma frase no "+" do app ("42 mercado nubank em 3x");
- o Atalho e a automação do Apple Pay no iPhone;
- o compartilhar no Android;
- os atalhos do ícone.

Tudo que entra com dúvida cai na lista "A conferir", que tem contagem no Painel e lembrete às 20h.

**Arquitetura:**
- **Lógica:** funções puras e sem import em `supabase/functions/_shared/frase.ts`, que o cliente e a Edge usam:
  - o parser da frase;
  - o casamento de cartão;
  - o preenchimento pelo histórico.
- **Entrada externa:** a Edge `capture`:
  - autentica por um **token pessoal de captura**, guardado só em hash;
  - confere o plano com `workspace_plan()`;
  - grava como a pessoa;
  - roda os avaliadores de orçamento e de limite.
- **Telas:** entram como **wireframes** em `src/components/wireframe/` (regra do `AGENTS.md`).

**Tecnologia:** Next 16 / React 19, Supabase (Postgres, `pg_cron`, Edge em Deno, `pgcrypto`), Vitest (`node`) e Deno test. Nenhuma dependência nova.

**Spec:** `docs/superpowers/specs/2026-10-20-proposta-funcional-design.md`:
- §7 (Bloco 3), sem a parte do WhatsApp;
- §8 só como fronteira: a IA fica no 3B;
- §9, o parágrafo do `workspace_plan()`.

A regra das telas está no `AGENTS.md`, em "Funcionalidade nova entra em wireframe".

## Restrições globais

- **O banco de dev é o de produção.** Nenhuma tarefa roda `supabase db push`, deploy ou SQL contra o projeto. Quem publica é o orquestrador, pelo roteiro da Tarefa 7, e só com o pedido explícito do dono.
- **O front de `main` continua em produção até o fim do 2.0.** Toda migração e toda mudança de Edge Function precisam funcionar com o front antigo:
  - as colunas novas nascem com padrão;
  - nenhuma coluna existente muda de tipo nem sai;
  - os avaliadores continuam aceitando o JWT do usuário.
- **O repositório é público:** nenhum segredo, URL de projeto, token nem dado real. Os exemplos de frase nos testes são inventados.
- **Testes:**
  - Vitest roda em ambiente `node` e só pega `src/**/*.test.ts`. Use teste de fonte com `lerFonte`/`semComentarios` de `@/test/fonte`.
  - O Deno testa só `supabase/functions/_shared/*.test.ts` (`npm run test:edge`).
- **Tipos:** escritos à mão em `src/types/database.ts` e `src/lib/supabase.ts`. `src/types/database-drift.ts` reprova divergência.
- **Wireframe** (`AGENTS.md`):
  - só em `src/components/wireframe/`;
  - a etiqueta é `WIREFRAME · Bloco 3 · <funcionalidade>`;
  - as classes são `border-dashed border-muted-foreground/60 bg-muted/40 text-muted-foreground font-mono`;
  - os controles são nativos;
  - todo `<button>` declara `type`;
  - nada de `@/components/ui`.
  - Reaproveite `src/components/wireframe/wireframe-box.tsx`.
- **Enter:** um campo de wireframe que mora dentro de um `<form>` e tem ação própria chama `preventDefault` no `keydown` do Enter. Assim ele não envia o formulário (`AGENTS.md`, "Forms and Enter-to-submit").
- **Data do app:** o dia é o de `America/Sao_Paulo`. Use `appTodayYmd` (`_shared/credit-card-cycle.ts:220`). A data gravada segue `calendarYmdToStorageIso` (meio-dia UTC), como na importação.
- **Mudança de jornada:** atualizar `docs/JORNADAS.md`, depois `docs/atlas/template.html`, depois rodar `python3 docs/atlas/build.py`. O orquestrador republica o Atlas.
- **Fechamento de cada tarefa:** `npx tsc --noEmit && npm run lint && npm run test:unit` verdes. Com Edge, também `npm run test:edge`. Com wireframe, também `npm run ds:audit -- src/components/wireframe`.

## Decisões desta rodada (o orquestrador registra no ledger)

1. **O Bloco 3 se divide em 3A (este) e 3B (WhatsApp + IA).** O 3B depende de contas de terceiros que só o dono cria: Meta Cloud API, Groq e Cloudflare.
2. **Sem IA no 3A.** O que o parser não entende:
   - sem valor: devolve erro claro e não grava;
   - com valor: grava com `needs_review`.
   A IA entra no 3B pela mesma cadeia, sem mudar o contrato da Edge.
3. **A Edge `capture` só aceita JSON** (`text`, ou `amount` + `merchant` + `card`).
   - Foto de recibo no iPhone: o Atalho faz "Extrair texto da imagem" e manda o texto.
   - Imagem e PDF crus ficam para o 3B, com a visão e a leitura de fatura.
4. **O compartilhar do Android é só texto, por `GET`.** O `share_target` aponta para `/transactions?frase=…`, que abre o formulário já com a frase. Arquivo exige service worker com POST e fica para o 3B.
5. **"A conferir" é um wireframe próprio em `/transactions?conferir=1`.** Fica acima da lista, mostra os itens com `needs_review` e tem "Confirmar" e "Abrir". Não entra como filtro no controlador da lista, que tem 19 pontos de toque por filtro. Na revisão de tela, ele vira o filtro de verdade.
6. **O token de captura** é `fac_` seguido de 64 hex (32 bytes).
   - Ele nasce numa RPC `security definer`, que guarda só o `sha256` e devolve o texto uma vez.
   - Há no máximo 10 ativos por pessoa.
   - Revogar marca `revoked_at`.
   - A Edge procura pelo hash. Ela nunca compara o token em texto.
7. **A unidade do plano é a carteira padrão do token.** `workspace_plan(p_workspace_id)` nasce **devolvendo `'familia'` para todos** (spec §9) e passa a valer de fato no Bloco 4. A Edge o consulta antes de qualquer outra coisa.
8. **Agir como a pessoa.** A Edge usa a service role e repete as regras da RLS:
   - `user_id` é o dono do token;
   - a pessoa precisa ser membro da carteira de destino;
   - o cartão e a categoria precisam ser da mesma carteira.
   O trigger de autor (`preserve_row_author`) só atua no UPDATE.
9. **Os avaliadores ganham o caminho de serviço.**
   - `evaluate-budgets` e `evaluate-credit-card-alerts` passam a aceitar `x-cron-secret`, além do JWT.
   - Com o segredo, o corpo traz `workspace_id`, e a checagem de membro é pulada, porque o servidor já checou.
   - `isServiceAuthorized` sai de `notify-transaction-created` para `_shared/service-auth.ts`.
10. **`needs_review` na captura:** verdadeiro quando há qualquer dúvida do parser, cartão citado e não casado, ou nenhuma categoria pelo histórico.
11. **O Apple Pay aprende o cartão.**
    - Sem casamento, o nome do cartão da Wallet fica em `transactions.capture_meta.walletCard`.
    - Ao confirmar o item em "A conferir" com um cartão escolhido, o wireframe oferece "Lembrar '<nome>' como este cartão", que grava `credit_cards.wallet_alias`.
12. **Idempotência.**
    - O pedido pode trazer `id`. Nesse caso, `client_id` = UUID derivado de `sha256(token_id + ':' + id)`, com os bits de versão e variante do v4 ajustados.
    - O insert usa `onConflict: 'workspace_id,client_id'` com `ignoreDuplicates`, e o retry devolve o lançamento que já existe.
    - Sem `id`, cada pedido é um lançamento.
13. **O lembrete das 20h** vale para cada pessoa que tem itens `needs_review` **lançados por ela** (`user_id`), por carteira.
    - Uma vez por dia, com dedupe.
    - Desliga pela preferência nova `notify_review`.
14. **A frase rápida no app só preenche o formulário.** Quem salva é a pessoa, pelo botão de sempre.
    - O payload ganha `source: 'quick_text'`.
    - Ganha `needsReview: true` quando o parser teve dúvida.
    - **Editar e salvar tira a marca** (spec §7).

## Foco de revisão

1. **Retry do Atalho com o mesmo `id`:** não duplica e devolve o mesmo lançamento. Sem `id`, dois toques fazem dois lançamentos. (Tarefa 3: teste Deno de `clientIdDoPedido`, e teste de fonte do `ignoreDuplicates`.)
2. **Token revogado, desconhecido ou mal formado:**
   - devolve `401 { error: 'Token inválido.' }`, sem dizer qual dos três;
   - o token nunca é gravado em texto;
   - a lista de tokens nunca mostra o valor.
   (Tarefas 1 e 3.)
3. **Cartão reconhecido numa carteira da qual a pessoa não é membro:** o lançamento fica na carteira padrão, sem cartão e com `needs_review`. Ele nunca vaza para a carteira alheia. (Tarefa 3, teste Deno de `montarLancamento`.)
4. **Frases difíceis:**
   - "mercado nubank", sem valor, devolve 422 e não grava;
   - "1.234,56", "12.50", "R$ 42" e "quarenta e dois" dão os valores certos;
   - "dia 31" num mês de 30 dias vira o último dia do mês;
   - "dia 25", quando hoje é dia 10, é do mês passado;
   - às 22h em Brasília (01h UTC), "hoje" é o dia de Brasília.
   (Tarefa 2, tabela de testes.)
5. **Enter no campo da frase dentro do formulário:** aplica a frase e não salva o lançamento. (Tarefa 5, teste de fonte do `preventDefault`.)

---

### Tarefa 1: Migração — tokens, alias da Wallet, plano, preferência e cron

**Arquivos:**
- Criar: `supabase/migrations/20261023120000_captura.sql`
- Modificar:
  - `src/types/database.ts`;
  - `src/lib/supabase.ts` (tipos `CaptureToken`, `CreditCard.wallet_alias`, `Transaction.capture_meta`);
  - `src/types/database-drift.ts`.
- Teste: `src/lib/captura/migracao-captura.test.ts`

**Interfaces (produz):**
- `public.capture_tokens`:
  - colunas:
    - `id uuid pk default gen_random_uuid()`;
    - `user_id uuid not null references auth.users on delete cascade`;
    - `workspace_id uuid not null references workspaces on delete cascade`, a carteira padrão;
    - `name text not null check (char_length(name) between 1 and 60)`;
    - `token_hash text not null unique`;
    - `created_at timestamptz not null default now()`;
    - `last_used_at timestamptz`;
    - `revoked_at timestamptz`.
  - RLS: SELECT só `user_id = auth.uid()`. Sem política de INSERT, UPDATE nem DELETE.
  - `revoke select (token_hash) on public.capture_tokens from authenticated, anon`: o hash nunca chega ao cliente.
- `public.create_capture_token(p_workspace_id uuid, p_name text) returns text`:
  - `security definer`, `search_path = ''`;
  - recusa com `raise exception 'nao_membro'` se a pessoa não for membro;
  - recusa com `'limite_tokens'` se ela já tiver 10 ativos;
  - gera `'fac_' || encode(extensions.gen_random_bytes(32), 'hex')`;
  - grava `encode(extensions.digest(token, 'sha256'), 'hex')`;
  - devolve o token;
  - `grant execute` só a `authenticated`.
- `public.revoke_capture_token(p_id uuid) returns void`: `security definer`, marca `revoked_at = now()` só se `user_id = auth.uid()`.
- `public.workspace_plan(p_workspace_id uuid) returns text`: `language sql stable`, devolve `'familia'`. `grant execute` a `authenticated` e `service_role`.
- `credit_cards.wallet_alias text null`, com `check (wallet_alias is null or char_length(wallet_alias) between 1 and 60)`.
- `transactions.capture_meta jsonb null`.
- `workspace_member_notification_prefs.notify_review boolean not null default true`.
- `public.review_reminder_dedupe(user_id uuid, workspace_id uuid, sent_on date, primary key (user_id, workspace_id, sent_on))`. RLS ligada, sem política: só a service role usa.
- O cron `review-reminder-daily`, em `'0 23 * * *'` (20h em Brasília), com `select public.invoke_edge_function('review-reminder')`. O padrão do bloco `if exists` está em `20261021120000_internal_edge_dispatch.sql`.

- [ ] **Passo 1: teste de fonte que falha.** `migracao-captura.test.ts` confere, no SQL:
  - `token_hash text not null unique` e `revoke select (token_hash)`;
  - `create_capture_token` com `security definer`, `set search_path = ''`, `'limite_tokens'`, `gen_random_bytes(32)` e `digest(`;
  - `workspace_plan` devolvendo `'familia'`;
  - `wallet_alias`, `capture_meta jsonb`, `notify_review boolean not null default true`;
  - `review-reminder-daily` com `'0 23 * * *'`;
  - nenhum `drop column` nem `alter column ... type` (compatibilidade com o front de `main`).
- [ ] **Passo 2:** `npx vitest run src/lib/captura/migracao-captura.test.ts`. Esperado: FAIL.
- [ ] **Passo 3:** escrever a migração e os tipos.
- [ ] **Passo 4:** `npx tsc --noEmit && npm run test:unit`. Esperado: PASS.
- [ ] **Passo 5:** commit `feat(captura): tokens de captura, alias da Wallet, workspace_plan e lembrete`.

### Tarefa 2: Parser da frase, cartão e histórico

**Arquivos:**
- Criar:
  - `supabase/functions/_shared/frase.ts` (**sem nenhum import**);
  - `supabase/functions/_shared/frase.test.ts` (Deno, casos-chave);
  - `src/lib/captura/frase.ts` (reexporta: `export * from "../../../supabase/functions/_shared/frase"`).
- Teste: `src/lib/captura/frase.test.ts` (Vitest, a tabela completa).
- Modificar: `src/lib/import/normalizar.ts`. `normalizarDescricao` e `palavraSignificativa` passam a reexportar as de `frase.ts`, e os testes atuais seguem verdes.

**Interfaces (produz):**
```ts
export type FormaDePagamento = "pix" | "debit" | "credit_card" | "cash"
export type FraseInterpretada = {
  valor: number | null            // sempre positivo
  data: string                    // YYYY-MM-DD
  parcelas: number | null         // "em 3x", "3x", "em 3 vezes"
  tipo: "expense" | "income"
  estorno: boolean
  forma: FormaDePagamento | null
  cartaoTexto: string | null      // palavra que sobrou e pode ser cartão
  descricao: string
  duvidas: string[]               // "valor", "data", "cartao"
}
export function normalizarDescricao(s: string): string
export function palavraSignificativa(s: string): string | null
export function interpretarFrase(texto: string, hoje: string): FraseInterpretada
export type CartaoParaCasar = { id: string; name: string; wallet_alias: string | null; last_four: string | null; workspace_id: string; is_active: boolean }
export function casarCartao(texto: string | null, cartoes: CartaoParaCasar[]): CartaoParaCasar | null
export type LinhaHistorico = { description: string | null; category_id: string | null; payment_method: string | null; payment_credit_card_id: string | null; date: string; type: "expense" | "income" }
export function preencherPeloHistorico(descricao: string, tipo: "expense" | "income", historico: LinhaHistorico[]): { categoryId: string | null; paymentMethod: string | null; creditCardId: string | null }
```

**Regras que os testes fixam:**
- **Valor:**
  - casos: "42", "42,90", "R$ 42", "1.234,56", "12.50" (ponto com 2 decimais é decimal) e "1.234" (mil);
  - por extenso: zero a novecentos e noventa e nove, mais "mil", ligados por "e" ("quarenta e dois", "cento e vinte", "mil e duzentos"), com "reais" opcional;
  - o primeiro número da frase que não é "Nx" nem "dia N" é o valor.
- **Data:**
  - "hoje", "ontem", "anteontem";
  - "dia N" é do mês corrente, ou do mês passado quando N é maior que hoje; N maior que o último dia do mês vira o último dia;
  - "dd/mm" usa o ano de hoje;
  - sem data, `hoje`.
- **Parcelas:** "em 10x", "10x", "em 10 vezes", de 2 a 48. Fora disso vira dúvida `parcelas`.
- **Tipo:**
  - "recebi", "receita", "salário" ou "salario" dão `income`;
  - "estorno" ou "estornou" dão `income` com `estorno: true`.
- **Forma:**
  - "pix" dá `pix`;
  - "débito", "debito" ou "no débito" dão `debit`;
  - "dinheiro" dá `cash`;
  - "crédito", "credito" ou "cartão" dão `credit_card`.
- **Descrição:** o resto, sem as palavras consumidas, com o espaço colapsado e a primeira letra maiúscula. Vazia vira "Lançamento rápido" e entra em `duvidas`.
- **`casarCartao`:**
  - compara normalizado e só cartões ativos;
  - a ordem é: `wallet_alias` igual; depois uma palavra do texto igual a uma palavra do `name`, com 3 letras ou mais; depois os 4 dígitos iguais a `last_four`;
  - mais de um candidato no mesmo nível dá `null`.
- **`preencherPeloHistorico`:**
  - procura a linha mais recente de mesmo `tipo` com a mesma descrição normalizada;
  - sem ela, a de mesma `palavraSignificativa`;
  - devolve os três campos dela.
- Casos do Foco 4, com `hoje = "2026-04-10"`:
  - `interpretarFrase("dia 31 farmácia 20", hoje).data === "2026-03-31"`;
  - "dia 25" dá `"2026-03-25"`.

- [ ] **Passo 1:** escrever a tabela Vitest e os casos Deno (que falham). A tabela tem pelo menos 30 linhas e cobre cada regra acima. Uma delas: `interpretarFrase("42 mercado nubank em 3x", "2026-10-21")` → `{ valor: 42, parcelas: 3, cartaoTexto: "nubank", descricao: "Mercado", tipo: "expense", data: "2026-10-21" }`.
- [ ] **Passo 2:** `npx vitest run src/lib/captura/frase.test.ts && npm run test:edge`. Esperado: FAIL.
- [ ] **Passo 3:** implementar `frase.ts`. Se o `next build` recusar o import relativo para fora de `src/`, troque o reexporte por uma cópia em `src/lib/captura/frase.ts`. Nesse caso, um teste compara as duas fontes byte a byte, que é o padrão de `src/lib/transaction-notify-rules.ts`.
- [ ] **Passo 4:** `npm run test:unit && npm run test:edge && npm run build`. Esperado: PASS.
- [ ] **Passo 5:** commit `feat(captura): parser da frase, cartão e histórico compartilhados`.

### Tarefa 3: Edge `capture` e avaliadores pelo servidor

**Arquivos:**
- Criar:
  - `supabase/functions/_shared/captura.ts` (puro);
  - `supabase/functions/_shared/captura.test.ts`;
  - `supabase/functions/_shared/service-auth.ts`, com `isServiceAuthorized(req: Request): boolean`, movido de `notify-transaction-created`;
  - `supabase/functions/capture/index.ts`.
- Modificar:
  - `supabase/functions/notify-transaction-created/index.ts`, que importa o `isServiceAuthorized`;
  - `supabase/functions/evaluate-budgets/index.ts` e `evaluate-credit-card-alerts/index.ts` (caminho de serviço, Decisão 9);
  - `supabase/config.toml` (`[functions.capture] verify_jwt = false`);
  - `package.json` (`supabase:deploy:functions` inclui `capture`).

**Interfaces:**
- Consome a Tarefa 2 (`interpretarFrase`, `casarCartao`, `preencherPeloHistorico`) e a Tarefa 1 (`capture_tokens`, `workspace_plan`, `capture_meta`).
- Produz:
```ts
// _shared/captura.ts
export type PedidoCaptura = { id?: string; text?: string; amount?: number | string; merchant?: string; card?: string; date?: string; source?: "shortcut" | "apple_pay" | "share" }
export function validarPedido(body: unknown): { ok: true; pedido: PedidoCaptura } | { ok: false; erro: string }
export function clientIdDoPedido(tokenId: string, id: string): Promise<string>   // UUID v4-like de sha256
export type ContextoCaptura = { userId: string; carteiraPadrao: string; carteirasDaPessoa: string[]; cartoes: CartaoParaCasar[]; historicoPorCarteira: Record<string, LinhaHistorico[]>; hoje: string }
export function montarLancamento(pedido: PedidoCaptura, ctx: ContextoCaptura): { ok: true; linha: LinhaCaptura; resumo: string } | { ok: false; status: 422; erro: string }
```
- `LinhaCaptura` carrega:
  - os campos de `transactions`: `workspace_id`, `user_id`, `type`, `amount`, `description`, `date`, `payment_method`, `payment_credit_card_id`, `category_id`, `source` e `needs_review`;
  - `capture_meta`, que é `{ walletCard?: string, texto?: string }`.
- **Carteira de destino:** um cartão casado numa carteira de `carteirasDaPessoa` leva o lançamento para a carteira do cartão, e o histórico usado é o dessa carteira (spec §7). Um cartão fora dessas carteiras é ignorado (Foco 3).
- `parcelas > 1` ainda vira lançamento simples, com "(1/N)" na descrição e `needs_review`. Criar um plano de parcelamento pelo servidor fica para o 3B.
- **Contrato HTTP de `capture`:** `POST`, com `Authorization: Bearer fac_…` e o corpo `PedidoCaptura`.
  - 200 devolve `{ ok: true, id, needs_review, resumo }`. O `resumo` tem o formato "R$ 42,00 · Mercado · Nubank".
  - 401 devolve `{ error: 'Token inválido.' }`.
  - 402 devolve `{ error: 'Sem plano ativo nesta carteira.' }`.
  - 422 devolve `{ error }`.
  - 413 recusa corpo acima de 16 KB.
  - 405 é para método que não seja POST nem OPTIONS.
- **Mensagens 422 exatas:**
  - "Não entendi o valor. Ex.: 42 mercado";
  - "Texto acima de 500 caracteres.";
  - "Valor acima do limite." (> 1.000.000).

**Ordem dentro da função:**
1. Calcula o `sha256` do token e busca o `capture_tokens` ativo.
2. Chama `rpc('workspace_plan')`.
3. Confere que a pessoa ainda é membro da carteira padrão.
4. Carrega os cartões ativos e os últimos 300 lançamentos de cada carteira envolvida.
5. Roda `montarLancamento`.
6. Faz o insert com `ignoreDuplicates`. Em conflito, relê pelo `client_id`.
7. Atualiza `last_used_at`.
8. Chama `evaluate-budgets` e `evaluate-credit-card-alerts` por `fetch` com `x-cron-secret`, em `EdgeRuntime.waitUntil` ou com `await` curto. A falha só vira log.

- [ ] **Passo 1: testes Deno que falham.**
  - `clientIdDoPedido('t1', 'abc')` é estável e tem a forma de UUID; `('t1', 'abd')` dá outro.
  - `montarLancamento`:
    - "42 mercado" sem histórico dá `needs_review: true` e categoria nula;
    - com histórico, pega a categoria;
    - um cartão de uma carteira fora de `carteirasDaPessoa` não é usado, e o item fica na padrão com `needs_review` (Foco 3);
    - Apple Pay sem casamento grava `capture_meta.walletCard`;
    - sem valor devolve 422 com a mensagem exata.
  - `validarPedido` recusa texto acima de 500 caracteres e `amount` negativo.
  - Um teste de fonte (Vitest) confere em `capture/index.ts`:
    - `ignoreDuplicates: true`;
    - `workspace_plan`;
    - `'Token inválido.'`;
    - que o hash é calculado antes da busca.
  - Outro confere, nos dois avaliadores, que `isServiceAuthorized` vem antes do `bearerJwt`.
- [ ] **Passo 2:** `npm run test:edge && npm run test:unit`. Esperado: FAIL.
- [ ] **Passo 3:** implementar.
- [ ] **Passo 4:** `npx tsc --noEmit && npm run lint && npm run test:unit && npm run test:edge`. Esperado: PASS.
- [ ] **Passo 5:** commit `feat(captura): Edge capture com token, plano e avaliadores pelo servidor`.

### Tarefa 4: Tokens na conta, Atalho do iPhone e Apple Pay que aprende o cartão

**Arquivos:**
- Criar:
  - `src/components/wireframe/captura-tokens-wireframe.tsx`;
  - `docs/captura/atalho-iphone.md`.
- Modificar:
  - `src/app/(app)/account/page-client.tsx`, onde entra a seção;
  - `src/components/wireframe/a-conferir-wireframe.tsx`, onde entra "Lembrar … como este cartão".
- Teste: amplie `src/components/wireframe/wireframe.test.ts`.

**Interfaces:** consome as RPCs da Tarefa 1 e o contrato HTTP da Tarefa 3.

**O que o wireframe faz:**
- Lista os tokens (nome, carteira, criado em, último uso), cada um com "Revogar" (`rpc('revoke_capture_token')`).
- "Novo token" pede o nome do aparelho e a carteira padrão (`<select>` das carteiras da pessoa) e chama `rpc('create_capture_token')`.
- Mostra o token **uma vez**, com "Copiar" e o aviso "Guarde agora: ele não aparece de novo.".
- Mostra o endereço `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/capture`.
- Mostra as mensagens de erro de `nao_membro` e `limite_tokens` em português.
- Liga para `docs/captura/atalho-iphone.md` pelo GitHub, com caminho relativo no texto.

**O que o documento ensina, com o token e a URL sempre em marcador (`<TOKEN>`, `<URL>`):**
- o Atalho "Lançar gasto": Ditar texto → Obter conteúdo de URL (POST, JSON `{ text, source: "shortcut" }`, cabeçalho `Authorization: Bearer <TOKEN>`) → Mostrar resultado (`resumo`);
- a automação "Transação" do Apple Pay (iOS 17 ou mais), com o corpo `{ amount, merchant, card, source: "apple_pay" }` montado das variáveis Valor, Comerciante e Cartão;
- a folha de compartilhar: Extrair texto da imagem → o mesmo POST;
- revogar no app quando o aparelho for perdido;
- uma seção opcional, "Android avançado": o Tasker ou o MacroDroid leem a notificação do banco e fazem o mesmo POST (spec §7, só documentação).

**Na `AConferirWireframe`:** quando a transação tem `source === 'apple_pay'`, `capture_meta.walletCard` e um cartão escolhido, mostra o botão "Lembrar '<walletCard>' como este cartão". Ele faz um update em `credit_cards.wallet_alias`, que já tem RLS de membro.

- [ ] **Passo 1: teste de fonte que falha.**
  - O wireframe usa `create_capture_token`, `revoke_capture_token` e "Guarde agora: ele não aparece de novo.".
  - Nenhum `@/components/ui`.
  - Todo `<button>` tem `type`.
  - `atalho-iphone.md` não contém `supabase.co` nem `fac_` seguido de hex.
  - `a-conferir-wireframe.tsx` contém `wallet_alias`.
- [ ] **Passo 2:** `npx vitest run src/components/wireframe/wireframe.test.ts`. Esperado: FAIL.
- [ ] **Passo 3:** implementar.
- [ ] **Passo 4:** rodar o fechamento padrão e `npm run ds:audit -- src/components/wireframe`. Esperado: PASS.
- [ ] **Passo 5:** commit `feat(captura): tokens na conta, guia do Atalho e alias da Wallet`.

### Tarefa 5: Frase rápida no "+", compartilhar do Android e atalhos do ícone

**Arquivos:**
- Criar: `src/components/wireframe/frase-rapida-wireframe.tsx`
- Modificar:
  - o formulário de lançamento: o campo entra no topo, só na criação. Ache o ponto em `src/components/transactions/transaction-form-fields.tsx` / `transaction-form-use.tsx`;
  - `src/components/transactions/transaction-form-types.ts`, onde `TransactionFormSavePayload` ganha `source?: TransactionSource` e `needsReview?: boolean`;
  - `src/lib/transactions/mutations.ts` (`buildTransactionRow`):
    - grava `source` e `needs_review` quando vierem;
    - **na edição, grava `needs_review: false`** (Decisão 14);
    - o handler offline (`src/lib/offline/handlers/transactions.ts`) segue o mesmo row;
  - `src/components/layout/global-shell-dialogs-provider.tsx`, onde `openTransactionCreate(mode, opts?: { frase?: string })` repassa a frase inicial ao formulário;
  - `src/lib/transactions-list-search-params.ts`, que ganha `consumirParametroFrase(params): string | null`, no padrão do `consumirParametroImportar`;
  - `src/app/(app)/transactions/page-client.tsx`, que lê `?frase=`, abre a criação com a frase e limpa a URL;
  - `src/app/manifest.ts`:
    - acrescenta `share_target: { action: "/transactions", method: "GET", params: { text: "frase", title: "frase_titulo", url: "frase_url" } }`;
    - acrescenta o atalho "A conferir" → `/transactions?conferir=1`;
    - o atalho que existe passa a se chamar "Nova despesa".
- Teste: `src/lib/captura/frase-no-form.test.ts` (fonte e unidade).

**Interfaces:**
- Consome a Tarefa 2.
- `FraseRapidaWireframe({ fraseInicial?: string; cartoes: CartaoParaCasar[]; historico: LinhaHistorico[]; onAplicar(c: CamposDaFrase): void })`.
- `CamposDaFrase = { tipo; valor; data; descricao; paymentMethod; creditCardId; categoryId; parcelas; duvidas }`.
- Quando `parcelas > 1`, o formulário vai para o modo "Parcelada" com o número preenchido, se esse modo aceitar número inicial. Senão, fica uma dúvida visível.
- `consumirParametroFrase` junta `frase`, `frase_titulo` e `frase_url`, nessa ordem, separados por espaço, e corta em 500 caracteres.

**O que acontece:**
- Enter no campo chama `preventDefault` e aplica a frase. O botão "Preencher" tem `type="button"`.
- Aplicar preenche os campos e mostra as dúvidas em texto ("Confira: cartão").
- O salvar continua o de sempre, e o payload leva `source: 'quick_text'` e `needsReview: duvidas.length > 0`.
- Os avaliadores do cliente continuam como estão.

- [ ] **Passo 1: testes que falham.**
  - Fonte: o wireframe tem `preventDefault` no Enter e não tem `type="submit"` (Foco 5).
  - Unidade: `buildTransactionRow` na edição grava `needs_review: false`, e na criação com `source: 'quick_text'` grava os dois campos. Exporte a função para o teste, se preciso, com `/** @internal */`.
  - Unidade: `consumirParametroFrase(new URLSearchParams("frase=42%20mercado&frase_url=x"))` devolve `"42 mercado x"`.
  - Fonte: o manifest tem `share_target`, `method: "GET"` e `/transactions?conferir=1`.
- [ ] **Passo 2:** `npx vitest run src/lib/captura`. Esperado: FAIL.
- [ ] **Passo 3:** implementar.
- [ ] **Passo 4:** rodar o fechamento padrão, `npm run ds:audit -- src/components/wireframe` e `npm run build`. Esperado: PASS.
- [ ] **Passo 5:** commit `feat(captura): frase rápida no formulário, compartilhar do Android e atalhos do ícone`.

### Tarefa 6: Lista "A conferir", contagem no Painel e lembrete das 20h

**Arquivos:**
- Criar:
  - `src/components/wireframe/a-conferir-lista-wireframe.tsx`;
  - `src/components/wireframe/a-conferir-contagem-wireframe.tsx`;
  - `supabase/functions/review-reminder/index.ts`;
  - `supabase/functions/_shared/review-reminder.ts` (puro);
  - `supabase/functions/_shared/review-reminder.test.ts`.
- Modificar:
  - `src/app/(app)/transactions/page-client.tsx`: `?conferir=1` mostra a lista acima da de sempre;
  - `src/app/(app)/dashboard/page-client.tsx`: a contagem entra perto dos KPIs;
  - `_shared/notification-types.ts`: tipo `'review'` e `notify_review` em `WorkspaceNotificationPrefs`, `DEFAULT_NOTIFICATION_PREFS` e `isTypeAllowedForPrefs`;
  - `_shared/deliver-notification.ts` (`PREFS_COLUMNS`, `normalizePrefsRow`);
  - `src/lib/workspace-notification-prefs.ts`;
  - `src/app/(app)/settings/page-client.tsx`: um wireframe com a caixa "Lembrete às 20h de itens a conferir", que liga e desliga `notify_review` pelo `patchWorkspaceNotificationPrefs`;
  - `supabase/config.toml` (`[functions.review-reminder] verify_jwt = false`);
  - `package.json` (a lista de deploy).

**Interfaces:**
- **Lista:**
  - mostra até 50 itens `needs_review = true` da carteira atual, do mais recente ao mais antigo, com data, descrição, valor e a origem (`source` em português: "Frase", "Atalho", "Apple Pay", "Compartilhado", "Importado");
  - "Confirmar" faz o update de `needs_review: false` e invalida `["transactions"]`;
  - "Abrir" leva a `?txn=<id>`, que abre o detalhe com a `AConferirWireframe`;
  - vazia, mostra "Nada a conferir.".
- **Contagem:** `select id` com `{ count: 'exact', head: true }` filtrado por `needs_review`. Com N > 0, mostra "A conferir: N" com o link `/transactions?conferir=1`. Com zero, não aparece.
- **Lembrete:**
  - `pessoasParaLembrar(linhas: Array<{ user_id: string; workspace_id: string }>): Array<{ userId; workspaceId; total }>` agrupa as linhas;
  - a Edge confere `x-cron-secret`, lê os `needs_review` (paginado de 500 em 500), agrupa, faz o dedupe por `review_reminder_dedupe` (insert, com 23505 = já enviado) e entrega com `deliverNotification`:
    - `type: 'review'`;
    - título "Itens a conferir";
    - corpo "Você tem N lançamento(s) para conferir.";
    - `metadata.href: '/transactions?conferir=1'`.
  - se a entrega falhar, o dedupe é desfeito.

- [ ] **Passo 1: testes que falham.**
  - Deno: `pessoasParaLembrar` agrupa por pessoa e carteira e conta.
  - Fonte:
    - a Edge tem `secretMatches` antes da primeira consulta, `review_reminder_dedupe` e `'/transactions?conferir=1'`;
    - os wireframes não importam `@/components/ui`;
    - `isTypeAllowedForPrefs` mapeia `'review'` para `notify_review`.
- [ ] **Passo 2:** `npm run test:edge && npm run test:unit`. Esperado: FAIL.
- [ ] **Passo 3:** implementar.
- [ ] **Passo 4:** rodar o fechamento padrão, `npm run test:edge`, `npm run ds:audit -- src/components/wireframe` e `npm run build`. Esperado: PASS.
- [ ] **Passo 5:** commit `feat(captura): lista a conferir, contagem no Painel e lembrete das 20h`.

### Tarefa 7: Roteiro de publicação, jornadas e Atlas

**Arquivos:**
- Criar: `supabase/BLOCO_3A_DEPLOYMENT.md`
- Modificar:
  - `docs/JORNADAS.md`;
  - `docs/atlas/template.html`;
  - `docs/atlas/atlas-jornadas.html`, gerado.

- [ ] **Passo 1: o roteiro, em ordem.**
  1. Rodar `supabase db push` e conferir:
     - a tabela `capture_tokens` com RLS;
     - `has_column_privilege('authenticated', 'public.capture_tokens', 'token_hash', 'select')`, que deve dar `false`;
     - o cron `review-reminder-daily`;
     - `select public.workspace_plan('<WORKSPACE_ID>')`, que deve dar `familia`.
  2. Rodar `supabase functions deploy capture review-reminder evaluate-budgets evaluate-credit-card-alerts notify-transaction-created --use-api`.
  3. Teste de fumaça, com uma carteira de teste:
     - criar um token na conta;
     - `curl` com `<TOKEN>` e `{ "text": "1 teste captura" }`, que deve dar 200 com o `resumo`;
     - repetir com o mesmo `id`, que deve devolver o mesmo `id`;
     - revogar o token, e o próximo pedido dá 401;
     - apagar o lançamento de teste.
  4. Compatibilidade: o front de `main` não usa nada disso. Os avaliadores continuam aceitando o JWT.
- [ ] **Passo 2: o `JORNADAS.md`.** Entram as jornadas de:
  - frase rápida no "+";
  - instalar o Atalho (o token na conta, depois o guia);
  - Apple Pay, até "a conferir" e "lembrar cartão";
  - compartilhar no Android (`?frase=`);
  - lista "A conferir" (`?conferir=1`, o Painel e o lembrete).
  Atualize o backend (tabela, RPCs, as Edges `capture` e `review-reminder`, o cron) e as lacunas. Em particular, registre como lacunas: a imagem crua, o PDF e o arquivo do compartilhar, que ficam para o 3B; e a parcela capturada, que vira lançamento simples. Depois, o `template.html`, e então `python3 docs/atlas/build.py`.
- [ ] **Passo 3:** `git diff --cached | grep -E "supabase\.co/|eyJ|postgres(ql)?://[^<]|fac_[0-9a-f]{8}"`. Esperado: nenhuma linha.
- [ ] **Passo 4:** commit `docs(captura): roteiro do Bloco 3A, jornadas e Atlas`.
- [ ] **Passo 5 (orquestrador):** republicar o Atlas em https://claude.ai/artifact/1N43LFYP1YSVsWaRMaNTRL.
