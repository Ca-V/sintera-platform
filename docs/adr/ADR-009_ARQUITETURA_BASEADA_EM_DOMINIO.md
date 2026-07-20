# ADR-009 — Arquitetura baseada em domínio + independência entre domínios

**Status:** Accepted · **Architectural Baseline** · 2026-07-20 · **Ref:** [[HIP-013]] · [[HIP-011]]

## Contexto
O app é a plataforma principal e crescerá em equipe e base de código. Organizar por telas (Home/Tela A/Tela B) mistura
navegação com domínio, não escala e cria acoplamento. A arquitetura observacional e a evolução exigem módulos estáveis.

## Decisão
Os **módulos do app representam CAPACIDADES da plataforma** — Timeline, Observações, Exames, Agenda, Medicamentos,
Suplementos, Perfil, Integrações… — **nunca telas**. A **navegação CONSOME** domínios; **não os define**. Cada domínio
evolui com o **menor acoplamento possível**; quando um domínio precisa de outro, a comunicação ocorre por **contratos/
serviços compartilhados** (em `packages/*`), **sem dependência direta** entre domínios.

## Alternativas consideradas
- **Organização por telas:** rejeitada — não escala; acopla navegação e domínio.
- **Acoplamento direto entre domínios:** rejeitada — trava a evolução independente.

## Consequências
Domínios evoluem isolados e testáveis; a navegação é uma camada consumidora; contratos vivem nos pacotes compartilhados;
alinha o app à taxonomia da Sidebar ([[sidebar_ssot_taxonomia]]). Governa a arquitetura interna ([[HIP-013]]).
