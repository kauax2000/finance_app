-- Reativação (4/nov/2026): o sinal de acesso e o dedupe do push de ausência.
-- `ultimo_acesso_em` é o último acesso de qualquer lugar; `app_aberto_em`, a
-- última abertura pelo app instalado. Nulas até o primeiro registro (o primeiro
-- registro não é "volta"). As políticas de user_settings (cada um lê e atualiza
-- a própria linha) já cobrem as colunas novas.
alter table public.user_settings
  add column if not exists ultimo_acesso_em timestamptz,
  add column if not exists app_aberto_em timestamptz;

-- Dedupe: `referente` é a data do ultimo_acesso_em; um novo acesso muda a
-- referência e rearma os dois avisos (3 e 7 dias). Só a service role lê e grava.
create table if not exists public.reativacao_envios (
  user_id uuid not null references auth.users(id) on delete cascade,
  marco smallint not null check (marco in (3, 7)),
  referente date not null,
  enviado_em timestamptz not null default now(),
  primary key (user_id, marco, referente)
);

alter table public.reativacao_envios enable row level security;
revoke all on public.reativacao_envios from anon, authenticated;

-- 15h UTC = 12h em Brasília (hosted: extensão presente; local: no-op).
do $cron$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    perform cron.unschedule(j.jobid) from cron.job j
    where j.jobname = 'reativacao-daily';
    perform cron.schedule(
      'reativacao-daily', '0 15 * * *',
      $cmd$select public.invoke_edge_function('reativacao')$cmd$
    );
  end if;
end;
$cron$;
