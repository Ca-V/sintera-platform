-- DUE auditável (ADR-DUE-001): relatório interno de compreensão por documento — origem/confiança por atributo +
-- razão de ausência + proveniência da terminologia. Aditivo, nullable. Não altera comportamento existente.
alter table public.exams
  add column if not exists understanding_report jsonb;

comment on column public.exams.understanding_report is
  'Relatório auditável do Document Understanding Engine: { due: <UnderstandingReport por atributo (valor/origem/confiança/razão de ausência)>, terminology: <resolução de nomenclatura (nome/confiança/origem/terminology/provisional/basis/evidence/equipment)> }. Preenchido na 1ª compreensão de documentos de imagem.';