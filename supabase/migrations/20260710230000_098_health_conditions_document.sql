-- 098 — Condições de Saúde: proveniência documental (laudo/exame)
--
-- Uma condição pode vir de um LAUDO/EXAME (upload/foto/scan). Guardamos o link do
-- documento original (mesma URL assinada do bucket exams) para "Ver documento
-- original" (Princípio da Rastreabilidade Documental). `kind` classifica o registro
-- (diagnostico/alergia/condicao/outro) — factual, sem juízo clínico. Quando o
-- documento também for um exame que confirma o diagnóstico, o app cria em paralelo
-- um registro em `exams` (salvamento duplo); aqui só o vínculo de proveniência.

ALTER TABLE public.health_conditions
  ADD COLUMN IF NOT EXISTS file_url text,
  ADD COLUMN IF NOT EXISTS kind text;
