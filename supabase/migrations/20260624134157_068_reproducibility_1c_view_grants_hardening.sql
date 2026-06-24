-- 1c.0b — Endurecimento de grants da view canônica (menor privilégio).
-- View é somente-leitura por design (JOIN -> não auto-updatable; writes seriam inertes).
-- Objetivo: anon sem acesso; authenticated/service_role apenas SELECT.
-- Aplicada em produção em 24/06/2026 (version 20260624134157).

revoke all on public.current_biomarkers from anon;
revoke insert, update, delete, truncate, references, trigger
  on public.current_biomarkers from authenticated;
revoke insert, update, delete, truncate, references, trigger
  on public.current_biomarkers from service_role;

-- Garantir SELECT explícito para os papéis de uso (idempotente).
grant select on public.current_biomarkers to authenticated;
grant select on public.current_biomarkers to service_role;
