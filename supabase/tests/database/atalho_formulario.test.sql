-- pgTAP: colunas do atalho com formulário (20261103160000_atalho_formulario)
begin;
select plan(13);

select has_column('public', 'user_settings', 'lancamento_inteligente', 'user_settings.lancamento_inteligente existe');
select col_type_is('public', 'user_settings', 'lancamento_inteligente', 'boolean', 'lancamento_inteligente é boolean');
select col_not_null('public', 'user_settings', 'lancamento_inteligente', 'lancamento_inteligente NOT NULL');
select col_default_is('public', 'user_settings', 'lancamento_inteligente', 'true', 'lancamento_inteligente default true');

select has_column('public', 'user_settings', 'lancamento_inteligente_em', 'user_settings.lancamento_inteligente_em existe');
select col_type_is('public', 'user_settings', 'lancamento_inteligente_em', 'timestamp with time zone', 'lancamento_inteligente_em é timestamptz');
select col_is_null('public', 'user_settings', 'lancamento_inteligente_em', 'lancamento_inteligente_em aceita nulo');

select has_column('public', 'capture_tokens', 'atalho_versao', 'capture_tokens.atalho_versao existe');
select col_type_is('public', 'capture_tokens', 'atalho_versao', 'smallint', 'atalho_versao é smallint (nulo = v1)');

select ok(
  has_column_privilege('authenticated', 'public.capture_tokens', 'atalho_versao', 'SELECT'),
  'authenticated lê capture_tokens.atalho_versao (o grant é por coluna)'
);
select ok(
  not has_column_privilege('authenticated', 'public.capture_tokens', 'token_hash', 'SELECT'),
  'o hash continua fora do authenticated'
);
select ok(
  has_column_privilege('authenticated', 'public.user_settings', 'lancamento_inteligente', 'SELECT,UPDATE'),
  'authenticated lê e atualiza user_settings.lancamento_inteligente'
);
select ok(
  has_column_privilege('authenticated', 'public.user_settings', 'lancamento_inteligente_em', 'SELECT,UPDATE'),
  'authenticated lê e atualiza user_settings.lancamento_inteligente_em'
);

select * from finish();
rollback;
