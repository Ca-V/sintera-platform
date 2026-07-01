import { describe, it } from 'vitest'

/**
 * CONTRATO DE JORNADA — Doenças Autoimunes (compartilhada)
 * Estrutura obrigatória (CONTRACT_TEST_GUIDE.md §4):
 *
 *  1. Nome:          Doenças autoimunes (jornada compartilhada)
 *  2. Objetivo:      acompanhar condição autoimune com múltiplos medicamentos, várias
 *                    especialidades e períodos de atividade/estabilidade (factual).
 *  3. Pré-condições: conta ativa. ATORES: paciente (escreve) · (opcional) cuidador sob
 *                    delegação — grau de autonomia: parcial.
 *  4. Passos:        Condição(ões) → Central de Entrada (exames/receitas) → medicamentos →
 *                    recompras → consultas (várias especialidades) → Indicadores → Relatório.
 *  5. Estados:       Acompanhamento (condição ativa) · atenção factual (exame fora da faixa ·
 *                    recompra pendente).
 *  6. Projeções:     Histórico · Gastos · Agenda · Indicadores · Relatório.
 *  7. Automações:    recompras; lembretes de múltiplas consultas.
 *  8. Aceite:        múltiplas condições/medicamentos coexistem sem sobrecarga; nada interpretado.
 *  9. Invariantes:   ver _invariants.contract.test.ts (período de atividade = descrição factual).
 * 10. Dependências:  ActionForm (📋 Estado 2) · Delegação/Rede de Cuidado (📋) · Programa autoimune (📋).
 *
 * Gate — atores: paciente↔cuidador (delegação parcial), consistente com Idoso.
 */

describe('Jornada Autoimunes · L1 — fluxo de UX', () => {
  it.todo('múltiplas condições convivem no painel sem sobrecarga (revelação progressiva)')
  it.todo('Central de Entrada recebe exames/receitas de várias especialidades')
  it.todo('Indicadores acompanham marcadores de atividade de forma factual')
})

describe('Jornada Autoimunes · L2 — regras de domínio', () => {
  it.todo('cada medicamento gera recompra própria; eventos convergem no Histórico')
  it.todo('exame fora da faixa vira SituationCard de atenção, não diagnóstico')
  it.todo('ator que escreve varia por delegação (paciente/cuidador), sob permissão')
})

describe('Jornada Autoimunes · L3 — integração', () => {
  it.todo('Gastos consolidam múltiplos medicamentos')
  it.todo('relatório consolidado reflete todas as condições e é compartilhável (revogável)')
})

describe('Jornada Autoimunes · transparência', () => {
  it.todo('item de atenção explica "...porque um exame ficou fora da faixa do laboratório"')
})

/**
 * COBERTURA DO CONTRATO
 *  Componentes:  CaptureCenter · Card de item · ActionForm · SituationCard · Timeline ·
 *                IndicatorEvolutionCard · Card de Programa · Rede de Cuidado · ReportSection · Card Financeiro
 *  Jornadas:     compra/recompra (múltipla) · consultas múltiplas · acompanhamento de atividade
 *  Programas:    Autoimune
 *  Estados:      Múltiplas condições ativas · atenção factual (+ Acompanhamento · Compartilhamento)
 *  Eventos:      Compra · Recompra · Consulta · Exame
 *  Projeções:    Histórico · Gastos · Agenda · Indicadores · Relatório
 */
