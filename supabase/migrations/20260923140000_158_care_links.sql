-- 158 — CARE-003 §2.2: o vínculo entre uma pessoa e o profissional que a acompanha.
--
-- É a RELAÇÃO CONTÍNUA, sem prazo de validade. Não confundir com o Care Space do CARE-001, que é episódico,
-- nasce em torno de um Evento Assistencial e expira. O vínculo é o substrato sobre o qual o Care Space
-- passará a existir; termina por revogação, nunca por relógio.
--
-- INVARIANTE QUE ESTA MIGRAÇÃO PRECISA SUSTENTAR (CARE-003 §1.1): nenhum vínculo existe sem ato afirmativo do
-- titular dos dados. Quem INICIA a conversa é questão de produto — o convite pode partir dos dois lados. Quem
-- CRIA o acesso é sempre o paciente, e é por isso que `aceito_em` só é preenchido por ele.
--
-- ADITIVA. Tabela nova; não toca nada existente.

create table if not exists public.care_links (
  id                uuid primary key default gen_random_uuid(),

  paciente_user_id  uuid not null references auth.users(id) on delete cascade,
  profissional_id   uuid not null references public.professional_profiles(id) on delete cascade,

  status            text not null default 'convidado'
                      check (status in ('convidado','ativo','recusado','revogado','encerrado')),

  -- Quem mandou o convite. Na fase de lançamento só 'paciente' ocorre: o entitlement
  -- `prof.convidar_pacientes` nasce desligado em todos os planos (BILLING-003 §5).
  iniciado_por      text not null check (iniciado_por in ('paciente','profissional')),

  -- O que o profissional enxerga. Escopo é do PACIENTE: ele define no aceite e altera quando quiser.
  -- O padrão é o mínimo que torna o vínculo útil. Ficam DE FORA por decisão (CARE-003 §3.2): hábitos, ciclo,
  -- contracepção e saúde da mulher — os dados em que a exposição indesejada custa mais caro.
  escopo            text[] not null default array['exames','documentos','medidas','historico-saude'],

  criado_em         timestamptz not null default now(),
  aceito_em         timestamptz,
  revogado_em       timestamptz,
  revogado_por      text check (revogado_por is null or revogado_por in ('paciente','profissional','sistema')),

  -- Declaração de relação assistencial existente, obrigatória quando o profissional inicia (CARE-003 §4.2).
  -- Guardada porque é ela que sustenta o uso do contato do paciente — pendente da questão 3 do Briefing.
  declaracao_relacao text,

  -- Um vínculo vigente por par. Encerrados não bloqueiam um novo começo.
  constraint uq_care_links_par unique (paciente_user_id, profissional_id),

  -- Nada silencioso: ativo exige instante de aceite; revogado exige instante e autor da revogação.
  constraint chk_ativo_tem_aceite
    check (status <> 'ativo' or aceito_em is not null),
  constraint chk_revogado_tem_autor
    check (status <> 'revogado' or (revogado_em is not null and revogado_por is not null)),
  -- Convite do profissional exige a declaração. O do paciente não precisa: ele é o titular.
  constraint chk_convite_profissional_declara
    check (iniciado_por <> 'profissional' or declaracao_relacao is not null)
);

comment on table public.care_links is
  'CARE-003 2.2: vinculo CONTINUO paciente<->profissional. Sem prazo; termina por revogacao. Substrato do '
  'Care Space (CARE-001), que e episodico. Nenhum vinculo existe sem aceite do titular.';
comment on column public.care_links.escopo is
  'CARE-003 3.2: modulos que o profissional enxerga. Do PACIENTE — definido no aceite, alteravel a qualquer momento.';
comment on column public.care_links.iniciado_por is
  'Quem mandou o convite. Nao muda quem CRIA o acesso: o aceite e sempre do paciente.';

create index if not exists idx_care_links_paciente on public.care_links(paciente_user_id);
create index if not exists idx_care_links_profissional on public.care_links(profissional_id);
create index if not exists idx_care_links_ativos on public.care_links(paciente_user_id, profissional_id)
  where status = 'ativo';

alter table public.care_links enable row level security;

-- ---------------------------------------------------------------------------------------------------------
-- RLS — o paciente é dono do vínculo; o profissional só enxerga o que diz respeito a ele.
-- ---------------------------------------------------------------------------------------------------------

-- O paciente vê todos os seus vínculos, em qualquer estado.
drop policy if exists care_links_paciente_select on public.care_links;
create policy care_links_paciente_select on public.care_links
  for select to authenticated using (auth.uid() = paciente_user_id);

-- O paciente cria vínculo — convidando um profissional.
drop policy if exists care_links_paciente_insert on public.care_links;
create policy care_links_paciente_insert on public.care_links
  for insert to authenticated with check (auth.uid() = paciente_user_id);

-- O paciente aceita, altera escopo e revoga. É a única via para `aceito_em`.
drop policy if exists care_links_paciente_update on public.care_links;
create policy care_links_paciente_update on public.care_links
  for update to authenticated
  using (auth.uid() = paciente_user_id) with check (auth.uid() = paciente_user_id);

-- O profissional vê os vínculos em que ele é o profissional. Inclui `convidado` — precisa saber que foi
-- convidado para poder responder — e exclui o resto por não ser assunto dele.
drop policy if exists care_links_profissional_select on public.care_links;
create policy care_links_profissional_select on public.care_links
  for select to authenticated using (
    exists (
      select 1 from public.professional_profiles pp
      where pp.id = care_links.profissional_id and pp.user_id = auth.uid()
    )
  );

-- O profissional pode ENCERRAR um vínculo seu. Não pode ativar: ativar é aceite, e aceite é do titular.
-- A catraca de `chk_ativo_tem_aceite` não basta sozinha, então o `with check` proíbe o estado 'ativo' aqui.
drop policy if exists care_links_profissional_update on public.care_links;
create policy care_links_profissional_update on public.care_links
  for update to authenticated
  using (
    exists (
      select 1 from public.professional_profiles pp
      where pp.id = care_links.profissional_id and pp.user_id = auth.uid()
    )
  )
  with check (
    status in ('recusado','encerrado','revogado')
    and exists (
      select 1 from public.professional_profiles pp
      where pp.id = care_links.profissional_id and pp.user_id = auth.uid()
    )
  );

-- Sem DELETE para ninguém: vínculo encerrado é HISTÓRICO. Apagar a linha apagaria a prova de que um
-- profissional teve acesso aos dados de alguém, que é exatamente o que a auditoria precisa conservar.

-- ---------------------------------------------------------------------------------------------------------
-- A função que as demais tabelas vão consultar para liberar leitura ao profissional.
-- ---------------------------------------------------------------------------------------------------------
--
-- SECURITY INVOKER de propósito. Uma função SECURITY DEFINER aqui apareceria no linter como executável por
-- `authenticated`, e não é necessária: o profissional já enxerga os próprios vínculos pela policy acima, então
-- a subconsulta funciona sob o RLS de quem chama. Menos privilégio, mesmo resultado.
--
-- `search_path` fixado — função sem search_path fixo é a falha que o próprio linter do projeto acusa.
create or replace function public.profissional_tem_vinculo_ativo(p_paciente uuid, p_modulo text)
returns boolean
language sql
stable
security invoker
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.care_links cl
    join public.professional_profiles pp on pp.id = cl.profissional_id
    where cl.paciente_user_id = p_paciente
      and pp.user_id = auth.uid()
      and cl.status = 'ativo'
      and p_modulo = any(cl.escopo)
  );
$$;

comment on function public.profissional_tem_vinculo_ativo(uuid, text) is
  'CARE-003 3.3: quem chama tem vinculo ATIVO com este paciente, com este modulo dentro do escopo? '
  'As policies das tabelas de dado consultam esta funcao. Vinculo nao-ativo ou modulo fora do escopo => false.';
