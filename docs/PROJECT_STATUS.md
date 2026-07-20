# PROJECT STATUS — SINTERA (visão executiva viva)

**Objetivo:** refletir **apenas o estado atual** do projeto — visão executiva sempre atualizada.
**Status:** Approved (vivo) · **Versão:** 1.0 · **Atualizado:** 2026-07-20.
> Documento de ESTADO — não guarda histórico nem planejamento (roadmap = [[IMPLEMENTATION_ROADMAP]]).

## Arquitetura
✅ **Fase de definição arquitetural e governança documental ENCERRADA.** Baselines: Mobile-First, API-First, Observacional,
SSOT, RN+Expo, Monorepo, Sincronização (ADR-002..008). Referência: [[ARCH-003]].

## Implementação
▶ **Onda 1 — Fundação da plataforma móvel** em curso (estratégia evolutiva do monorepo, [[adr_007_monorepo|ADR-007]]).
- ✅ **Etapa A (monorepo):** npm workspaces + `packages/*` (core · api-client · types · validation · design-system ·
  config · utils) com fronteiras claras; **web intocada** (permanece na raiz/`src`); verde (tsc · 709 testes · build).
- ⏭️ **Próximo:** `@sintera/core` (conteúdo do domínio) · base do app RN (`apps/mobile`) · Design System · navegação ·
  estado · cliente de API · autenticação · ambiente de dev · testes da fundação. Guia: [[HIP-012]] §4–§7.
Ainda sem código funcional de produto.

## Documentação
✅ Conjunto oficial consolidado e versionado (índice: [[MASTER_DOCUMENT_INDEX]]; governança: [[DOCUMENTATION_GOVERNANCE]]).

## Integrações
- ✅ Withings (conector web de **referência**, construído — [[HIP-002]]).
- ⏳ Apple Health / Health Connect = capacidades nativas (Onda 3).
- ⏳ Agregador (Terra/Rook) por gatilho; Strava = Atividade Física futura (gate jurídico); Garmin condicionado.
Consolidado: [[ARCH-004]].

## Módulos
Catálogo: [[CATALOGO_PLATAFORMA]]. No app: nenhum ainda (fundação em curso). Na web (existentes): Exames, Eventos,
Composição, Agenda, Medicamentos, Recursos, Relatórios, NOV-001, Notificações.

## Riscos em aberto
Limites de background sync (SO); revisão HealthKit nas lojas; divergência web↔app (mitigada por monorepo); dependências
externas (contas Apple/Play; sign-off jurídico Strava; custo agregador).

## Decisões pendentes
- **D-PLAT:** MVP primeiro em Android/Health Connect ou iOS/Apple HealthKit.
- **Contas:** Apple Developer · Google Play Console · Expo/EAS (em paralelo, não bloqueiam a fundação).
- Estrutura final de pastas do monorepo (a definir no início da Onda 1).

## Próximos marcos
1. Monorepo definitivo + `@sintera/core` (fecha quando web e app importam o mesmo core).
2. Base do app RN + Design System + navegação.
3. Cliente de API + autenticação + testes da fundação → **fim da Onda 1** (app instalável, autenticado, navegável).
