-- 142 — Governança: Consent (LGPD/FHIR) + AuditEvent (trilha append-only). DDL ADITIVO, idempotente, reversível.
-- NÃO popula nada. NÃO toca tabelas existentes nem o Ciclo 1. Consentimento ≠ base legal (LGPD): o Consent é o
-- INSTRUMENTO; `legal_basis` registra a hipótese legal que ampara a finalidade (pode não ser consentimento).
-- Invariantes: revogado ⇒ revoked_by/at (revogação não-silenciosa); ativo ⇒ granted_by/at (evidência da autorização).
-- AuditEvent é APPEND-ONLY (RLS só select/insert). Rollback: docs/c2/rollback_142_consent_audit.sql.

do $$ begin
  if not exists (select 1 from pg_type where typname='consent_status') then
    create type public.consent_status as enum ('proposed','active','revoked','expired','rejected');
  end if;
  if not exists (select 1 from pg_type where typname='consent_purpose') then
    create type public.consent_purpose as enum
      ('interno','compartilhamento','transmissao','consulta','disponibilizacao','assistencial','secundario','pesquisa','analytics','ia','outro');
  end if;
  if not exists (select 1 from pg_type where typname='audit_action') then
    create type public.audit_action as enum ('create','read','update','delete','link','confirm','transmit','export','other');
  end if;
end $$;

-- FHIR Consent + LGPD (por finalidade/destinatário, com evidência e revogação rastreável).
create table if not exists public.consents (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null,
  subject_user_id uuid not null,                     -- titular dos dados.
  purpose         public.consent_purpose not null,   -- finalidade (categoria; detalhe em purpose_detail).
  purpose_detail  text,
  legal_basis     text,                              -- hipótese legal LGPD (consentimento ≠ única base). NULL = a definir.
  scope           text,                              -- escopo.
  data_categories text[],                            -- tipos de dados abrangidos.
  source          text,                              -- fonte.
  recipient       text,                              -- destinatário (consentimento POR destinatário).
  policy_version  text,                              -- versão do termo.
  period_start    date,
  period_end      date,
  status          public.consent_status not null default 'proposed',
  granted_by      uuid,
  granted_at      timestamptz,
  revoked_by      uuid,
  revoked_at      timestamptz,
  evidence        text,                              -- evidência da autorização.
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  -- ativo ⇒ evidência de concessão; revogado ⇒ evidência de revogação (nada silencioso).
  constraint chk_consent_active_grant check (status <> 'active'  or (granted_by is not null and granted_at is not null)),
  constraint chk_consent_revocation   check (status <> 'revoked' or (revoked_by is not null and revoked_at is not null))
);
create index if not exists idx_consents_user      on public.consents(user_id);
create index if not exists idx_consents_subject   on public.consents(subject_user_id);
create index if not exists idx_consents_recipient on public.consents(recipient);

alter table public.consents enable row level security;
drop policy if exists consents_select on public.consents;
create policy consents_select on public.consents for select using (auth.uid() = user_id);
drop policy if exists consents_insert on public.consents;
create policy consents_insert on public.consents for insert with check (auth.uid() = user_id);
drop policy if exists consents_update on public.consents;
create policy consents_update on public.consents for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists consents_delete on public.consents;
create policy consents_delete on public.consents for delete using (auth.uid() = user_id);

-- FHIR AuditEvent + LGPD (registro de operações). APPEND-ONLY: sem policies de update/delete (RLS nega).
create table if not exists public.audit_events (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null,
  action       public.audit_action not null,        -- create/read/update/delete/link/confirm/transmit/export.
  entity_type  text,                                 -- alvo (tabela/recurso).
  entity_id    uuid,
  actor_id     uuid,                                 -- quem.
  occurred_at  timestamptz not null default now(),   -- quando.
  source       text,                                 -- origem.
  purpose      text,                                 -- finalidade.
  outcome      text,                                 -- resultado (success/failure/…).
  session_ref  text,                                 -- vínculo com sessão.
  details      jsonb,
  created_at   timestamptz not null default now()
);
create index if not exists idx_audit_events_user   on public.audit_events(user_id);
create index if not exists idx_audit_events_entity on public.audit_events(entity_type, entity_id);
create index if not exists idx_audit_events_actor  on public.audit_events(actor_id);

alter table public.audit_events enable row level security;
-- APPEND-ONLY: só select + insert (sem update/delete → RLS nega alteração/remoção pelo cliente).
drop policy if exists audit_events_select on public.audit_events;
create policy audit_events_select on public.audit_events for select using (auth.uid() = user_id);
drop policy if exists audit_events_insert on public.audit_events;
create policy audit_events_insert on public.audit_events for insert with check (auth.uid() = user_id);
