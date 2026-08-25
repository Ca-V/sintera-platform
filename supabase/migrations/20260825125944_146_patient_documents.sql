-- 146 — DOC-001/DOC-002: Documentos do paciente (atestado · relatório · encaminhamento · receita · outros).
--
-- DDL ADITIVO e idempotente. NÃO toca profiles, exams, exam_documents nem o baseline.
--
-- POR QUE TABELA PRÓPRIA, e não `exam_documents`: aquela tem `exam_id NOT NULL references exams(id)`. Um
-- atestado não é de um exame. Caber ali exigiria ou tornar `exam_id` nulável — o que destrói o significado da
-- tabela e o índice "no máximo 1 primário por exame" — ou criar um exame falso, que a invariante travada do
-- domínio proíbe: criar/associar um Documento NUNCA cria um exame nem muta o registro-alvo.
--
-- NOMES DAS COLUNAS espelham `exam_documents` de propósito (file_url · document_sha256 · source · issuer ·
-- status). Quando o repositório único de documentos (`health_documents`, DOC-001-Repositório) existir, as duas
-- tabelas migram pelo MESMO padrão, com uma migration só, em vez de inventar um terceiro formato.
--
-- RLS por `auth.uid() = user_id`, igual ao resto da plataforma. Quando o IDENT-001 for aplicado, esta tabela
-- entra na mesma reescrita mecânica das demais (`can_access_subject(user_id)`) — uma coluna entre 46.

create table if not exists public.patient_documents (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null,
  -- SUBTIPO do documento. `outro` é a válvula do Modelo Aberto: o desconhecido degrada, não quebra.
  -- Acrescentar um subtipo = este CHECK + DOCUMENT_SUBTYPES no core (os dois, sempre juntos).
  subtype          text not null default 'outro'
                     check (subtype in ('receita','atestado','relatorio','encaminhamento','outro')),
  -- artefato
  file_url         text not null,
  document_sha256  text,                     -- base de dedup (coluna só; sem lógica de merge aqui)
  -- fatos documentais (transcrição, NUNCA inferência — ADR-000 / RDC 657)
  issuer           text,
  doc_date         date,
  notes            text,
  -- proveniência
  source           text not null default 'upload_usuario',
  status           text not null default 'pending',
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create index if not exists idx_patient_documents_user    on public.patient_documents(user_id);
create index if not exists idx_patient_documents_subtype on public.patient_documents(user_id, subtype);
create index if not exists idx_patient_documents_sha256  on public.patient_documents(document_sha256);

-- Associação do documento a 1..N registros-alvo. Uma receita pode alimentar Medicamento E Suplemento.
-- `target_id` é POLIMÓRFICO (aponta para tabelas diferentes conforme `target_domain`), então não há FK
-- possível — é limitação inerente ao modelo de associação aberta, não descuido. A validação de quais pares
-- (subtype × target_domain) são legítimos vive no domínio (`canAssociate`, no core) e é testada lá.
create table if not exists public.patient_document_links (
  id            uuid primary key default gen_random_uuid(),
  document_id   uuid not null references public.patient_documents(id) on delete cascade,
  user_id       uuid not null,
  target_domain text not null
                  check (target_domain in ('medicamento','suplemento','ciclo','composicao','recurso',
                                           'habito','monitoramento','exame','consulta')),
  target_id     uuid not null,
  created_at    timestamptz not null default now(),
  -- o mesmo documento não se associa duas vezes ao mesmo alvo
  constraint uq_patient_document_link unique (document_id, target_domain, target_id)
);
create index if not exists idx_patient_document_links_doc    on public.patient_document_links(document_id);
create index if not exists idx_patient_document_links_target on public.patient_document_links(user_id, target_domain, target_id);

-- RLS — cada pessoa vê e escreve só o que é seu.
do $$
declare t text;
begin
  foreach t in array array['patient_documents','patient_document_links'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists %I_select on public.%I', t, t);
    execute format('create policy %I_select on public.%I for select using (auth.uid() = user_id)', t, t);
    execute format('drop policy if exists %I_insert on public.%I', t, t);
    execute format('create policy %I_insert on public.%I for insert with check (auth.uid() = user_id)', t, t);
    execute format('drop policy if exists %I_update on public.%I', t, t);
    execute format('create policy %I_update on public.%I for update using (auth.uid() = user_id) with check (auth.uid() = user_id)', t, t);
    execute format('drop policy if exists %I_delete on public.%I', t, t);
    execute format('create policy %I_delete on public.%I for delete using (auth.uid() = user_id)', t, t);
  end loop;
end $$;

comment on table public.patient_documents is
  'DOC-001/DOC-002: documentos clínicos do paciente (receita/atestado/relatorio/encaminhamento/outro). '
  'SEPARADO de exams e exam_documents. Criar um documento NUNCA cria exame nem muta o registro-alvo.';
comment on table public.patient_document_links is
  'DOC-001/DOC-002: associação de um documento a 1..N registros-alvo. target_id é polimórfico (sem FK); '
  'os pares válidos (subtype x target_domain) são validados no domínio (canAssociate, @sintera/core).';
