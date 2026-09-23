-- 157 — CARE-003 §2.1: a conta profissional.
--
-- Um login, uma pessoa, DOIS perfis (CARE-003 §2.0). Este é o segundo: o perfil da PRÁTICA, distinto do
-- perfil pessoal em `profiles`. A mesma pessoa pode ter os dois — a nutricionista que também acompanha a
-- própria saúde — e alterna entre eles sem sair da conta.
--
-- POR QUE NÃO REUSAR `public.practitioners`. Ela existe para identidade FHIR (migração 139): representa o
-- profissional CITADO num documento — o médico que assinou o laudo, o que solicitou o exame — e na imensa
-- maioria dos casos essa pessoa NÃO tem conta na SINTERA. São dois conceitos com o mesmo nome. Fundi-los
-- poria um médico citado num exame como titular de acesso aos dados de quem o guardou. A referência entre as
-- duas, quando existir, é por projeção — nunca por fusão (ADR-001).
--
-- SEM PODERES AINDA. Esta migração cria o perfil e o estado de verificação. Vínculo, envio de documento e
-- convite vêm depois, e cada um exige `status_verificacao = 'verificado'` (CARE-003 §5).

-- Conselhos que faltavam no enum da 139, que só tinha 'crm'.
--
-- O `if exists` em volta NÃO é zelo excessivo: ao aplicar isto em produção em 23/09/2026, a migração falhou
-- com `type "public.identifier_kind" does not exist`. O bloco 137–143 do repositório — exam_documents,
-- service_requests, a identidade FHIR inteira, terminology_bindings, consents e procedures — **nunca foi
-- aplicado ao banco de produção**, embora as migrações 146 em diante tenham sido. Há um buraco no meio.
--
-- Esta tabela não depende do enum: `conselho` é uma coluna `text` com CHECK próprio. Então o enum é melhoria
-- oportunista onde ele existir, e a ausência dele não pode derrubar a criação da conta profissional.
do $$
begin
  if exists (select 1 from pg_type where typname = 'identifier_kind') then
    if not exists (select 1 from pg_enum where enumtypid = 'public.identifier_kind'::regtype and enumlabel = 'crn') then
      alter type public.identifier_kind add value 'crn';
    end if;
    if not exists (select 1 from pg_enum where enumtypid = 'public.identifier_kind'::regtype and enumlabel = 'crefito') then
      alter type public.identifier_kind add value 'crefito';
    end if;
    if not exists (select 1 from pg_enum where enumtypid = 'public.identifier_kind'::regtype and enumlabel = 'cref') then
      alter type public.identifier_kind add value 'cref';
    end if;
  end if;
end $$;

create table if not exists public.professional_profiles (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null unique references auth.users(id) on delete cascade,

  nome_profissional   text not null,
  profissao           text not null
                        check (profissao in ('medico','nutricionista','educador_fisico','fisioterapeuta','outro')),
  especialidade       text,

  -- Registro no conselho. Guardado como a pessoa digitou (`registro_numero`) e normalizado
  -- (`registro_normalizado`) para comparação. NÃO há validação de formato: os formatos variam por conselho e
  -- por região, e uma regra inventada recusaria profissional legítimo — o pior resultado possível aqui.
  -- Modelo Aberto (ADR-000): o desconhecido degrada (fica pendente), não quebra.
  conselho            text check (conselho in ('CRM','CRN','CREFITO','CREF')),
  registro_numero     text,
  registro_normalizado text,
  registro_uf         text check (registro_uf is null or char_length(registro_uf) = 2),

  status_verificacao  text not null default 'pendente'
                        check (status_verificacao in ('pendente','verificado','recusado','suspenso')),
  verificado_em       timestamptz,
  verificacao_nota    text,          -- por que foi recusado/suspenso; mostrado a quem se cadastrou

  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

comment on table public.professional_profiles is
  'CARE-003 §2.1: conta profissional (perfil da PRATICA). Distinta de public.practitioners, que e identidade '
  'FHIR do profissional CITADO em documento e em geral nao tem conta. Um perfil profissional por login.';
comment on column public.professional_profiles.status_verificacao is
  'CARE-003 §5: so `verificado` habilita enviar documento e convidar paciente. Sem isso o perfil existe e nao age.';
comment on column public.professional_profiles.registro_normalizado is
  'Registro sem separadores e em maiusculas, para comparacao. Nunca usado para VALIDAR formato.';

-- Dois profissionais não podem reivindicar o mesmo registro no mesmo conselho e UF.
create unique index if not exists uq_professional_registro
  on public.professional_profiles (conselho, registro_uf, registro_normalizado)
  where conselho is not null and registro_normalizado is not null;

create index if not exists idx_professional_profiles_status
  on public.professional_profiles (status_verificacao);

alter table public.professional_profiles enable row level security;

-- A pessoa lê e edita o PRÓPRIO perfil profissional.
drop policy if exists professional_profiles_own_select on public.professional_profiles;
create policy professional_profiles_own_select on public.professional_profiles
  for select to authenticated using (auth.uid() = user_id);

drop policy if exists professional_profiles_own_insert on public.professional_profiles;
create policy professional_profiles_own_insert on public.professional_profiles
  for insert to authenticated with check (auth.uid() = user_id);

-- Edição do próprio perfil SEM poder alterar o estado da verificação: quem se verifica não é quem se declara.
-- O `status_verificacao` só muda pelo serviço (service role), que é quem confere no conselho.
drop policy if exists professional_profiles_own_update on public.professional_profiles;
create policy professional_profiles_own_update on public.professional_profiles
  for update to authenticated
  using (auth.uid() = user_id)
  with check (
    auth.uid() = user_id
    and status_verificacao = (select p.status_verificacao from public.professional_profiles p where p.id = professional_profiles.id)
  );

-- Sem policy de DELETE: encerrar um perfil profissional com vínculos ativos tem consequência para os
-- pacientes do outro lado, e isso é fluxo próprio (CARE-003), não um `delete` solto.
