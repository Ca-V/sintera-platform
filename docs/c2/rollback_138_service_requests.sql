-- Rollback da migração 138 (C-2). Puramente estrutural e reversível: remove SÓ os objetos criados pela 138.
-- NÃO toca exams/biomarkers/exam_documents nem qualquer dado legado. Idempotente.
drop table if exists public.service_request_results;
drop table if exists public.service_requests;
drop type  if exists public.order_link_method;
drop type  if exists public.service_request_status;
drop type  if exists public.service_request_intent;
