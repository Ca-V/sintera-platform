# MASTER DOCUMENT INDEX — SINTERA

**Objetivo:** índice ÚNICO e oficial de toda a documentação de arquitetura, produto e implementação da SINTERA.
**Porta de entrada** da documentação técnica. Manter **permanentemente atualizado**.
**Status:** Approved (vivo) · **Versão:** 1.0 · **Histórico:** v1.0 (2026-07-20) — criação ao iniciar a Onda 1.
**Convenção de status por documento:** `Draft` (em elaboração) · `Approved` (aprovado, vigente) · `Frozen` (congelado,
muda só por evidência/revisão formal).

> Precedência em conflito: **ADR-000 > ARCH-00x / princípios permanentes > HIP (Fase 2) > planos/backlog**. O roadmap tem
> **fonte única**: [[IMPLEMENTATION_ROADMAP]].
> **Governança documental:** [[DOCUMENTATION_GOVERNANCE]] (fonte única · hierarquia de 4 níveis · Architectural Baseline ·
> ADRs · rastreabilidade). **Estado vivo do projeto:** [[PROJECT_STATUS]]. Docs marcados **⛨ Baseline** exigem revisão
> formal para mudança estrutural.

## 0. Decisões Arquiteturais (ADRs) — o *porquê*
| ADR | Decisão | Status |
|---|---|---|
| ADR-000 | Princípios arquiteturais (raiz) | Frozen ⛨ |
| ADR-001 | Projeção sem duplicação + SSOT | Approved ⛨ |
| ADR-002 | Mobile-First (app = produto principal) | Accepted ⛨ |
| ADR-003 | API-First (backend desacoplado) | Accepted ⛨ |
| ADR-004 | Arquitetura Observacional (Observação como unidade) | Accepted ⛨ |
| ADR-005 | SSOT bruto imutável + reconciliação na projeção | Accepted ⛨ |
| ADR-006 | React Native + Expo | Accepted ⛨ |
| ADR-007 | Monorepo web↔mobile | Accepted ⛨ |
| ADR-008 | Arquitetura de Sincronização | Accepted ⛨ |
| ADR-009 | Arquitetura baseada em domínio + independência | Accepted ⛨ |
| ADR-010 | Identidade visual única + _Almond Blossom_ + Design System único | Accepted ⛨ |

## 1. Constitucional / princípios permanentes
| Doc | Finalidade | Versão | Status | Relações |
|---|---|---|---|---|
| ADR-000 | Princípios arquiteturais (raiz constitucional) | — | Frozen | governa todos |
| ADR-001 | Projeção sem duplicação + SSOT | — | Approved | ARCH-003, HIP-009 |
| ARCH-002 | **Mobile-First · API-First** (permanente) | 1.0 | Approved | governa Fase 2; ARCH-003, HIP-008/010/012 |
| DATE-001 | Infraestrutura temporal única | — | Approved | HIP-007/009 |
| COMPLIANCE-001 | Fase 0 + Gate de Conformidade | — | Approved | todas as entregas |
| Governança — ação destrutiva | Aprovação explícita pós-Preview p/ ação irreversível | 1.0 | Approved | HIP-010/012 |

## 2. Arquitetura (referência)
| Doc | Finalidade | Versão | Status | Relações |
|---|---|---|---|---|
| **ARCH-003** | **Arquitetura Geral da Plataforma** (referência principal) | 1.0 | Approved | consolida ADR-000/ARCH-002/HIP-007/009 |
| **ARCH-004** | Arquitetura de Integrações (capacidades nativas + externos + agregadores) | 1.0 | Approved | HIP-001/002/003/006 |
| **HIP-007** | Arquitetura de Dados Observacionais (Observação/Indicador/SSOT/rastreabilidade) | 2.0 | Approved | ARCH-003; base de tudo |
| **HIP-009** | Arquitetura de Sincronização | 1.0 | Approved | HIP-007; base do /ingest |
| HIP-001 | Plataforma de Integrações (pilar vendor-neutral) | — | Approved | ARCH-004 |
| HIP-003 | Estudo do ecossistema de wearables | 1.0 | Approved | ARCH-004; base de decisão |
| HIP-006 | Roadmap arquitetural de integrações | 1.0 | Approved | refinado por HIP-010/IMPLEMENTATION_ROADMAP |

## 3. Produto Mobile
| Doc | Finalidade | Versão | Status | Relações |
|---|---|---|---|---|
| **BRAND-001** | Sistema de Identidade da SINTERA (marca; ref. _Almond Blossom_; 10 princípios) | 1.1 | Approved ⛨ | orienta o Design System (web+mobile); ADR-010 |
| **BRAND-002** | Estudo Tipográfico (análise de pares; recomendação) | 1.0 | Draft | integra BRAND-001 §5 após decisão |
| **COLOR-001** | Estudo Cromático (5 direções _Almond Blossom_; rampas 50–900) | 1.0 | Draft | direção → tokens do Design System (3B) |
| **HIP-013** | Arquitetura Interna do App Móvel | 1.0 | Approved ⛨ | ADR-009; HIP-007/009 |
| **HIP-011** | Arquitetura do Produto Mobile (experiência/navegação/UX/offline/notif/evolução) | 1.1 | Approved | HIP-008; BRAND-001; ref. Produto/UX/Eng |
| **HIP-008** | Arquitetura do App (stack RN+Expo; comparativo técnico+estratégico) | 1.0 | Approved | ARCH-002; HIP-012 |
| **HIP-013** | Arquitetura Interna do App Móvel (módulos por domínio; camadas; portas) | 1.0 | Approved ⛨ | ADR-009; HIP-007/009 |

## 4. Implementação
| Doc | Finalidade | Versão | Status | Relações |
|---|---|---|---|---|
| **HIP-012** | **Master Implementation Plan** (manual operacional — 16 tópicos + Princípios de Evolução) | 1.1 | Approved ⛨ | consome todos; roadmap = IMPLEMENTATION_ROADMAP |
| **HIP-010** | Plano Executivo da Etapa 4 (ondas de valor + critérios de validação em 4 categorias) | 1.2 | Approved | detalhado por HIP-012 |
| **IMPLEMENTATION_ROADMAP** | **Fonte ÚNICA do roadmap** (fases/ondas/marcos/entregáveis) | 1.0 | Approved | referenciado por todos |
| **CATALOGO_PLATAFORMA** | Catálogo geral de módulos (MVP e futuros) | 1.0 | Approved | ARCH-003; Sidebar SSOT |

## 5. Histórico da Fase 2 (contexto — decisões que levaram ao conjunto acima)
| Doc | Finalidade | Status |
|---|---|---|
| HIP-002 | Conector Withings (referência construída) | Approved |
| HIP-004 | Plano do conector Strava (Atividade Física futura; gates jurídico/produto) | Draft |
| HIP-005 | Plano inicial do app móvel (superado por HIP-008/011/012) | Superseded |
| NOV-001 | Infraestrutura de Novidade (implementada) | Approved |

## 6. Domínios e pilares (docs de módulo)
Ver [[arch_000_document_architecture|ARCH-000]] (arquitetura documental) para o índice completo dos domínios já
existentes (Exames, Eventos, Composição, Notificações NOTIF-001, Captura HUB-001, Care CARE-001, Billing BILLING-001,
Design System, etc.). O catálogo de produto está em [[CATALOGO_PLATAFORMA]].

## 7. Mapa de rastreabilidade (impacto entre documentos)
Para avaliar rapidamente o impacto de uma alteração:
```
ADR-002 Mobile-First ─┐
ADR-003 API-First ─────┼─▶ ARCH-002 ─▶ HIP-008 ─▶ HIP-009 ─▶ HIP-012
                       └─▶ ARCH-003 (arquitetura geral)

ADR-004 Observacional ─▶ HIP-007 ─┬─▶ HIP-009 (sincronização)
ADR-005 SSOT bruto ───────────────┤   └─▶ ARCH-004 (integrações)
                                  └─▶ projeções/NOV-001/Timeline

ADR-006 RN+Expo ─▶ HIP-008 ─▶ HIP-011 (produto) ─▶ HIP-012
ADR-007 Monorepo ─▶ HIP-012 §4 (fundação Onda 1)
ADR-008 Sincronização ≡ HIP-009 ─▶ /ingest (HIP-012 §9)

HIP-012 (Master Plan) ─implementa▶ ARCH-003 · HIP-007 · HIP-008 · HIP-009 · HIP-010
IMPLEMENTATION_ROADMAP ─fonte única do roadmap◀─ (referenciado por todos)
```
Regra: alterar um documento **acima** exige revisar os **abaixo** (impacto em cascata). Docs ⛨ Baseline → revisão formal.

---
**Manutenção:** ao criar/alterar um documento de arquitetura/implementação, atualizar este índice (nome, finalidade,
versão, status, relações) e o [[PROJECT_STATUS]]. Este arquivo é a porta de entrada; nenhum documento oficial existe fora
dele. Ver [[DOCUMENTATION_GOVERNANCE]].
