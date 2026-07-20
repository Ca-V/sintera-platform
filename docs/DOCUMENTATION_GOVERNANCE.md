# DOCUMENTATION GOVERNANCE — SINTERA

**Objetivo:** garantir que o patrimônio documental permaneça consistente durante toda a evolução da plataforma.
**Escopo:** regras de organização, hierarquia, status, ADRs e rastreabilidade da documentação.
**Status:** Approved · **Architectural Baseline** · **Versão:** 1.0 · **Histórico:** v1.0 (2026-07-20).
**Dependências:** [[MASTER_DOCUMENT_INDEX]] (índice) · [[arch_000_document_architecture|ARCH-000]].

## 1. Fonte única da verdade
Cada assunto tem **um** documento canônico. Nenhum tema tem duas fontes de verdade. Um documento que **depende** de outro
apenas o **referencia** (`[[...]]`), **nunca duplica** o conteúdo. Roadmap: fonte única = [[IMPLEMENTATION_ROADMAP]].

## 2. Hierarquia documental (4 níveis)
| Nível | Conteúdo | Cadência | Exemplos |
|---|---|---|---|
| **1 — Princípios permanentes** | arquitetura raiz, Mobile-First, API-First, Observacional, SSOT | muda raramente | ADR-000, ARCH-002, ADR-002..008, ARCH-003 |
| **2 — Arquitetura** | app, integrações, sincronização, dados observacionais | evolui lentamente | HIP-007/008/009, ARCH-004 |
| **3 — Implementação** | plano mestre, plano executivo, roadmap | evolui com o desenvolvimento | HIP-012, HIP-010, IMPLEMENTATION_ROADMAP |
| **4 — Operacional** | checklists, procedimentos, guias, runbooks | muda com frequência | (a criar por onda) |

## 3. Architectural Baseline
Documentos **estruturais** (níveis 1 e 2, e ADRs) recebem o status adicional **Architectural Baseline**: alterações
**estruturais** neles exigem **revisão formal** (registrada como novo ADR ou nova versão do doc) **antes** da aprovação.
Correções editoriais não exigem revisão formal, mas devem atualizar o histórico de versões.

## 4. Registro de decisões (ADRs)
Toda decisão arquitetural importante é registrada como **ADR** (`docs/adr/ADR-NNN_*.md`), com: contexto, decisão,
**alternativas consideradas**, consequências e referências — preservando o **porquê**. ADRs vigentes: ADR-000 (raiz),
ADR-001 (projeção/SSOT), ADR-002 (Mobile-First), ADR-003 (API-First), ADR-004 (Observacional), ADR-005 (SSOT bruto),
ADR-006 (RN+Expo), ADR-007 (Monorepo), ADR-008 (Sincronização).

## 5. Rastreabilidade
O [[MASTER_DOCUMENT_INDEX]] mantém o **mapa de relações** (quem influencia/implementa/usa quem), para avaliar rapidamente
o **impacto** de qualquer alteração.

## 6. Estado do projeto
[[PROJECT_STATUS]] mantém a **visão executiva viva** (arquitetura, implementação, documentação, integrações, módulos,
riscos, decisões pendentes, próximos marcos). Sempre atualizado.

## 7. Markdown canônico + PDF oficial (diretriz permanente)
**Todo documento `Approved` ou `Frozen` gera também um PDF**, preservando a **mesma versão** do Markdown.
- **Markdown (.md)** = documento **canônico** e vivo, versionado no Git (fonte da verdade).
- **PDF** = versão **oficial** para distribuição, revisão executiva e arquivamento (sócios/investidores/parceiros/
  consultores), sem depender do repositório.
- Geração: `npm run docs:pdf` (script `scripts/docs-to-pdf.mjs`, Markdown → HTML → PDF via Chrome). PDFs em `docs/pdf/`.
- Ao promover um doc a Approved/Frozen ou alterar sua versão: **regenerar o PDF** correspondente.

## 8. Manutenção
Ao criar/alterar documento: atualizar o [[MASTER_DOCUMENT_INDEX]] (nome/finalidade/versão/status/relações), o histórico
de versões do próprio doc e — se estrutural — abrir ADR. Nenhum documento oficial existe fora do índice.
