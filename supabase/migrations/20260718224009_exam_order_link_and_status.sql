-- Q1 (Pedidos ↔ Exames) — integração SEM duplicação, com rastreabilidade histórica (ADR-001).
-- O pedido NÃO é substituído pelo exame: ele permanece como ORIGEM (entidade histórica). O resultado
-- referencia o pedido; ambos coexistem, ligados por rastreabilidade. Relação 1→N: um pedido pode
-- originar vários resultados (vários exames laboratoriais/imagem no mesmo pedido).

-- No RESULTADO: aponta para o pedido que o originou (referência; SET NULL preserva o resultado se o pedido sumir).
alter table public.exams
  add column if not exists fulfills_order_id uuid references public.exams(id) on delete set null;

-- No PEDIDO: estado do ciclo de vida do pedido (pendente → realizado → finalizado). NULL em não-pedidos.
alter table public.exams
  add column if not exists order_status text;

-- Busca eficiente dos resultados de um pedido (1→N) e da origem de um resultado.
create index if not exists idx_exams_fulfills_order_id on public.exams (fulfills_order_id) where fulfills_order_id is not null;

comment on column public.exams.fulfills_order_id is
  'Q1: resultado → pedido de origem (medical_order/insurance_guide) que o originou. Rastreabilidade; 1 pedido → N resultados.';
comment on column public.exams.order_status is
  'Q1: estado do PEDIDO (pendente|realizado|finalizado). NULL para exames que não são pedido.';