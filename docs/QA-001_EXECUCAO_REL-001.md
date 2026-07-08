# QA-001 — Execução de auditoria visual · REL-001 (pré-homologação)

> Relatório consolidado da auditoria visual automatizada executada antes do merge
> da branch `feat/rel-001-central-relatorios`. Data: 2026-07-07.

## Método (fluxo autônomo — PROCESSO_HOMOLOGACAO.md)

- **Ambiente:** preview da branch em homologação (Vercel), commit `f1cc6c0` —
  maior fidelidade (mesmo build/backend), acesso via bypass programático da Vercel.
- **Usuário de auditoria:** provisionado automaticamente por SQL (`pgcrypto`/`crypt`),
  com dados sintéticos representativos (medicamentos, eventos, exames, medidas, sinais,
  condições próprias/familiares, hábitos, recurso de correção visual, ômica) + um link
  público. **Removido ao final** (teardown) — nenhum dado/usuário sintético permanece
  em produção.
- **Harness:** `scripts/qa/qa001-harness.mjs` (Playwright headless). Percorre 24 rotas
  em **desktop (1280×900)** e **mobile (390×844)**: screenshot full-page + heurística de
  **overflow horizontal** (`scrollWidth` vs viewport) + captura de **erros de console/página**.
- **Artefatos:** `qa001-artifacts/{desktop,mobile}/*.png` + `qa001-report.json`
  (não versionados). Inspeção visual humana das telas críticas.

## Resultado

| Métrica | Desktop | Mobile |
|---|---|---|
| Rotas auditadas | 24 (2 públicas + 22 autenticadas) | 24 |
| HTTP != 200 | 0 | 0 |
| **Overflow horizontal** | **0** | **0** |
| **Erros de console/página** | **0** | **0** |

**Inspeção visual das telas críticas (olho, não só heurística):**
- `/dashboard/relatorio` (REL-001) — desktop e mobile: layout limpo, árvore de seleção
  (tri-state + contadores) correta, cards de controle alinhados, sem quebra letra-a-letra.
- `/dashboard/exams/[id]` — **cabeçalho correto** em desktop e mobile (título, data,
  ações em linha/grade). O bug recorrente de quebra letra-a-letra **não ocorre** —
  confirmada a correção herdada da `main`.
- `/r/[token]` (link público REL-001) — render factual completo, disclaimer RDC 657 presente.

## Achados

Nenhum achado **P0** (bloqueia) nem **P1** (funcional). A entrega passa no tripé.

Observações **P2** (cosmético / backlog — não bloqueiam homologação):
1. **Rótulo do menu "Relatórios" (plural)** × título/rota "Relatório" (singular) —
   inconsistência de nomenclatura pré-existente (escopo UX-001, não regressão da REL-001).
2. **Link público `/r/[token]`** não reflete o agrupamento em faixas
   ACOMPANHAMENTO / MINHA SAÚDE do relatório autenticado — refinamento de paridade visual
   já previsto como evolução futura da Camada de Comunicação.

## Conclusão

Tripé de Integridade **completo** para a REL-001:
1. Técnica — tsc 0 · ESLint 0 · build OK.
2. Estrutural — divergência vs `main` limitada à superfície REL-001; demais páginas
   byte-idênticas à produção.
3. Visual/experiência — QA-001 automatizado (desktop+mobile, 0 overflow / 0 erros) +
   revisão crítica da interface + inspeção visual das telas críticas.

**Recomendação:** apto para homologação e merge, sem achados bloqueantes.
