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
- ✅ **Etapa B · Passo 3A (Sistema de Identidade) — APROVADO:** **[[BRAND-001]]** v1.1 (identidade + 10 princípios) +
  **ADR-010** (Almond Blossom; Design System ÚNICO web+mobile; paleta web provisória; nenhuma cor definitiva).
- 🔵 **Etapa B · Passo 3A′ (Estudo Tipográfico) — CONCLUÍDO, aguardando decisão:** **[[BRAND-002]]** compara 3 pares
  (Fraunces+Hanken / Source Serif4+Sans3 / Figtree), OFL/variáveis; recomenda A. Escolha pendente → integra BRAND-001 §5.
- ⏭️ **Próximo (após decidir a tipografia):** Passo 3B **Design System** (tokens 50–900 + componentes) → navegação →
  estado (**ADR**) → cliente API → auth → ambiente dev.

## Marca / Identidade
Identidade **aprovada**: [[BRAND-001]] v1.1 (Almond Blossom) · ADR-010 · **Design System único** (web+mobile). Paleta web
atual = **provisória**; **nenhuma cor definitiva aprovada**.
- **Tipografia:** [[BRAND-002]] (estudo + specimen visual) — **decisão pendente** (candidatas: Fraunces+Hanken / Fraunces+
  Atkinson / Source / Figtree).
- **Cor primária:** [[COLOR-001]] — **direção A·E APROVADA** (só a direção; valores finais no DS). Princípios: primária
  com contenção; **neutros em 1º lugar** (quentes, sem branco puro); semântica sálvia/âmbar/terracota; identidade única
  web+mobile. Teste em telas densas OK. Cor do 1º specimen (teal escuro) **descartada**.
- **Tipografia:** [[BRAND-002]] — **decisão pendente** (aprovar JUNTO com a cor; candidatas no teste denso: Hanken ×
  Atkinson). Sugestão: D (Fraunces + Atkinson) pela legibilidade em dados.
Após aprovar **tipografia + cor juntas** → **Passo 3B Design System** constrói os tokens 50–900 e componentes.
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
