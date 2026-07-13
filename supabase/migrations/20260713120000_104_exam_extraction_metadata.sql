-- 104 — Bloco de metadados da extração (CEF). Não é novo domínio: organiza metadados que
-- naturalmente crescerão. Prepara o REPROCESSAMENTO automático quando um extrator evoluir.
--
-- Princípio (fundadora 13/07): a COMPLETUDE é relativa ao EXTRATOR, não ao documento — evita
-- "FULL" como absoluto (nunca verificável). Estados: structured | partial | document_only.
-- A completude/confiança são calculadas HOJE por heurística; cada extrator especializado do CEF
-- passará a computá-las propriamente (e o extractor_version identifica o que reprocessar).

ALTER TABLE exams ADD COLUMN IF NOT EXISTS extractor_family text;
ALTER TABLE exams ADD COLUMN IF NOT EXISTS extractor_version text;
ALTER TABLE exams ADD COLUMN IF NOT EXISTS extraction_completeness text; -- structured | partial | document_only
ALTER TABLE exams ADD COLUMN IF NOT EXISTS structural_confidence text;   -- high | medium | low
ALTER TABLE exams ADD COLUMN IF NOT EXISTS processed_at timestamptz;

COMMENT ON COLUMN exams.extraction_completeness IS
  'Relativa ao EXTRATOR (não ao documento): structured (tudo que o extrator suporta hoje foi estruturado) | partial (parte estruturada; resto no documento) | document_only (nada estruturado com segurança).';
COMMENT ON COLUMN exams.extractor_version IS
  'Versão do extrator que estruturou o exame (ex.: laboratory-v1, heuristic-v0). Permite reprocessar quando um extrator evolui.';
