-- 1d.2.1 Passo A — Allowlist de casos controlados + roteamento por motivo. INERTE.
-- Mantem o hash de producao intacto; adiciona excecao explicita, pequena, auditavel e com expiracao.
-- Inerte enquanto: canonical_write_mode='off' E allowlist vazia. Nenhuma mudanca de comportamento.

-- 1) Allowlist (refinamento #1: expires_at como rede de seguranca)
create table if not exists public.canonical_rollout_allowlist (
  exam_id    uuid primary key,
  note       text,
  added_by   text default current_user,
  created_at timestamptz not null default now(),
  expires_at timestamptz
);
alter table public.canonical_rollout_allowlist enable row level security;
do $$ begin
  if not exists (select 1 from pg_policy where polname='cra_select' and polrelid='public.canonical_rollout_allowlist'::regclass) then
    create policy cra_select on public.canonical_rollout_allowlist for select to authenticated using (true);
  end if;
end $$;
revoke all on public.canonical_rollout_allowlist from anon, authenticated;
grant select on public.canonical_rollout_allowlist to authenticated;
grant select, insert, update, delete on public.canonical_rollout_allowlist to service_role;

-- 2) Roteamento: valor unico por exame, allowlist (nao expirada) tem precedencia sobre o percentual.
--    Hash IDENTICO ao de producao (1d.2.0). Retorna o motivo (route_reason).
create or replace function public.canonical_route(p_exam_id uuid) returns text
 language sql stable security definer set search_path to ''
as $function$
  select case
    when coalesce((select value from public.system_flags where key='canonical_write_mode'),'off') <> 'on'
      then 'mode_off'
    when exists (select 1 from public.canonical_rollout_allowlist a
                 where a.exam_id = p_exam_id
                   and (a.expires_at is null or a.expires_at > now()))
      then 'allowlist'
    when (((hashtextextended(p_exam_id::text, 0) % 100) + 100) % 100)
         < coalesce((select value from public.system_flags where key='canonical_write_pct'),'0')::int
      then 'percent'
    else 'percent_miss'
  end;
$function$;
revoke all on function public.canonical_route(uuid) from public, anon;
grant execute on function public.canonical_route(uuid) to authenticated, service_role;

-- 3) should_write_canonical vira wrapper booleano sobre canonical_route (compatibilidade).
create or replace function public.should_write_canonical(p_exam_id uuid) returns boolean
 language sql stable security definer set search_path to ''
as $function$
  select public.canonical_route(p_exam_id) in ('allowlist','percent');
$function$;
revoke all on function public.should_write_canonical(uuid) from public, anon;
grant execute on function public.should_write_canonical(uuid) to authenticated, service_role;

-- 4) Telemetria: route_reason (refinamento #2 — coluna unica = origem).
alter table public.canonical_write_telemetry add column if not exists route_reason text;
