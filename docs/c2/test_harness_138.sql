-- Harness de teste ISOLADO para a migração 138 (C-2). NÃO faz parte da migração — só reproduz o ambiente
-- mínimo (stub de auth.uid + tabela exams mínima + dados LEGADOS) para provar idempotência/reversibilidade
-- e que o rollback não altera/perde dados legados. Rodar em PostgreSQL descartável (nunca em produção).

-- Stub do auth.uid() do Supabase, lendo um GUC de sessão (test.uid) — permite testar RLS com role não-owner.
create schema if not exists auth;
create or replace function auth.uid() returns uuid language sql stable as $$
  select nullif(current_setting('test.uid', true), '')::uuid
$$;

-- Tabela exams MÍNIMA (só o necessário para as FKs da 138). Representa o legado que NÃO pode ser tocado.
create table if not exists public.exams (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid,
  document_type text,
  order_status  text,
  display_title text
);

-- Dados LEGADOS (marcadores para provar que rollback não altera nem perde). IDs fixos.
insert into public.exams (id, user_id, document_type, order_status, display_title) values
  ('11111111-1111-1111-1111-111111111111','aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','medical_order','pendente','pedido.pdf'),
  ('22222222-2222-2222-2222-222222222222','aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',null,'processed','Hemograma')
on conflict (id) do nothing;
