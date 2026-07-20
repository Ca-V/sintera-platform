# PROJECT STATUS — SINTERA (visão executiva viva)

**Objetivo:** refletir **apenas o estado atual** do projeto — visão executiva sempre atualizada.
**Status:** Approved (vivo) · **Versão:** 1.0 · **Atualizado:** 2026-07-20.
> Documento de ESTADO — não guarda histórico nem planejamento (roadmap = [[IMPLEMENTATION_ROADMAP]]).

## Arquitetura
✅ **Fase de definição arquitetural e governança documental ENCERRADA.** Baselines: Mobile-First, API-First, Observacional,
SSOT, RN+Expo, Monorepo, Sincronização (ADR-002..008). Referência: [[ARCH-003]].

## Implementação
▶ **Onda 1 — Fundação da plataforma móvel** em curso (estratégia evolutiva do monorepo, [[adr_007_monorepo|ADR-007]]).
- ✅ **Etapa A (monorepo):** npm workspaces + `packages/*` (fronteiras claras); web intocada; verde.
- ✅ **Etapa B · Passo 1 (estrutura do app) — APROVADO:** `apps/mobile` RN+Expo no monorepo, módulos por domínio, deps
  Expo/RN fora do grafo (web protegida).
- ✅ **Etapa B · Passo 2 (arquitetura interna) — APROVADO:** camadas ([[HIP-013]]); ADR-009 (domínio, não telas); portas
  em `@sintera/core` (Observability, SyncEngine offline-first, DomainModule); HIP-012 §15b Princípios de Evolução.
- 🔵 **Etapa B · Passo 3A (Sistema de Identidade) — CONCLUÍDO, aguardando aprovação:** **[[BRAND-001]]** (identidade da
  marca) + **ADR-010** (referência _Almond Blossom_; Design System ÚNICO web+mobile; paleta web atual = provisória; nenhuma
  cor definitiva aprovada — só direção). HIP-011 v1.1 registra a diretriz de identidade. Doc de decisão (sem código).
- ⏭️ **Próximo (após aprovar BRAND-001):** Passo 3B **Design System** (tokens 50–900 + componentes, implementando o
  BRAND-001) → navegação → estado (**ADR**) → cliente API → auth → ambiente dev.

## Marca / Identidade
Direção aprovada: identidade inspirada em **Almond Blossom** (Van Gogh) — [[BRAND-001]] (Draft, aguardando aprovação) ·
ADR-010. **Design System único** (web+mobile). Paleta atual da web = **provisória**; **nenhuma cor definitiva aprovada**.
Ainda sem código funcional de produto. Critérios de validação por etapa: [[HIP-010]] (4 categorias).

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
