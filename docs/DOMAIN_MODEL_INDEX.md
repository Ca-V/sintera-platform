# SINTERA — Domain Model (Índice)

**Versão:** 1.0 · **Status:** APROVADO (ver `DOMAIN_MODEL_APPROVED.md`) · **Data:** 02/07/2026.
Índice de navegação — sem conteúdo próprio.

## Domain Model (ordem de leitura)
| # | Documento | Dimensão | Versão |
|---|---|---|---|
| 1 | `SCIENTIFIC_DOMAIN_MODEL.md` | Estrutura (entidades·relações·cardinalidades·invariantes) | 1.0 |
| 2 | `DOMAIN_BEHAVIORS.md` | Comportamento (o que acontece) | 1.0 |
| 3 | `DOMAIN_EVENTS.md` | Eventos oficiais | 1.0 |
| 4 | `DOMAIN_INVARIANTS.md` | Invariantes (nunca violar) | 1.0 |
| 5 | `ENTITY_LIFECYCLES.md` | Ciclo de vida das entidades | 1.0 |
| 6 | `DOMAIN_STATE_MACHINE.md` | Estados e transições | 1.0 |

## Governança relacionada (também congelada como contrato)
| Documento | Papel |
|---|---|
| `DOMAIN_MODEL_APPROVED.md` | Declaração de aprovação v1.0 |
| `ARCHITECTURAL_DECISIONS.md` | ADR (constituição) — ADR-001..015 |
| `CATALOG_SINGLE_SOURCE_OF_TRUTH.md` | Princípio #12 (SSOT) |
| `BOUNDED_CONTEXTS.md` | Contextos de domínio |
| `DOMAIN_GLOSSARY.md` | Glossário oficial (contrato) |
| `UI_LANGUAGE_STANDARD.md` | Vocabulário oficial |
| `PLANO_MATURIDADE_PRE_MOBILE.md` (governança externa) | Visão/maturidade/Governança Científica |

## Dependências
- Tudo assenta em **Catalog (SSOT)**; a evolução `Scientific Catalog v2` (`ADR-010`) é o próximo passo estrutural — **após** os ~30 dias de estabilização.
- Sequência: Domain Model (aprovado) → estabilização → `SCIENTIFIC_CATALOG_V2_SPEC.md` → `CATALOG_V2_MIGRATION_PLAN.md` → implementação.
