# HIP-013 — Arquitetura Interna do App Móvel (Etapa B · Passo 2)

**Objetivo:** definir a arquitetura interna do `apps/mobile` — módulos por **domínio** e separação de camadas — **antes**
de qualquer funcionalidade. **Escopo:** estrutura/contratos; não implementa DS (Passo 3) nem estado (Passo 5).
**Status:** Approved · **Architectural Baseline** · **Versão:** 1.0 · **Histórico:** v1.0 (2026-07-20).
**Dependências:** [[ADR-009]] (domínio) · [[HIP-007]] (Observação) · [[HIP-009]] (sincronização) · [[ARCH-002]]. **Impacto:**
governa como toda funcionalidade do app é organizada.

## 1. Princípios (permanentes)
- **Por domínio, não por telas** ([[ADR-009]]): módulos = capacidades (Timeline/Observações/Exames/Agenda/…).
- **Independência entre domínios:** comunicação por **contratos/serviços compartilhados**, sem dependência direta.
- **Nenhuma camada depende da interface gráfica.** Domínio e infraestrutura são UI-independent.
- **Sincronização = infraestrutura**, funciona **sem tela aberta** (background/notificações/Health Connect/Apple Health/
  dispositivos/integrações) — [[HIP-009]].
- **Offline-first nos contratos** desde já (mesmo sem implementar).
- **Observabilidade reservada** como porta (logs/telemetria/métricas/analytics/crash), sem ferramenta acoplada.

## 2. Camadas (fluxo de dependência: apresentação → domínio → infraestrutura; nunca o contrário)
| Camada (`src/`) | Papel | Depende de |
|---|---|---|
| `app/` | raiz + provedores (estado, navegação, DS) | tudo abaixo |
| `presentation/` | telas/componentes **por domínio** | domínio (contratos) + DS |
| `navigation/` | navegação principal — **consome** domínios (Passo 4) | domínios |
| `domain/` | capacidades: contratos, casos de uso do app; consome `@sintera/core` | core (portas) |
| `infrastructure/` | http, armazenamento seguro, config, **observabilidade** | portas do core |
| `state/` | estado global — **estratégia via ADR** (Passo 5) | domínio |
| `sync/` | motor de sincronização (UI-independent, offline-first) | core `SyncEngine` |
| `integrations/` | capacidades nativas (Apple Health/Health Connect) e conectores | sync + domínio |
| `design-system/` | tokens/componentes — **doc próprio** (Passo 3) | `@sintera/design-system` |
| `shared/` | componentes/utilidades reutilizáveis entre domínios | — |

## 3. Portas de fundação (em `@sintera/core` — UI-independent, verificáveis) — Passo 2
- **Observability** (`ports/observability`): `Logger·Telemetry·Metrics·Analytics·CrashReporter` + fachada + `noopObservability`.
- **SyncEngine** (`ports/sync`): `start/stop/enqueue/runOnce`, fila offline, idempotência, `connectivity` — roda sem UI.
- **DomainModule/DomainRegistry** (`domain/module`): capacidade da plataforma; navegação consome, não define.
Implementações destas portas entram nos passos seguintes, atrás dos contratos.

## 4. Offline-first (contratos desde o início)
Leitura serve cache; escrita/captura enfileira (`SyncEngine.enqueue`) e drena quando houver rede (`runOnce`, idempotente).
As interfaces já assumem indisponibilidade de rede como estado normal, não excepcional.

## 5. Pendências gated (próximos passos, com seus artefatos)
- **Passo 3 — Design System Mobile:** documento próprio **antes** dos componentes (tokens/tipografia/grid/espaçamento/
  ícones/componentes-base/interação/animações/acessibilidade/estados).
- **Passo 5 — Estado:** **ADR** justificando a tecnologia e a divisão estado global × local × cache remoto × derivado.
