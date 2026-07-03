-- 090 — Fidelidade da Ingestão (RF-01/RF-02): contexto do laudo por resultado.
-- source_material  = material informado no laudo (ex.: "Sangue", "Sangue venoso", "Urina de 24 horas")
-- source_exam_name = nome do exame informado no laudo (ex.: "Hemograma", "Gasometria venosa")
-- Texto ORIGINAL do laudo (sem normalização/tradução — decisão fundadora 03/07).
-- Aditivo/nullable: exames antigos ficam NULL → UI usa fallback do catálogo (compat).
alter table public.biomarkers
  add column if not exists source_material  text,
  add column if not exists source_exam_name text;

-- Versiona o CONTRATO de extração (prompt↔app). Registros legados = 1 (sem contexto
-- do laudo); novas extrações com este contrato = 2. Facilita auditoria/evolução.
alter table public.extraction_versions
  add column if not exists extraction_schema_version integer not null default 1;
