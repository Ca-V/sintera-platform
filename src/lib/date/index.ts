// ============================================================================
// DATE-001 — Infraestrutura ÚNICA das regras temporais da SINTERA (SSOT)
// ============================================================================
// Fundadora (18/07/2026): NENHUM domínio reimplementa cálculo de datas. Toda lógica de
// adição de dias/meses, diferenças, data atual, próximas ocorrências, recorrências,
// vencimentos, validade e previsões futuras passa OBRIGATORIAMENTE por este módulo.
// Precisou de algo novo? EVOLUA aqui — nunca duplique num domínio. (Governança: docs/DATE-001.)
//
// PRINCÍPIOS:
//  1. Fonte única — este é o único lugar com aritmética/regra de data da plataforma.
//  2. Dois níveis — PRIMITIVOS (utilitários genéricos) × REGRAS DE NEGÓCIO reutilizáveis.
//     Nunca misturar operação básica com regra reutilizável.
//  3. Multi-domínio — não nasce para o CTC-001. Serve Agenda · Planejamento · Medicamentos ·
//     Exames · Vacinação · Dispositivos · Gestação · Condições crônicas · Manutenções futuras.
//  4. Determinismo — mesma entrada ⇒ mesmo resultado, independentemente da interface que
//     consome. Evita divergência entre Timeline, Agenda, Notificações e Relatórios. (UTC, sem
//     leitura de fuso/local no cálculo; o relógio fica isolado em todayISO/nowISO, injetável.)
//  5. Evolução prevista (NÃO implementar agora — ver §Evolução no fim do arquivo).
// ============================================================================

// ── NÍVEL 1 · PRIMITIVOS (utilitários genéricos de calendário) ───────────────

/** Parse de 'YYYY-MM-DD' → Date em UTC (meia-noite). Interno. */
function parseISO(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d))
}

/** Data de hoje em 'YYYY-MM-DD' (UTC). Ponto único de leitura do relógio (data). */
export const todayISO = (): string => new Date().toISOString().slice(0, 10)

/** Timestamp atual completo (ISO-8601). Ponto único de leitura do relógio (instante). */
export const nowISO = (): string => new Date().toISOString()

/** Soma `n` dias (pode ser negativo) a 'YYYY-MM-DD'. */
export function addDays(iso: string, n: number): string {
  const dt = parseISO(iso); dt.setUTCDate(dt.getUTCDate() + n); return dt.toISOString().slice(0, 10)
}

/** Soma `n` meses (pode ser negativo) a 'YYYY-MM-DD'. Overflow normaliza (31/01 +1 mês → 03/03). */
export function addMonths(iso: string, n: number): string {
  const dt = parseISO(iso); dt.setUTCMonth(dt.getUTCMonth() + n); return dt.toISOString().slice(0, 10)
}

/** Diferença em DIAS entre `a` e `b` (b − a). Positivo se `b` for depois de `a`. */
export function daysBetween(a: string, b: string): number {
  return Math.round((parseISO(b).getTime() - parseISO(a).getTime()) / 86_400_000)
}

// ── NÍVEL 2 · REGRAS DE NEGÓCIO reutilizáveis (construídas sobre os primitivos) ──
// Aqui moram as regras temporais compartilhadas por vários domínios: próximas ocorrências,
// recorrências, validade, vencimento, próximas datas de manutenção. Construir SEMPRE sobre o
// Nível 1 (nunca reintroduzir aritmética de calendário). Recorrência baseada em REGRA
// (frequência/intervalo/until/count) vive em @/lib/recurrence, que delega a estes primitivos.

/**
 * Próxima ocorrência de uma cadência FIXA em dias, ESTRITAMENTE após `from` (default: hoje).
 * A partir de `start`, retorna o menor `start + k·stepDays` (k ≥ 1) maior que `from`.
 * Base única para: próxima recompra da pílula, próxima aplicação da injeção, troca de
 * adesivo/anel, validade/vencimento e próximas manutenções. `stepDays ≤ 0` degrada para
 * `start` (nunca quebra).
 */
export function nextOccurrenceByDays(start: string, stepDays: number, from: string = todayISO()): string {
  if (stepDays <= 0) return start
  const cycles = Math.max(1, Math.floor(daysBetween(start, from) / stepDays) + 1)
  return addDays(start, cycles * stepDays)
}

// ── EVOLUÇÃO PREVISTA (registrada, NÃO implementar agora) ────────────────────
// Para não limitar a arquitetura, prevê-se que o Nível 2 cresça para suportar:
//  · recorrências complexas (regras baseadas em calendário: "toda 1ª segunda", "último dia");
//  · periodicidade variável e exceções (pular/antecipar ocorrências);
//  · feriados e dias úteis; janelas de tolerância (antecipar/adiar dentro de um intervalo);
//  · fusos horários, quando um domínio exigir hora-local real (hoje o cálculo é date-only UTC).
// Qualquer uma dessas entra AQUI, evoluindo o Nível 2 — nunca duplicada num domínio.
