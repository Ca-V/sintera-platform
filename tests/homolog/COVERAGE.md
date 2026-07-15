# Matriz de cobertura — Homologação de Exames

> Visão objetiva do progresso da homologação por categoria (fundadora 15/07). Fonte da verdade =
> casos reais em `fixtures/exames/*.json`. Regenerável: a tabela é impressa ao rodar
> `HOMOLOG=1 npm run test:homolog` (função `renderCoverageTable`). "Homologado" = ≥1 caso real
> aprovado nos critérios objetivos; "pendente" = sem caso.

Cobertura de homologação (Exames): **0%**

| Categoria | Status | Casos |
|---|---|---|
| Laboratório — exame único | ⬜ pendente | 0 |
| Laboratório — painel (vários) | ⬜ pendente | 0 |
| Documento multi-exame (segmentação) | ⬜ pendente | 0 |
| Exame de imagem | ⬜ pendente | 0 |
| Documento qualitativo | ⬜ pendente | 0 |
| Pedido / solicitação / guia | ⬜ pendente | 0 |

_Todas as categorias aguardam documentos reais. O código está pronto; a validação roda em paralelo
ao desenvolvimento (não bloqueia a fila)._ Ver `fixtures/exames/README.md` para adicionar casos.
