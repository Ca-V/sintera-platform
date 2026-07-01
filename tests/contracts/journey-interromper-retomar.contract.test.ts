import { describe, it } from 'vitest'

/**
 * CONTRATO DE JORNADA — Interromper → Retomar
 * Estrutura obrigatória (CONTRACT_TEST_GUIDE.md §4):
 *
 *  1. Nome:          Interromper e retomar
 *  2. Objetivo:      validar que uma jornada pode ser interrompida e retomada
 *                    exatamente no ponto em que parou (Princípio de UX 6).
 *  3. Pré-condições: conta ativa; um item do catálogo existente (ex.: Metformina).
 *  4. Passos:        ActionForm (compra, parcial) → sair → Dashboard "Continuar de onde
 *                    parei" → retomar → confirmar.
 *  5. Estados:       Entrada (parcial) → Acompanhamento (retomável) → Confirmando → Sucesso.
 *  6. Projeções:     Evento de compra · Gasto · Agenda (recompra).
 *  7. Automações:    lembrete de recompra criado ao confirmar.
 *  8. Aceite:        dados parciais reaparecem preenchidos; nada se perde; sucesso explica o "porquê".
 *  9. Invariantes:   ver _invariants.contract.test.ts (transparência · canônico · texto).
 * 10. Dependências:  ActionForm (📋 Estado 2) · estado de rascunho/fluxo incompleto (📋 Estado 2) ·
 *                    Dashboard "Continuar de onde parei" (📋) · SituationCard (📋).
 *
 * Nota: este contrato é a base reutilizável de continuidade — se funcionar,
 * todas as demais jornadas reutilizam o mesmo comportamento de retomada.
 */

describe('Jornada Interromper → Retomar · L1 — fluxo de UX', () => {
  it.todo('Entrada: ActionForm de compra iniciado com dados parciais')
  it.todo('interrupção: ao sair, o ponto é preservado (sem erro, sem perda)')
  it.todo('Acompanhamento: Dashboard mostra "Continuar de onde parei" SÓ quando há fluxo incompleto')
  it.todo('a seção "Continuar" desaparece por completo quando não há nada interrompido')
  it.todo('Confirmando: ao continuar, os dados parciais reaparecem preenchidos')
  it.todo('Sucesso: "Compra registrada"')
})

describe('Jornada Interromper → Retomar · L2 — regras de domínio', () => {
  it.todo('confirmar a compra cria UM Evento (não duplica por causa do rascunho)')
  it.todo('o rascunho é descartado após a confirmação')
  it.todo('Gasto e Agenda (recompra) derivam do Evento, não escrevem entre si')
})

describe('Jornada Interromper → Retomar · L3 — integração', () => {
  it.todo('persistência do rascunho sobrevive a recarregar/fechar o app')
  it.todo('retomada carrega exatamente os campos parciais salvos')
})

describe('Jornada Interromper → Retomar · transparência', () => {
  it.todo('sucesso explica "Foi criado um lembrete de recompra porque você registrou uma compra"')
})

/**
 * COBERTURA DO CONTRATO
 *  Componentes:  ActionForm · SituationCard ("Continuar de onde parei") · Dashboard
 *  Jornadas:     compra (parcial → retomada)
 *  Programas:    — (transversal a qualquer programa)
 *  Estados:      Entrada (parcial) · Acompanhamento (retomável) · Confirmando · Sucesso
 *  Eventos:      Compra
 *  Projeções:    Gasto · Agenda (recompra) · Histórico
 */
