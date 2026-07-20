# IMPLEMENTATION ROADMAP — SINTERA (fonte ÚNICA do roadmap)

**Objetivo:** ser a **fonte única** da evolução prevista da plataforma — do MVP à visão completa. Nenhum outro documento
cria planejamento paralelo; todos referenciam este.
**Escopo:** fases, ondas, prioridades, dependências, marcos e entregáveis.
**Status:** Approved · **Versão:** 1.0 · **Histórico:** v1.0 (2026-07-20) — consolida HIP-006/010 + estratégia mobile-first.
**Princípios:** [[ARCH-002]] (mobile-first/API-first) · [[HIP-007]] (observacional). **Dependências:** HIP-008/009/010/011/012.

## Horizonte por fases
| Fase | Foco | Estado |
|---|---|---|
| **Definição arquitetural** | Etapas 1–4 (ecossistema, app, sincronização, plano) | ✅ ENCERRADA (20/07) |
| **Construção Mobile (Fase 2)** | app produto principal + aquisição observacional | ▶ EM CURSO (Onda 1) |
| **Inteligência (V3)** | indicadores longitudinais, notificações inteligentes, IA contextual | previsto |
| **Ecossistema/Comercial** | integrações amplas, Rede de Cuidado, billing | previsto |

## Ondas da Construção Mobile (detalhe em [[HIP-010]])
| Onda | Entregável | Depende de | Marco |
|---|---|---|---|
| **O1 — Fundação** | monorepo · auth · Design System · navegação · cliente API | — | app instalável, autenticado, navegável |
| **O2 — Experiência** | Timeline · Exames/Documentos · Perfil · Agenda | O1 | usuária vê/organiza a própria história |
| **O3 — Aquisição observacional** | Apple Health/Health Connect (nativos) · sync · `/ingest` · Observações/NOV-001 | O1, O2, Etapa 3 | história cresce sozinha |
| **O4 — Integrações** | Withings · agregador · atividade física · dispositivos médicos | O3 | cobertura ampliada sem redesenho |

## Prioridades
1. **Fundação sólida** (O1) antes de qualquer funcionalidade.
2. **Experiência principal** (O2) — valor percebido diário.
3. **Aquisição observacional** (O3) — o diferencial de monitoramento contínuo.
4. **Integrações** (O4) — largura, por gatilho ([[ARCH-004]]).

## Marcos e critérios
Cada onda encerra com: entregável **utilizável** · resposta a *"o que o usuário passa a conseguir fazer?"* · métricas
coletando ([[HIP-010]]) · aprovação explícita · Gate de Conformidade · revisão de aderência. Detalhe operacional: [[HIP-012]].

## Pós-construção (visão)
- **V3 Inteligência longitudinal:** Indicadores derivados das Observações (tendências/adesão/lacunas), notificações
  inteligentes, IA contextual — sempre factual ([[principio_nao_producao_conteudo_clinico]]).
- **Rede de Cuidado / Compartilhamento** ([[care_001_espaco_colaborativo]]) · **Billing** ([[billing_001_assinaturas]]).
