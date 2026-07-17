-- FIN-001 (BETA-7) — tipo do documento fiscal anexado a uma despesa.
-- O Evento Assistencial é o PORTADOR financeiro canônico (amount_cents/direct_expense/attachment_url);
-- este campo CLASSIFICA o anexo para Relatórios (IR/reembolso) e auditoria. Nullable/aditivo (backward-compat).
-- Valores abertos, validados no domínio (src/lib/finance/expense.ts): nota_fiscal | recibo | comprovante | outro.
alter table public.health_events add column if not exists expense_doc_type text;
comment on column public.health_events.expense_doc_type is
  'FIN-001: tipo do documento fiscal da despesa (nota_fiscal|recibo|comprovante|outro). Classifica attachment_url para Relatorios/IR e auditoria. Nullable; dominio em lib/finance/expense.';
