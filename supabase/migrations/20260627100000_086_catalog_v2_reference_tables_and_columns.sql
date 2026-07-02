-- ============================================================
-- Scientific Catalog v2 — Estrutura (Sprint 3A · fases M1/M3/M4/M6)
-- ============================================================
-- Deriva de docs/SCIENTIFIC_CATALOG_V2_SPEC.md (§5) e docs/CATALOG_V2_MIGRATION_PLAN.md.
-- ADITIVO e NÃO-DESTRUTIVO (RNF-05): nada existente é removido; tudo é reversível
-- por `drop`. NÃO executar em produção (branch feat/catalog-v2, Sprint 3A). A
-- execução é a Sprint 3B, após o Gate Operacional.
-- ============================================================

-- ── M1 · Tabelas de referência (material e painel de primeira classe) ──────────
-- id = código canônico (ex.: 'sangue', 'hematologia_vermelha'); label = rótulo curado
-- (hoje transicional em lib/biomarkers/panels.ts → passa a residir aqui, SSOT).
create table if not exists public.materials (
  id         text     primary key,
  label      text     not null,
  sort_order smallint not null default 0
);

create table if not exists public.panels (
  id         text     primary key,
  label      text     not null,
  sort_order smallint not null default 0
);

-- ── M3 · Colunas aditivas no biomarker_catalog (todas nullable / com default) ──
alter table public.biomarker_catalog
  add column if not exists scientific_name  text,
  add column if not exists preferred_name   text,
  add column if not exists short_name       text,
  add column if not exists ucum_unit        text,
  add column if not exists material_id      text references public.materials(id),
  add column if not exists sort_order       smallint not null default 0,
  add column if not exists visibility       text not null default 'visible'
                             check (visibility in ('visible','hidden')),
  add column if not exists search_terms     text,
  add column if not exists tags             text[],
  add column if not exists body_system      text,
  add column if not exists clinical_domain  text,
  add column if not exists omics_domain     text,
  add column if not exists catalog_version  integer not null default 1,
  -- ciclo de vida (DOMAIN_STATE_MACHINE): DRAFT→CURATED→APPROVED→PUBLISHED→DEPRECATED
  add column if not exists lifecycle_status text not null default 'published'
                             check (lifecycle_status in ('draft','curated','approved','published','deprecated'));

create index if not exists biomarker_catalog_material_idx on public.biomarker_catalog (material_id);

-- ── M4 · N—N biomarcador↔painel ───────────────────────────────────────────────
create table if not exists public.biomarker_panels (
  catalog_id uuid not null references public.biomarker_catalog(id) on delete cascade,
  panel_id   text not null references public.panels(id),
  primary key (catalog_id, panel_id)
);
create index if not exists biomarker_panels_panel_idx on public.biomarker_panels (panel_id);

-- ── M6 · Versionamento / governança (histórico de curadoria) ──────────────────
create table if not exists public.catalog_versions (
  id              uuid        primary key default gen_random_uuid(),
  catalog_id      uuid        not null references public.biomarker_catalog(id) on delete cascade,
  version         integer     not null,
  lifecycle_status text       not null,
  approval_status text,
  reviewed_by     text,
  reviewed_at     timestamptz,
  snapshot        jsonb,
  created_at      timestamptz not null default now(),
  unique (catalog_id, version)
);
create index if not exists catalog_versions_catalog_idx on public.catalog_versions (catalog_id);

-- ── RLS — leitura pública autenticada (como biomarker_catalog); escrita = service role ──
alter table public.materials        enable row level security;
alter table public.panels           enable row level security;
alter table public.biomarker_panels enable row level security;
alter table public.catalog_versions enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='materials' and policyname='materials_read') then
    create policy materials_read on public.materials for select to authenticated using (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='panels' and policyname='panels_read') then
    create policy panels_read on public.panels for select to authenticated using (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='biomarker_panels' and policyname='biomarker_panels_read') then
    create policy biomarker_panels_read on public.biomarker_panels for select to authenticated using (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='catalog_versions' and policyname='catalog_versions_read') then
    create policy catalog_versions_read on public.catalog_versions for select to authenticated using (true);
  end if;
end $$;

grant select on public.materials, public.panels, public.biomarker_panels, public.catalog_versions to authenticated;

-- Rollback (se necessário): drop das 3 tabelas novas + drop das colunas add-ed +
-- drop da tabela catalog_versions. Nada legado é tocado (specimen/category intactos).
