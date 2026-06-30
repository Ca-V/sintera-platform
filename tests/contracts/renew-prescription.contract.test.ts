// ============================================================
// CONTRATO DE FLUXO — Renovação de receita/plano/garantia (Etapa 1 · Quadro "Renovação")
// ============================================================
// Natureza: PREPARAÇÃO (Frente B). `it.todo` — não executa, não quebra o gate.
//
// CENÁRIO: a usuária registra a RENOVAÇÃO de uma receita (ou plano/garantia) recorrente.
// ENTRADA: item/contexto de origem + data de validade/renovação.
// COMPORTAMENTO ESPERADO: EVENTO de Renovação em `health_events` (+ EventLink quando
//   houver objeto de catálogo) e um LEMBRETE futuro na Agenda.
// PROJEÇÕES ESPERADAS: Histórico (renovação registrada) + Agenda (lembrete da próxima).
// CRITÉRIO DE ACEITE: Evento + Agenda (lembrete) corretos.

import { describe, it } from 'vitest'

describe('Contrato — Renovação (Evento + Agenda lembrete)', () => {
  it.todo('cria health_event de Renovação')
  it.todo('vincula ao objeto de origem via EventLink quando aplicável')
  it.todo('gera o lembrete da próxima renovação na Agenda (sem agenda_events)')
  it.todo('aparece no Histórico quando concluída')
  it.todo('a data do lembrete usa a regra de recorrência correta')
})

// DEPENDÊNCIAS DE IMPLEMENTAÇÃO:
// [ ] command.create suporta Ação=Renovação
// [ ] Lembrete/recorrência derivado do domínio (não agenda_events)
// [ ] Projeção Agenda gera a próxima ocorrência
