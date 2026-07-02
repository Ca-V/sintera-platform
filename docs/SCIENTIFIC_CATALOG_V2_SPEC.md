# SINTERA — Scientific Catalog v2 — Specification (Sprint 1)

**Status:** Sprint 1 — **Especificação revisável**. **Sem código, sem migrations, sem alterações de banco.** Aguarda **Design Review formal** (checklist em `POST_STABILIZATION_BACKLOG.md`) antes da Sprint 2 (Migration Plan).
**Base:** Domain Model v1.0 (`DOMAIN_MODEL_APPROVED.md`), `CATALOG_SINGLE_SOURCE_OF_TRUTH.md` (Princípio #12), `ADR-010`. Ordem deste documento: **Objetivos → Requisitos Funcionais → Requisitos Não-Funcionais → Modelo Conceitual → Modelo Físico** (físico por último — o domínio direciona o dado, não o contrário).

---

## 1. Objetivos

### 1.1 O que o Catalog v2 resolve
Consolidar o Catálogo Científico como **única fonte da verdade (SSOT)** do metadado de biomarcadores:
- **Identidade única** de cada biomarcador (`catalog_id`), independente de como cada laudo o nomeia.
- **Nomenclatura científica** curada (nome de exibição, nome científico, nome preferido, forma curta).
- **Aliases** — variações de nome dos laudos resolvidas de forma determinística para o `catalog_id`.
- **Painéis** e **Materiais** como entidades de referência de primeira classe (com rótulo e ordenação) — encerrando os mapas transicionais de `lib/biomarkers/panels.ts`.
- **Unidades** canônicas com código padronizado (**UCUM**).
- **Códigos externos**: LOINC, SNOMED CT (já parcialmente presentes).
- **Versionamento** do metadado (estado + histórico).
- **Governança/curadoria** (aprovação, revisor, data, prioridade).

### 1.2 O que o Catalog v2 deliberadamente NÃO resolve (fronteira de escopo)
Fica **fora** (fases seguintes do roadmap — ver `POST_STABILIZATION_BACKLOG.md`):
- **Scientific Retrieval Layer**, literatura, diretrizes, protocolos (Sprint 7 / `ADR-016`).
- **IA / IA Contextual**, recomendações, **busca semântica** (a resolução aqui é **determinística** por alias/normalização — não semântica).
- **Integrações externas** (wearables, labs) e **funcionalidades móveis**.
- **Event sourcing / replay / auditoria imutável** de dados clínicos (dependem do Event Store — `CAT-022/023`). O v2 versiona/audita **o próprio catálogo**, não a jornada clínica.
- **Conversão de unidades** entre sistemas (registrar UCUM; conversão é item futuro se necessário).

## 2. Requisitos Funcionais

- **RF-01 · Identidade única.** Todo biomarcador catalogado tem `catalog_id` estável e único. Séries longitudinais e agrupamentos referem-se ao `catalog_id`, nunca ao nome (fecha `CAT` de "agrupar por catalog_id").
- **RF-02 · Nomenclatura.** Campos: `display_name` (exibição), `scientific_name`, `preferred_name`, `short_name`. A UI consome; nunca origina.
- **RF-03 · Aliases.** Mapear N variações de nome de laudo (normalizadas) → 1 `catalog_id`, com `unit_pattern` opcional para desambiguar por unidade. Resolução **determinística** (normalização + alias), não semântica.
- **RF-04 · Painéis.** Painel como entidade de referência (`panel`): identidade, rótulo curado, ordenação. Um biomarcador pertence a ≥0 painéis (relação explícita).
- **RF-05 · Materiais.** Material/espécime como entidade de referência (`material`): identidade, rótulo (Sangue/Urina/Urina 24h/…), ordenação. Extensível (fezes, saliva, líquor…) **sem** `CHECK` rígido.
- **RF-06 · Unidades.** `ucum_unit` (código UCUM) + unidade canônica de exibição. Sem conversão automática nesta fase.
- **RF-07 · Códigos externos.** LOINC (`loinc_code` + status), SNOMED CT (`snomed_ct_code` + status). Mantidos e ampliáveis.
- **RF-08 · Versionamento.** Cada mudança relevante de metadado gera **nova versão** com estado do ciclo de vida (`DRAFT → CURATED → APPROVED → PUBLISHED → DEPRECATED` — `DOMAIN_STATE_MACHINE`). Só `PUBLISHED` é consumível pela UI.
- **RF-09 · Governança/curadoria.** `approval_status`, `reviewed_by`, `reviewed_at`, `rejection_reason`, `curation_priority`, `curation_wave`. Mudança de catálogo **reprojeta** consumidores (`CatalogUpdated`), **nunca reescreve** Medições (`DOMAIN_BEHAVIORS` B2).
- **RF-10 · Resolução (matching).** Dado um nome/unidade de laudo, resolver para `catalog_id` (via código, alias normalizado, unit_pattern) e reportar **cobertura** (`CatalogMatched` / `CatalogMatchMissing`) — sem fallback silencioso.
- **RF-11 · Busca operacional.** `search_terms` para localizar itens do catálogo (curadoria/UI) — busca **lexical**, não semântica.
- **RF-12 · Ordenação e visibilidade.** `sort_order` e `visibility` para exibição consistente entre telas (Web/Mobile herdam).

## 3. Requisitos Não-Funcionais

- **RNF-01 · Performance.** Resolução nome→`catalog_id` e leitura de metadados devem ser O(1)/indexadas. Catálogo é pequeno e **altamente cacheável** (leitura dominante).
- **RNF-02 · Escalabilidade.** Suportar milhares de biomarcadores e dezenas de milhares de aliases sem degradar a resolução.
- **RNF-03 · Auditabilidade.** Toda mudança de metadado é versionada e rastreável (autor/data/versão/aprovação) — do **catálogo** (não confundir com auditoria da jornada clínica, `CAT-022`).
- **RNF-04 · Compatibilidade (consumidores atuais).** `catalog_id` permanece a chave; as telas que já leem `display_name`/`specimen`/`category` via `catalog_id` continuam funcionando durante e após a migração.
- **RNF-05 · Backward compatibility.** Migração **aditiva** sobre o `biomarker_catalog` existente (não recriar). `specimen`/`category` (hoje `text`/enum) evoluem para `material_id`/`panel_id` com **camada de compatibilidade** (view/coluna espelho) até os consumidores migrarem.
- **RNF-06 · Governança de RLS/segurança.** Catálogo é leitura pública autenticada (como hoje); escrita restrita à curadoria (service role). SSOT preservado.
- **RNF-07 · Determinismo.** Nenhuma resolução probabilística/semântica nesta fase — resultados reproduzíveis.

## 4. Modelo Conceitual (entidades · relações · responsabilidades)

**Entidades**
- **BiomarkerCatalogItem** — identidade científica canônica (nomes, unidade, códigos externos, estado, governança).
- **Alias** — forma alternativa (normalizada) de nomear um item; resolve laudo→identidade.
- **Panel** — agrupamento científico nomeado (rótulo, ordenação).
- **Material** — tipo de amostra (rótulo, ordenação).
- **ExternalCode** — LOINC/SNOMED (código + status) — pode ser atributo do item ou entidade própria.
- **CatalogVersion** — versão/estado do metadado de um item (histórico de curadoria).

**Relações**
```
BiomarkerCatalogItem N—1 Material
BiomarkerCatalogItem N—N Panel            (um biomarcador em ≥0 painéis)
BiomarkerCatalogItem 1—N Alias
BiomarkerCatalogItem 1—N CatalogVersion   (histórico)
BiomarkerCatalogItem 1—N ExternalCode      (LOINC/SNOMED)
```

**Responsabilidades**
- O **catálogo** origina toda nomenclatura/painel/material/unidade/alias (SSOT). A **UI apenas consome**.
- **Medições/Exames** referenciam o item por `catalog_id` (imutável); mudança de catálogo reprojeta, não reescreve.
- **Resolução** (laudo→identidade) é responsabilidade do catálogo (aliases/normalização), não da IA nem da UI.

## 5. Modelo Físico (schema — DESIGN; sem migrations)
> Design conceitual das tabelas para revisão. **Não** é migration nem DDL executável — isso é a Sprint 2 (Migration Plan) e Sprint 3 (Implementação).

**Estado atual (v1, a estender — não recriar):** `biomarker_catalog(id, code, display_name, category, specimen, canonical_unit, measure_kind, is_critical, created_at, loinc_code, snomed_ct_code, loinc_status, snomed_status, scientific_source, scientific_version, reviewed_by, reviewed_at, approval_status, rejection_reason, curation_wave, curation_priority)` · `biomarker_aliases(alias_normalized, catalog_id, unit_pattern)`.

**Design-alvo v2 (aditivo + normalização):**
- **`biomarker_catalog`** (estende): +`scientific_name`, +`preferred_name`, +`short_name`, +`ucum_unit`, +`material_id`(fk), +`sort_order`, +`visibility`, +`search_terms`, +`tags`, +`body_system`, +`clinical_domain`, +`omics_domain`, +`version`, +`status` (ciclo de vida). Mantém `code`/`display_name` e, por compat, `specimen`/`category` espelhados até a migração dos consumidores.
- **`materials`** (nova, referência): `id`, `label`, `sort_order`. Substitui o enum `specimen` e absorve os rótulos de `panels.ts`.
- **`panels`** (nova, referência): `id`, `label`, `sort_order`.
- **`biomarker_panels`** (nova, N—N): `catalog_id`, `panel_id`.
- **`biomarker_aliases`** (estende): mantém `alias_normalized`/`catalog_id`/`unit_pattern`.
- **`catalog_versions`** (nova, histórico/curadoria): `id`, `catalog_id`, `version`, `status`, `approval_status`, `reviewed_by`, `reviewed_at`, `snapshot`.
- **Compat:** view `current_catalog` (ou colunas espelho) expondo `specimen`/`category` derivados de `material_id`/`panel_id` enquanto os consumidores migram — dissolve `lib/biomarkers/panels.ts`.

*(Colunas/índices/constraints exatos, estratégia de backfill de `material_id`/`panel_id` a partir de `specimen`/`category`, e rollback: **Sprint 2 — Migration Plan**.)*

---
## Rastreabilidade
- Escopo aderente à **Fronteira do Catalog v2** e ao **Princípio #12 (SSOT)**.
- Não altera ADRs, Bounded Contexts nem introduz entidades fora do Domain Model.
- Known Gaps relacionados: `CAT-021` (dedup) toca resolução/ingestão; `CAT-022/023` (auditoria imutável/replay) **fora** desta Spec (Event Store).

**Próximo passo:** Design Review formal (checklist de 9 itens). Só após aprovação → Sprint 2 (Migration Plan).
