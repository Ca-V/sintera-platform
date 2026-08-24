-- Validação da 142 (Consent + AuditEvent) em PostgreSQL isolado, dados sintéticos. Exit != 0 em falha.
\set ON_ERROR_STOP on
create schema if not exists auth;
create or replace function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('test.uid', true), '')::uuid $$;
-- role não-owner para testar RLS e append-only
do $$ begin if not exists (select 1 from pg_roles where rolname='gov_app_user') then create role gov_app_user nologin; end if; end $$;
grant usage on schema public, auth to gov_app_user;
grant select, insert, update, delete on public.consents, public.audit_events to gov_app_user;

-- ── A) ESTRUTURA ─────────────────────────────────────────────────────────────
do $$ begin
  if to_regclass('public.consents') is null or to_regclass('public.audit_events') is null then raise exception 'A: tabelas ausentes'; end if;
  if (select count(*) from pg_policies where tablename='consents') <> 4 then raise exception 'A: consents policies != 4'; end if;
  if (select count(*) from pg_policies where tablename='audit_events') <> 2 then raise exception 'A: audit_events policies != 2 (append-only)'; end if;
  if not exists (select 1 from pg_constraint where conname='chk_consent_active_grant') then raise exception 'A: chk_consent_active_grant ausente'; end if;
  if not exists (select 1 from pg_constraint where conname='chk_consent_revocation') then raise exception 'A: chk_consent_revocation ausente'; end if;
  raise notice 'A) ESTRUTURA OK (consents 4 policies + 2 CHECK; audit_events 2 policies append-only)';
end $$;

-- ── B) CONSENT por finalidade/destinatário; ativo exige evidência de concessão ──
do $$ declare v_u uuid := 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
begin
  insert into public.consents (user_id,subject_user_id,purpose,recipient,status,granted_by,granted_at,legal_basis,evidence)
    values (v_u,v_u,'compartilhamento','Clínica Parceira (sintética)','active',v_u,now(),'consentimento','termo v1 aceito');
  if (select count(*) from public.consents where status='active' and recipient is not null) <> 1 then raise exception 'B: consent ativo por destinatário não registrado'; end if;
  raise notice 'B) CONSENT OK (por finalidade+destinatário; ativo com evidência de concessão; legal_basis explícita)';
end $$;

-- ── C) NEGATIVOS: ativo sem concessão e revogado sem revogador FALHAM ──────────
do $$ declare v_u uuid := 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
begin
  begin
    insert into public.consents (user_id,subject_user_id,purpose,status) values (v_u,v_u,'interno','active');
    raise exception 'C1 FALHOU: ativo sem granted_by/at';
  exception when check_violation then raise notice 'C1 OK: chk_consent_active_grant barrou ativo sem evidência'; end;
  begin
    insert into public.consents (user_id,subject_user_id,purpose,status) values (v_u,v_u,'interno','revoked');
    raise exception 'C2 FALHOU: revogado sem revoked_by/at';
  exception when check_violation then raise notice 'C2 OK: chk_consent_revocation barrou revogação silenciosa'; end;
  raise notice 'C) NEGATIVOS OK (consentimento não silencioso)';
end $$;

-- ── D) AUDIT_EVENT append-only: insert OK; update/delete NEGADOS pelo RLS (role não-owner) ─────────────
insert into public.audit_events (user_id,action,entity_type,entity_id,actor_id,outcome,purpose)
  values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','create','service_requests',gen_random_uuid(),'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','success','registro clínico');
begin;
  set local role gov_app_user;
  set local "test.uid" = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  -- insert append permitido
  insert into public.audit_events (user_id,action,outcome) values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','read','success');
  -- update deve afetar 0 linhas (sem policy de update → RLS nega)
  do $$ declare n int; begin
    update public.audit_events set outcome='tampered'; get diagnostics n = row_count;
    if n <> 0 then raise exception 'D FALHOU: update afetou % linhas (deveria ser append-only)', n; end if;
    delete from public.audit_events; get diagnostics n = row_count;
    if n <> 0 then raise exception 'D FALHOU: delete afetou % linhas (append-only)', n; end if;
    raise notice 'D OK: audit_events append-only (update/delete negados pelo RLS)';
  end $$;
commit;

-- ── E) RLS (dois sentidos) em consents ────────────────────────────────────────
insert into public.consents (user_id,subject_user_id,purpose) values ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb','bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb','interno');
begin;
  set local role gov_app_user;
  set local "test.uid" = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  do $$ begin if exists (select 1 from public.consents where user_id <> 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa') then raise exception 'E-A: A viu consent de outro'; end if; raise notice 'E-A OK: A vê só os próprios consents'; end $$;
  set local "test.uid" = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
  do $$ begin if (select count(*) from public.consents where user_id='aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa') <> 0 then raise exception 'E-B: B viu consents de A'; end if; raise notice 'E-B OK: B não vê consents de A'; end $$;
commit;

select 'VALIDATION_142_OK' as resultado;
