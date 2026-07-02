# SINTERA — Pendências Pós-Estabilização

**Regra:** contém **exclusivamente** iniciativas **autorizadas para iniciar após o término do congelamento arquitetural** (~30 dias de estabilização) e da homologação v1.0. Separado do backlog geral para **não misturar estabilização com evolução**. Nada aqui começa antes da homologação v1.0 aprovada.

---

## Ordem canônica (dependências)
| # | Iniciativa | Depende de | ADR/Doc |
|---|---|---|---|
| 1 | **Scientific Catalog v2 — Specification** | Domain Model aprovado ✅ | `ADR-010`; `SCIENTIFIC_CATALOG_V2_SPEC.md` (a criar) |
| 2 | **Catalog v2 — Migration Plan** | Spec | `CATALOG_V2_MIGRATION_PLAN.md` (a criar) |
| 3 | **Catalog v2 — Implementação** | Migration Plan | `ADR-010` |
| 4 | **Knowledge Layer v2** | Catalog v2 | `ADR-006` |
| 5 | **Knowledge Graph v2** | Knowledge Layer v2 | `ADR-007` |
| 6 | **Scientific Retrieval Layer** | KL v2 + KG v2 (conhecimento consolidado) | `ADR-016`; `SCIENTIFIC_RETRIEVAL_LAYER.md` |
| 7 | **IA Contextual** | SRL | `PLANO_MATURIDADE §12/§13` |
| 8 | **Architecture Compliance Checklist** | início da impl. estrutural (Catalog v2) | `ARCHITECTURE_COMPLIANCE_CHECKLIST.md` (a criar) |
| 9 | **Non-Functional Requirements** | antes do Mobile | `ADR-015`; `NON_FUNCTIONAL_REQUIREMENTS.md` (a criar) |
| 10 | **Aplicativos Mobile (iOS/Android)** | plataforma madura (critérios `PLANO_MATURIDADE §20`) | `ADR-008` |

## Dívidas técnicas autorizadas (entram junto com o Catalog v2)
- **Agrupar séries longitudinais por `catalog_id`** (hoje por nome) — `CATALOG_SINGLE_SOURCE_OF_TRUTH.md`.
- **Remover fallback `catalogId ?? ''`** — tornar `catalog_id` obrigatório + log de cobertura.
- **Dissolver `lib/biomarkers/panels.ts`** — rótulos/material/painel/ordem migram para o catálogo (Catalog v2).
- **ESLint** — triar os 22 erros + 9 avisos pré-existentes do projeto.

## Backlog de domínio (Estado 2 — já registrado, entra após Catalog v2)
- Camada 1: Catálogo→Evento→EventLink · Camada 2: ActionExecutor/CaptureProcessor · Camada 3: projeções reconsumindo · Camada 4: Financeiro/Relatório/Programas/Contexto Biológico.
- Itens de UX adiados: Formato "Domiciliar" (migração `074`) · recorrência bimestral/trimestral/semestral.

---
**Governança:** cada item só inicia com o anterior estável e com ADR correspondente. Novas iniciativas estruturais entram aqui **primeiro** (com ADR), nunca direto no código.
