-- ============================================================
-- SINTERA — Schema inicial
-- Execute no Supabase SQL Editor:
-- Dashboard → SQL Editor → New Query → Cole e execute
-- ============================================================

-- Tabela de perfis (extensão do auth.users)
create table if not exists public.profiles (
  id               uuid references auth.users on delete cascade primary key,
  name             text,
  age_range        text,
  cycle_length     integer default 28,
  last_period      date,
  cycle_regularity text,
  goals            text[] default '{}',
  pref_daily_reminder  boolean default true,
  pref_phase_alerts    boolean default true,
  pref_email_insights  boolean default false,
  avatar_url       text,
  created_at       timestamptz default now(),
  updated_at       timestamptz default now()
);

-- Row Level Security
alter table public.profiles enable row level security;

create policy "Usuários veem apenas seu próprio perfil"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Usuários criam seu próprio perfil"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "Usuários atualizam seu próprio perfil"
  on public.profiles for update
  using (auth.uid() = id);

-- Criar perfil automaticamente após cadastro
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id)
  values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Atualizar updated_at automaticamente
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.set_updated_at();

-- ============================================================
-- Storage bucket para exames
-- Execute no Supabase Dashboard → Storage → New bucket
-- Nome: exams | Public: false
-- Ou via SQL Editor:
-- ============================================================

insert into storage.buckets (id, name, public)
values ('exams', 'exams', false)
on conflict (id) do nothing;

-- RLS para o bucket exams
create policy "Usuária faz upload dos próprios exames"
  on storage.objects for insert
  with check (bucket_id = 'exams' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Usuária vê os próprios exames"
  on storage.objects for select
  using (bucket_id = 'exams' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Usuária deleta os próprios exames"
  on storage.objects for delete
  using (bucket_id = 'exams' and auth.uid()::text = (storage.foldername(name))[1]);

-- ============================================================
-- Tabelas futuras (Fase 2 do Master Plan)
-- ============================================================

-- Exames (MVP futuro)
create table if not exists public.exams (
  id          uuid default gen_random_uuid() primary key,
  user_id     uuid references auth.users on delete cascade not null,
  type        text,
  exam_date   date,
  file_url    text,
  status      text default 'pending', -- pending | processed | error
  notes       text,
  created_at  timestamptz default now()
);

alter table public.exams enable row level security;
create policy "Usuários veem seus exames" on public.exams for select using (auth.uid() = user_id);
create policy "Usuários criam seus exames" on public.exams for insert with check (auth.uid() = user_id);
create policy "Usuários atualizam seus exames" on public.exams for update using (auth.uid() = user_id);

-- Biomarcadores (MVP futuro)
create table if not exists public.biomarkers (
  id              uuid default gen_random_uuid() primary key,
  exam_id         uuid references public.exams on delete cascade,
  user_id         uuid references auth.users on delete cascade not null,
  name            text not null,
  value           numeric,
  unit            text,
  reference_min   numeric,
  reference_max   numeric,
  interpretation  text, -- low | normal | high | critical
  ai_insight      text,
  created_at      timestamptz default now()
);

alter table public.biomarkers enable row level security;
create policy "Usuários veem seus biomarcadores" on public.biomarkers for select using (auth.uid() = user_id);
create policy "Usuários criam seus biomarcadores" on public.biomarkers for insert with check (auth.uid() = user_id);

-- Insights de IA
create table if not exists public.ai_insights (
  id          uuid default gen_random_uuid() primary key,
  user_id     uuid references auth.users on delete cascade not null,
  insight     text not null,
  category    text, -- cycle | energy | sleep | hormones | nutrition | general
  priority    text default 'medium', -- low | medium | high
  is_read     boolean default false,
  created_at  timestamptz default now()
);

alter table public.ai_insights enable row level security;
create policy "Usuários veem seus insights" on public.ai_insights for select using (auth.uid() = user_id);
create policy "Usuários criam seus insights" on public.ai_insights for insert with check (auth.uid() = user_id);
create policy "Usuários atualizam seus insights" on public.ai_insights for update using (auth.uid() = user_id);

-- Score biológico
create table if not exists public.biological_scores (
  id              uuid default gen_random_uuid() primary key,
  user_id         uuid references auth.users on delete cascade not null,
  score_total     integer,
  score_metabolic    integer,
  score_hormonal     integer,
  score_inflammatory integer,
  score_cardiovascular integer,
  score_cognitive    integer,
  score_performance  integer,
  score_longevity    integer,
  scored_at       timestamptz default now()
);

alter table public.biological_scores enable row level security;
create policy "Usuários veem seus scores" on public.biological_scores for select using (auth.uid() = user_id);
create policy "Usuários criam seus scores" on public.biological_scores for insert with check (auth.uid() = user_id);
