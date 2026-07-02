-- 089 — medications: referência ao evento canônico de COMPRA (health_events).
-- Opção A (modelo de eventos): marcar um medicamento como "comprado" emite um
-- health_events que alimenta Timeline/Gastos/Dashboard por origem única. Guardamos
-- o id do evento aqui para a projeção ser IDEMPOTENTE (editar/re-salvar atualiza o
-- mesmo evento; despublicar remove) — espelha o padrão de `repurchase_event_id`.
-- Aditivo/reversível: coluna nullable, sem tocar dados existentes.

alter table public.medications
  add column if not exists purchase_event_id uuid;
