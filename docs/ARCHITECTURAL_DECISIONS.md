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

**Legenda:** ✅ Aprovada (decidida, vigente) · 🔵 Planejada (aceita como direção; a implementar na fase própria).

## Sequenciamento (governança vigente)
1. **Agora:** estabilizar a Sprint UX (cutover em legacy, sem flip v2). Congelamento do Estado 2 mantido.
2. **Próximo salto (fundação):** **ADR-010 Scientific Catalog v2** — coincide com o início do Estado 2 Camada 1 (**Catálogo**). É o "coração"; Timeline/IA/Knowledge/Mobile/APIs/Omics/Produtos/Busca dependem dele.
3. Depois: Evento→EventLink (Estado 2), Knowledge Layer/Graph, APIs versionadas, RBAC, auditoria, Mobile.

> Regressões proibidas: nenhuma implementação pode contrariar um ADR ✅ Aprovada sem novo ADR que o substitua.
