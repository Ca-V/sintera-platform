import { describe, it } from 'vitest'

/**
 * CONTRATO DE JORNADA — Saúde Mental (individual · confidencial)
 * Estrutura obrigatória (CONTRACT_TEST_GUIDE.md §4):
 *
 *  1. Nome:          Saúde mental (jornada individual)
 *  2. Objetivo:      acompanhar tratamento contínuo (medicamento + consultas) com
 *                    confidencialidade reforçada.
 *  3. Pré-condições: conta ativa. (Ator único.) Confidencialidade elevada (dado sensível).
 *  4. Passos:        Condição → medicamento contínuo → recompras → consultas →
 *                    acompanhamento → Relatório (compartilhamento seletivo).
 *  5. Estados:       Acompanhamento (tratamento ativo) · atenção (recompra · retorno).
 *  6. Projeções:     Histórico · Gastos · Agenda · Relatório.
 *  7. Automações:    lembrete de recompra; lembrete de retorno.
 *  8. Aceite:        nenhuma inferência sobre estado emocional; tudo factual e privado;
 *                    compartilhamento é seletivo e revogável (consentimento explícito).
 *  9. Invariantes:   ver _invariants.contract.test.ts (+ confidencialidade · consentimento · RDC 657).
 * 10. Dependências:  Confidencialidade/Consentimento (📋 Estado 3) · ActionForm (📋 Estado 2).
 */

describe('Jornada Saúde Mental · L1 — fluxo de UX', () => {
  it.todo('registra condição e medicamento contínuo com a mesma máquina (sem exceção visual)')
  it.todo('recompras e retornos aparecem em "Próximos acontecimentos"')
  it.todo('a plataforma nunca rotula/interpreta estado emocional (apenas organiza)')
})

describe('Jornada Saúde Mental · L2 — regras de domínio', () => {
  it.todo('compra cria Evento; recompra/agenda derivam dele')
  it.todo('dado sensível: visibilidade restrita por padrão')
})

describe('Jornada Saúde Mental · L3 — integração', () => {
  it.todo('compartilhamento é seletivo, com consentimento explícito e revogável')
})

describe('Jornada Saúde Mental · transparência', () => {
  it.todo('lembrete de retorno explica "...porque sua última consulta foi há <intervalo>"')
})

/**
 * COBERTURA DO CONTRATO
 *  Componentes:  Card de item · ActionForm · Timeline · SituationCard · ReportSection
 *  Jornadas:     compra/recompra · consulta/retorno · compartilhamento seletivo
 *  Programas:    Saúde Mental
 *  Estados:      Tratamento ativo · atenção factual (+ Acompanhamento · Compartilhamento)
 *  Eventos:      Compra · Recompra · Consulta
 *  Projeções:    Histórico · Gastos · Agenda · Relatório
 */
