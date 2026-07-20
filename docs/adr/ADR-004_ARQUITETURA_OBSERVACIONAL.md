# ADR-004 — Arquitetura Observacional (Observação como unidade)

**Status:** Accepted · **Architectural Baseline** · 2026-07-20 · **Ref:** [[HIP-007]]

## Contexto
Muitos tipos de dado objetivo (HRV, sono, peso, glicemia, PA…) chegam de muitas fontes (wearables, dispositivos médicos,
apps, documentos). Modelar cada tipo/fonte como entidade própria não escala e cria acoplamento de fornecedor.

## Decisão
A unidade estrutural de todo dado objetivo é a **Observação** (alinhada ao FHIR `Observation`): valor + tempo + origem +
dispositivo + confiabilidade + qualidade + contexto. Distinta de Evento Assistencial (encontro), Documento/Laudo e UCDA
(evidência). Toda funcionalidade que consome dado objetivo trabalha **sobre Observações**.

## Alternativas consideradas
- **Tabela por métrica:** rejeitada — explode com cada novo sinal; não escala.
- **Modelar por fonte/fabricante:** rejeitada — vendor lock-in, contra HIP-001.

## Consequências
Substrato único; novas fontes entram sem redesenho; **Indicadores** são derivados (nunca a própria observação). Governa
[[HIP-009]], [[ARCH-004]], [[HIP-012]] §9.
