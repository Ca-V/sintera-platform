-- Pós-rollback: prova que a 138 foi totalmente removida e que os dados LEGADOS permanecem intactos.
\set ON_ERROR_STOP on
do $$ begin
  -- objetos da 138 removidos
  if to_regclass('public.service_requests') is not null then raise exception 'R1: service_requests não removida'; end if;
  if to_regclass('public.service_request_results') is not null then raise exception 'R2: service_request_results não removida'; end if;
  if exists (select 1 from pg_type where typname in ('service_request_status','service_request_intent','order_link_method')) then raise exception 'R3: enums da 138 não removidos'; end if;
  -- legado intacto (mesmas 2 linhas, valores inalterados)
  if (select count(*) from public.exams) <> 2 then raise exception 'R4: nº de linhas legadas mudou'; end if;
  if not exists (select 1 from public.exams where id='11111111-1111-1111-1111-111111111111' and document_type='medical_order' and order_status='pendente' and display_title='pedido.pdf') then raise exception 'R5: linha legada 1 alterada'; end if;
  if not exists (select 1 from public.exams where id='22222222-2222-2222-2222-222222222222' and document_type is null and order_status='processed' and display_title='Hemograma') then raise exception 'R6: linha legada 2 alterada'; end if;
  raise notice 'ROLLBACK OK: 138 removida por completo; dados legados 100%% intactos';
end $$;
select 'LEGACY_INTACT_OK' as resultado;
