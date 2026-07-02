# SINTERA — Domain Model APPROVED

**Versão:** 1.0
**Data:** 02/07/2026
**Aprovado por:** Fundadora (arquiteta responsável).

## Escopo
Este documento declara **encerrada a modelagem conceitual do domínio** da plataforma SINTERA. O domínio oficial passa a ser composto pelos seguintes documentos (todos em `docs/`):

1. `SCIENTIFIC_DOMAIN_MODEL.md` — estrutura (entidades, relações, cardinalidades)
2. `DOMAIN_BEHAVIORS.md` — comportamento
3. `DOMAIN_EVENTS.md` — eventos oficiais
4. `DOMAIN_INVARIANTS.md` — invariantes
5. `ENTITY_LIFECYCLES.md` — ciclo de vida
6. `DOMAIN_STATE_MACHINE.md` — estados e transições

## Declaração de aprovação
O Domain Model da SINTERA é considerado **aprovado na versão 1.0**. A modelagem conceitual está suficientemente madura para servir de **referência oficial** da plataforma. Novas alterações estruturais passam a depender de **ADR** e deverão preservar os princípios de **Governança Científica**, **Single Source of Truth**, **Arquitetura Orientada a Eventos**, **Bounded Contexts** e as **invariantes** definidas no domínio.

## Regras a partir desta aprovação
- **Nenhuma alteração estrutural** sem ADR.
- Qualquer mudança deve **preservar os invariantes**.
- Implementações devem **seguir o domínio aprovado**.
- **Congelados** (contrato — só mudam por bug/inconsistência/decisão realmente nova, via ADR): o Domain Model (estes 6 docs), o `DOMAIN_GLOSSARY.md` e o `ARCHITECTURAL_DECISIONS.md`.

## Próxima etapa
Após o **período de estabilização arquitetural (~30 dias)** — homologação, revisão, QA, sem novos documentos/conceitos/entidades — a próxima etapa será a `SCIENTIFIC_CATALOG_V2_SPEC.md`, seguida do `CATALOG_V2_MIGRATION_PLAN.md` e da implementação.

> Futuro (não agora — apenas quando a implementação estrutural do Catalog v2 começar): `ARCHITECTURE_COMPLIANCE_CHECKLIST.md` (checklist de revisão de PR estrutural).
