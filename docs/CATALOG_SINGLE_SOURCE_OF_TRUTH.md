# SINTERA — Catálogo Científico como Única Fonte da Verdade (SSOT)

**Status:** política de arquitetura (fundadora, 02/07/2026) — **Princípio Arquitetural nº 12**.
**Escopo:** Web, Mobile, APIs e IA. Impede regressões de nomenclatura/metadado.

> Coerente com o modelo orientado a eventos e com a Governança Científica. O catálogo é a semente do **Clinical Knowledge Layer**.

---

## Regras (obrigatórias)
1. **Todo biomarcador deve possuir `catalog_id`.**
2. **Nenhuma tela** pode definir nomes próprios de biomarcador.
3. **Nenhuma tela** pode definir painéis.
4. **Nenhuma tela** pode definir materiais.
5. **Nenhuma tela** pode definir aliases.
6. **Toda nomenclatura** (nome, painel, material, categoria, aliases, unidade, ícone, prioridade, ordenação) **é resolvida pelo catálogo**.
7. **A UI apenas consome** metadados do catálogo — nunca os origina.
8. **`catalog_id` é a CHAVE de negócio; `display_name` é só apresentação** (nunca lógica, nunca chave de agrupamento).

## Estado atual (02/07/2026) e conformidade
- ✅ Nome de biomarcador (Evolução, `/saude/[slug]`, detalhe do exame) vem do **`biomarker_catalog.display_name`** via `catalog_id`.
- ✅ Segmentação (material→painel) usa `specimen`/`category` do catálogo via `catalog_id`.
- ⚠️ **`lib/biomarkers/panels.ts` é TRANSICIONAL:** hospeda rótulos código→label (painel/material) e a lógica `groupBySpecimen`. Os **rótulos/ícones/ordem** devem migrar para o catálogo (**Scientific Catalog v2** — ver `PLANO_MATURIDADE_PRE_MOBILE.md §0.2`). A **lógica** de agrupamento pode permanecer no domínio.

## Dívidas técnicas registradas (corrigir na migração do modelo)
1. **`catalogId ?? ''` (fallback silencioso).** Hoje há ~1% de biomarcadores sem `catalog_id` (extração não casou). O fallback para "Outros exames" + nome cru é intencional, mas **deve deixar de ser silencioso**: `catalog_id` obrigatório para biomarcadores catalogados; casos legítimos (legado/testes) tratados **explicitamente com log/indicador de inconsistência**, monitorando cobertura. Remover os `?? ''` quando o `catalog_id` for garantido.
2. **Agrupar séries longitudinais por `catalog_id`, não por nome.** `summarizeBiomarkers` agrupa por `normalizeName(name)` — variações de nome ("Glicose"/"Glicemia"/"Glicose sérica") fragmentam a série. Deve passar a agrupar por `catalog_id` (Estado 2 / Catalog v2).

---
**Manutenção:** qualquer novo consumo de metadado clínico deve vir do catálogo. PRs que originarem nomenclatura na UI violam este documento.
