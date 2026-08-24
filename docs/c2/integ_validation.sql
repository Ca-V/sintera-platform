-- Validação de INTEGRAÇÃO do conjunto 137→143 como arquitetura única. Exit != 0 em falha.
\set ON_ERROR_STOP on

-- ── A) TODAS AS ENTIDADES PRESENTES E COM RLS ─────────────────────────────────
do $$ declare t text; miss text := '';
begin
  foreach t in array array['exam_documents','service_requests','service_request_results','patients','practitioners','organizations','party_identifiers','terminology_bindings','consents','audit_events','procedures'] loop
    if to_regclass('public.'||t) is null then miss := miss||' '||t;
    elsif not (select relrowsecurity from pg_class where oid=('public.'||t)::regclass) then raise exception 'A: RLS off em %', t; end if;
  end loop;
  if miss <> '' then raise exception 'A: entidades ausentes:%', miss; end if;
  raise notice 'A) TODAS as 11 entidades presentes com RLS habilitada';
end $$;

-- ── B) GRAFO DE FKs cross-migração (as ligações canônicas existem) ────────────
do $$ begin
  -- service_request_results → service_requests e → exams (basedOn + resultado)
  if not exists (select 1 from pg_constraint where conrelid='public.service_request_results'::regclass and confrelid='public.service_requests'::regclass) then raise exception 'B: srr→service_requests ausente'; end if;
  if not exists (select 1 from pg_constraint where conrelid='public.service_request_results'::regclass and confrelid='public.exams'::regclass) then raise exception 'B: srr→exams ausente'; end if;
  -- wiring 140: service_requests → patients/practitioners/organizations
  if (select count(*) from pg_constraint where conrelid='public.service_requests'::regclass and contype='f' and confrelid in ('public.patients'::regclass,'public.practitioners'::regclass,'public.organizations'::regclass)) <> 3 then raise exception 'B: wiring 140 (service_requests→identidade) != 3 FKs'; end if;
  -- procedures 143 → service_requests, patients, practitioners, organizations, exams
  if (select count(*) from pg_constraint where conrelid='public.procedures'::regclass and contype='f') <> 5 then raise exception 'B: procedures FKs != 5'; end if;
  -- exam_documents 137 → exams; exams.primary_document_id → exam_documents; fulfills_order_id → exams (self)
  if not exists (select 1 from pg_constraint where conrelid='public.exam_documents'::regclass and confrelid='public.exams'::regclass) then raise exception 'B: exam_documents→exams ausente'; end if;
  if not exists (select 1 from pg_constraint where conname='exams_fulfills_order_id_fkey') then raise exception 'B: fulfills_order_id FK (137) ausente'; end if;
  raise notice 'B) GRAFO DE FKs OK (basedOn, wiring 140, procedures, exam_documents/137)';
end $$;

-- ── C) CADEIA SEMÂNTICA END-TO-END (uma arquitetura) ──────────────────────────
do $$
declare v_u uuid := 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
        v_pat uuid; v_prac uuid; v_org uuid; v_req uuid := gen_random_uuid();
        v_sr_e uuid; v_sr_d uuid; v_res uuid := '12000000-0000-0000-0000-0000000000e1'; v_ped uuid := 'ed000000-0000-0000-0000-0000000000b1';
        v_doc uuid;
begin
  -- Identidade (139)
  insert into public.patients (user_id,name) values (v_u,'Paciente') returning id into v_pat;
  insert into public.practitioners (user_id,name) values (v_u,'Solicitante') returning id into v_prac;
  insert into public.organizations (user_id,name) values (v_u,'Executante') returning id into v_org;
  -- Identifier (139): CPF do paciente (system NULL)
  insert into public.party_identifiers (user_id,patient_id,kind,value) values (v_u,v_pat,'cpf','000');
  -- Bilateral: dois ServiceRequest (138) + mesmo requisition + lateralidade + atores estruturados (140)
  insert into public.service_requests (user_id,requisition_id,source_exam_id,code_text,laterality,subject_user_id,subject_patient_id,requester_practitioner_id,performer_organization_id)
    values (v_u,v_req,v_ped,'Doppler venoso MI','esquerdo',v_u,v_pat,v_prac,v_org) returning id into v_sr_e;
  insert into public.service_requests (user_id,requisition_id,source_exam_id,code_text,laterality,subject_user_id,subject_patient_id,requester_practitioner_id,performer_organization_id)
    values (v_u,v_req,v_ped,'Doppler venoso MI','direito', v_u,v_pat,v_prac,v_org) returning id into v_sr_d;
  -- Documento original (137) sob o exame-resultado → DocumentReference
  insert into public.exam_documents (exam_id,user_id,file_url,document_role) values (v_res,v_u,'synthetic://res.pdf','laudo_final') returning id into v_doc;
  -- Resultado do lado esquerdo → basedOn (138) com proveniência + confirmação
  insert into public.service_request_results (user_id,service_request_id,result_exam_id,linked_by,link_method,confirmed,confirmed_by,confirmed_at)
    values (v_u,v_sr_e,v_res,v_u,'user_confirmed',true,v_u,now());
  -- Execução (143) basedOn a solicitação, report → exame-resultado
  insert into public.procedures (user_id,based_on_service_request_id,status,code_text,subject_user_id,subject_patient_id,performer_organization_id,report_exam_id,laterality)
    values (v_u,v_sr_e,'completed','Doppler venoso MI',v_u,v_pat,v_org,v_res,'esquerdo');
  -- Governança (142): consent + audit
  insert into public.consents (user_id,subject_user_id,purpose,status,granted_by,granted_at) values (v_u,v_u,'assistencial','active',v_u,now());
  insert into public.audit_events (user_id,action,entity_type,entity_id,actor_id,outcome) values (v_u,'link','service_request_results',v_sr_e,v_u,'success');
  -- Terminologia (141): binding do conceito (coding NULL)
  insert into public.terminology_bindings (user_id,concept_text,target_type,target_id) values (v_u,'Doppler venoso MI','service_request_code',v_sr_e);

  -- CADEIA COERENTE: Patient → ServiceRequest → (basedOn) resultado → Procedure → DocumentReference
  if not exists (
    select 1
      from public.service_requests s
      join public.patients p on p.id = s.subject_patient_id
      join public.service_request_results r on r.service_request_id = s.id and r.confirmed
      join public.exams e on e.id = r.result_exam_id
      join public.exam_documents d on d.exam_id = e.id
      join public.procedures pr on pr.based_on_service_request_id = s.id and pr.report_exam_id = e.id
      where s.id = v_sr_e and s.requisition_id = v_req
  ) then raise exception 'C: cadeia Patient→ServiceRequest→resultado→Procedure→DocumentReference não fecha'; end if;

  -- bilateral: 2 SR mesmo requisition, lateralidade individual, vínculo por solicitação (só o esquerdo)
  if (select count(*) from public.service_requests where requisition_id=v_req) <> 2 then raise exception 'C: bilateral != 2 SR'; end if;
  if (select count(*) from public.service_request_results r join public.service_requests s on s.id=r.service_request_id where s.requisition_id=v_req) <> 1 then raise exception 'C: vínculo bilateral deveria ser por solicitação (só esquerdo)'; end if;
  raise notice 'C) CADEIA SEMÂNTICA OK (Patient→ServiceRequest→resultado→Procedure→DocumentReference; bilateral por solicitação)';
end $$;

-- ── D) DUPLICIDADE pedido→resultado: fulfills_order_id (137) × service_request_results (138) coexistem ─────
do $$ begin
  -- ambos os mecanismos existem; o canônico é service_request_results (por solicitação/lado, com proveniência).
  if (select count(*) from information_schema.columns where table_name='exams' and column_name='fulfills_order_id') <> 1 then raise exception 'D: fulfills_order_id (137) ausente'; end if;
  if to_regclass('public.service_request_results') is null then raise exception 'D: service_request_results (138) ausente'; end if;
  raise notice 'D) DUPLICIDADE mapeada: fulfills_order_id(137, grão de pedido) coexiste com service_request_results(138, canônico por lado+proveniência) — 137 fica legado';
end $$;

-- ── E) SEPARAÇÃO de identidade entre recursos (nenhuma colisão de PK entre tabelas distintas) ───────────
do $$ begin
  if exists (select 1 from public.service_requests s join public.procedures p on p.id=s.id) then raise exception 'E: colisão service_request/procedure'; end if;
  if exists (select 1 from public.exams e join public.service_requests s on s.id=e.id) then raise exception 'E: colisão exam/service_request'; end if;
  raise notice 'E) SEPARAÇÃO OK (solicitação ≠ execução ≠ resultado ≠ documento — entidades distintas)';
end $$;

select 'INTEG_138_143_OK' as resultado;
