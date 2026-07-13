-- Estado da IDENTIDADE (Clinical Identity Registry, CEF §3.0 / M4) — draft | validated.
-- 'validated' quando a identidade (documental ou clínica) foi reconhecida com confiança suficiente;
-- 'draft' quando permanece incerta (ensemble abaixo do limiar ou ambíguo) — sinaliza revisão futura.
-- Write-once no analyze (só na 1ª extração), coerente com a Identidade Documental (write-once).
-- Coluna nullable/não-destrutiva; default 'draft' para registros novos.
alter table public.exams add column if not exists document_identity_status text default 'draft';

comment on column public.exams.document_identity_status is
  'Estado da identidade do documento: draft (incerta) | validated (reconhecida com confiança). Saída do M4 (ensemble de evidências); write-once. O LLM é apenas 1 evidência — conflito futuro reabre para revisão governada.';
