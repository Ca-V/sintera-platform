-- 063 — vínculo opcional medida → exame (laudo original)
--
-- Uma medida corporal (ex.: bioimpedância) frequentemente vem de um LAUDO que a
-- pessoa já enviou em Exames. Guardamos apenas a REFERÊNCIA ao exame (não
-- duplicamos o documento): assim o link "Ver documento original" aparece na
-- página de Medidas e no Relatório pela MESMA camada de proveniência, sem lógica
-- específica. ON DELETE SET NULL: apagar o exame não apaga a medida — só desfaz
-- o vínculo. Continua factual/organizacional, sem juízo clínico.

ALTER TABLE public.body_metrics
  ADD COLUMN IF NOT EXISTS exam_id uuid REFERENCES public.exams(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS body_metrics_exam_idx ON public.body_metrics (exam_id);
