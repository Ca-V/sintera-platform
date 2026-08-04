// @sintera/core — Domínio da SINTERA: entidades, casos de uso, regras de negócio e PORTAS de plataforma
// (contratos de infraestrutura independentes da interface). NÃO é depósito de utilitários (ver ADR-007).
// Fronteira: ver docs/HIP-012 §4 e docs/adr/ADR-007.

// Portas (infraestrutura, UI-independent) — a implementação entra atrás destes contratos.
export * from './ports/observability'
export * from './ports/sync'

// Contrato de módulo de domínio (capacidade da plataforma; ADR-009).
export * from './domain/module'

// Projeção cronológica (Timeline) — lógica pura reutilizável por qualquer domínio datado.
export * from './domain/timeline'

// Apresentação PURA de resultados (biomarcadores) — fonte única Web↔Mobile (paridade Exames).
export * from './domain/exams/biomarkerView'

// Regras puras do domínio Exames (identidade, classificação, fluxo assistencial) — fonte única Web↔Mobile.
export * from './domain/exams/identity'
export * from './domain/exams/classification'
export * from './domain/exams/careFlow'
export * from './domain/exams/ucda'
export * from './domain/exams/nameMatch'

// Financeiro puro (parsing de valor, documento fiscal) — fonte única Web↔Mobile.
export * from './domain/finance/money'
export * from './domain/finance/expense'
