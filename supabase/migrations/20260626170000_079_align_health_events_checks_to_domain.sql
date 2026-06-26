-- 079: alinha as CHECKs de health_events ao vocabulário do domínio (corrige o
-- Salvar que falhava em silêncio: source='manual'/'recurrence' e tipos
-- retorno/medicacao/plano eram rejeitados pelas CHECKs antigas).
-- Aditivo/inerte: apenas amplia os valores aceitos; linhas existentes seguem válidas.

alter table public.health_events drop constraint if exists health_events_source_check;
alter table public.health_events add constraint health_events_source_check
  check (source = any (array[
    'manual','recurrence','agenda_legacy','exam','protocol','ai','wearable',
    'device','hospital','lab','import','connector','system',
    'autorrelato','upload','integracao'
  ]));

alter table public.health_events drop constraint if exists health_events_event_type_check;
alter table public.health_events add constraint health_events_event_type_check
  check (event_type = any (array[
    'consulta','retorno','vacina','procedimento','exame','estetico',
    'medicamento','medicacao','atividade','plano','outro'
  ]));
