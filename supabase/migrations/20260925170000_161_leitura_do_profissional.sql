-- 161 — CARE-003 §3.3: o profissional passa a LER os dados do paciente que o autorizou.
--
-- É a mudança de RLS de maior alcance feita até aqui: toca as oito tabelas que guardam o que a pessoa mais
-- protege. Por isso ela é feita da forma mais conservadora possível.
--
-- ============================================================================================
-- O DESENHO: ACRESCENTAR, NUNCA REESCREVER
-- ============================================================================================
-- Nenhuma policy existente é alterada ou removida. Cada tabela ganha UMA policy nova, `for select`, e só.
--
-- No Postgres, policies permissivas para o mesmo comando são combinadas com OR. Então depois desta migração
-- a leitura passa a ser "é o dono OU é profissional com vínculo ativo", e a ESCRITA continua exatamente como
-- era — porque nenhuma policy de insert/update/delete foi tocada.
--
-- Isso importa para `body_metrics` e `health_events`, que usam `for all` numa policy só. Reescrevê-las para
-- acomodar o profissional significaria mexer na regra que protege escrita para liberar leitura — trocar risco
-- grande por benefício pequeno. Acrescentando uma policy de select, a de escrita nem é lida.
--
-- CARE-001 §3.6 — "somente leitura, o profissional NUNCA altera a base do paciente" — fica garantido pela
-- FORMA da migração, não por disciplina de quem escreve: não existe aqui nenhuma policy de escrita para
-- profissional, e a catraca ARCH-leitura-profissional reprova se alguém acrescentar uma.
--
-- ============================================================================================
-- O ESCOPO É DO PACIENTE, MÓDULO A MÓDULO
-- ============================================================================================
-- `profissional_tem_vinculo_ativo(paciente, modulo)` exige vínculo ATIVO **e** o módulo dentro do escopo que
-- a pessoa autorizou. Tirar um módulo do escopo corta a leitura na hora, sem passo intermediário.
--
--   exames           → exams · biomarkers · clinical_results
--   medidas          → body_metrics
--   documentos       → patient_documents · patient_document_files · patient_document_links
--   historico-saude  → health_events
--
-- São os quatro de ESCOPO_PADRAO no core. Hábitos, ciclo, contracepção, medicamentos e saúde da mulher NÃO
-- aparecem aqui — nem com o módulo no escopo, porque não há policy que os alcance. Quando entrarem, será por
-- migração própria e decisão explícita.
--
-- ============================================================================================
-- O QUE NÃO FOI MEDIDO
-- ============================================================================================
-- A função roda por linha avaliada. Com poucas centenas de linhas por paciente isso não pesa, e o índice
-- parcial `idx_care_links_ativos` cobre a consulta interna. NÃO foi medido com volume grande — se a leitura
-- do profissional ficar lenta, é aqui que se olha primeiro.
--
-- ADITIVA E REVERSÍVEL: para desfazer, basta remover as oito policies `*_profissional_select`.

-- exames ---------------------------------------------------------------------------------------------------
drop policy if exists exams_profissional_select on public.exams;
create policy exams_profissional_select on public.exams
  for select to authenticated
  using (public.profissional_tem_vinculo_ativo(user_id, 'exames'));

drop policy if exists biomarkers_profissional_select on public.biomarkers;
create policy biomarkers_profissional_select on public.biomarkers
  for select to authenticated
  using (public.profissional_tem_vinculo_ativo(user_id, 'exames'));

drop policy if exists clinical_results_profissional_select on public.clinical_results;
create policy clinical_results_profissional_select on public.clinical_results
  for select to authenticated
  using (public.profissional_tem_vinculo_ativo(user_id, 'exames'));

-- medidas --------------------------------------------------------------------------------------------------
drop policy if exists body_metrics_profissional_select on public.body_metrics;
create policy body_metrics_profissional_select on public.body_metrics
  for select to authenticated
  using (public.profissional_tem_vinculo_ativo(user_id, 'medidas'));

-- documentos -----------------------------------------------------------------------------------------------
drop policy if exists patient_documents_profissional_select on public.patient_documents;
create policy patient_documents_profissional_select on public.patient_documents
  for select to authenticated
  using (public.profissional_tem_vinculo_ativo(user_id, 'documentos'));

drop policy if exists patient_document_files_profissional_select on public.patient_document_files;
create policy patient_document_files_profissional_select on public.patient_document_files
  for select to authenticated
  using (public.profissional_tem_vinculo_ativo(user_id, 'documentos'));

drop policy if exists patient_document_links_profissional_select on public.patient_document_links;
create policy patient_document_links_profissional_select on public.patient_document_links
  for select to authenticated
  using (public.profissional_tem_vinculo_ativo(user_id, 'documentos'));

-- histórico de saúde ---------------------------------------------------------------------------------------
drop policy if exists health_events_profissional_select on public.health_events;
create policy health_events_profissional_select on public.health_events
  for select to authenticated
  using (public.profissional_tem_vinculo_ativo(user_id, 'historico-saude'));
