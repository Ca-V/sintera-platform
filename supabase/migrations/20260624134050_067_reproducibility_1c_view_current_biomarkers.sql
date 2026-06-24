-- 1c.0 — View canônica de biomarcadores (security_invoker) + grant.
-- Não-destrutivo: nenhuma alteração de dados. Rollback = drop view.
-- Aplicada em produção em 24/06/2026 (version 20260624134050).

create view public.current_biomarkers
  with (security_invoker = true)
as
select b.*
from public.biomarkers b
join public.exams e on e.id = b.exam_id
where b.extraction_version_id = e.current_extraction_version_id;

comment on view public.current_biomarkers is
  '1c: biomarcadores da versão canônica de cada exame (b.extraction_version_id = exams.current_extraction_version_id). security_invoker=true herda a RLS de biomarkers e exams do chamador.';

grant select on public.current_biomarkers to authenticated;
