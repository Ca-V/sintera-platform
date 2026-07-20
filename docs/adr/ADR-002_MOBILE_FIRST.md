# ADR-002 — Mobile-First (app como produto principal)

**Status:** Accepted · **Architectural Baseline** · 2026-07-20 · **Ref:** [[ARCH-002]]

## Contexto
A SINTERA nasceu como plataforma web, mas seu posicionamento é o **companheiro diário de saúde**. O maior valor e a maior
frequência de uso estão no celular; além disso, Apple Health e Health Connect (cobertura máxima de wearables) **só existem
no aparelho** — inacessíveis por backend web.

## Decisão
O **aplicativo móvel é o produto principal e a experiência principal**. A web passa a ser interface **complementar**
(administrativo, revisão de documentos, uso profissional). Toda funcionalidade nasce considerando primeiro o mobile
(**Mobile → API → Web**).

## Alternativas consideradas
- **Web-first / web-only:** rejeitada — subutiliza o mobile e torna Apple Health/Health Connect inalcançáveis.
- **Paridade web/mobile:** rejeitada — dilui foco e duplica esforço sem priorizar onde está o valor.

## Consequências
Investimento no stack móvel; a web consome as mesmas APIs; a experiência principal é desenhada para o celular. Governa
[[HIP-008]], [[HIP-011]], [[HIP-012]].
