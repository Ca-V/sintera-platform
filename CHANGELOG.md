# Changelog — SINTERA

Formato: [SemVer](https://semver.org/lang/pt-BR/). Nome interno da linha: **Van Gogh**.

## [v1.0.1] — 2026-07-12 · hotfix de domínio

**1ª entrega da Fase de Consolidação Arquitetural.** Demonstra o princípio: regras de
domínio **determinísticas** substituindo comportamento dependente de nome de arquivo ou de
interpretação ocasional da IA.

- **Corrige** a nomenclatura automática de documentos: o nome representa o **documento**,
  nunca um resultado interno (bug real — painel laboratorial nomeado por um único biomarcador,
  "IgE látex").
- **Introduz** classificação por `document_type` (categoria/mídia) + `document_scope`
  (single/panel/mixed) + `display_title` (nome de exibição derivado). `clinical_category`
  reservado.
- Nomenclatura **dirigida por categoria + escopo** (não por contagem): painel/misto →
  "Exames laboratoriais"; urina isolada → "Urina tipo I"; imagem → modalidade canônica; etc.
- **Backfill** dos registros existentes (Content Classifier aplicado retroativamente);
  mantém compatibilidade com documentos existentes.
- **1ª suíte reutilizável do Capture Hub** (ARCH-002), suite rápida (mock) + homologação (IA real).

Regra de domínio: `@/lib/capture/document-naming` · migrations 101/102 · CAP-002 §Content Classifier.

## [v1.0.0] — 2026-07 · Onda 1

Landing + identidade visual v3.0 "Van Gogh"; Relatório (Medidas = laudo/documento);
captura documental; publicação em produção (sinteramais.com.br).
