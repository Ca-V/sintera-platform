-- 085: adiciona 'outro' aos tipos do catálogo medications (aditivo/inerte, só catálogo).
alter table public.medications drop constraint if exists medications_kind_check;
alter table public.medications add constraint medications_kind_check
  check (kind = any (array['medicamento'::text, 'suplemento'::text, 'produto'::text, 'dispositivo'::text, 'outro'::text]));
