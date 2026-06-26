-- 082: o módulo já se chama "Medicamentos, Suplementos, Produtos e Dispositivos",
-- mas medications.kind só aceitava medicamento/suplemento. Amplia o CHECK (aditivo/
-- inerte) para incluir 'produto' e 'dispositivo'. NÃO toca o domínio de eventos
-- (health_events) — é só o catálogo de medicamentos.
alter table public.medications drop constraint if exists medications_kind_check;
alter table public.medications add constraint medications_kind_check
  check (kind = any (array['medicamento'::text, 'suplemento'::text, 'produto'::text, 'dispositivo'::text]));
