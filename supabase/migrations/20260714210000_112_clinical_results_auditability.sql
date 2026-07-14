-- clinical_results — AUDITABILIDADE (Certificação da Plataforma §4, fundadora 14/07): para qualquer elemento
-- representado, responder de qual documento (exam_id, já existe) · qual PÁGINA · qual TRECHO (raw_text, já
-- existe) · qual versão do ENGINE · qual versão do PROCESSADOR (contract_version, já existe) · QUANDO
-- (created_at, já existe). Adiciona o que faltava: page + engine_version. Aditivo; fecha a rastreabilidade.
alter table public.clinical_results
  add column if not exists page           int,
  add column if not exists engine_version text;

comment on column public.clinical_results.page is 'Página de origem (1-based) no documento — auditabilidade.';
comment on column public.clinical_results.engine_version is 'Versão do Clinical Processing Engine que produziu — auditabilidade.';
