-- 145 — Versiona o job `agenda-email-reminders` e REMOVE o segredo em texto claro.
--
-- DOIS PROBLEMAS CORRIGIDOS DE UMA VEZ:
--
-- (a) RECONSTRUTIBILIDADE — o job existia apenas em produção, criado à mão conforme
--     `docs/agenda-lembretes-setup.md`. Nunca esteve na cadeia de migrations. Um banco
--     reconstruído do repositório produzia 2 de 3 jobs. A partir daqui, produz 3 de 3.
--
-- (b) SEGREDO EXPOSTO — o procedimento manual mandava colar o `ADMIN_SECRET` literal no
--     comando (`'x-admin-secret', 'COLE_AQUI_O_ADMIN_SECRET'`). Verificado em 24/08/2026:
--     o segredo ESTÁ em texto claro em `cron.job.command`. Essa tabela é legível por
--     qualquer role com `pg_read_all_data` (ex.: `supabase_read_only_user`) e o privilégio
--     de SELECT chega até `anon`. Aqui o comando passa a conter uma CONSULTA ao Vault,
--     não o valor — o texto do job deixa de ser material sensível.
--
-- PRÉ-CONDIÇÃO (executar ANTES desta migration):
--     select vault.create_secret('<valor do ADMIN_SECRET>', 'admin_secret',
--                                'Segredo do painel admin; usado por agenda-email-reminders');
--
-- ROTAÇÃO OBRIGATÓRIA: o valor antigo esteve legível em texto claro. Após aplicar,
-- rotacione o `ADMIN_SECRET` na Vercel e regrave o novo valor no Vault. Trocar o local
-- de armazenamento não desfaz a exposição pregressa.
--
-- Idempotente e reversível: reaplicar reagenda com o mesmo conteúdo; para reverter,
-- reagende a versão anterior (não recomendado — reintroduz o segredo literal).

do $$
declare
  v_tem_segredo boolean;
begin
  select exists (select 1 from vault.decrypted_secrets where name = 'admin_secret')
    into v_tem_segredo;

  if not v_tem_segredo then
    raise exception using
      message = 'Vault: segredo "admin_secret" não encontrado.',
      hint    = 'Grave-o antes de aplicar: select vault.create_secret(''<valor>'', ''admin_secret'');';
  end if;

  if exists (select 1 from cron.job where jobname = 'agenda-email-reminders') then
    perform cron.unschedule('agenda-email-reminders');
  end if;

  -- O comando abaixo NÃO contém o segredo: contém a consulta que o resolve na execução.
  perform cron.schedule(
    'agenda-email-reminders',
    '0 12 * * *',
    $cmd$
    select net.http_post(
      url     := 'https://www.sinteramais.com.br/api/agenda/reminders',
      headers := jsonb_build_object(
        'Content-Type',    'application/json',
        'x-admin-secret',  (select decrypted_secret
                              from vault.decrypted_secrets
                             where name = 'admin_secret')
      ),
      body    := '{}'::jsonb
    );
    $cmd$
  );

  raise notice '145: agenda-email-reminders reagendado lendo o segredo do Vault.';
end $$;
