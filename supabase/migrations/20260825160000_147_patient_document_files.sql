-- 147 — ANEXO-001: um documento pode ter VÁRIAS PÁGINAS.
--
-- DDL ADITIVO e idempotente. NÃO altera nem remove `patient_documents.file_url`.
--
-- O PROBLEMA: `patient_documents` nasceu com `file_url` — UM arquivo por documento. Mas um atestado
-- fotografado em duas páginas é UM atestado, não dois. Sem esta tabela, "adicionar mais páginas" só poderia
-- ser cumprido criando um registro por página, o que é errado: a lista mostraria três receitas onde há uma.
--
-- É a mesma relação que `exam_documents` tem com `exams` — N artefatos, 1 registro. Aqui os nomes e a
-- semântica espelham aquela tabela de propósito, para que ambas migrem pelo mesmo padrão quando o
-- repositório único de documentos (`health_documents`) existir.
--
-- COMPATIBILIDADE: `patient_documents.file_url` PERMANECE, apontando para a primeira página. Documentos
-- criados antes desta migration continuam sendo lidos por ele, sem migração de dado. A leitura prefere as
-- páginas quando existirem e cai no `file_url` quando não — mesma escada da receita (DOC-002).

create table if not exists public.patient_document_files (
  id           uuid primary key default gen_random_uuid(),
  document_id  uuid not null references public.patient_documents(id) on delete cascade,
  user_id      uuid not null,
  file_url     text not null,
  -- fatos do artefato (transcrição, não inferência)
  file_name    text,                    -- nome original; é o que identifica a página para a pessoa
  mime_type    text,
  size_bytes   bigint,
  document_sha256 text,                 -- base de dedup (coluna só; sem lógica de merge aqui)
  -- ordem das páginas. A pessoa fotografou na ordem em que quer ler.
  position     integer not null default 0,
  created_at   timestamptz not null default now(),
  -- a mesma página não entra duas vezes na mesma posição
  constraint uq_patient_document_file_pos unique (document_id, position)
);
create index if not exists idx_patient_document_files_doc  on public.patient_document_files(document_id, position);
create index if not exists idx_patient_document_files_user on public.patient_document_files(user_id);

-- RLS — cada pessoa vê e escreve só o que é seu, igual à tabela-mãe.
alter table public.patient_document_files enable row level security;
drop policy if exists patient_document_files_select on public.patient_document_files;
create policy patient_document_files_select on public.patient_document_files
  for select using (auth.uid() = user_id);
drop policy if exists patient_document_files_insert on public.patient_document_files;
create policy patient_document_files_insert on public.patient_document_files
  for insert with check (auth.uid() = user_id);
drop policy if exists patient_document_files_update on public.patient_document_files;
create policy patient_document_files_update on public.patient_document_files
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists patient_document_files_delete on public.patient_document_files;
create policy patient_document_files_delete on public.patient_document_files
  for delete using (auth.uid() = user_id);

comment on table public.patient_document_files is
  'ANEXO-001: páginas/arquivos de UM documento do paciente (N artefatos → 1 documento), espelhando a relação '
  'exam_documents→exams. `patient_documents.file_url` permanece como primeira página, para compatibilidade '
  'com os documentos criados antes desta migration — sem migração de dado.';
