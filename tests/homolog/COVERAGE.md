# Matriz de cobertura — Homologação de Exames (INDICADOR OFICIAL)

> Indicador OFICIAL de progresso da capacidade **Exames** (fundadora 15/07): o avanço é medido pela
> **% de dimensões homologadas com documentos reais**, não por quantidade de testes. Enquanto houver
> dimensão pendente, **Exames = em desenvolvimento**; só é CONCLUÍDO quando **todas** estiverem
> homologadas com documentos reais e aprovadas pela Certificação da Plataforma.
>
> Regenerável: a tabela é impressa por `HOMOLOG=1 npm run test:homolog` (`renderCoverageTable`).
> "Homologado" = ≥1 caso real aprovado nos critérios objetivos. "Validação determinística" = a REGRA
> já tem teste verde na suíte rápida (mas a homologação final exige documento real).

**Exames homologado: 0% (0/8 dimensões) — Concluído: NÃO (em desenvolvimento)**

| Dimensão | Homologação (doc real) | Casos | Validação determinística |
|---|---|---|---|
| Segmentação documental | ⬜ pendente | 0 | — |
| Documentos com múltiplos exames | ⬜ pendente | 0 | — |
| Exames de imagem | ⬜ pendente | 0 | — |
| Exames qualitativos | ⬜ pendente | 0 | — |
| Integração completa do CPE ao fluxo | ⬜ pendente | 0 | — |
| Nomenclatura dos cards | ⬜ pendente | 0 | regra ✓ (ARCH-002 · FUNC-nomenclature-consistency) |
| Identificação (nome/laboratório/solicitante) | ⬜ pendente | 0 | regra ✓ (card 3 linhas + E1 requesting_physician) |
| Política binária de estruturação | ⬜ pendente | 0 | regra ✓ (E3 — nunca "parcial") |

_As 5 primeiras dimensões dependem de documentos reais. As 3 últimas já têm a REGRA validada por teste
determinístico (verde), mas aguardam confirmação com documento real para a homologação final._
Ver `fixtures/exames/README.md` para adicionar casos (`dimensions: [...]`) e `HOMOLOG=1 npm run test:homolog`.
