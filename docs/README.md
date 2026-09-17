# Documentação

As regras do projeto para quem escreve código (humano ou agente) estão em
[`AGENTS.md`](../AGENTS.md). As operações do banco e das Edge Functions ficam em
[`supabase/README.md`](../supabase/README.md). O resto está aqui.

## Runbooks

| Arquivo | Para quê |
|---|---|
| [`BASELINE_RUNBOOK.md`](BASELINE_RUNBOOK.md) | Reconciliar produção com o baseline de migrações (concluído; tem o status no topo) |
| [`REVISAO_GERAL_RUNBOOK.md`](REVISAO_GERAL_RUNBOOK.md) | Ordem de deploy de `fix/revisao-geral` para produção |
| [`PERFORMANCE.md`](PERFORMANCE.md) | Como medir o bundle e o carregamento, e o que já foi feito |

## Design system

| Arquivo | Para quê |
|---|---|
| [`design/HISTORICO-DESIGN-SYSTEM.md`](design/HISTORICO-DESIGN-SYSTEM.md) | Diário das rodadas e backlog de migração: o porquê de cada regra do `AGENTS.md` |
| [`design/CONFORMIDADE-02.md`](design/CONFORMIDADE-02.md) | Estado atual da conformidade das telas com o DS |
| [`design/CONFORMIDADE-01.md`](design/CONFORMIDADE-01.md) | Registro histórico (substituído pela 02) |
| [`design/REVISAO-IMPECCABLE-01.md`](design/REVISAO-IMPECCABLE-01.md) | Diagnóstico de design de antes das correções |

## Arquivo

Artefatos de uso único, mantidos só como registro. Não rode de novo.

- [`arquivo/revisao-backend-2026-08/`](arquivo/revisao-backend-2026-08/): a
  descrição do PR da revisão de backend e os SQLs de pré-checagem
  (`PRE_PUSH_*.sql`) que foram rodados em produção antes do `db push`.
