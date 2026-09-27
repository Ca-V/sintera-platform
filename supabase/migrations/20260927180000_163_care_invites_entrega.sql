-- 163 — CARE-003 §2.3: o convite passa a registrar POR ONDE saiu e SE saiu.
--
-- DEFEITO ENCONTRADO NA HOMOLOGAÇÃO (fundadora, 27/09/2026). O convite era gravado, a tela dizia "Convites
-- enviados", e NADA saía — nem e-mail, nem mensagem. Quem convidasse esperaria uma resposta que nunca
-- chegaria, sem nenhum sinal de que havia problema.
--
-- O pior não era a falta do envio: era a tela AFIRMAR o que não aconteceu. Um rótulo que mente destrói a
-- confiança em todos os outros, porque a pessoa deixa de saber quais acreditar.
--
-- Sem estas colunas o rótulo continuaria adivinhando. Com elas, ele relata.
--
-- `nao_configurado` é estado próprio, separado de `falhou`, e a distinção decide o que fazer: falha é problema
-- a investigar; canal sem credencial é configuração ausente, que a pessoa certa resolve em minutos. Tratá-los
-- como a mesma coisa é a armadilha que já custou dois ciclos de homologação a este projeto.
--
-- ADITIVA. O default `pendente` descreve corretamente as linhas que já existem: foram gravadas e nunca
-- enviadas — que é literalmente o defeito.

alter table public.care_invites
  add column if not exists canal text
    check (canal is null or canal in ('email','whatsapp','desconhecido'));

alter table public.care_invites
  add column if not exists entrega text not null default 'pendente'
    check (entrega in ('pendente','entregue','falhou','nao_configurado'));

alter table public.care_invites
  add column if not exists entrega_detalhe text;

alter table public.care_invites
  add column if not exists entregue_em timestamptz;

comment on column public.care_invites.canal is
  'CARE-003 2.3: por onde o convite saiu. Decidido pelo FORMATO do contato — quem digitou e-mail recebe '
  'e-mail, quem digitou telefone recebe WhatsApp. O destinatario ainda nao e usuario e nao tem preferencia.';
comment on column public.care_invites.entrega is
  'Estado da entrega. `pendente` e o estado honesto entre gravar e enviar. `nao_configurado` e DIFERENTE de '
  '`falhou`: um e configuracao ausente, o outro e problema a investigar.';
comment on column public.care_invites.entrega_detalhe is
  'Motivo do falhou/nao_configurado, para diagnostico. NUNCA contem credencial nem dado de saude.';

create index if not exists idx_care_invites_entrega on public.care_invites(entrega)
  where entrega <> 'entregue';

-- A visão do remetente passa a expor canal e entrega. Continua SEM `para_user_id` e SEM `token`: saber se a
-- pessoa criou conta transforma o silêncio dela em cobrança (CARE-003 §3.1).
create or replace view public.care_invites_do_remetente
with (security_invoker = true) as
  select id, de_user_id, para_contato, direcao, status, criado_em, expira_em, respondido_em, care_link_id,
         canal, entrega
  from public.care_invites;
