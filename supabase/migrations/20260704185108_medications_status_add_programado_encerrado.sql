
-- Expande o ciclo de vida do medicamento: em_uso, programado, suspenso, encerrado.
-- Aditivo/reversível; dados atuais (todos em_uso) permanecem válidos.
alter table medications drop constraint medications_status_check;
alter table medications add constraint medications_status_check
  check (status = any (array['em_uso'::text, 'programado'::text, 'suspenso'::text, 'encerrado'::text]));
