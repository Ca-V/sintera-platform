-- Clinical Identity: equipamento identificado (≠ exame, ≠ emissor). Persistido p/ exibição rotulada
-- ("Equipamento: …") em vez do subtítulo cru. Aditivo, nullable.
alter table public.exams
  add column if not exists equipment text;

comment on column public.exams.equipment is
  'Equipamento/aparelho identificado pela Clinical Identity (ex.: Pentacam). Distinto de exame (display_title) e de emissor (issuer). Exibido rotulado como "Equipamento: …".';