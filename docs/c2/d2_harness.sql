-- D-2 harness (ISOLADO, dados 100% sintéticos, sem PII). Reproduz exams mínimo + legado + 2 usuários.
-- NÃO é produção. NÃO é backfill de dados reais. Rodar em PostgreSQL descartável.
create schema if not exists auth;
create or replace function auth.uid() returns uuid language sql stable as $$
  select nullif(current_setting('test.uid', true), '')::uuid $$;

create table if not exists public.exams (
  id uuid primary key default gen_random_uuid(),
  user_id uuid, document_type text, order_status text, display_title text, file_url text
);

-- Usuários sintéticos: U_A = aaaa…, U_B = bbbb….
-- Legado (marcador de preservação) + pedidos (medical_order) + resultados. IDs fixos, sintéticos.
insert into public.exams (id,user_id,document_type,order_status,display_title,file_url) values
  ('e0000000-0000-0000-0000-0000000000ff','aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',null,'processed','Hemograma (legado)','synthetic://legacy.pdf'),
  -- pedidos do U_A
  ('ed000000-0000-0000-0000-0000000000b1','aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','medical_order','pendente','pedido.pdf','synthetic://ped_bi.pdf'),   -- PED_BI
  ('ed000000-0000-0000-0000-0000000000b2','aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','medical_order','pendente','pedido_mp.pdf','synthetic://ped_mp.pdf'), -- PED_MP
  -- resultados do U_A
  ('12000000-0000-0000-0000-0000000000e1','aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',null,'processed','Resultado esquerdo',null), -- RES_ESQ
  ('12000000-0000-0000-0000-0000000000e2','aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',null,'processed','Resultado direito',null),  -- RES_DIR
  ('12000000-0000-0000-0000-0000000000e3','aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',null,'processed','Resultado MP',null),       -- RES_MP
  -- pedido do U_B (para RLS)
  ('ed000000-0000-0000-0000-0000000000c1','bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb','medical_order','pendente','pedido_b.pdf','synthetic://ped_b.pdf')
on conflict (id) do nothing;
