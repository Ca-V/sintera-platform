-- Clinical Pipeline (ADR-CP-001): identificador ESTÁVEL da decisão (independente do exame), p/ replay/auditoria.
create sequence if not exists public.clinical_resolution_seq;

create or replace function public.next_resolution_id() returns text
  language sql volatile as $$
  select 'RES-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('public.clinical_resolution_seq')::text, 8, '0')
$$;

alter table public.exams
  add column if not exists resolution_id text;

comment on column public.exams.resolution_id is
  'Clinical Pipeline: id estável da resolução (ex.: RES-2026-00001983). Correlaciona o exame ao Pipeline Audit (understanding_report) e permite reproduzir a decisão independentemente do exame.';