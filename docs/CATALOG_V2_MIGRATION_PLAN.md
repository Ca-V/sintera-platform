# SINTERA — Scientific Catalog v2 — Migration Plan (Sprint 2)

**Status:** Sprint 2 — **Plano de migração revisável**. **Sem código de negócio, sem DDL executado, sem alterar o banco.** Descreve *como* migrar; a execução é a **Sprint 3** (gated pelo **Gate Operacional**).
**Base:** `SCIENTIFIC_CATALOG_V2_SPEC.md` (§5 Modelo Físico). **Princípio herdado (RNF-05):** *nenhuma alteração poderá exigir migração destrutiva na primeira versão* — tudo **aditivo e reversível**.
**Pré-requisitos para EXECUTAR (Sprint 3):** Spec aprovada ✅ · Design Review do Migration Plan · **Gate Operacional** (smoke Grupo A · cutover · cadastro).

---

## 1. Objetivo
Evoluir o `biomarker_catalog` (v1) para o design-alvo da Spec **sem quebrar consumidores** e **sem migração destrutiva**, mantendo o `catalog_id` como chave estável.

## 2. Estratégia — fases aditivas (cada uma reversível isoladamente)
**Fase M1 — Tabelas de referência (novas, vazias).** Criar `materials` e `panels` (`id`, `label`, `sort_order`). Zero impacto nos consumidores (nada as usa ainda).
**Fase M2 — Popular referências (backfill de rótulos).** Inserir em `materials`/`panels` os valores hoje existentes em `specimen`/`category` (enums), usando os rótulos curados que hoje vivem em `lib/biomarkers/panels.ts` (fonte transicional → passa a residir no banco).
**Fase M3 — Colunas aditivas no `biomarker_catalog`.** Adicionar (nullable, sem `NOT NULL` inicial): `scientific_name`, `preferred_name`, `short_name`, `ucum_unit`, `material_id`(fk→materials), `sort_order`, `visibility`, `search_terms`, `tags`, `body_system`, `clinical_domain`, `omics_domain`, `version`, `status`. Nenhuma coluna existente é removida.
**Fase M4 — N—N de painéis.** Criar `biomarker_panels(catalog_id, panel_id)` e popular a partir do `category` atual.
**Fase M5 — Backfill de FKs.** Preencher `material_id` (de `specimen`) e `biomarker_panels` (de `category`) por mapeamento determinístico (ver §3).
**Fase M6 — Versionamento.** Criar `catalog_versions` e gerar a versão inicial (`PUBLISHED`) de cada item a partir do estado atual (`approval_status`/`reviewed_*`).
**Fase M7 — Camada de compatibilidade.** View `current_catalog` (ou colunas espelho) expondo `specimen`/`category` **derivados** de `material_id`/`panel_id`, para os consumidores atuais continuarem sem alteração.
**Fase M8 — Migração dos consumidores (código, Sprint 3+).** UI/adapters passam a ler `material_id`/`panel_id`/`display_name` do catálogo; **dissolve `lib/biomarkers/panels.ts`**.
**Fase M9 — Depreciação (versão POSTERIOR, não a primeira).** Só após todos os consumidores migrados: marcar `specimen`/`category` como legados. **Remoção destrutiva fica FORA da v1** (RNF-05).

## 3. Backfill — mapeamentos determinísticos
- `specimen` → `material_id`: `sangue`→Material "Sangue"; `urina`→"Urina"; `urina_24h`→"Urina (24 horas)". (Rótulos de `panels.ts` `SPECIMEN_LABEL`.)
- `category` → `panel_id` (via `biomarker_panels`): usar `CATEGORY_LABEL` de `panels.ts` (hematologia_vermelha→"Série vermelha", cardiometabolico→"Perfil lipídico", urinalise_eas→"Urina tipo I (EAS)", etc.).
- `canonical_unit` → `ucum_unit`: mapeamento curado (não automático); onde não houver UCUM confiável, deixar nulo e sinalizar para curadoria (sem preencher errado).
- `scientific_name`/`preferred_name`/`short_name`: **curadoria** (não inferidos automaticamente) — podem entrar nulos e ser preenchidos por onda de curadoria (`curation_wave`).
- `aliases`: mantidos como estão; ampliados por curadoria.

## 4. Compatibilidade (durante a transição)
- `catalog_id` **não muda** — chave estável para Medições/consumidores.
- Consumidores atuais leem `specimen`/`category` via a **view de compat** (M7) enquanto não migram (M8).
- Nenhuma leitura existente quebra em nenhuma fase M1–M7 (todas aditivas).

## 5. Rollback (por fase — tudo reversível)
- M1–M4/M6: `drop` das novas tabelas/colunas (sem perda — dados legados intactos).
- M5 (backfill): re-executável/idempotente; reverter = limpar as colunas/linhas preenchidas.
- M7 (view): `drop view`.
- Como **nada** é destrutivo até M9 (fora da v1), o rollback de qualquer ponto retorna ao estado v1 sem perda.

## 6. Validação / cobertura (critérios de aceite da migração)
- [ ] 100% dos itens com `material_id` e ≥1 `panel` (ou explicitamente "sem painel"), sem `NULL` silencioso.
- [ ] `specimen`/`category` da view de compat **idênticos** aos valores atuais (diff = 0).
- [ ] Nenhuma Medição/`biomarkers.catalog_id` órfão ou alterado.
- [ ] Cobertura de `catalog_id` nos biomarcadores medidos ≥ atual (~99%); os sem match **logados** (não silenciosos).
- [ ] `tsc` 0 · ESLint 0 · testes verdes após a migração dos consumidores (M8).
- [ ] Backfill idempotente (re-rodar não duplica).

## 7. Ordem de execução (topológica)
`M1 → M2 → M3 → M4 → M5 → M6 → M7` (todas aditivas, seguras) → **[Gate Operacional + Sprint 3]** → `M8` (código) → `M9` (só em versão posterior).

## 8. Fora de escopo (mesma fronteira da Spec)
Event Store · replay · auditoria imutável da jornada clínica (`CAT-022/023`) · SRL · IA · busca semântica · integrações · mobile · conversão de unidades.

---
**Próximo passo:** Design Review deste Migration Plan → decisão (Aprovada / com ressalvas / Reprovada). Só após aprovação **e** o Gate Operacional → **Sprint 3 (Implementação)**: escrever as migrations reais (M1–M7), backfill, compat, e então M8.
