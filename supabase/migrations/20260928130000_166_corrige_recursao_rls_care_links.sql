-- 166 — CORREÇÃO URGENTE: recursão infinita de RLS derrubou a leitura da plataforma inteira.
--
-- ============================================================================================
-- O QUE ACONTECEU (28/09/2026, achado na homologação da fundadora)
-- ============================================================================================
-- A migração 165 acrescentou `professional_profiles_paciente_select`, cuja condição consulta `care_links`.
-- A policy `care_links_profissional_select` (migração 158) já consultava `professional_profiles`.
--
-- As duas se chamam em círculo. O Postgres não desempata: aborta com
--   42P17 — infinite recursion detected in policy for relation "care_links"
--
-- ============================================================================================
-- O ALCANCE, MEDIDO E NÃO ESTIMADO
-- ============================================================================================
-- Não parou na tela de Profissionais. As 8 policies da migração 161 chamam
-- `profissional_tem_vinculo_ativo()`, que é `security invoker` e lê `care_links` — então a recursão subiu
-- por elas. Medido em produção com `role=authenticated`, ANTES da correção:
--
--   exams .............. 42P17    patient_documents ... 42P17
--   biomarkers ......... 42P17    body_metrics ........ 42P17
--   health_events ...... 42P17
--
-- Exames, Receitas e atestados, Composição Corporal e Histórico de Saúde estavam fora do ar para QUALQUER
-- pessoa autenticada, por cerca de uma hora.
--
-- POR QUE NÃO APARECEU ANTES DE IR AO AR. As consultas com a chave anônima devolviam `200 []` — sem policy
-- aplicável, a RLS nega ANTES de avaliar a condição, e a recursão nunca acontece. O erro só existe para quem
-- tem sessão. Eu conferi a migração 165 com consultas anônimas e li o silêncio como aprovação.
--
-- ============================================================================================
-- A CORREÇÃO
-- ============================================================================================
-- Basta quebrar UM lado do círculo. A policy de `professional_profiles` passa a obter os ids por uma função
-- `security definer`, que lê `care_links` sem disparar a RLS dela. O ciclo termina:
--
--   care_links → (policy) → professional_profiles → (policy) → função definer → FIM
--
-- A função NÃO amplia acesso: filtra por `auth.uid()` exatamente como a condição anterior fazia. O que muda é
-- só quem avalia a RLS de `care_links` no meio do caminho — ninguém.

create or replace function public.profissionais_que_me_acompanham()
returns setof uuid
language sql
security definer
stable
set search_path = public, pg_temp
as $$
  select cl.profissional_id
  from public.care_links cl
  where cl.paciente_user_id = auth.uid()
$$;

revoke all on function public.profissionais_que_me_acompanham() from public, anon;
grant execute on function public.profissionais_que_me_acompanham() to authenticated;

drop policy if exists professional_profiles_paciente_select on public.professional_profiles;
create policy professional_profiles_paciente_select on public.professional_profiles
  for select to authenticated
  using (id in (select public.profissionais_que_me_acompanham()));

comment on function public.profissionais_que_me_acompanham() is
  'CARE-003: os perfis profissionais ligados a quem chama. security definer DE PROPOSITO — le `care_links` '
  'SEM disparar a RLS dela, quebrando a recursao mutua entre as policies das duas tabelas (42P17). Nao '
  'amplia acesso: filtra por auth.uid(), exatamente como a policy fazia.';
