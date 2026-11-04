-- Atalho com formulário (3/nov/2026): o "Lançamento inteligente" (frase ou
-- formulário) passa do aparelho para a conta, para o atalho do iPhone saber o
-- modo pelo GET da Edge `capture`. Sem linha em user_settings, ou com o padrão,
-- vale a frase. `lancamento_inteligente_em` é quando a pessoa escolheu (nulo =
-- nunca escolheu): o `"0"` antigo do aparelho só migra para a conta com ele nulo.
-- `capture_tokens.atalho_versao` é a versão do atalho que usou o token por
-- último (cabeçalho `X-Atalho-Versao`; nulo = atalho v1, que precisa baixar de
-- novo). As políticas de user_settings (cada um lê e atualiza a própria linha)
-- já cobrem as colunas novas, e o GRANT ALL de tabela do baseline também.
-- capture_tokens só é escrito pela Edge, mas o select dele é concedido por
-- coluna (20261023120000_captura.sql): a coluna nova precisa do próprio grant,
-- ou a lista de aparelhos dá 42501.
alter table public.user_settings
    add column if not exists lancamento_inteligente boolean not null default true,
    add column if not exists lancamento_inteligente_em timestamptz;

alter table public.capture_tokens
    add column if not exists atalho_versao smallint;

grant select (atalho_versao) on public.capture_tokens to authenticated;
