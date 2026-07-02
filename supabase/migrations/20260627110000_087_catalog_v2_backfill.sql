-- ============================================================
-- Scientific Catalog v2 — Backfill determinístico (Sprint 3A · M2/M5/M6-dados)
-- ============================================================
-- IDEMPOTENTE (§3 do Migration Plan): executar 2+ vezes produz o mesmo estado
-- final. Todo passo é upsert por chave natural (materials.id / panels.id /
-- (catalog_id,panel_id) / (catalog_id,version)) — nunca insert cego.
-- Rótulos = fonte transicional lib/biomarkers/panels.ts (SPECIMEN_LABEL/CATEGORY_LABEL),
-- que passa a residir no banco (SSOT). NÃO executar em produção (Sprint 3A).
-- ============================================================

-- ── M2 · Popular materials (de specimen + SPECIMEN_LABEL/SPECIMEN_ORDER) ────────
insert into public.materials (id, label, sort_order) values
  ('sangue',    'Exame de sangue',              0),
  ('urina',     'Exame de urina',               1),
  ('urina_24h', 'Exame de urina (24 horas)',    2)
on conflict (id) do update set label = excluded.label, sort_order = excluded.sort_order;

-- ── M2 · Popular panels (de category + CATEGORY_LABEL) ─────────────────────────
insert into public.panels (id, label, sort_order) values
  ('hematologia_vermelha',          'Série vermelha',                              0),
  ('hematologia_branca_plaquetas',  'Série branca e plaquetas',                    1),
  ('coagulacao',                    'Coagulação',                                  2),
  ('metabolismo_ferro',             'Metabolismo do ferro',                        3),
  ('metabolismo_glicose',           'Glicose',                                     4),
  ('funcao_tireoidiana',            'Tireoide',                                    5),
  ('inflamacao_imunologia',         'Inflamação e imunologia',                     6),
  ('funcao_hepatica_proteinas',     'Fígado e proteínas',                          7),
  ('funcao_renal_eletrolitos',      'Rins e eletrólitos',                          8),
  ('urina_24h',                     'Urina de 24 horas',                           9),
  ('vitaminas_minerais',            'Vitaminas e minerais',                       10),
  ('hormonios_sexuais_reprodutivo', 'Hormônios sexuais e reprodutivos',           11),
  ('cardiometabolico',              'Perfil lipídico (colesterol e triglicérides)',12),
  ('urinalise_eas',                 'Urina tipo I (EAS)',                         13)
on conflict (id) do update set label = excluded.label, sort_order = excluded.sort_order;

-- ── M5 · Backfill material_id (de specimen) ────────────────────────────────────
-- Determinístico: material_id = specimen (o material já existe em materials via M2).
-- Só popula onde há material correspondente; specimen sem match fica NULL e é
-- listado pela validação (não silencioso). NÃO sobrescreve curadoria manual futura.
update public.biomarker_catalog bc
   set material_id = bc.specimen
  from public.materials m
 where m.id = bc.specimen
   and bc.material_id is distinct from bc.specimen;

-- ── M5 · Backfill biomarker_panels (de category) ───────────────────────────────
-- category vira uma associação N—N; upsert por (catalog_id, panel_id).
insert into public.biomarker_panels (catalog_id, panel_id)
select bc.id, bc.category
  from public.biomarker_catalog bc
  join public.panels p on p.id = bc.category
 where bc.category is not null
on conflict (catalog_id, panel_id) do nothing;

-- ── M6-dados · Versão inicial (PUBLISHED) por item ─────────────────────────────
-- Snapshot do estado v1; idempotente por (catalog_id, version). Não gera v2 aqui.
insert into public.catalog_versions
  (catalog_id, version, lifecycle_status, approval_status, reviewed_by, reviewed_at, snapshot)
select bc.id, 1, coalesce(bc.lifecycle_status, 'published'),
       bc.approval_status, bc.reviewed_by, bc.reviewed_at, to_jsonb(bc)
  from public.biomarker_catalog bc
on conflict (catalog_id, version) do nothing;

-- Rollback: as colunas/linhas preenchidas podem ser limpas
-- (update material_id=null; delete from biomarker_panels; delete from catalog_versions).
-- Nada legado (specimen/category) é alterado — a origem permanece intacta.
