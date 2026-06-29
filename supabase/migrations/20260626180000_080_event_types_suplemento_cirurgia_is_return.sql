-- 080: taxonomia única de tipos de evento. Aditiva/inerte:
-- acrescenta 'suplemento' e 'cirurgia' aos tipos aceitos (os demais já vinham da 079)
-- e adiciona o atributo "é retorno" (is_return) para Consulta — "Retorno" deixa de
-- ser um TIPO e passa a ser um atributo complementar.

alter table public.health_events drop constraint if exists health_events_event_type_check;
alter table public.health_events add constraint health_events_event_type_check
  check (event_type = any (array[
    'consulta','retorno','vacina','procedimento','exame','estetico',
    'medicamento','medicacao','atividade','plano','outro',
    'suplemento','cirurgia'
  ]));

alter table public.health_events add column if not exists is_return boolean not null default false;
