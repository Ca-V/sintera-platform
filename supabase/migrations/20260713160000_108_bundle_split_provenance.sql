-- Bundle Split (M3) — proveniência de "1 upload → N registros".
-- Quando um upload contém N CDUs distintas (Segmentação), cada CDU vira um registro próprio, todos
-- ligados ao exame-RAIZ (o upload original) e cada um cobrindo o seu intervalo de páginas.
-- Colunas nullable/não-destrutivas. Registros de upload único (a maioria) ficam com tudo nulo.
alter table public.exams add column if not exists source_bundle_exam_id uuid references public.exams(id) on delete set null;
alter table public.exams add column if not exists bundle_cdu_index int;
alter table public.exams add column if not exists bundle_cdu_count int;
alter table public.exams add column if not exists bundle_page_start int;
alter table public.exams add column if not exists bundle_page_end int;

comment on column public.exams.source_bundle_exam_id is
  'Exame-raiz (upload original) quando este registro é uma CDU de um bundle multi-exame (M3). A própria raiz aponta para si. Preserva a proveniência do Bundle.';
comment on column public.exams.bundle_cdu_index is 'Índice 1-based desta CDU dentro do bundle de origem (M3).';
comment on column public.exams.bundle_cdu_count is 'Total de CDUs no bundle de origem (M3).';
comment on column public.exams.bundle_page_start is 'Página inicial (0-based, inclusiva) que esta CDU cobre no arquivo de origem (M3).';
comment on column public.exams.bundle_page_end is 'Página final (0-based, inclusiva) que esta CDU cobre no arquivo de origem (M3).';

create index if not exists idx_exams_source_bundle on public.exams(source_bundle_exam_id) where source_bundle_exam_id is not null;
