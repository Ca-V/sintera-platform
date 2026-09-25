-- 159 — CARE-003 §2.3: o convite.
--
-- POR QUE É ENTIDADE PRÓPRIA, e não um `care_links` em estado 'convidado': o convite precisa existir para
-- quem AINDA NÃO TEM CONTA. A pessoa convida a nutricionista que nunca entrou na plataforma; o vínculo só
-- pode nascer quando as duas pontas existem. Confundir os dois obrigaria `care_links` a aceitar um
-- profissional nulo — e uma tabela de vínculo que aceita vínculo sem uma das partes deixa de garantir o que
-- existe para garantir.
--
-- O QUE ESTA TABELA NUNCA PODE CONTER: dado de saúde. Nem no corpo, nem em campo auxiliar. Um convite lido
-- por quem não deveria não pode revelar nada além de que uma pessoa quis se conectar a outra. Por isso aqui
-- só há contato, direção e a declaração de relação — e nenhuma coluna livre onde alguém possa despejar
-- contexto clínico "para facilitar".
--
-- ADITIVA. Tabela nova.

create table if not exists public.care_invites (
  id                 uuid primary key default gen_random_uuid(),

  -- Quem convidou. Sempre existe: convite anônimo não existe.
  de_user_id         uuid not null references auth.users(id) on delete cascade,

  -- Para onde foi. `para_contato` é e-mail ou telefone; `para_user_id` só é preenchido quando a pessoa
  -- passa a existir na plataforma. Guardar o contato é o que permite reconhecer o convite no cadastro.
  para_contato       text not null,
  para_user_id       uuid references auth.users(id) on delete set null,

  direcao            text not null
                       check (direcao in ('paciente_convida_profissional','profissional_convida_paciente')),

  status             text not null default 'enviado'
                       check (status in ('enviado','aceito','recusado','expirado','cancelado')),

  -- Gerado NO BANCO com pgcrypto, como em `report_shares`: o cliente não tem Web Crypto no Hermes/Expo, e um
  -- token fraco aqui é acesso indevido ao fluxo de aceite.
  token              text not null unique default encode(gen_random_bytes(32), 'hex'),

  -- Obrigatória quando o profissional inicia (CARE-003 §4.2). É ela que sustenta o uso do contato que ele já
  -- detém em razão do atendimento — pendente da questão 3 do Briefing Jurídico.
  declaracao_relacao text,

  -- O vínculo criado pelo aceite. Nulo enquanto o convite não foi aceito.
  care_link_id       uuid references public.care_links(id) on delete set null,

  criado_em          timestamptz not null default now(),
  expira_em          timestamptz not null default (now() + interval '30 days'),
  respondido_em      timestamptz,

  constraint chk_convite_profissional_declara
    check (direcao <> 'profissional_convida_paciente' or declaracao_relacao is not null),
  -- Respondido (aceito/recusado) exige o instante. Nada muda de estado em silêncio.
  constraint chk_respondido_tem_instante
    check (status not in ('aceito','recusado') or respondido_em is not null),
  -- Aceite produz vínculo. Um convite aceito sem vínculo seria um aceite que não concedeu nada.
  constraint chk_aceito_tem_vinculo
    check (status <> 'aceito' or care_link_id is not null)
);

comment on table public.care_invites is
  'CARE-003 2.3: convite para formar vinculo. Entidade PROPRIA porque precisa existir para quem ainda nao tem '
  'conta. NUNCA contem dado de saude — so contato, direcao e declaracao de relacao.';
comment on column public.care_invites.para_contato is
  'E-mail ou telefone de destino. Dado pessoal de TERCEIRO ate o aceite — nunca exibido a quem nao enviou.';
comment on column public.care_invites.token is
  'Gerado no banco (pgcrypto). O cliente nao gera: Hermes/Expo nao tem Web Crypto e token fraco aqui e acesso indevido.';

create index if not exists idx_care_invites_de on public.care_invites(de_user_id);
create index if not exists idx_care_invites_para_user on public.care_invites(para_user_id);
create index if not exists idx_care_invites_contato on public.care_invites(lower(para_contato));
-- Um convite PENDENTE por destino e remetente. Recusados e expirados nao bloqueiam tentar de novo.
create unique index if not exists uq_care_invites_pendente
  on public.care_invites (de_user_id, lower(para_contato))
  where status = 'enviado';

alter table public.care_invites enable row level security;

-- Quem enviou vê e cancela o que enviou.
drop policy if exists care_invites_remetente_select on public.care_invites;
create policy care_invites_remetente_select on public.care_invites
  for select to authenticated using (auth.uid() = de_user_id);

drop policy if exists care_invites_remetente_insert on public.care_invites;
create policy care_invites_remetente_insert on public.care_invites
  for insert to authenticated with check (auth.uid() = de_user_id);

drop policy if exists care_invites_remetente_update on public.care_invites;
create policy care_invites_remetente_update on public.care_invites
  for update to authenticated
  using (auth.uid() = de_user_id)
  -- O remetente só CANCELA. Aceitar e recusar são do destinatário — quem convida não responde por ele.
  with check (auth.uid() = de_user_id and status in ('enviado','cancelado','expirado'));

-- O destinatário vê e responde ao convite que é dele, depois de vinculado à conta.
drop policy if exists care_invites_destinatario_select on public.care_invites;
create policy care_invites_destinatario_select on public.care_invites
  for select to authenticated using (auth.uid() = para_user_id);

drop policy if exists care_invites_destinatario_update on public.care_invites;
create policy care_invites_destinatario_update on public.care_invites
  for update to authenticated
  using (auth.uid() = para_user_id)
  with check (auth.uid() = para_user_id and status in ('aceito','recusado'));

-- Sem DELETE: o convite recusado é a evidência de que a recusa foi respeitada. Apagá-lo permitiria reenviar
-- indefinidamente sem deixar rastro, que é o desenho de um mecanismo de insistência.

-- ---------------------------------------------------------------------------------------------------------
-- O QUE O REMETENTE NÃO PODE SABER
-- ---------------------------------------------------------------------------------------------------------
-- A policy acima deixa o remetente ler a própria linha inteira, inclusive `para_user_id` — o que revelaria se
-- a pessoa criou conta. A leitura na aplicação é feita por uma visão que omite isso, e a regra fica escrita
-- aqui para não se perder: saber se o convite "chegou" transforma silêncio em cobrança (CARE-003 §3.1).
create or replace view public.care_invites_do_remetente
with (security_invoker = true) as
  select id, de_user_id, para_contato, direcao, status, criado_em, expira_em, respondido_em, care_link_id
  from public.care_invites;

comment on view public.care_invites_do_remetente is
  'CARE-003 3.1: o que quem convidou pode ver. Omite `para_user_id` e `token` de proposito — saber se a pessoa '
  'criou conta transforma o silencio dela em cobranca. security_invoker: o RLS de care_invites continua valendo.';
