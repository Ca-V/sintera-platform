-- clinical_results → MODELO CANÔNICO de qualquer INFORMAÇÃO CLÍNICA ESTRUTURADA (fundadora 14/07: nasce
-- para representar tudo, não só "resultado" — evita uma 2ª migração estrutural em alguns meses).
-- Cobre: parâmetros numéricos E categóricos · achados narrativos · classificações (BI-RADS/PI-RADS/
-- Bethesda…) · medidas · estruturas anatômicas · lateralidade · regiões · grupos.
-- Aditivo (tabela com 0 linhas neste ambiente). RDC 657: transcreve/estrutura, não interpreta.

alter table public.clinical_results
  add column if not exists item_type    text,     -- natureza do item: measure|parameter|finding|classification|observation
  add column if not exists value_num    numeric,  -- valor numérico parseado (habilita evolução/comparação); value_text continua a transcrição fiel
  add column if not exists value_code    text,     -- código da classificação (ex.: '2' de BI-RADS 2) ou código de sistema
  add column if not exists code_system   text,     -- sistema do código (ex.: 'BI-RADS','PI-RADS','Bethesda'; futuro: LOINC/SNOMED)
  add column if not exists anatomy       text,     -- estrutura/órgão a que o item se refere (ex.: 'mama', 'fígado', 'córnea')
  add column if not exists group_label   text,     -- grupo dentro do exame (ex.: painel, quadrante, região agrupada)
  add column if not exists reference_text text;    -- faixa/valor de referência COMO transcrito (não interpretativo)

-- item_type restrito ao conjunto conhecido (ou nulo).
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'clinical_results_item_type_chk') then
    alter table public.clinical_results
      add constraint clinical_results_item_type_chk
      check (item_type is null or item_type in ('measure','parameter','finding','classification','observation'));
  end if;
end $$;

comment on table public.clinical_results is
  'Modelo CANÔNICO de qualquer informação clínica estruturada (não só "resultado"): parâmetros numéricos/categóricos, achados narrativos, classificações (BI-RADS/PI-RADS/Bethesda), medidas, estruturas anatômicas, lateralidade/região, grupos. Saída dos processadores do CPE por MODELO CLÍNICO. Transcreve/estrutura, não interpreta (RDC 657). value_text = transcrição fiel; value_num = numérico parseado (evolução).';
comment on column public.clinical_results.item_type is 'Natureza do item: measure | parameter | finding | classification | observation.';
comment on column public.clinical_results.value_num is 'Valor numérico parseado (nullable) — habilita evolução longitudinal e comparação; value_text permanece a transcrição fiel.';
comment on column public.clinical_results.code_system is 'Sistema de classificação/código: BI-RADS, PI-RADS, Bethesda… (futuro: LOINC/SNOMED).';
comment on column public.clinical_results.anatomy is 'Estrutura anatômica/órgão a que o item se refere.';
comment on column public.clinical_results.group_label is 'Grupo dentro do exame (painel, quadrante, região agrupada).';

create index if not exists idx_clinical_results_group on public.clinical_results(exam_id, group_label);
