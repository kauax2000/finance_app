-- Atalho por gatilho (19/nov/2026): `capture_tokens.atalho_gatilho` é o que
-- disparou o atalho por último (cabeçalho `X-Atalho-Gatilho`: siri, acao,
-- toque, bloqueio ou inicio; nulo = nunca informou). Só a Edge `capture` escreve;
-- o select é concedido por coluna (20261023120000_captura.sql), então a coluna
-- nova precisa do próprio grant, ou a lista de aparelhos dá 42501.
alter table public.capture_tokens
    add column if not exists atalho_gatilho text
    check (atalho_gatilho in ('siri', 'acao', 'toque', 'bloqueio', 'inicio'));

grant select (atalho_gatilho) on public.capture_tokens to authenticated;
