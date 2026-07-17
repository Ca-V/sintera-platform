-- Função de SEED de demonstração (reproduzível, idempotente). Popula dados fictícios para um usuário demo.
-- NÃO cria o usuário de auth (isso é feito pelo runner via admin API, ou manualmente). Aqui só POPULA.
-- Uso: select public.seed_demo();  (ou public.seed_demo('outro@email'))
create or replace function public.seed_demo(p_email text default 'demo@sintera.app')
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid;
  ex_hemograma uuid := gen_random_uuid();
  ex_rm uuid := gen_random_uuid();
  ev_hemograma uuid := gen_random_uuid();
begin
  select id into uid from auth.users where email = p_email;
  if uid is null then
    return 'Usuario ' || p_email || ' NAO existe. Crie o auth user (runner/admin) e rode novamente.';
  end if;

  -- Idempotência: limpa dados anteriores do usuário demo (ordem segura p/ FKs).
  update exams set current_extraction_version_id = null where user_id = uid;
  delete from biomarkers where user_id = uid;
  delete from extraction_versions where user_id = uid;
  delete from body_metrics where user_id = uid;
  delete from health_conditions where user_id = uid;
  delete from health_resources where user_id = uid;
  delete from medications where user_id = uid;
  delete from health_events where user_id = uid;
  delete from exams where user_id = uid;

  insert into exams (id, user_id, type, exam_date, status, document_type, issuer, requesting_physician, clinical_family, page_count, patient_name, synthetic, created_at)
  values (ex_hemograma, uid, 'Hemograma completo', current_date - 20, 'processed', 'lab_result', 'Laboratório Demo', 'Dra. Demo Clínica Geral', 'laboratory', 1, 'Usuária Demo', false, now());
  insert into extraction_versions (id, exam_id, user_id, version_number, status, origin)
  values (ev_hemograma, ex_hemograma, uid, 1, 'valid', 'fresh');
  update exams set current_extraction_version_id = ev_hemograma where id = ex_hemograma;
  insert into biomarkers (exam_id, user_id, name, value, unit, reference_min, reference_max, interpretation, result_type, extraction_version_id, synthetic, source, reference_source)
  values
   (ex_hemograma, uid, 'Hemoglobina',      14.2, 'g/dL',   12,   16,   'dentro_da_referencia', 'numeric', ev_hemograma, false, 'ai_extracted', 'laudo'),
   (ex_hemograma, uid, 'Leucócitos',       7200, '/mm³',   4000, 11000,'dentro_da_referencia', 'numeric', ev_hemograma, false, 'ai_extracted', 'laudo'),
   (ex_hemograma, uid, 'Glicose',          105,  'mg/dL',  70,   99,   'acima_da_referencia',  'numeric', ev_hemograma, false, 'ai_extracted', 'laudo'),
   (ex_hemograma, uid, 'Colesterol total', 190,  'mg/dL',  0,    200,  'dentro_da_referencia', 'numeric', ev_hemograma, false, 'ai_extracted', 'laudo'),
   (ex_hemograma, uid, 'TSH',              2.1,  'µUI/mL', 0.4,  4.0,  'dentro_da_referencia', 'numeric', ev_hemograma, false, 'ai_extracted', 'laudo');

  insert into exams (id, user_id, type, exam_date, status, document_type, issuer, clinical_family, extraction_completeness, page_count, patient_name, synthetic, created_at)
  values (ex_rm, uid, 'Ressonância magnética do crânio', current_date - 60, 'processed', 'imaging_report', 'Clínica de Imagem Demo', 'imaging', 'document_only', 3, 'Usuária Demo', false, now());

  insert into medications (user_id, name, dose, frequency, started_on, status, kind)
  values
   (uid, 'Losartana',  '50 mg',   '1x ao dia', current_date - 120, 'em_uso', 'medicamento'),
   (uid, 'Vitamina D', '2000 UI', '1x ao dia', current_date - 90,  'em_uso', 'suplemento'),
   (uid, 'Ômega 3',    '1000 mg', '2x ao dia', current_date - 40,  'em_uso', 'suplemento');

  insert into health_events (user_id, event_type, title, event_date, status, source, professional_kind, professional_name, establishment, modality, amount_cents, direct_expense, expense_doc_type, synthetic, is_return, priority, outcome, reminder_enabled)
  values
   (uid, 'consulta', 'Consulta Cardiologia', current_date - 15, 'realizado', 'manual', 'medico', 'Dr. Demo Cardio', 'Clínica Demo', 'presencial', 35000, false, 'nota_fiscal', false, false, 'media', '{"summary":"Pressão controlada; manter Losartana."}'::jsonb, true),
   (uid, 'exame',    'Ultrassom abdominal',  current_date + 10, 'planejado', 'manual', 'medico', null, 'Clínica de Imagem Demo', 'presencial', null, false, null, false, false, 'alta', null, true),
   (uid, 'consulta', 'Retorno Cardiologia',  current_date + 30, 'planejado', 'manual', 'medico', 'Dr. Demo Cardio', 'Clínica Demo', 'telemedicina', null, false, null, false, true, 'baixa', null, true),
   (uid, 'plano',    'Plano de saúde',       current_date - 5,  'realizado', 'manual', null, null, 'Operadora Demo', null, 45000, true, 'comprovante', false, false, null, null, false);

  insert into body_metrics (user_id, metric, value_text, unit, measured_on)
  values
   (uid, 'peso',                   '74', 'kg', current_date - 90),
   (uid, 'peso',                   '72', 'kg', current_date - 10),
   (uid, 'altura',                 '168','cm', current_date - 200),
   (uid, 'circunferencia_cintura', '82', 'cm', current_date - 10),
   (uid, 'gordura_corporal',       '24', '%',  current_date - 10);

  insert into health_conditions (user_id, scope, name, since_label, notes)
  values
   (uid, 'propria',  'Hipertensão arterial', '2022', 'Controlada com Losartana.'),
   (uid, 'familiar', 'Diabetes tipo 2',      null,   'Mãe.');

  insert into health_resources (user_id, resource_type, name, prescriber, started_on, status, attributes)
  values
   (uid, 'correcao_visual', 'Óculos de grau', 'Dr. Demo Oftalmo', current_date - 300, 'em_uso',
    '{"vision_kind":"oculos","od":{"sph":"-2,00","cyl":"-0,75","axis":"180"},"oe":{"sph":"-1,75","cyl":"-0,50","axis":"170"}}'::jsonb);

  return 'Seed demo aplicado para ' || p_email || ' (' || uid || '): 2 exames, 3 medicamentos/suplementos, 4 eventos, 5 medidas, 2 condicoes, 1 recurso.';
end $$;

revoke all on function public.seed_demo(text) from public, anon, authenticated;
