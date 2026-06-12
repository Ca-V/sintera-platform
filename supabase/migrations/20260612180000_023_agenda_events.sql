-- ============================================================
-- Migration 023 — Agenda / Planejamento de Saúde (Fase 1)
-- ============================================================
-- Armazena eventos de saúde da usuária (exames, consultas, retornos,
-- medicação, outros). SEM inteligência clínica: apenas organização.
-- Notificações e sugestões inteligentes ficam para fases seguintes.
-- ============================================================

create table if not exists public.agenda_events (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users on delete cascade,
  event_type   text not null check (event_type in ('exame','consulta','retorno','medicacao','outro')),
  title        text not null,
  event_date   date not null,
  event_time   time,
  duration_min integer default 60,
  notes        text,
  status       text not null default 'pending' check (status in ('pending','done','cancelled')),
  -- Vínculo opcional a um exame (ex.: "repetir Hemograma" originado de um laudo).
  exam_id      uuid references public.exams(id) on delete set null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

alter table public.agenda_events enable row level security;

-- Idempotente: permite re-aplicação segura (CI / migração já aplicada à mão).
drop policy if exists "agenda_events_select" on public.agenda_events;
create policy "agenda_events_select" on public.agenda_events
  for select using ((select auth.uid()) = user_id);
drop policy if exists "agenda_events_insert" on public.agenda_events;
create policy "agenda_events_insert" on public.agenda_events
  for insert with check ((select auth.uid()) = user_id);
drop policy if exists "agenda_events_update" on public.agenda_events;
create policy "agenda_events_update" on public.agenda_events
  for update using ((select auth.uid()) = user_id)
              with check ((select auth.uid()) = user_id);
drop policy if exists "agenda_events_delete" on public.agenda_events;
create policy "agenda_events_delete" on public.agenda_events
  for delete using ((select auth.uid()) = user_id);

create index if not exists agenda_events_user_date_idx on public.agenda_events (user_id, event_date);
create index if not exists agenda_events_status_idx     on public.agenda_events (user_id, status);

-- Reaproveita set_updated_at() (migração 002).
drop trigger if exists agenda_events_updated_at on public.agenda_events;
create trigger agenda_events_updated_at
  before update on public.agenda_events
  for each row execute procedure public.set_updated_at();
