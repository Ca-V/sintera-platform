-- D-2 validação (dados sintéticos) — cenários D-01..D-12 + projeção conceitual + coerência. Exit != 0 em falha.
\set ON_ERROR_STOP on
-- Constantes sintéticas
-- U_A=aaaa… U_B=bbbb… ; REQ_1=req bilateral ; REQ_2=req multi-procedimento
-- SR_ESQ=a1..1 SR_DIR=a1..2 SR_P1=a2..1 SR_P2=a2..2 ; SR_B=b1..1

-- ── D-01/02/03 · PEDIDO BILATERAL (2 SR, mesmo requisition, lateralidade distinta, coding NULL) ──────────
insert into public.service_requests (id,user_id,requisition_id,source_exam_id,code_text,laterality,subject_user_id) values
 ('a1000000-0000-0000-0000-000000000001','aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','d1000000-0000-0000-0000-0000000000a1','ed000000-0000-0000-0000-0000000000b1','Doppler colorido venoso de membro inferior','esquerdo','aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
 ('a1000000-0000-0000-0000-000000000002','aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','d1000000-0000-0000-0000-0000000000a1','ed000000-0000-0000-0000-0000000000b1','Doppler colorido venoso de membro inferior','direito','aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa');
do $$ begin
  if (select count(*) from public.service_requests where requisition_id='d1000000-0000-0000-0000-0000000000a1') <> 2 then raise exception 'D-02: bilateral != 2'; end if;
  if (select count(distinct laterality) from public.service_requests where requisition_id='d1000000-0000-0000-0000-0000000000a1') <> 2 then raise exception 'D-03: lateralidades não distintas'; end if;
  if exists (select 1 from public.service_requests where requisition_id='d1000000-0000-0000-0000-0000000000a1' and (code_system is not null or code_value is not null)) then raise exception 'D-01: coding inventado'; end if;
  raise notice 'D-01/02/03 OK · bilateral: 2 SR, mesmo requisition, lateralidade distinta, coding NULL';
end $$;

-- ── D-04 · PEDIDO COM MÚLTIPLOS PROCEDIMENTOS (2 SR, code_text distintos, mesmo requisition) ─────────────
insert into public.service_requests (id,user_id,requisition_id,source_exam_id,code_text,subject_user_id) values
 ('a2000000-0000-0000-0000-000000000001','aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','d2000000-0000-0000-0000-0000000000a2','ed000000-0000-0000-0000-0000000000b2','Ultrassonografia de abdome total','aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
 ('a2000000-0000-0000-0000-000000000002','aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','d2000000-0000-0000-0000-0000000000a2','ed000000-0000-0000-0000-0000000000b2','Radiografia de tórax','aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa');
do $$ begin
  if (select count(*) from public.service_requests where requisition_id='d2000000-0000-0000-0000-0000000000a2') <> 2 then raise exception 'D-04: multi-proc != 2'; end if;
  if (select count(distinct code_text) from public.service_requests where requisition_id='d2000000-0000-0000-0000-0000000000a2') <> 2 then raise exception 'D-04: procedimentos não distintos'; end if;
  raise notice 'D-04 OK · multi-procedimento: 2 SR distintos, mesmo requisition';
end $$;

-- ── D-05 · RESULTADO SÓ DO LADO ESQUERDO ────────────────────────────────────────────────────────────────
insert into public.service_request_results (user_id,service_request_id,result_exam_id,linked_by,link_method,confirmed,confirmed_by,confirmed_at,evidence)
 values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','a1000000-0000-0000-0000-000000000001','12000000-0000-0000-0000-0000000000e1','aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','user_confirmed',true,'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',now(),'paciente+lateralidade+data');
do $$ begin
  if (select count(*) from public.service_request_results where service_request_id='a1000000-0000-0000-0000-000000000001' and confirmed) <> 1 then raise exception 'D-05: esquerdo não cumprido'; end if;
  if (select count(*) from public.service_request_results where service_request_id='a1000000-0000-0000-0000-000000000002') <> 0 then raise exception 'D-05: direito não deveria estar vinculado'; end if;
  raise notice 'D-05 OK · esquerdo cumprido, direito pendente';
end $$;

-- ── D-06 · RESULTADO POSTERIOR DO LADO DIREITO (linked_at posterior) ────────────────────────────────────
insert into public.service_request_results (user_id,service_request_id,result_exam_id,linked_by,linked_at,link_method,confirmed,confirmed_by,confirmed_at,evidence)
 values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','a1000000-0000-0000-0000-000000000002','12000000-0000-0000-0000-0000000000e2','aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', now() + interval '1 hour','user_confirmed',true,'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', now() + interval '1 hour','paciente+lateralidade+data');
do $$ begin
  if (select count(*) from public.service_request_results r join public.service_requests s on s.id=r.service_request_id where s.requisition_id='d1000000-0000-0000-0000-0000000000a1' and r.confirmed) <> 2 then raise exception 'D-06: bilateral não completo'; end if;
  raise notice 'D-06 OK · direito cumprido posteriormente; requisição bilateral completa';
end $$;

-- ── D-07/08 · VÍNCULO AMBÍGUO + SUGESTÃO SEM CONFIRMAÇÃO (RES_MP candidato a SR_P1 e SR_P2) ──────────────
insert into public.service_request_results (id,user_id,service_request_id,result_exam_id,linked_by,link_method,match_confidence,evidence) values
 ('c0000000-0000-0000-0000-000000000001','aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','a2000000-0000-0000-0000-000000000001','12000000-0000-0000-0000-0000000000e3','aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','auto_suggested',0.55,'match parcial'),
 ('c0000000-0000-0000-0000-000000000002','aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','a2000000-0000-0000-0000-000000000002','12000000-0000-0000-0000-0000000000e3','aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','auto_suggested',0.52,'match parcial');
do $$ begin
  if (select count(*) from public.service_request_results where result_exam_id='12000000-0000-0000-0000-0000000000e3') <> 2 then raise exception 'D-07: candidatos != 2'; end if;
  if (select count(*) from public.service_request_results where result_exam_id='12000000-0000-0000-0000-0000000000e3' and confirmed) <> 0 then raise exception 'D-08: sugestão virou vínculo sem confirmação'; end if;
  raise notice 'D-07/08 OK · ambíguo: 2 candidatos, 0 confirmados (sem vínculo silencioso)';
end $$;

-- ── D-09 · CONFIRMAÇÃO EXPLÍCITA de 1 candidato; o outro é descartado ────────────────────────────────────
update public.service_request_results set confirmed=true, confirmed_by='aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', confirmed_at=now(), link_method='user_confirmed'
 where id='c0000000-0000-0000-0000-000000000001';
delete from public.service_request_results where id='c0000000-0000-0000-0000-000000000002';
do $$ begin
  if (select count(*) from public.service_request_results where result_exam_id='12000000-0000-0000-0000-0000000000e3' and confirmed) <> 1 then raise exception 'D-09: != 1 confirmado após confirmação explícita'; end if;
  raise notice 'D-09 OK · confirmação explícita: 1 vínculo confirmado, candidato rival descartado';
end $$;

-- ── D-10 · PROVENIÊNCIA (todos os vínculos têm autor/instante/método; confirmados têm confirmador/instante) ─
do $$ begin
  if exists (select 1 from public.service_request_results where linked_by is null or link_method is null) then raise exception 'D-10: vínculo sem proveniência'; end if;
  if exists (select 1 from public.service_request_results where confirmed and (confirmed_by is null or confirmed_at is null)) then raise exception 'D-10: confirmado sem confirmador/instante'; end if;
  raise notice 'D-10 OK · proveniência completa em todos os vínculos';
end $$;

-- ── G · PROJEÇÃO CONCEITUAL (mapa, não implementação FHIR) ───────────────────────────────────────────────
do $$
declare v_based int; v_docurl text;
begin
  -- basedOn: resultado esquerdo → SR_ESQ → requisition REQ_1 (reconstrução do vínculo semântico)
  select count(*) into v_based
    from public.service_request_results r
    join public.service_requests s on s.id=r.service_request_id
    where r.result_exam_id='12000000-0000-0000-0000-0000000000e1' and r.confirmed and s.requisition_id='d1000000-0000-0000-0000-0000000000a1';
  if v_based <> 1 then raise exception 'G1: basedOn (resultado→SR→requisition) não reconstrói'; end if;
  -- DocumentReference: source_exam_id do SR aponta ao pedido com file_url preservado
  select e.file_url into v_docurl
    from public.service_requests s join public.exams e on e.id=s.source_exam_id
    where s.id='a1000000-0000-0000-0000-000000000001';
  if v_docurl is null then raise exception 'G2: documento original (file_url) não projeta p/ DocumentReference'; end if;
  raise notice 'G OK · projeção conceitual: basedOn reconstruído; DocumentReference com file_url=%', v_docurl;
end $$;

-- ── D-11 · RLS (dois sentidos), em transação ────────────────────────────────────────────────────────────
do $$ begin if not exists (select 1 from pg_roles where rolname='c2_app_user') then create role c2_app_user nologin; end if; end $$;
grant usage on schema public, auth to c2_app_user;
grant select, insert, update, delete on public.service_requests, public.service_request_results, public.exams to c2_app_user;
-- U_B tem uma solicitação própria (para provar visão só do próprio dado)
insert into public.service_requests (id,user_id,requisition_id,source_exam_id,code_text,subject_user_id)
 values ('b1000000-0000-0000-0000-000000000001','bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb','d3000000-0000-0000-0000-0000000000b3','ed000000-0000-0000-0000-0000000000c1','Exame do usuário B','bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb')
 on conflict do nothing;
begin;
  set local role c2_app_user;
  set local "test.uid" = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  do $$ begin if (select count(*) from public.service_requests) <> 4 then raise exception 'D-11a: A não vê suas 4 solicitações (viu %)', (select count(*) from public.service_requests); end if; raise notice 'D-11a OK · U_A vê as próprias 4 solicitações'; end $$;
  set local "test.uid" = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
  do $$ begin if (select count(*) from public.service_requests) <> 1 then raise exception 'D-11b: B não vê exatamente a sua 1 (viu %)', (select count(*) from public.service_requests); end if; raise notice 'D-11b OK · U_B vê só a própria solicitação (isolamento)'; end $$;
commit;

select 'D2_VALIDATION_OK' as resultado;
