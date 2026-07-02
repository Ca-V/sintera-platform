# SINTERA — Architectural Decision Records (ADR)

**Status:** repositório mestre das decisões estruturais (a "constituição" da arquitetura).
**Regra:** toda decisão estrutural nova entra aqui com ID, status e link para o documento-fonte. Nenhuma implementação estrutural sem ADR correspondente.

| ID | Decisão | Status | Fonte |
|---|---|---|---|
| **ADR-001** | **Plataforma de Governança Científica** (organiza/relaciona/recupera; não conclui/diagnostica/recomenda) | ✅ Aprovada | `PLANO_MATURIDADE_PRE_MOBILE.md §0` |
| **ADR-002** | **Catálogo Científico é a Única Fonte da Verdade (SSOT)** do metadado clínico (Princípio #12) | ✅ Aprovada | `docs/CATALOG_SINGLE_SOURCE_OF_TRUTH.md` |
| **ADR-003** | **Arquitetura orientada a eventos** (Paciente → Linha do Tempo → Eventos; exame = um tipo de evento) | ✅ Aprovada | `PLANO_MATURIDADE §3/§8`; Estado 2 (Catálogo→Evento→EventLink) |
| **ADR-004** | **Timeline (prontuário) longitudinal** — visão única de todos os eventos | ✅ Aprovada | `PLANO_MATURIDADE §4/§5` |
| **ADR-005** | **APIs versionadas / backend único / regra no backend** (paridade Web↔Mobile) | 🔵 Planejada | `PLANO_MATURIDADE §2/§15` |
| **ADR-006** | **Clinical Knowledge Layer** (relaciona conhecimento; organiza, não decide) | 🔵 Planejada | `PLANO_MATURIDADE §6` |
| **ADR-007** | **Knowledge Graph** (grafo de relações; não produz diagnóstico) | 🔵 Planejada | `PLANO_MATURIDADE §14` |
| **ADR-008** | **Mobile API-first** (app é cliente da plataforma consolidada) | 🔵 Planejada | `PLANO_MATURIDADE §17/§18` |
| **ADR-009** | **Vocabulário oficial da interface** | ✅ Aprovada | `docs/UI_LANGUAGE_STANDARD.md` |
| **ADR-010** | **Scientific Catalog v2** (catálogo vira base de conhecimento; fundação de quase tudo) | 🔵 Planejada — **prioridade alta** | `docs/CATALOG_SINGLE_SOURCE_OF_TRUTH.md`; `PLANO_MATURIDADE §0.2` |
| **ADR-011** | **RBAC multi-perfil** (paciente/médico/lab/nutri/empresa/RH/pesquisador/admin) | 🔵 Planejada | `PLANO_MATURIDADE §10` |
| **ADR-012** | **Auditoria/rastreabilidade completa** (autor/data/versão/aprovação/assinatura) | 🔵 Planejada | `PLANO_MATURIDADE §11` |
| **ADR-013** | **Bounded Contexts** (modularização por domínio; integração por contratos) | ✅ Aprovada | `docs/BOUNDED_CONTEXTS.md` |
| **ADR-014** | **Toda entidade relevante possui ciclo de vida + máquina de estados documentados** (nascimento→evolução→fim; estados/transições válidas) | ✅ Aprovada | `docs/ENTITY_LIFECYCLES.md`, `docs/DOMAIN_STATE_MACHINE.md` |
| **ADR-015** | **Requisitos não-funcionais** (metas de performance/disponibilidade/LGPD/criptografia/auditoria/observabilidade/escalabilidade) | 🔵 Planejada — **antes do Mobile** | `docs/NON_FUNCTIONAL_REQUIREMENTS.md` (a criar) |
| **ADR-016** | **Scientific Retrieval Layer** — capacidade **transversal** (porta de entrada do conhecimento externo), **independente** do Knowledge Layer/Graph; recupera/indexa; exclusivamente informacional; **opcional/desacoplada** (nunca dependência); separação absoluta dado clínico × conhecimento | ✅ Aprovada (v1.2) — 🔵 implementação **após KL v2/KG v2** | `docs/SCIENTIFIC_RETRIEVAL_LAYER.md` |
| **ADR-017** | **Princípio da Proveniência Científica** — toda informação científica com origem·versão·data·organização·identificador rastreáveis | 🔵 Planejada | `docs/SCIENTIFIC_RETRIEVAL_LAYER.md §12` |

**Legenda:** ✅ Aprovada (decidida, vigente) · 🔵 Planejada (aceita como direção; a implementar na fase própria).

## Sequenciamento (governança vigente)
1. **Agora:** estabilizar a Sprint UX (cutover em legacy, sem flip v2). Congelamento do Estado 2 mantido.
2. **Próximo salto (fundação):** **ADR-010 Scientific Catalog v2** — coincide com o início do Estado 2 Camada 1 (**Catálogo**). É o "coração"; Timeline/IA/Knowledge/Mobile/APIs/Omics/Produtos/Busca dependem dele. **Encadeamento obrigatório (domínio → arquitetura → dados):** **Domain Model (6 docs)** = `SCIENTIFIC_DOMAIN_MODEL` (estrutura) + `DOMAIN_BEHAVIORS` (comportamento) + `DOMAIN_EVENTS` (eventos) + `DOMAIN_INVARIANTS` (invariantes) + `ENTITY_LIFECYCLES` (ciclo de vida) + `DOMAIN_STATE_MACHINE` (estados/transições) — ✅ produzidos, **fechado só após aprovação da fundadora** → `SCIENTIFIC_CATALOG_V2_SPEC.md` → `CATALOG_V2_MIGRATION_PLAN.md` → implementação. **Nada de schema antes do Domain Model aprovado.**

## Congelamento arquitetural (recomendação da fundadora, 02/07)
Após o Domain Model fechado e antes de escrever migrations/código estrutural: **período de estabilização arquitetural de ~30 dias** — nenhuma mudança estrutural; apenas correções, homologação (cutover/cadastro/Sprint UX), revisão da documentação e validação dos conceitos. Objetivo: caçar inconsistências antes de codar; reduz retrabalho.
3. Depois (ordem de build): Evento→EventLink (Estado 2) → **Knowledge Layer v2 → Knowledge Graph v2 → Scientific Retrieval Layer** (`ADR-016`; depende do catálogo + modelo de conhecimento consolidado) → **IA Contextual** → APIs versionadas, RBAC, auditoria, Mobile.

> Regressões proibidas: nenhuma implementação pode contrariar um ADR ✅ Aprovada sem novo ADR que o substitua.
