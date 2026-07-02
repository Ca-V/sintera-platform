# SINTERA — Pendências Pós-Estabilização

**Regra:** contém **exclusivamente** iniciativas **autorizadas para iniciar após o término do congelamento arquitetural** (~30 dias de estabilização) e da homologação v1.0. Separado do backlog geral para **não misturar estabilização com evolução**. Nada aqui começa antes da homologação v1.0 aprovada.

---

## Sprints (ordem priorizada)
| Sprint | Entrega | ADR/Doc |
|---|---|---|
| **Sprint 1** | Catalog v2 — **Specification** (só documento revisável; **SEM migrations/código/banco**) | `ADR-010` |
| **Sprint 2** | Catalog v2 — **Migration Plan** (sem código de negócio) | `ADR-010` |
| **Sprint 3** | Catalog v2 — **Implementação** (só após aprovação FORMAL da Spec) | `ADR-010` |
| **Sprint 4** | Catalog v2 — **Homologação** | `ADR-010` |
| **Sprint 5** | **Knowledge Layer v2** | `ADR-006` |
| **Sprint 6** | **Knowledge Graph v2** | `ADR-007` |
| **Sprint 7** | **Scientific Retrieval Layer** | `ADR-016` |
| **Sprint 8** | **IA Contextual** | `PLANO_MATURIDADE §12/§13` |
| **Sprint 9** | **Mobile Foundation** | `ADR-008` |

### Protocolo da Sprint 1 — `SCIENTIFIC_CATALOG_V2_SPEC.md` (ordem obrigatória, domínio→dados)
Escrever **nesta ordem** (NÃO começar por tabelas — evita o banco direcionar o desenho):
1. **Objetivos** — o que resolve · o que **deliberadamente NÃO** resolve (ver Fronteira de escopo abaixo).
2. **Requisitos funcionais** — identidade única · nomenclatura · aliases · painéis · materiais · unidades · versionamento · governança.
3. **Requisitos não-funcionais** — performance · escalabilidade · auditabilidade · compatibilidade · backward compatibility.
4. **Modelo conceitual** — entidades · relacionamentos · responsabilidades.
5. **Modelo físico (schema)** — **por último**.
**Regra da Sprint 1:** NÃO escrever migrations, NÃO escrever código, NÃO alterar o banco. Objetivo único = **especificação revisável**. A implementação (Sprint 3) só começa após **aprovação formal** da Spec.

### Design Review — gate obrigatório entre Sprint 1 e Sprint 2
A Spec **só** passa para o Migration Plan após um **Design Review formal** (aprovação ≠ "documento pronto"). Checklist objetivo:
1. [ ] Escopo permanece dentro da **fronteira aprovada** do Catalog v2.
2. [ ] Não introduz entidades **fora do Domain Model**.
3. [ ] Não altera **ADRs** existentes.
4. [ ] Não altera **Bounded Contexts**.
5. [ ] Mantém o **Catálogo como SSOT**.
6. [ ] Aderente ao **Domain Model**.
7. [ ] Aderente ao **Plano de Maturidade**.
8. [ ] Não incorpora funcionalidades de sprints futuras (SRL, IA Contextual, Mobile…).
9. [ ] O **modelo físico decorre do conceitual** (não o contrário).

### Governança de decisão (toda sprint termina com uma decisão explícita)
- ✅ **Aprovada** → segue para a próxima.
- ⚠️ **Aprovada com ressalvas** → segue com ajustes **registrados**.
- ⛔ **Reprovada** → retorna para revisão.
Evita que documentos/entregas avancem "por inércia". Papel da fundadora a partir da Sprint 1 = **revisora técnica** (aderência a domínio/governança/maturidade).

*(Documentos de apoio quando cada sprint começar: `ARCHITECTURE_COMPLIANCE_CHECKLIST.md` no Sprint 2; `NON_FUNCTIONAL_REQUIREMENTS.md` antes do Mobile — `ADR-015`.)*

### Fronteira de escopo do Scientific Catalog v2 (disciplina — NÃO deixar crescer)
Erro comum: transformar o "Catalog v2" num projeto que tenta resolver tudo. Escopo **fechado**:
- **DENTRO (só isto):** identidade única dos biomarcadores · nomenclatura científica · aliases · LOINC · SNOMED CT · UCUM · painéis · materiais · versionamento · governança.
- **FORA (fases seguintes do roadmap):** Scientific Retrieval · IA · recomendações · busca semântica · integrações externas · funcionalidades móveis.
Qualquer coisa fora dessa lista → próxima sprint, não o Catalog v2.

## Dívidas técnicas autorizadas (entram junto com o Catalog v2)
- **Agrupar séries longitudinais por `catalog_id`** (hoje por nome) — `CATALOG_SINGLE_SOURCE_OF_TRUTH.md`.
- **Remover fallback `catalogId ?? ''`** — tornar `catalog_id` obrigatório + log de cobertura.
- **Dissolver `lib/biomarkers/panels.ts`** — rótulos/material/painel/ordem migram para o catálogo (Catalog v2).
- **ESLint** — triar os 22 erros + 9 avisos pré-existentes do projeto.

## Known Gaps (limitações arquiteturais conhecidas — NÃO são defeitos)
> **Nota oficial:** a ausência de deduplicação e de auditoria permanente na exclusão **não** é defeito da plataforma atual. É uma **limitação arquitetural conhecida**, cuja implementação está planejada para a fase do **Scientific Catalog v2 + arquitetura orientada a eventos**. **Não** constituem bloqueadores para iniciar essa evolução. (A implementação atual ainda **não atende** ao domínio aprovado — não "viola" um invariante já vigente; o invariante pertence ao domínio-alvo.) Evita que, meses depois, alguém abra "bug: auditoria errada" — ela ainda não existe.
| ID | Item | Prioridade | Dependência |
|---|---|---|---|
| **CAT-021** | Deduplicação (reenvio faz nova ingestão; `DocumentDuplicateDetected`/B5 não implementado) | Alta | Catalog v2 |
| **CAT-022** | Auditoria imutável (exclusão apaga `ai_processing_log`; alvo `Event Store → Audit Log → Projections`, não "Audit depende do Exame") | Alta | Event Store |
| **CAT-023** | Replay de eventos / reprojeções (inexistente) | Alta | Event Store |

**Acceptance Criteria do Catalog v2 / arquitetura de eventos:** essa fase **não** é considerada concluída enquanto **CAT-021 (dedup) · CAT-022 (auditoria imutável) · CAT-023 (replay/reprojeções)** não existirem — assim os Known Gaps reaparecem como critério de aceite e não somem do radar.

## Backlog de domínio (Estado 2 — já registrado, entra após Catalog v2)
- Camada 1: Catálogo→Evento→EventLink · Camada 2: ActionExecutor/CaptureProcessor · Camada 3: projeções reconsumindo · Camada 4: Financeiro/Relatório/Programas/Contexto Biológico.
- Itens de UX adiados: Formato "Domiciliar" (migração `074`) · recorrência bimestral/trimestral/semestral.

---
**Governança:** cada item só inicia com o anterior estável e com ADR correspondente. Novas iniciativas estruturais entram aqui **primeiro** (com ADR), nunca direto no código.
