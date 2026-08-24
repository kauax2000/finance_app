Revisão completa do backend (Supabase: SQL/RLS/RPCs + Edge Functions) e da camada de dados do cliente, a partir de uma auditoria em três frentes. **A maior parte já está aplicada em produção** — ver "Estado do deploy" no fim.

## Por que

A auditoria encontrou três falhas exploráveis e uma corrida que cobrava o usuário duas vezes. Além disso, `supabase db reset` não conseguia construir o banco do zero: metade do schema vivia em ~30 SQLs soltos rodados à mão.

## O que muda

### Segurança

| Falha | Correção |
|---|---|
| `delete_workspace_installment_plan_cascade` falhava **aberto** com `auth.uid()` NULL — apagava plano e transações sem checar membership | Checagem de auth primeiro, com exceção |
| **Revogação de sessão contornável**: o POST de registro não passava pelo guard, então um dispositivo revogado se re-registrava com o JWT antigo | Guard de registro casando o `session_id` do GoTrue (nova coluna `auth_session_id`) |
| **`max_uses` de convite não era aplicado**: membership entrava antes do claim, então N aceites concorrentes passavam todos | RPC atômica `accept_workspace_invite` com row lock |
| Políticas de avatar permissivas (em prod, **só** essas existiam): qualquer autenticado sobrescrevia/apagava avatar alheio | Conjunto único owner-scoped |
| `token_hash` era hash 32-bit (colisão trivial); GET vazava `token_hash` | SHA-256 com leitura compatível; campos sensíveis fora da resposta |
| Auditoria forjável: `activity-logs` aceitava `ip`/`device` do caller | Derivados dos headers |
| Secrets comparados com `!==`; CORS `*` nas funções de cron | Comparação constant-time; CORS removido |

### Billing

`run_subscription_billing()` não travava a linha e o único guard era um `NOT EXISTS` sem índice. Como cron e catch-up do dashboard rodam concorrentemente, **dupla cobrança era possível**.

- Índices únicos parciais tornam a duplicata impossível no banco; guards viram `ON CONFLICT DO NOTHING` + `FOR UPDATE SKIP LOCKED`
- Lógica unificada em `charge_subscription_cycle` (eram ~100 linhas duplicadas e divergentes; o cron avançava só 1 ciclo por execução)
- **Fuso**: tudo comparava "hoje" em UTC num app pt-BR — entre 21h e meia-noite BRT, cobrança e "fatura fecha hoje" saíam um dia adiantados. Agora `app_today()` (America/Sao_Paulo)
- Vetores dourados de calendário validados em **três camadas** (Vitest, Deno, pgTAP), fechando a divergência cliente-local × edge-UTC que nenhum teste cobria

### Notificações

- Falha de email deixa de reportar erro total (in-app e push já entregues) — `workspace-invites-accept` devolvia 500 em aceite bem-sucedido, e o retry duplicava
- Dedupe de alerta de cartão passa a ser por usuário: antes, o primeiro membro notificado consumia o alerta do ciclo e os demais **nunca** recebiam
- Cron: paginação, prefs/emails em lote (eram N+1 por membro por evento), erro acumulado por item (um `return 500` abortava a rodada diária)

### Schema

- `transactions.workspace_id` NOT NULL + CASCADE: era nullable com `SET NULL`, e como o RLS filtra por membership, linha órfã virava **dinheiro invisível e indeletável**
- Budgets passam a ser workspace-scoped (o schema era ambíguo: unique por usuário, leitura por workspace, e os dois caminhos discordavam)
- 13 índices de FK criados, 6 redundantes removidos, checks de sanidade, `client_id` por workspace
- 32 políticas RLS com `(select auth.uid())` — sem o wrap, reavaliava por linha (advisor `auth_rls_initplan`)

### Cliente

- Assinaturas tinham handler offline, policy e `client_id` prontos mas **nada enfileirava** — caminho morto, com insert duplicado em duas telas
- Cartões: update/delete/toggle sem **nenhuma** invalidação — bundles serviam cartão já excluído
- Sync engine: backoff dormia dentro do loop segurando o lock (~3,5 min de fila travada)
- Cache persistido ganha namespace por usuário (vazamento entre contas no mesmo device)
- Bundle de categoria: 5 round-trips → 1

### Baseline do schema

`migrations/` agora é autossuficiente: `00000000000000_baseline.sql` substitui as 31 migrações antigas e os ~30 SQLs soltos. Removidos os arquivos que **desmontavam o RLS** se colados no SQL Editor (`fix-rls.sql`, `disable-rls.sql`, `fix-all-lints.sql`, `reset.sql`, `setup.sql`).

## Estado do deploy

**14 de 15 migrações já aplicadas em produção**, junto com as 11 Edge Functions.

Pendente apenas `20260824180000_drop_legacy_constraints.sql` — a fase *contract*. As migrações que trocam alvos de `onConflict` do cliente seguem **expand/contract**: as constraints novas entraram mantendo as legadas, então o cliente atualmente em produção continua funcionando. **Aplicar a 180000 só depois do merge e do deploy deste PR**, senão salvar orçamento e o replay offline quebram.

Antes de aplicar as migrações destrutivas, `docs/PRE_PUSH_VERDICT.sql` foi rodado em produção: **todos os contadores zero** — nenhuma transação, assinatura ou compra parcelada foi apagada (confirmado também pela ausência de `RAISE NOTICE` no push).

## Ação necessária do mantenedor

`Main Notes.md` foi removido do versionamento, mas continha **senhas do banco, token do Twilio e API key da MiniMax** em texto puro, presentes no repositório desde o primeiro commit (17/05). **As credenciais precisam ser rotacionadas** — remover o arquivo não desfaz a exposição no histórico. Twilio e MiniMax não são usados no código; a senha do Supabase é a crítica. Depois de rotacionar, rode `npx supabase link` novamente antes do push final.

## Verificação

| Suite | Resultado |
|---|---|
| `supabase db reset` do zero | baseline + 15 migrações |
| pgTAP | 108 testes / 13 arquivos (6 suites novas) |
| Vitest | 189 testes / 24 arquivos |
| Deno (`npm run test:edge`) | 12 testes; 15/15 functions em `deno check` |
| Lint / tsc | 0 erros |
| Build + Playwright smoke | verde |
| Guards em produção | 401 nas 5 functions testadas |

## Adiado deliberadamente

Redesign do motor offline (remap de id provisório, resolução de conflito), outbox de entrega de notificações e timezone configurável por workspace — documentados em `src/lib/offline/README.md` e no plano.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
