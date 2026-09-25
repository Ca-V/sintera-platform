-- 160 — CARE-003 §1.2: o profissional PROPÕE um documento; o aceite do paciente é o que ESCREVE.
--
-- POR QUE TABELA PRÓPRIA, E NÃO UMA COLUNA EM `patient_documents`. A alternativa era acrescentar
-- `estado_aceite` lá e filtrar por ele. Duas razões derrubaram isso, e a segunda é decisiva:
--
--   1. `patient_documents` é lida em DEZ lugares hoje — listagens, associações, busca global. Um documento
--      apenas proposto passaria a aparecer em todos eles até que cada consulta ganhasse o filtro. E qualquer
--      consulta futura que esquecesse o filtro voltaria a vazar. A regra ficaria dependendo de disciplina.
--
--   2. Obrigaria o profissional a ter INSERT em `patient_documents` com `user_id` de outra pessoa —
--      enfraquecendo a policy mais forte da plataforma (`auth.uid() = user_id`) para acomodar um caso.
--
-- Com tabela própria, `patient_documents` NÃO MUDA: continua com `auth.uid() = user_id`, sem exceção. Quem
-- escreve lá, no aceite, é o próprio paciente — que é literalmente o que o CARE-003 §1.2 define. É o mesmo
-- desenho de `care_invites`, separado de `care_links`, e pela mesma razão.
--
-- ADITIVA. Tabela nova; nenhuma existente é tocada.

create table if not exists public.care_document_proposals (
  id                  uuid primary key default gen_random_uuid(),

  care_link_id        uuid not null references public.care_links(id) on delete cascade,
  -- Desnormalizados para que a RLS não precise de subconsulta em cada leitura. O vínculo continua sendo a
  -- fonte da verdade sobre a relação; estes dois são projeção dele (ADR-001).
  paciente_user_id    uuid not null references auth.users(id) on delete cascade,
  profissional_id     uuid not null references public.professional_profiles(id) on delete cascade,

  -- MESMOS subtipos de `patient_documents`. Plano alimentar e plano de treino NÃO entram aqui: eles não
  -- existem como subtipo lá, e inventá-los só neste lado quebraria o aceite, que cria a linha de lá.
  subtype             text not null default 'outro'
                        check (subtype in ('receita','atestado','relatorio','encaminhamento','outro')),

  file_url            text not null,
  document_sha256     text,
  issuer              text,
  doc_date            date,
  notes               text,

  estado              text not null default 'proposto'
                        check (estado in ('proposto','aceito','recusado','cancelado')),

  criado_em           timestamptz not null default now(),
  respondido_em       timestamptz,

  -- O documento criado pelo aceite. Nulo enquanto não houve aceite.
  patient_document_id uuid references public.patient_documents(id) on delete set null,

  -- Aceite sem documento seria aceite que não entregou nada.
  constraint chk_aceito_tem_documento
    check (estado <> 'aceito' or patient_document_id is not null),
  -- Nada muda de estado em silêncio.
  constraint chk_respondido_tem_instante
    check (estado not in ('aceito','recusado') or respondido_em is not null)
);

comment on table public.care_document_proposals is
  'CARE-003 1.2: documento PROPOSTO pelo profissional. Nao e documento do historico — vira um em '
  'patient_documents quando o paciente aceita, e quem insere la e o proprio paciente. patient_documents '
  'permanece com auth.uid() = user_id, sem excecao.';
comment on column public.care_document_proposals.patient_document_id is
  'Preenchido no aceite. E a ponte entre a proposta e o documento que passou a existir no historico.';

create index if not exists idx_cdp_paciente on public.care_document_proposals(paciente_user_id, estado);
create index if not exists idx_cdp_profissional on public.care_document_proposals(profissional_id, estado);
create index if not exists idx_cdp_link on public.care_document_proposals(care_link_id);

alter table public.care_document_proposals enable row level security;

-- ---------------------------------------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------------------------------------

-- O paciente vê o que lhe propuseram.
drop policy if exists cdp_paciente_select on public.care_document_proposals;
create policy cdp_paciente_select on public.care_document_proposals
  for select to authenticated using (auth.uid() = paciente_user_id);

-- O paciente aceita ou recusa. Só isso — ele não propõe em nome do profissional, nem cancela por ele.
drop policy if exists cdp_paciente_update on public.care_document_proposals;
create policy cdp_paciente_update on public.care_document_proposals
  for update to authenticated
  using (auth.uid() = paciente_user_id)
  with check (auth.uid() = paciente_user_id and estado in ('aceito','recusado'));

-- O profissional vê o que ele mesmo propôs — ENQUANTO O VÍNCULO ESTIVER ATIVO.
--
-- A catraca ARCH-vinculo-rls pegou esta policy sem a condição do vínculo, e estava certa. Sem ela, revogar
-- deixaria de ser imediato para este canal: o profissional continuaria lendo as propostas que fez, e com elas
-- o `file_url` de documentos sobre aquela pessoa. Revogação que não alcança tudo não é revogação.
drop policy if exists cdp_profissional_select on public.care_document_proposals;
create policy cdp_profissional_select on public.care_document_proposals
  for select to authenticated using (
    exists (
      select 1 from public.professional_profiles pp
      join public.care_links cl on cl.profissional_id = pp.id
      where pp.id = care_document_proposals.profissional_id
        and pp.user_id = auth.uid()
        and cl.id = care_document_proposals.care_link_id
        and cl.status = 'ativo'
    )
  );

-- O profissional PROPÕE — e as três condições são todas necessárias:
--   · o perfil profissional é dele;
--   · o registro no conselho está VERIFICADO (CARE-003 §5) — é o que impede alguém não habilitado de mandar
--     a um usuário um documento que ele vai ler como clínico;
--   · o vínculo está ATIVO, é o vínculo citado, e é com aquele paciente.
-- A proposta nasce obrigatoriamente em 'proposto': ninguém se autoconcede o aceite.
drop policy if exists cdp_profissional_insert on public.care_document_proposals;
create policy cdp_profissional_insert on public.care_document_proposals
  for insert to authenticated with check (
    estado = 'proposto'
    and exists (
      select 1
      from public.professional_profiles pp
      join public.care_links cl on cl.profissional_id = pp.id
      where pp.id = care_document_proposals.profissional_id
        and pp.user_id = auth.uid()
        and pp.status_verificacao = 'verificado'
        and cl.id = care_document_proposals.care_link_id
        and cl.status = 'ativo'
        and cl.paciente_user_id = care_document_proposals.paciente_user_id
    )
  );

-- O profissional só CANCELA o que propôs. Aceitar e recusar são do paciente.
drop policy if exists cdp_profissional_update on public.care_document_proposals;
create policy cdp_profissional_update on public.care_document_proposals
  for update to authenticated
  using (
    exists (
      select 1 from public.professional_profiles pp
      join public.care_links cl on cl.profissional_id = pp.id
      where pp.id = care_document_proposals.profissional_id and pp.user_id = auth.uid()
        and cl.id = care_document_proposals.care_link_id and cl.status = 'ativo'
    )
  )
  with check (
    estado = 'cancelado'
    and exists (
      select 1 from public.professional_profiles pp
      join public.care_links cl on cl.profissional_id = pp.id
      where pp.id = care_document_proposals.profissional_id and pp.user_id = auth.uid()
        and cl.id = care_document_proposals.care_link_id and cl.status = 'ativo'
    )
  );

-- Sem DELETE. Uma proposta recusada é a evidência de que a recusa foi respeitada; apagá-la permitiria
-- reenviar sem deixar rastro, que é o desenho de um mecanismo de insistência.
