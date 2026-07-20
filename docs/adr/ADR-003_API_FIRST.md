# ADR-003 — API-First (backend desacoplado da interface)

**Status:** Accepted · **Architectural Baseline** · 2026-07-20 · **Ref:** [[ARCH-002]]

## Contexto
Com dois clientes (app móvel + web), há risco de regra de negócio duplicada e divergente entre as interfaces.

## Decisão
**Nenhuma funcionalidade existe só na web.** Toda capacidade da plataforma existe **primeiro como serviço de backend
(API)** versionado, consumido pelo app e, quando necessário, pela web. O **backend fica desacoplado de qualquer
interface**; nenhuma tela contém regra de negócio ausente na API.

## Alternativas consideradas
- **Lógica na tela (por cliente):** rejeitada — duplica regras e diverge.
- **BFF separado por cliente:** rejeitada — multiplica contratos e manutenção.

## Consequências
Contratos únicos (monorepo/`@sintera/core`); web e app consomem as mesmas APIs; disciplina de versionamento de API.
Governa [[HIP-012]] §8.
