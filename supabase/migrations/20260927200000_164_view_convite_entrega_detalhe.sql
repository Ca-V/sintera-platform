-- 164 — CARE-003: a visão do remetente expõe `entrega_detalhe`.
--
-- DEFEITO ENCONTRADO NA HOMOLOGAÇÃO (fundadora, 27/09/2026, 15:29). A tela Profissionais mostrava "Erro
-- desconhecido" e a lista vazia. Os convites não tinham sumido: a leitura inteira estourava.
--
-- CAUSA. A migração 163 adicionou `entrega_detalhe` à TABELA e recriou a visão SEM essa coluna. O cliente
-- (`getRedeDeCuidado`) passou a pedi-la em `bce66b66`, e o PostgREST recusa a consulta toda quando uma das
-- colunas do select não existe na relação — não devolve o resto, devolve erro.
--
-- O QUE ISSO ENSINA. Coluna adicionada à tabela não chega à visão sozinha. Escrever as duas coisas na mesma
-- migração não garante que elas concordem; só conferir garante. A catraca
-- `tests/contracts/visao-convite-cobre-o-select.ARCH.test.ts` passa a comparar as duas listas.
--
-- Continua SEM `para_user_id` e SEM `token`: saber se a pessoa criou conta transforma o silêncio dela em
-- cobrança (CARE-003 §3.1). `entrega_detalhe` não é dado do destinatário — é o motivo pelo qual o envio não
-- saiu, e quem precisa dele é justamente quem enviou.

create or replace view public.care_invites_do_remetente
with (security_invoker = true) as
  select id, de_user_id, para_contato, direcao, status, criado_em, expira_em, respondido_em, care_link_id,
         canal, entrega, entrega_detalhe
  from public.care_invites;

comment on view public.care_invites_do_remetente is
  'CARE-003 3.1: os convites que a pessoa ENVIOU, sem `para_user_id` e sem `token`. Toda coluna lida por '
  '`getRedeDeCuidado` precisa estar aqui — o PostgREST recusa o select inteiro se faltar uma.';
