-- ============================================================
-- Migration 103 — Tokens de push do app Mobile (Expo)
-- ============================================================
-- Guarda os Expo push tokens por usuária (um por dispositivo). O app registra o token
-- após o login (POST /api/push/register); o worker de lembretes envia o push (Canal 3)
-- via Expo Push API. Aditiva e idempotente — não altera nada existente.
-- ============================================================

create table if not exists public.push_tokens (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  token       text not null,
  platform    text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (user_id, token)
);

create index if not exists push_tokens_user_idx on public.push_tokens (user_id);

alter table public.push_tokens enable row level security;

-- A usuária gerencia apenas os próprios tokens (o worker usa service role, que ignora RLS).
do $$ begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'push_tokens' and policyname = 'push_tokens_own_select') then
    create policy push_tokens_own_select on public.push_tokens for select using (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'push_tokens' and policyname = 'push_tokens_own_insert') then
    create policy push_tokens_own_insert on public.push_tokens for insert with check (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'push_tokens' and policyname = 'push_tokens_own_update') then
    create policy push_tokens_own_update on public.push_tokens for update using (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'push_tokens' and policyname = 'push_tokens_own_delete') then
    create policy push_tokens_own_delete on public.push_tokens for delete using (auth.uid() = user_id);
  end if;
end $$;
