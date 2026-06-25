-- 1d.2.0 — Infra do Rollout Controlado. INERTE (canonical_write_pct=0).
-- Aplicada em producao via MCP em 25/06/2026 (version 20260625003305).
-- Flag de fracao + funcao de roteamento deterministico por exame + tabela de telemetria.

insert into public.system_flags (key, value) values ('canonical_write_pct','0')
  on conflict (key) do nothing;

create or replace function public.should_write_canonical(p_exam_id uuid) returns boolean
 language sql stable security definer set search_path to ''
as $function$
  select coalesce((select value from public.system_flags where key='canonical_write_mode'),'off') = 'on'
     and (((hashtextextended(p_exam_id::text, 0) % 100) + 100) % 100)
         < coalesce((select value from public.system_flags where key='canonical_write_pct'),'0')::int;
$function$;
revoke all on function public.should_write_canonical(uuid) from public, anon;
grant execute on function public.should_write_canonical(uuid) to authenticated, service_role;

create table if not exists public.canonical_write_telemetry (
  id uuid primary key default gen_random_uuid(),
  exam_id uuid,
  version_id uuid,
  action text,
  duration_ms numeric,
  pct int,
  created_at timestamptz not null default now()
);
alter table public.canonical_write_telemetry enable row level security;
do $$ begin
  if not exists (select 1 from pg_policy where polname='cwt_insert' and polrelid='public.canonical_write_telemetry'::regclass) then
    create policy cwt_insert on public.canonical_write_telemetry for insert to authenticated with check (true);
  end if;
  if not exists (select 1 from pg_policy where polname='cwt_select' and polrelid='public.canonical_write_telemetry'::regclass) then
    create policy cwt_select on public.canonical_write_telemetry for select to authenticated using (true);
  end if;
end $$;
revoke all on public.canonical_write_telemetry from anon;
grant insert, select on public.canonical_write_telemetry to authenticated;
grant select, insert, update, delete on public.canonical_write_telemetry to service_role;
