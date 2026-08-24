
alter table medications add column if not exists prescriber_name text;
comment on column medications.prescriber_name is 'Nome do(a) médico(a) prescritor(a), quando informado ou escaneado da receita. Aditivo/nullable.';
