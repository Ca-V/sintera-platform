-- 136 — Receita médica (D-13): anexo da RECEITA ao medicamento/suplemento.
-- Aditivo e não-destrutivo: coluna nullable; consumidores atuais inalterados.
alter table public.medications
  add column if not exists prescription_url text;