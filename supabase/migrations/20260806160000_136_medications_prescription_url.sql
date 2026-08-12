-- 136 — Receita médica (D-13): anexo da RECEITA ao medicamento/suplemento.
-- A receita é um documento armazenado SEPARADO do produto (signed URL no bucket 'exams',
-- como os demais anexos). Aditivo e não-destrutivo: coluna nullable; consumidores atuais
-- inalterados. NÃO é dado clínico canônico (é um documento anexo) — fora do prompt_registry.
alter table public.medications
  add column if not exists prescription_url text;
