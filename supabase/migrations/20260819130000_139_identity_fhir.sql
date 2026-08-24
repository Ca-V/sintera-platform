-- 139 — Identidade estruturada (FHIR Patient / Practitioner / Organization + Identifier). C-2 → P0 identidade.
-- DDL ADITIVO, idempotente, reversível. NÃO toca profiles/exams/service_requests nem o baseline do Ciclo 1.
-- NÃO inventa system URIs oficiais nem valores de identificador: `system` nasce NULL ([NC] até fonte oficial);
-- `value` é preenchido só com dado real/curado (sintético em teste). `kind` é classificação INTERNA do tipo de
-- identificador (CPF/CNS/CNES/CNPJ/CRM), fato estrutural — não é o system FHIR. Identidade LOCAL (user_id) nunca
-- é substituída por CPF/CNS. Rollback: docs/c2/rollback_139_identity.sql.

do $$ begin
  if not exists (select 1 from pg_type where typname='party_type') then
    create type public.party_type as enum ('patient','practitioner','organization');
  end if;
  if not exists (select 1 from pg_type where typname='identifier_kind') then
    create type public.identifier_kind as enum ('cpf','cns','cnes','cnpj','crm','local','outro');
  end if;
end $$;

-- FHIR Patient (camada de identidade projetável; distinta de `profiles`, que NÃO é tocada).
create table if not exists public.patients (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null,              -- identidade LOCAL (não substituída por CPF/CNS).
  name       text,
  birth_date date,
  gender     text check (gender is null or gender in ('female','male','other','unknown')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_patients_user on public.patients(user_id);

-- FHIR Practitioner.
create table if not exists public.practitioners (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null,
  name       text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_practitioners_user on public.practitioners(user_id);

-- FHIR Organization.
create table if not exists public.organizations (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null,
  name       text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_organizations_user on public.organizations(user_id);

-- FHIR Identifier (0..* por parte). Exclusive-arc: exatamente UM proprietário (FK real → integridade referencial).
create table if not exists public.party_identifiers (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null,
  patient_id          uuid references public.patients(id) on delete cascade,
  practitioner_id     uuid references public.practitioners(id) on delete cascade,
  organization_id     uuid references public.organizations(id) on delete cascade,
  kind                public.identifier_kind not null,   -- classificação INTERNA (cpf/cns/cnes/cnpj/crm/local/outro).
  value               text not null,                     -- valor do identificador (nunca inventado; sintético em teste).
  system              text,                              -- URI oficial FHIR/BR-Core — NULL até confirmação. [NC]
  use                 text check (use is null or use in ('usual','official','temp','secondary','old')),
  period_start        date,
  period_end          date,
  assigner_text       text,
  verification_status text check (verification_status is null or verification_status in ('unverified','verified')) default 'unverified',
  created_at          timestamptz not null default now(),
  -- exatamente um proprietário (patient XOR practitioner XOR organization)
  constraint chk_one_party check (num_nonnulls(patient_id, practitioner_id, organization_id) = 1)
);
create index if not exists idx_party_identifiers_patient      on public.party_identifiers(patient_id);
create index if not exists idx_party_identifiers_practitioner on public.party_identifiers(practitioner_id);
create index if not exists idx_party_identifiers_organization on public.party_identifiers(organization_id);

-- RLS user-scoped nas 4 tabelas (idempotente).
do $$
declare t text;
begin
  foreach t in array array['patients','practitioners','organizations','party_identifiers'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists %I_select on public.%I', t, t);
    execute format('create policy %I_select on public.%I for select using (auth.uid() = user_id)', t, t);
    execute format('drop policy if exists %I_insert on public.%I', t, t);
    execute format('create policy %I_insert on public.%I for insert with check (auth.uid() = user_id)', t, t);
    execute format('drop policy if exists %I_update on public.%I', t, t);
    execute format('create policy %I_update on public.%I for update using (auth.uid() = user_id) with check (auth.uid() = user_id)', t, t);
    execute format('drop policy if exists %I_delete on public.%I', t, t);
    execute format('create policy %I_delete on public.%I for delete using (auth.uid() = user_id)', t, t);
  end loop;
end $$;
