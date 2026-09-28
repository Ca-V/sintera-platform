-- 165 — CARE-003: o convite passa a poder ser ACEITO. E o paciente passa a ver QUEM ele autorizou.
--
-- ============================================================================================
-- O QUE FALTAVA (achado ao responder a fundadora, 27/09/2026)
-- ============================================================================================
-- O convite era criado, enviado e aberto — e parava ali. Nada consumia o token, nada criava vínculo, e o
-- profissional que clicasse no link chegava ao `/login` com o token descartado pelo caminho.
--
-- As policies de 158 já previam o aceite: `care_invites_destinatario_update` permite ao destinatário mudar o
-- status para aceito/recusado. Mas ela depende de `para_user_id`, e NADA preenchia essa coluna — o convite
-- nascia sabendo só o contato. O elo entre "quem recebeu a mensagem" e "qual conta é essa" não existia.
--
-- ============================================================================================
-- DECISÃO: O TOKEN É A CREDENCIAL DO ACEITE
-- ============================================================================================
-- Quem apresenta o token válido é quem foi convidado. É para isso que ele existe (32 bytes de pgcrypto), é o
-- que já viaja no link, e é o que funciona quando a pessoa aceita de um e-mail diferente do que o paciente
-- digitou — o que acontece o tempo todo.
--
-- A alternativa considerada e RECUSADA era casar pelo contato no cadastro. Ela parece mais segura e é pior:
-- falha quando o profissional usa outro e-mail, e para convite por telefone exigiria telefone verificado, que
-- a plataforma não tem. Trocaria um risco pequeno por uma porta que não abre.
--
-- O que limita o token: prazo (`expira_em`), uso único (o status sai de `enviado`), e cancelamento pelo
-- remetente a qualquer momento. Aceitar ainda exige SESSÃO — o token sozinho não dá acesso a dado nenhum.
--
-- ============================================================================================
-- POR QUE FUNÇÃO `security definer`, E NÃO POLICY
-- ============================================================================================
-- O aceite toca três linhas de duas tabelas e precisa ser atômico: ou nasce o vínculo E o convite vira aceito,
-- ou nada acontece. Com policies soltas, um erro entre um passo e outro deixaria convite aceito sem vínculo —
-- a pessoa acreditando que autorizou alguém que não enxerga nada, ou pior, o contrário.
--
-- Toda função aqui é `security definer` com `search_path` fixo, valida `auth.uid()` na primeira linha, e
-- recusa o que não pode: convite de outra direção, o próprio convite, convite já respondido, convite vencido,
-- e quem não tem perfil profissional.

-- ------------------------------------------------------------------------------------------------------
-- 1. O paciente precisa ver QUEM ele autorizou
-- ------------------------------------------------------------------------------------------------------
-- DEFEITO LATENTE, achado na leitura das policies. `professional_profiles` só tinha `own_select`
-- (`auth.uid() = user_id`). O paciente não é o profissional — então o join de `getRedeDeCuidado` voltaria
-- vazio e TODO vínculo ativo apareceria como "Profissional removido", que é o texto de fallback. Nunca
-- apareceu porque nunca houve vínculo ativo; apareceria no primeiro.
--
-- Política permissiva: soma-se à `own_select` por OU, sem tocar em escrita. O que ela expõe — nome, profissão,
-- especialidade, conselho, registro, UF, status de verificação — é exatamente o que a pessoa precisa para
-- conferir a quem deu acesso. Não há dado de saúde em `professional_profiles`.
drop policy if exists professional_profiles_paciente_select on public.professional_profiles;
create policy professional_profiles_paciente_select on public.professional_profiles
  for select to authenticated
  using (exists (
    select 1 from public.care_links cl
    where cl.profissional_id = professional_profiles.id
      and cl.paciente_user_id = auth.uid()
  ));

-- ------------------------------------------------------------------------------------------------------
-- 2. O que o convite revela a quem tem o token
-- ------------------------------------------------------------------------------------------------------
-- O MÍNIMO. Primeiro nome de quem convidou, estado e prazo. Nada de sobrenome, contato, dado de saúde ou
-- motivo — o token viaja em URL, e URL vaza: fica em histórico, em print, em mensagem encaminhada.
--
-- Exige sessão. A página pública do convite continua sem chamar isto e sem revelar nome nenhum.
create or replace function public.convite_por_token(p_token text)
returns table (status text, expira_em timestamptz, primeiro_nome text, ja_tenho_perfil boolean)
language sql
security definer
set search_path = public, pg_temp
stable
as $$
  select ci.status,
         ci.expira_em,
         -- Primeiro nome só. `split_part` devolve '' quando o perfil não tem nome, e '' vira null para que a
         -- tela caia no texto genérico em vez de mostrar um espaço vazio onde deveria haver uma pessoa.
         nullif(split_part(coalesce(p.name, ''), ' ', 1), ''),
         exists (select 1 from public.professional_profiles pp where pp.user_id = auth.uid())
  from public.care_invites ci
  left join public.profiles p on p.id = ci.de_user_id
  where ci.token = p_token
    and auth.uid() is not null
    and ci.direcao = 'paciente_convida_profissional';
$$;

-- ------------------------------------------------------------------------------------------------------
-- 3. O aceite
-- ------------------------------------------------------------------------------------------------------
create or replace function public.aceitar_convite_profissional(p_token text)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_convite public.care_invites%rowtype;
  v_perfil_id uuid;
  v_link_id uuid;
begin
  if auth.uid() is null then
    raise exception 'nao_autenticado';
  end if;

  -- `for update` serializa dois aceites simultâneos do mesmo token: o segundo encontra o status já mudado e
  -- cai em `convite_ja_respondido`, em vez de criar dois vínculos.
  select * into v_convite from public.care_invites where token = p_token for update;
  if not found then
    raise exception 'convite_nao_encontrado';
  end if;

  -- Esta função é do convite que o PACIENTE enviou. O convite na direção oposta depende do plano profissional
  -- e da questão 3 do Briefing Jurídico; quando existir, terá função PRÓPRIA — para que ninguém chegue lá por
  -- engano passando um parâmetro diferente.
  if v_convite.direcao <> 'paciente_convida_profissional' then
    raise exception 'direcao_invalida';
  end if;

  if v_convite.de_user_id = auth.uid() then
    raise exception 'nao_pode_aceitar_o_proprio_convite';
  end if;

  if v_convite.status <> 'enviado' then
    raise exception 'convite_ja_respondido';
  end if;

  if v_convite.expira_em <= now() then
    raise exception 'convite_expirado';
  end if;

  select id into v_perfil_id from public.professional_profiles where user_id = auth.uid();
  if v_perfil_id is null then
    -- Não é erro da pessoa: é uma etapa que falta. A tela traduz isto em "crie seu perfil profissional",
    -- com o convite guardado — e não em "falhou".
    raise exception 'sem_perfil_profissional';
  end if;

  -- Vínculo que já existiu entre os dois (revogado antes, por exemplo) é REATIVADO, não duplicado. Duas
  -- linhas para a mesma dupla tornariam "encerrar acesso" ambíguo: encerrar qual?
  select id into v_link_id from public.care_links
   where paciente_user_id = v_convite.de_user_id and profissional_id = v_perfil_id
   limit 1;

  if v_link_id is null then
    -- `escopo` OMITIDO de propósito: o DEFAULT da tabela é o escopo padrão, e repeti-lo aqui criaria um
    -- segundo dono da mesma decisão (ADR-023). Se o padrão mudar, muda num lugar só.
    insert into public.care_links (paciente_user_id, profissional_id, status, iniciado_por, aceito_em, declaracao_relacao)
    values (v_convite.de_user_id, v_perfil_id, 'ativo', 'paciente', now(), v_convite.declaracao_relacao)
    returning id into v_link_id;
  else
    update public.care_links
       set status = 'ativo', aceito_em = now(), revogado_em = null, revogado_por = null
     where id = v_link_id;
  end if;

  update public.care_invites
     set status = 'aceito', para_user_id = auth.uid(), care_link_id = v_link_id, respondido_em = now()
   where id = v_convite.id;

  return v_link_id;
end;
$$;

-- ------------------------------------------------------------------------------------------------------
-- 4. A recusa
-- ------------------------------------------------------------------------------------------------------
-- Recusar NÃO exige perfil profissional. Quem recebeu um convite por engano precisa conseguir dizer "não sou
-- eu" sem antes se cadastrar como profissional — exigir isso seria cobrar um cadastro para sair.
create or replace function public.recusar_convite_profissional(p_token text)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_convite public.care_invites%rowtype;
begin
  if auth.uid() is null then
    raise exception 'nao_autenticado';
  end if;

  select * into v_convite from public.care_invites where token = p_token for update;
  if not found then
    raise exception 'convite_nao_encontrado';
  end if;
  if v_convite.status <> 'enviado' then
    raise exception 'convite_ja_respondido';
  end if;

  update public.care_invites
     set status = 'recusado', para_user_id = auth.uid(), respondido_em = now()
   where id = v_convite.id;
end;
$$;

-- ------------------------------------------------------------------------------------------------------
-- 5. As pessoas que autorizaram este profissional
-- ------------------------------------------------------------------------------------------------------
-- POR QUE FUNÇÃO E NÃO UMA POLICY EM `profiles`. RLS é por LINHA, não por coluna. Uma policy permissiva de
-- leitura em `profiles` entregaria a linha INTEIRA — `cycle_length`, `last_period`, `goals`, `birth_date`,
-- `height_cm` — a qualquer profissional com vínculo, independentemente do escopo que a pessoa autorizou.
-- Seria conceder por fora exatamente o que a migração 161 concede com critério.
--
-- Esta função devolve as quatro colunas que a lista precisa, e só vínculo ATIVO.
create or replace function public.pacientes_do_profissional()
returns table (
  care_link_id uuid,
  paciente_user_id uuid,
  nome text,
  escopo text[],
  desde timestamptz
)
language sql
security definer
set search_path = public, pg_temp
stable
as $$
  select cl.id,
         cl.paciente_user_id,
         -- Pessoa sem nome no perfil não some da lista nem vira um espaço em branco: a tela tem de conseguir
         -- nomeá-la de alguma forma, e o core decide como.
         nullif(trim(coalesce(p.name, '')), ''),
         cl.escopo,
         cl.aceito_em
  from public.care_links cl
  join public.professional_profiles pp on pp.id = cl.profissional_id
  left join public.profiles p on p.id = cl.paciente_user_id
  where pp.user_id = auth.uid()
    and cl.status = 'ativo'
  order by cl.aceito_em desc nulls last;
$$;

-- ------------------------------------------------------------------------------------------------------
-- 6. Quem pode chamar
-- ------------------------------------------------------------------------------------------------------
-- `anon` NÃO entra em nenhuma. Toda função aqui exige sessão, e conceder ao anônimo o direito de tentar só
-- ampliaria a superfície sem ampliar nenhuma capacidade legítima.
revoke all on function public.convite_por_token(text) from public, anon;
revoke all on function public.aceitar_convite_profissional(text) from public, anon;
revoke all on function public.recusar_convite_profissional(text) from public, anon;
revoke all on function public.pacientes_do_profissional() from public, anon;

grant execute on function public.convite_por_token(text) to authenticated;
grant execute on function public.aceitar_convite_profissional(text) to authenticated;
grant execute on function public.recusar_convite_profissional(text) to authenticated;
grant execute on function public.pacientes_do_profissional() to authenticated;

comment on function public.aceitar_convite_profissional(text) is
  'CARE-003: consome o token do convite e cria (ou reativa) o vinculo, atomicamente. Exige sessao e perfil '
  'profissional. Recusa convite de outra direcao, o proprio convite, ja respondido e vencido.';
comment on function public.pacientes_do_profissional() is
  'CARE-003: as pessoas com vinculo ATIVO com este profissional. Funcao, e nao policy em `profiles`, porque '
  'RLS e por LINHA: uma policy entregaria a linha inteira, com dado de saude fora do escopo autorizado.';
