-- FB-008 (refina FIN-001) — o financeiro do exame é ATRIBUTO do próprio exame (o fato), não um Evento separado.
-- Evita duplicação em Registros de Saúde/Despesas. Colunas aditivas/nullable. Despesas passa a PROJETAR exames
-- com valor (além dos eventos avulsos). Valores de doc fiscal validados no domínio (lib/finance/expense).
alter table public.exams add column if not exists expense_amount_cents integer;
alter table public.exams add column if not exists expense_doc_type text;   -- nota_fiscal|recibo|comprovante|outro
alter table public.exams add column if not exists expense_doc_url text;     -- anexo do documento fiscal (NF/recibo)
comment on column public.exams.expense_amount_cents is 'FIN-001/FB-008: valor pago do exame (centavos). O financeiro é atributo do exame, nao um Evento.';
comment on column public.exams.expense_doc_type is 'FIN-001/FB-008: tipo do documento fiscal (nota_fiscal|recibo|comprovante|outro).';
comment on column public.exams.expense_doc_url is 'FIN-001/FB-008: URL do documento fiscal anexado (NF/recibo/comprovante).';
