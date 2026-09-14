begin;
select plan(1);

select hasnt_column(
  'public', 'workspace_invites', 'token_raw',
  'token de convite não fica em texto puro'
);

select * from finish();
rollback;
