-- CTC-001 (Opção A): contracepção hormonal (pílula/injeção/adesivo/anel) é registrada e editada
-- no próprio Ciclo (SSOT), não mais empurrada para Medicamentos. Métodos de uso contínuo têm uma
-- CADÊNCIA de recompra/reaplicação (semanal/mensal/trimestral), distinta da "vida útil" de dispositivos.
-- Coluna aditiva, nullable — dispositivos e registros existentes permanecem inalterados.
alter table public.contraceptive_methods
  add column if not exists usage_cadence text;

comment on column public.contraceptive_methods.usage_cadence is
  'CTC-001: cadência de recompra/reaplicação de método hormonal (semanal|mensal|trimestral). NULL para dispositivos.';