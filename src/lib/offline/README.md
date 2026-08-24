# Offline (outbox) — estado atual e limitações conhecidas

## Como funciona

- Escritas passam por `executeMutation` (mutation-gateway): online executa
  direto; offline enfileira no outbox Dexie (`db.ts`/`outbox.ts`).
- `sync-engine.ts` drena o outbox ao reconectar, em ordem de criação, sem
  head-of-line blocking (falhas re-agendam um passe futuro; a fila continua).
- Idempotência de replay: `client_id` + unique `(workspace_id, client_id)` no
  banco; replays fazem upsert com `onConflict: "workspace_id,client_id"`.
- Após sync, eventos `finance:*` invalidam os caches TanStack por entidade.
- Fluxos edge-only (pagar conta, convites, sessões…) são bloqueados offline
  pela policy `OFFLINE_BLOCKED_ACTIONS` (`policies.ts`).

## Limitações conhecidas (deferidas — ver plano de melhorias)

1. **Sem remap temp-id → server-id.** Um insert offline devolve o `client_id`
   como id provisório; após o sync, o servidor atribui outro `id`. UI que
   guardar o id provisório fica com referência pendurada, e uma escrita
   offline dependente (ex.: transação usando categoria criada offline) falha
   no replay por FK.
2. **Sem resolução de conflito.** Updates são last-write-wins de linha
   inteira, sem precondição de `updated_at` — uma edição offline antiga pode
   sobrescrever uma edição mais nova de outro membro.
3. **Insert + delete offline da mesma linha** deixa o insert vencer no replay
   (o delete roda contra o id provisório e não encontra nada no servidor).
4. **`navigator.onLine` é otimista** (captive portal / Wi-Fi morto contam
   como online): nesses casos a escrita falha com erro de rede em vez de ser
   enfileirada.
5. **Dead-letter manual**: mutations com 5 falhas ficam `failed` e não são
   reprocessadas automaticamente (aparecem no contador de pendências).
