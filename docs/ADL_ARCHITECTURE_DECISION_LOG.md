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

Ver `docs/GOVERNANCA.md` (ARG, níveis, formulação de congelamento), `docs/CAP-002_CAPTURE_HUB.md`.
