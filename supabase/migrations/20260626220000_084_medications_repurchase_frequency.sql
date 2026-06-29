-- 084: frequência da COMPRA recorrente (distinta de "frequência de uso"). Aditivo/
-- nulável, só no catálogo medications. Ao marcar "compra recorrente", o usuário
-- escolhe semanal/quinzenal/mensal/... + datas (reusa started_on/until_date).
alter table public.medications add column if not exists repurchase_frequency text;
