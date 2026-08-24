
-- Aditivo/reversível: forma farmacêutica, via de administração e unidade do conteúdo.
-- Todas nullable; consumidores atuais não referenciam → sem quebra.
alter table medications
  add column if not exists pharmaceutical_form  text,
  add column if not exists administration_route text,
  add column if not exists pack_unit            text;

comment on column medications.pharmaceutical_form  is 'Forma farmacêutica (slug: comprimido, capsula, gel, solucao_oral, ...). Define a unidade do conteúdo e se a duração é estimável.';
comment on column medications.administration_route is 'Via de administração (Oral, Tópica, Endovenosa, ...).';
comment on column medications.pack_unit            is 'Unidade do conteúdo da embalagem (comprimidos, g, mL, doses, ...). Default derivado da forma, editável.';
