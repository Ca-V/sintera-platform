// @sintera/design-system — TOKENS DE MOTION (Passo 3B · Etapa 1 · Subitem 5)
// Durações e curvas. Filosofia: BASE (primitivos) × PAPÉIS (roles).
// Princípio (DS-002): motion tem FUNÇÃO — orientar · conectar estados · reduzir carga cognitiva. Nunca decorativa.
// A melhor animação quase não é percebida. Acessibilidade: respeitar `prefers-reduced-motion`.

// ---------------------------------------------------------------------------
// Camada 1 — PRIMITIVOS (ms e curvas). Não consumir direto.
// ---------------------------------------------------------------------------
export const duration = { instant: 0, fast: 120, base: 200, slow: 320 } as const

export const easing = {
  standard: 'cubic-bezier(0.2, 0, 0, 1)',    // entradas/saídas gerais
  decelerate: 'cubic-bezier(0, 0, 0, 1)',    // elemento que entra
  accelerate: 'cubic-bezier(0.3, 0, 1, 1)',  // elemento que sai
  emphasized: 'cubic-bezier(0.2, 0, 0, 1)',  // ênfase (transições maiores)
} as const

// ---------------------------------------------------------------------------
// Camada 2 — PAPÉIS (roles) por INTENÇÃO. Cada um: {duration, easing}.
// ---------------------------------------------------------------------------
export interface MotionRole { duration: number; easing: string }
export const motion: Record<'tap' | 'enter' | 'exit' | 'emphasis', MotionRole> = {
  tap: { duration: duration.fast, easing: easing.standard },       // feedback de toque/hover
  enter: { duration: duration.base, easing: easing.decelerate },   // aparição (card, sheet)
  exit: { duration: duration.fast, easing: easing.accelerate },    // desaparição
  emphasis: { duration: duration.slow, easing: easing.emphasized },// transição de destaque/estado
}

// ---------------------------------------------------------------------------
// Acessibilidade — prefers-reduced-motion. Componentes chamam `motionDuration(role, reduced)`;
// com movimento reduzido a duração vai a 0 (transição instantânea), preservando a mudança de estado
// sem animação. Nunca remover o feedback de estado — apenas a animação.
// ---------------------------------------------------------------------------
export function motionDuration(role: MotionRole, reducedMotion: boolean): number {
  return reducedMotion ? duration.instant : role.duration
}
