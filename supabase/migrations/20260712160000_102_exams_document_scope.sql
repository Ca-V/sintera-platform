-- 102 — Separa CATEGORIA de ESCOPO documental (fundadora 12/07/2026, refinamento do 101).
-- Evita misturar conceitos: document_type = a mídia/categoria; document_scope = abrangência.
-- clinical_category (agrupamento clínico do painel, ex. "hormonal") fica RESERVADO — será
-- adicionado quando conseguirmos populá-lo com segurança (não criar coluna vazia agora).

ALTER TABLE exams ADD COLUMN IF NOT EXISTS document_scope text;

COMMENT ON COLUMN exams.document_type IS
  'Categoria/mídia do documento: laboratory | imaging | anatomopathology | medical_report | prescription | vaccination | omics | attestation | unknown.';
COMMENT ON COLUMN exams.document_scope IS
  'Abrangência do documento: single (um exame) | panel (vários da mesma categoria) | mixed (categorias distintas, ex. sangue+urina).';
