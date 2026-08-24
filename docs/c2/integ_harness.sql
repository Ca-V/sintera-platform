-- Harness de INTEGRAÇÃO (isolado): reproduz as tabelas legadas mínimas exigidas pela 137 (#117) + auth stub,
-- para aplicar 137→143 como arquitetura única. Dados sintéticos. NÃO é produção.
create schema if not exists auth;
create or replace function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('test.uid', true), '')::uuid $$;

-- Legado mínimo (o que a 137 referencia/altera): exams, extraction_versions, biomarkers, clinical_results.
create table if not exists public.exams (
  id uuid primary key default gen_random_uuid(),
  user_id uuid, document_type text, order_status text, display_title text, file_url text
);
create table if not exists public.extraction_versions (id uuid primary key default gen_random_uuid(), exam_id uuid);
create table if not exists public.biomarkers        (id uuid primary key default gen_random_uuid(), exam_id uuid, name text);
create table if not exists public.clinical_results  (id uuid primary key default gen_random_uuid(), exam_id uuid, name text);

-- Linhas legadas (marcadores de preservação) — sintéticas.
insert into public.exams (id,user_id,document_type,order_status,display_title,file_url) values
  ('ed000000-0000-0000-0000-0000000000b1','aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','medical_order','pendente','pedido.pdf','synthetic://ped.pdf'),
  ('12000000-0000-0000-0000-0000000000e1','aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',null,'processed','Resultado esquerdo','synthetic://res.pdf')
on conflict (id) do nothing;
