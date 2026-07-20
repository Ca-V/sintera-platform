// @sintera/core — Domínio da SINTERA: entidades, casos de uso, regras de negócio e PORTAS de plataforma
// (contratos de infraestrutura independentes da interface). NÃO é depósito de utilitários (ver ADR-007).
// Fronteira: ver docs/HIP-012 §4 e docs/adr/ADR-007.

// Portas (infraestrutura, UI-independent) — a implementação entra atrás destes contratos.
export * from './ports/observability'
export * from './ports/sync'

// Contrato de módulo de domínio (capacidade da plataforma; ADR-009).
export * from './domain/module'
