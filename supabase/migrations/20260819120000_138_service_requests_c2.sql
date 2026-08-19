-- 138 — Solicitação de 1ª classe (FHIR ServiceRequest) + vínculo pedido→resultado com proveniência (C-2).
-- DDL ADITIVO, idempotente, reversível. NÃO muta linhas existentes. NÃO toca exams/biomarkers/exam_documents.
-- NÃO faz backfill, NÃO popula códigos (LOINC/SNOMED/GAL nascem NULL), NÃO cria identificadores fictícios.
-- Escopo travado à especificação EXDOC-006 (C-2). Rollback: docs/c2/rollback_138_service_requests.sql.
-- FHIR-first: 'service_requests'/'service_request_results' são PERSISTÊNCIA interna; a projeção canônica
-- representa o vínculo por DiagnosticReport.basedOn → ServiceRequest (não substituem o conceito FHIR).

-- Enums (subconjuntos alinhados aos ValueSets FHIR request-status / request-intent). [NC-perfil BR-Core]:
-- o subconjunto EXATO exigido por BR-Core/RNDS não está confirmado — adota-se o superset FHIR R4.
do $$ begin
  if not exists (select 1 from pg_type where typname = 'service_request_status') then
    create type public.service_request_status as enum
      ('draft','active','on-hold','revoked','completed','entered-in-error','unknown');
  end if;
  if not exists (select 1 from pg_type where typname = 'service_request_intent') then
    create type public.service_request_intent as enum
      ('proposal','plan','order','original-order','reflex-order','filler-order','instance-order');
  end if;
  if not exists (select 1 from pg_type where typname = 'order_link_method') then
    create type public.order_link_method as enum
      ('user_confirmed','auto_suggested','imported','legacy_migration');
  end if;
end $$;

-- 1) SOLICITAÇÃO DE 1ª CLASSE (FHIR ServiceRequest). 1 linha = 1 procedimento/lado.
create table if not exists public.service_requests (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null,
  -- FHIR ServiceRequest.requisition — identificador COMUM aos lados/procedimentos do mesmo pedido (bilateral).
  requisition_id    uuid not null,
  -- Documento de origem (o "pedido" físico) → projeta p/ DocumentReference; preserva o Ciclo 1 (exams medical_order).
  source_exam_id    uuid references public.exams(id) on delete set null,
  -- FHIR ServiceRequest.status / intent.
  status            public.service_request_status not null default 'active',
  intent            public.service_request_intent not null default 'order',
  -- FHIR ServiceRequest.code (CodeableConcept): coding(system/code/display, version) + text (SEMPRE preservado).
  code_text         text not null,                 -- representação textual original — nunca nula.
  code_system       text,                          -- ex.: http://loinc.org — NULL até curadoria (NÃO inventar). [NC]
  code_value        text,                          -- code no sistema — NULL até curadoria. [NC]
  code_display      text,                          -- display oficial — NULL até curadoria. [NC]
  code_version      text,                          -- versão da terminologia.
  -- FHIR ServiceRequest.bodySite (CodeableConcept) + lateralidade.
  body_site_text    text,
  body_site_system  text,                          -- ex.: SNOMED CT — NULL até confirmação. [NC-artefato]
  body_site_code    text,
  laterality        text
                      check (laterality is null or laterality in ('esquerdo','direito','bilateral','nao_aplicavel')),
  -- Atores (interim texto; FKs estruturadas entram na migração de IDENTIDADE — P1, fora daqui).
  subject_user_id   uuid not null,                 -- interim = dono; futuro Patient.
  requester_text    text,                          -- futuro Practitioner.
  performer_text    text,                          -- futuro Organization/Practitioner.
  -- FHIR ServiceRequest.authoredOn / reason.
  authored_on       date,
  reason_text       text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create index if not exists idx_service_requests_requisition on public.service_requests(requisition_id);
create index if not exists idx_service_requests_source_exam on public.service_requests(source_exam_id);
create index if not exists idx_service_requests_user        on public.service_requests(user_id);

alter table public.service_requests enable row level security;
drop policy if exists service_requests_select on public.service_requests;
create policy service_requests_select on public.service_requests for select using (auth.uid() = user_id);
drop policy if exists service_requests_insert on public.service_requests;
create policy service_requests_insert on public.service_requests for insert with check (auth.uid() = user_id);
drop policy if exists service_requests_update on public.service_requests;
create policy service_requests_update on public.service_requests for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists service_requests_delete on public.service_requests;
create policy service_requests_delete on public.service_requests for delete using (auth.uid() = user_id);

-- 2) VÍNCULO ServiceRequest → resultado (projeta p/ FHIR DiagnosticReport.basedOn), por procedimento/lado,
--    COM PROVENIÊNCIA OBRIGATÓRIA (Protocolo §6). Sem vínculo silencioso; confirmação nunca silenciosa.
create table if not exists public.service_request_results (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null,
  service_request_id uuid not null references public.service_requests(id) on delete cascade,
  result_exam_id     uuid references public.exams(id) on delete cascade,   -- NULL = parcial/pendente.
  -- Proveniência OBRIGATÓRIA do vínculo.
  linked_by          uuid not null,                    -- quem criou o vínculo/sugestão.
  linked_at          timestamptz not null default now(),
  link_method        public.order_link_method not null,-- origem/método do vínculo.
  match_confidence   numeric check (match_confidence is null or (match_confidence >= 0 and match_confidence <= 1)),
  evidence           text,                             -- sinais usados (paciente/código/lateralidade/data/estab.).
  -- Confirmação: auto_suggested nasce NÃO confirmado (default false); confirmar exige registrar quem/quando.
  confirmed          boolean not null default false,
  confirmed_by       uuid,
  confirmed_at       timestamptz,
  created_at         timestamptz not null default now(),
  unique (service_request_id, result_exam_id),        -- não duplicar o mesmo par.
  -- INVARIANTE anti-confirmação-silenciosa: um vínculo confirmado DEVE registrar confirmador e instante.
  constraint chk_confirmation_provenance
    check (confirmed = false or (confirmed_by is not null and confirmed_at is not null))
);
create index if not exists idx_srr_service_request on public.service_request_results(service_request_id);
create index if not exists idx_srr_result_exam     on public.service_request_results(result_exam_id);

alter table public.service_request_results enable row level security;
drop policy if exists srr_select on public.service_request_results;
create policy srr_select on public.service_request_results for select using (auth.uid() = user_id);
drop policy if exists srr_insert on public.service_request_results;
create policy srr_insert on public.service_request_results for insert with check (auth.uid() = user_id);
drop policy if exists srr_update on public.service_request_results;
create policy srr_update on public.service_request_results for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists srr_delete on public.service_request_results;
create policy srr_delete on public.service_request_results for delete using (auth.uid() = user_id);
