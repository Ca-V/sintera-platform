-- 100 — Condições de Saúde: proveniência (source) + vínculo opcional ao exame
--
-- source: como o registro foi criado (manual/uploaded_document/exam_report/voice) —
-- auditabilidade da origem (registro de IA vs. digitado). A confirmação humana no
-- formulário já é o gate ("needs_review"): nada é gravado sem a usuária revisar+salvar.
-- source_exam_id: quando o laudo também é salvo como Exame, liga condição↔exame
-- (o vínculo PODE existir ou não; ON DELETE SET NULL não apaga a condição).

ALTER TABLE public.health_conditions
  ADD COLUMN IF NOT EXISTS source text,
  ADD COLUMN IF NOT EXISTS source_exam_id uuid REFERENCES public.exams(id) ON DELETE SET NULL;
