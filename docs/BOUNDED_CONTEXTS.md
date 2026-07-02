# SINTERA — Bounded Contexts (contextos de domínio)

**Status:** documentação oficial dos contextos de domínio (fundadora, 02/07/2026). Evita que a plataforma cresça de forma monolítica; prepara a modularização (`PLANO_MATURIDADE §9`) e a paridade Web/Mobile/APIs.
**Regra:** cada contexto tem responsabilidade própria e fronteira clara. Um contexto **não** implementa a lógica de outro; integra-se por contratos (eventos/serviços/APIs). Nenhum contexto duplica metadado de outro (SSOT — `CATALOG_SINGLE_SOURCE_OF_TRUTH.md`).

---

| Contexto | Responsável por | NÃO responsável por | Depende de |
|---|---|---|---|
| **Catalog** | Nomenclatura, biomarcadores, painéis, materiais, aliases, unidades, ordenação (SSOT) | Valores do paciente, decisões clínicas | — (base) |
| **Clinical Data** | Exames, biomarcadores medidos, resultados, séries | Nomenclatura (vem do Catalog), interpretação | Catalog |
| **Timeline** | Eventos, histórico, linha do tempo, agenda | Cálculo de resultados, conhecimento | Clinical Data, Products |
| **Knowledge** | Diretrizes, protocolos, literatura, referências, relações científicas | Decisão/diagnóstico (só organiza/relaciona) | Catalog |
| **Documents** | PDFs, imagens, armazenamento, OCR | Extração semântica (é da AI) | — |
| **AI** | Extração, normalização, classificação, sumarização, comparação factual, busca | Conclusão clínica, prescrição | Documents, Catalog, Clinical Data |
| **Users** | Autenticação, perfis, permissões (RBAC) | Dados clínicos | — (base) |
| **Notifications** | Push, e-mail, lembretes da agenda | Regras clínicas | Timeline, Users |
| **Products** | Medicamentos, suplementos, dispositivos, wearables; histórico de uso | Eventos (projeta para Timeline) | Catalog, Timeline |
| **Analytics** | Métricas de uso, telemetria (produto) | Análise clínica | Users |

## Princípios de fronteira
1. **Catalog é a base** — todos os contextos que exibem nomenclatura consomem do Catalog; nenhum origina nomes/painéis/materiais.
2. **AI não conclui** — produz organização/estruturação/sumarização/comparação factual; nunca interpretação clínica (Governança Científica).
3. **Knowledge organiza, não decide** — relaciona diretrizes/protocolos/evidências ao contexto; a decisão é do profissional.
4. **Timeline é o eixo do paciente** — Clinical Data e Products projetam eventos para ela.
5. **Integração por contratos** — contextos conversam por eventos/serviços/APIs versionadas (`ADR-005`), não por acesso direto ao interior um do outro.

## Relação com os ADR e o roadmap
- Base da modularização (`PLANO_MATURIDADE §9`) e das APIs versionadas (`ADR-005`).
- **Catalog** é o primeiro a evoluir (Scientific Catalog v2 — `ADR-010`), pois quase todos dependem dele.
- Ver `ARCHITECTURAL_DECISIONS.md`, `SCIENTIFIC_DOMAIN_MODEL.md`, `DOMAIN_GLOSSARY.md`.

---
**Manutenção:** novo contexto ou mudança de fronteira entra aqui antes de virar código.
