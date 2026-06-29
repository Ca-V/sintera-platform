-- T2-C — dois tipos de lancamento financeiro + Desfecho do evento.
-- ADITIVO e inerte.
--  direct_expense: despesa DIRETA (plano/academia/assinatura/suplemento/compra) que
--    conta como gasto mesmo sem o evento estar "realizado".
--  outcome (Desfecho): resumo/diagnostico informado/conduta/exames solicitados/
--    encaminhamentos/anexos/observacoes — fecha a jornada do evento (jsonb flexivel).

alter table public.health_events
  add column if not exists direct_expense boolean not null default false,
  add column if not exists outcome jsonb;
