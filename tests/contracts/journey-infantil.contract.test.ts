import { describe, it } from 'vitest'

/**
 * CONTRATO DE JORNADA — Saúde Infantil (dependente)
 * Estrutura obrigatória (CONTRACT_TEST_GUIDE.md §4):
 *
 *  1. Nome:          Saúde infantil (jornada dependente)
 *  2. Objetivo:      um responsável acompanha a saúde de uma criança (vacinas, crescimento,
 *                    consultas) agindo SEMPRE em nome dela.
 *  3. Pré-condições: conta ativa do responsável. ATORES: responsável (ESCREVE) ·
 *                    criança (dependente — grau de autonomia: nenhum, não escreve).
 *  4. Passos:        Cadastrar dependente → Central de Entrada (caderneta/exames) →
 *                    Calendário de vacinas → Curvas de crescimento → Consulta → Relatório.
 *  5. Estados:       Acompanhamento (dependente ativo) · "exige atenção" factual
 *                    (ex.: vacina pendente · medição fora do percentil de referência).
 *  6. Projeções:     Agenda (vacinas/consultas) · Histórico · Indicadores (crescimento) · Relatório.
 *  7. Automações:    próximas vacinas por idade; lembrete de consulta.
 *  8. Aceite:        toda ação é do responsável em nome do dependente (delegação total);
 *                    a criança nunca é ator que escreve.
 *  9. Invariantes:   ver _invariants.contract.test.ts (+ factual/RDC 657: percentil é
 *                    descrição, não diagnóstico).
 * 10. Dependências:  Dependente/Delegação (📋 Estado 2) · Contexto Biológico infantil (📋) ·
 *                    Programa de acompanhamento pediátrico (📋).
 *
 * Gate — conceitos em observação exercitados aqui:
 *   Atores/Papéis (responsável↔dependente) · Grau de autonomia (nenhum) · Delegação (total) ·
 *   Rede de cuidado · Programa de acompanhamento · (mudanças de contexto: NÃO — estado estável).
 */

describe('Jornada Infantil · L1 — fluxo de UX', () => {
  it.todo('cadastrar dependente e alternar o contexto para a criança')
  it.todo('Central de Entrada recebe caderneta/exames da criança como qualquer documento')
  it.todo('calendário de vacinas agrupa próximas doses por idade')
  it.todo('curva de crescimento mostra evolução (percentil) de forma factual')
  it.todo('toda tela de escrita deixa claro que a ação é EM NOME do dependente')
})

describe('Jornada Infantil · L2 — regras de domínio', () => {
  it.todo('o dependente não é ator que escreve (delegação total ao responsável)')
  it.todo('vacinas/consultas são Eventos/projeções do canônico (reuso, sem módulo paralelo)')
  it.todo('medição fora do percentil vira SituationCard de atenção, não diagnóstico')
  it.todo('Programa pediátrico agrega pendências por faixa etária')
})

describe('Jornada Infantil · L3 — integração', () => {
  it.todo('série longitudinal de crescimento persiste e evolui')
  it.todo('compartilhamento com o pediatra respeita permissões (LGPD) e é revogável')
})

describe('Jornada Infantil · transparência', () => {
  it.todo('agenda explica "...porque a criança atingiu a idade da próxima dose"')
})

/**
 * COBERTURA DO CONTRATO
 *  Componentes:  CaptureCenter · SituationCard · Timeline · IndicatorEvolutionCard ·
 *                Card de Programa · Rede de Cuidado (widget) · ReportSection
 *  Jornadas:     vacinação · crescimento · consulta pediátrica
 *  Programas:    Saúde Infantil / Preventivo pediátrico
 *  Estados:      Dependente ativo · atenção factual (+ Acompanhamento)
 *  Eventos:      Vacina · Consulta · Exame
 *  Projeções:    Agenda · Histórico · Indicadores · Relatório
 */
