-- clinical_results — alinha o backend canônico ao MODELO ABERTO (fundadora 14/07): representar CLASSES de
-- informação clínica, nunca listas fechadas. Adiciona os campos genéricos que faltavam para qualquer analito/
-- modalidade: código do item (aberto, LOINC/outro) + método + contexto. Evita 2ª migração estrutural.
-- (code_system e value_code já vieram na migration 110.) Aditivo; RDC 657 (transcreve, não interpreta).
alter table public.clinical_results
  add column if not exists code    text,   -- código do ITEM/analito (LOINC ou outro sistema aberto; code_system nomeia)
  add column if not exists method  text,   -- método de análise/aquisição (quando informado)
  add column if not exists context text;   -- contexto/condição (ex.: jejum, pós-esforço) — quando informado

comment on column public.clinical_results.code is
  'Código do item/analito em sistema ABERTO (LOINC/SNOMED/local; code_system nomeia). Nunca lista fechada.';
comment on column public.clinical_results.method is 'Método de análise/aquisição, quando informado.';
comment on column public.clinical_results.context is 'Contexto/condição de coleta (ex.: jejum), quando informado.';
