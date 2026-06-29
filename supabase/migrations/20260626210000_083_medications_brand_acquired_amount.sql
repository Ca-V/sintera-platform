-- 083: campos da spec do módulo Medicamentos/Suplementos/Produtos/Dispositivos.
-- Aditivos/nuláveis, só no CATÁLOGO medications (não toca health_events / domínio
-- de eventos). brand = marca/fabricante; acquired_quantity = quantidade adquirida;
-- amount_cents = valor pago (stopgap; a integração financeira via eventos/Gastos é
-- T2-D2).
alter table public.medications add column if not exists brand text;
alter table public.medications add column if not exists acquired_quantity numeric;
alter table public.medications add column if not exists amount_cents integer;
