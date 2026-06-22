-- 050 — medications: compra, estoque e lembrete de recompra
--
-- Permite calcular quando o produto acaba (quantidade ÷ consumo/dia a partir
-- da data de compra) e, em uso contínuo, lembrar de recomprar. Organização
-- factual — sem prescrição.

ALTER TABLE public.medications
  ADD COLUMN IF NOT EXISTS pack_quantity      numeric,   -- qtd na embalagem (ex.: 30 comprimidos)
  ADD COLUMN IF NOT EXISTS daily_consumption  numeric,   -- consumo por dia (ex.: 1)
  ADD COLUMN IF NOT EXISTS purchased_on       date,      -- comprado em
  ADD COLUMN IF NOT EXISTS purchase_status    text,      -- 'a_comprar' | 'comprado' | null
  ADD COLUMN IF NOT EXISTS repurchase_reminder boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS repurchase_event_id uuid REFERENCES public.agenda_events(id) ON DELETE SET NULL;

ALTER TABLE public.medications DROP CONSTRAINT IF EXISTS medications_purchase_status_check;
ALTER TABLE public.medications ADD CONSTRAINT medications_purchase_status_check
  CHECK (purchase_status IS NULL OR purchase_status IN ('a_comprar','comprado'));
