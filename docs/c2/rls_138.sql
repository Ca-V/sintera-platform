-- Teste rigoroso de RLS (dois sentidos), dentro de transação (SET LOCAL válido). Pressupõe 138 aplicada
-- e as 2 linhas bilaterais do usuário A (aaaa…) presentes. Role não-owner (c2_app_user) → RLS enforced.
\set ON_ERROR_STOP on
do $$ begin if not exists (select 1 from pg_roles where rolname='c2_app_user') then create role c2_app_user nologin; end if; end $$;
grant usage on schema public, auth to c2_app_user;
grant select, insert, update, delete on public.service_requests, public.service_request_results, public.exams to c2_app_user;

begin;
  set local role c2_app_user;
  set local "test.uid" = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';   -- usuário A (dono)
  do $$ begin
    if (select count(*) from public.service_requests) <> 2 then raise exception 'RLS-A FALHOU: A não vê suas 2 linhas (viu %)', (select count(*) from public.service_requests); end if;
    raise notice 'RLS-A OK: usuário A enxerga as próprias 2 solicitações';
  end $$;
  set local "test.uid" = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';   -- usuário B (não-dono)
  do $$ begin
    if (select count(*) from public.service_requests) <> 0 then raise exception 'RLS-B FALHOU: B viu % linhas de A', (select count(*) from public.service_requests); end if;
    raise notice 'RLS-B OK: usuário B NÃO enxerga solicitações de A';
  end $$;
commit;
select 'RLS_138_OK' as resultado;
