-- V2 Aha-R2 — "novo desde a última visita" fiel e cross-device. Aditivo/seguro.
-- Marca a última vez que o usuário abriu a plataforma; a comunicação do benefício compara o que chegou desde então.
alter table public.profiles add column if not exists last_seen_at timestamptz;
comment on column public.profiles.last_seen_at is
  'V2 Aha-R2: instante do último acesso do usuario. Base do "novo desde a ultima visita" (dados automaticos incorporados desde entao).';
