-- FB-004 — restaura o tipo "Outros" em Recursos de Saúde. Aditivo: amplia os valores aceitos (não destrói).
alter table public.health_resources drop constraint if exists health_resources_type_chk;
alter table public.health_resources add constraint health_resources_type_chk
  check (resource_type = any (array[
    'correcao_visual','dispositivo_medico','protese_ortese','auxilio','compressao_suporte','outro'
  ]));
