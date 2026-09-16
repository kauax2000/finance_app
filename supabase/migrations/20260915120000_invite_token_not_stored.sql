-- 1.16 — o token de convite deixa de ficar em texto puro.
--
-- `token_raw` era legível pelo dono e pelo convidado, ia para o cache do
-- cliente (IndexedDB) e bastava para entrar numa carteira. Quem valida é o
-- `token_hash`: o link existe só na resposta de `workspace-invites-create` e
-- no e-mail; reenviar gera um token novo; convite por e-mail é aceito pelo id,
-- porque quem decide ali é o e-mail, que `accept_workspace_invite` confere.
--
-- Ordem em produção: publicar as edge functions de convite ANTES desta
-- migração — a versão antiga de `workspace-invites-create` grava esta coluna.

alter table public.workspace_invites drop column if exists token_raw;
