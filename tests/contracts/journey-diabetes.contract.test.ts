import { describe, it } from 'vitest'

/**
 * CONTRATO DE JORNADA — Diabetes (âncora)
 * Estrutura obrigatória (CONTRACT_TEST_GUIDE.md §4):
 *
 *  1. Nome:          Diabetes tipo 2 (jornada individual)
 *  2. Objetivo:      acompanhar uma condição crônica com medicamento contínuo,
 *                    recompras e evolução de HbA1c.
 *  3. Pré-condições: conta ativa. (Ator único — sem sub-rótulo Atores.)
 *  4. Passos:        Condição → Medicamento → Registrar compra → Histórico → Agenda →
 *                    Exame (HbA1c) → Indicadores → Troca de dose → Relatório.
 *  5. Estados:       Acompanhamento (condição ativa) · atenção (recompra · HbA1c atrasada).
 *  6. Projeções:     Histórico · Gastos · Agenda · Indicadores · Relatório.
 *  7. Automações:    lembrete de recompra; indicador atualizado por novo exame.
 *  8. Aceite:        compra cria Evento; troca = suspensão + início; indicadores derivam de exames.
 *  9. Invariantes:   ver _invariants.contract.test.ts.
 * 10. Dependências:  ActionForm (📋 Estado 2) · EventLink exame↔indicador (📋).
 */

describe('Jornada Diabetes · L1 — fluxo de UX', () => {
  it.todo('registra condição, medicamento e a primeira compra')
  it.todo('Indicadores mostram HbA1c por 5 perguntas (situação → evolução → eventos)')
  it.todo('troca de dose usa o ActionForm (verbo variável)')
})

describe('Jornada Diabetes · L2 — regras de domínio', () => {
  it.todo('compra cria UM Evento; Gasto e Agenda derivam dele')
  it.todo('troca gera suspensão do atual + início do novo')
  it.todo('HbA1c é alimentada por exame via EventLink')
})

describe('Jornada Diabetes · L3 — integração', () => {
  it.todo('série de HbA1c evolui ao longo do tempo')
  it.todo('relatório reflete condição, medicamentos, exames e gastos')
})

describe('Jornada Diabetes · transparência', () => {
  it.todo('recompra explica "...porque você registrou a última compra"')
  it.todo('indicador explica "...porque um novo exame foi processado"')
})

/**
 * COBERTURA DO CONTRATO
 *  Componentes:  CaptureCenter · Card de item · ActionForm · Timeline ·
 *                IndicatorSummaryCard · IndicatorEvolutionCard · ReportSection · SituationCard
 *  Jornadas:     compra · recompra · troca · acompanhamento de indicador
 *  Programas:    Cardiometabólico
 *  Estados:      Condição ativa · atenção factual (+ Acompanhamento)
 *  Eventos:      Compra · Troca · Exame
 *  Projeções:    Histórico · Gastos · Agenda · Indicadores · Relatório
 */
