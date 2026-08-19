-- 141 — Camada de terminologia (scaffold). Binding: conceito SINTERA → system/code/display/version + PROVENIÊNCIA
-- da codificação. DDL ADITIVO, idempotente, reversível. NÃO popula nada (nenhum LOINC/SNOMED/GAL inventado):
-- `system`/`code` nascem NULL; `concept_text` é sempre preservado. Invariante anti-codificação-silenciosa:
-- um binding 'confirmed' EXIGE system+code+coded_by+coded_at (não se confirma código sem fonte e sem autor).
-- NÃO toca tabelas existentes nem o Ciclo 1. Rollback: docs/c2/rollback_141_terminology.sql.

do $$ begin
  if not exists (select 1 from pg_type where typname='terminology_status') then
    create type public.terminology_status as enum ('unmapped','proposed','confirmed');
  end if;
  if not exists (select 1 from pg_type where typname='terminology_source') then
    create type public.terminology_source as enum ('manual_curation','catalog','imported','ai_suggested');
  end if;
end $$;

-- FHIR CodeableConcept.coding + proveniência da codificação (conceito → código).
create table if not exists public.terminology_bindings (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null,
  concept_text  text not null,                      -- conceito original (SEMPRE preservado; nunca perdido).
  target_type   text,                               -- contexto: service_request_code | observation_code | body_site | ...
  target_id     uuid,                               -- referência opcional à linha codificada (polimórfico; sem FK).
  -- FHIR coding (NULL até curadoria — NÃO inventar):
  system        text,                               -- URI oficial (LOINC/SNOMED/…) — NULL até confirmação. [NC]
  code          text,                               -- código no sistema — NULL até curadoria. [NC]
  display       text,
  version       text,                               -- versão da terminologia.
  -- proveniência da codificação:
  coding_source public.terminology_source,
  coded_by      uuid,
  coded_at      timestamptz,
  confidence    numeric check (confidence is null or (confidence >= 0 and confidence <= 1)),
  status        public.terminology_status not null default 'unmapped',
  created_at    timestamptz not null default now(),
  -- INVARIANTE anti-codificação-silenciosa: confirmado ⇒ system+code+autor+instante presentes.
  constraint chk_confirmed_coding
    check (status <> 'confirmed' or (system is not null and code is not null and coded_by is not null and coded_at is not null))
);
create index if not exists idx_terminology_bindings_user    on public.terminology_bindings(user_id);
create index if not exists idx_terminology_bindings_target  on public.terminology_bindings(target_type, target_id);
create index if not exists idx_terminology_bindings_concept on public.terminology_bindings(concept_text);

alter table public.terminology_bindings enable row level security;
drop policy if exists terminology_bindings_select on public.terminology_bindings;
create policy terminology_bindings_select on public.terminology_bindings for select using (auth.uid() = user_id);
drop policy if exists terminology_bindings_insert on public.terminology_bindings;
create policy terminology_bindings_insert on public.terminology_bindings for insert with check (auth.uid() = user_id);
drop policy if exists terminology_bindings_update on public.terminology_bindings;
create policy terminology_bindings_update on public.terminology_bindings for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists terminology_bindings_delete on public.terminology_bindings;
create policy terminology_bindings_delete on public.terminology_bindings for delete using (auth.uid() = user_id);
