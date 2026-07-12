# ADL — Architecture Decision Log

Registro **cronológico** de TODAS as decisões arquiteturais relevantes — inclusive as que
NÃO justificam um ADR próprio. Complementa os ADRs (que detalham decisões estruturantes):
o ADL é a **linha do tempo** da arquitetura; muitas vezes é mais fácil achar uma decisão
por data/contexto do que garimpar entre documentos.

**Como usar:** toda decisão que passa pelo Architecture Review Gate (ARG) entra aqui com
seu **resultado** (Aprovado · Aprovado com ressalvas · Requer revisão arquitetural ·
Requer ADR). Tipo ∈ {Estrutural · Processo · Produto · Execução · Segurança}. Impacto ∈
{Alto · Médio · Baixo}. Ordem: mais recente embaixo (append-only).

| Data | Decisão | Tipo | Impacto | Resultado | Referência |
|---|---|---|---|---|---|
| 2026-07 | Identidade visual **v3.0 "Van Gogh"** (azul-turquesa/terracota/preto-marrom) — substitui teal v2.0 | Estrutural (branding) | Alto | Aprovado | BRD-001 |
| 2026-07 | **Onda 1 publicada em produção** (merge → main, tag v1.0.0, sinteramais.com.br) | Execução | Alto | Aprovado | roadmap |
| 2026-07 | **Princípio da Rastreabilidade Documental** (permanente): documento de origem = fonte primária | Estrutural | Alto | Aprovado | `@/lib/provenance` |
| 2026-07 | Relatório **Medidas = laudo (documento)**, não métricas de bioimpedância; resumo Peso/Altura/IMC | Produto | Médio | Aprovado | REL-001 |
| 2026-07 | Vínculo **medida→laudo** (`body_metrics.exam_id`) e **condição→exame** (`source_exam_id`) | Estrutural (modelo) | Médio | Aprovado | migrations 063/100 |
| 2026-07 | Captura documental em **Condições** + salvamento duplo (exame criado **independe** da conclusão clínica) | Produto/Execução | Médio | Aprovado com ressalvas (testes reais pendentes) | CAP-002-REF |
| 2026-07 | **Capture Hub** torna-se **domínio transversal** (ingestão de qualquer origem → 1 pipeline) | Estrutural | Alto | Aprovado | CAP-002 |
| 2026-07 | **10º princípio**: toda entrada de info externa é adaptador do Hub; vedado fluxo paralelo | Estrutural | Alto | Aprovado | CAP-002 §2 |
| 2026-07 | **Condições = Reference Implementation** do Capture Hub | Execução | Médio | Aprovado | CAP-002-REF |
| 2026-07 | **Backbone da Inbox só após** validação+merge de Condições (extrair componentes dela) | Processo | Médio | Aprovado | GOVERNANCA |
| 2026-07 | **DOC-001** = repositório documental **único** (arquivo referenciado por documentId) | Estrutural | Alto | Aprovado (spec; a implementar) | DOC-001 |
| 2026-07 | **Shield P0**: `search_path` fixado (omics); SECURITY DEFINER views/funções = **intencionais** (não alterar às cegas) | Segurança | Médio | Aprovado com ressalvas (verify_jwt + revisão SECURITY DEFINER → Onda 2) | SEC-001 |
| 2026-07 | **Architecture Review Gate (ARG)** + classificação de docs em 4 níveis + fase de Consolidação | Processo | Alto | Aprovado | GOVERNANCA |
| 2026-07-12 | **Nomenclatura documental** (Content Classifier): nome = o DOCUMENTO, nunca um resultado interno; IA descreve estrutura, domínio aplica nome determinístico; contagem por exames DISTINTOS (`source_exam_name`). Reverte "manter nome do arquivo". Backfill retroativo (5 painéis + 1 single; Hermes Pardini corrigido) | Estrutural (modelo/regra) | Alto | Aprovado | CAP-002 §Content Classifier · `@/lib/capture/document-naming` · migration 101 |
| 2026-07-12 | **Deploy do hotfix de nomenclatura (v1.0.1)** — 1ª entrega da Fase de Consolidação: regra de domínio determinística substitui comportamento dependente de nome de arquivo/IA. Nomenclatura derivada de **categoria + escopo** documental | Refinamento arquitetural compatível | Alto | **ARG: Aprovado** · aprovado para deploy | CHANGELOG v1.0.1 · tag v1.0.1 |
| 2026-07-12 | **Clinical Extraction Framework (CEF-001)** — novo domínio constitucional, par do Capture Hub: cada TIPO de documento tem protocolo de leitura + modelo de resultado próprios (biomarcador é só 1 tipo). Taxonomia por tipo documental; registro de leitores; semântica de datas por tipo; Document Bundle. RDC 657: extrai/estrutura, não interpreta. Sequência: finalizar RI-001 → spec (feita) → executar após HUB-001 | Estrutural | Alto | **Aprovado (spec v1.0; congelar após ARG)** | CEF-001 |
| 2026-07-12 | **1ª suíte reutilizável do Capture Hub** iniciada — arquitetura testada via Condições como ref. impl.; 2 camadas (Funcional/Arquitetural), convenção RI/ARCH/FUNC/INT/E2E, suite rápida (mock) + homologação (IA real). ARCH-002 (nomenclatura) verde | Processo/Execução | Médio | Aprovado com ressalvas (Camada 2 exige contrato `CapturedDocument`; Camada 1 na branch de Condições) | vitest · GOVERNANCA (gap RI-001) |

Ver `docs/GOVERNANCA.md` (ARG, níveis, formulação de congelamento), `docs/CAP-002_CAPTURE_HUB.md`.
