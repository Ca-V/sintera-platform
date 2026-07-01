import { describe, it } from 'vitest'

/**
 * CONTRATO DE JORNADA — Saúde Preventiva (individual)
 * Estrutura obrigatória (CONTRACT_TEST_GUIDE.md §4):
 *
 *  1. Nome:          Saúde preventiva (jornada individual)
 *  2. Objetivo:      manter rastreios e check-ups periódicos em dia, sem condição crônica.
 *  3. Pré-condições: conta ativa. (Ator único — sem sub-rótulo Atores.)
 *  4. Passos:        Central de Entrada (exames de rotina) → Indicadores → Agenda
 *                    (próximos rastreios) → Relatório anual.
 *  5. Estados:       Acompanhamento (sem condição) · atenção (rastreio atrasado).
 *  6. Projeções:     Indicadores · Agenda · Histórico · Relatório.
 *  7. Automações:    próximos rastreios por periodicidade; lembrete de check-up.
 *  8. Aceite:        a plataforma organiza prevenção sem inventar condição; tudo factual.
 *  9. Invariantes:   ver _invariants.contract.test.ts.
 * 10. Dependências:  Programa preventivo (📋) · periodicidade de rastreios (📋).
 */

describe('Jornada Preventiva · L1 — fluxo de UX', () => {
  it.todo('Central de Entrada recebe exames de rotina')
  it.todo('"Próximos acontecimentos" mostra rastreios por periodicidade')
  it.todo('Indicadores mostram marcadores estáveis dentro da referência')
})

describe('Jornada Preventiva · L2 — regras de domínio', () => {
  it.todo('rastreio atrasado vira SituationCard de atenção (factual)')
  it.todo('Programa preventivo agrega o que está em dia vs pendente')
})

describe('Jornada Preventiva · L3 — integração', () => {
  it.todo('relatório anual consolida rastreios e indicadores')
})

describe('Jornada Preventiva · transparência', () => {
  it.todo('agenda explica "...porque o último rastreio completou o intervalo recomendado"')
})

/**
 * COBERTURA DO CONTRATO
 *  Componentes:  CaptureCenter · SituationCard · IndicatorSummaryCard ·
 *                IndicatorEvolutionCard · Card de Programa · ReportSection
 *  Jornadas:     rastreio · check-up · acompanhamento de indicador
 *  Programas:    Preventivo
 *  Estados:      Sem condição (preventivo) · atenção factual (+ Acompanhamento)
 *  Eventos:      Exame de rotina · Consulta
 *  Projeções:    Indicadores · Agenda · Histórico · Relatório
 */
