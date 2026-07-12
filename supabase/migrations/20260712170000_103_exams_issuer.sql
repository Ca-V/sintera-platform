-- 103 — Emissor do documento (laboratório/clínica/hospital). Enriquece o display_title
-- ("Exames laboratoriais • Hermes Pardini"). Extraído best-effort do texto do laudo, isolado
-- do prompt governado de extração. Nullable/aditivo.

ALTER TABLE exams ADD COLUMN IF NOT EXISTS issuer text;

COMMENT ON COLUMN exams.issuer IS
  'Nome do laboratório/clínica/hospital emissor do documento, transcrito do laudo (não inferido). Enriquece a exibição: display_title • issuer.';
