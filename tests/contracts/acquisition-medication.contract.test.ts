// ============================================================
// CONTRATO DE FLUXO — Aquisição de medicamento/suplemento (Etapa 1 · Quadro 2.1)
// ============================================================
// Natureza: PREPARAÇÃO (Frente B / Estado 1 ampliado). São `it.todo` — NÃO executam,
// NÃO quebram o gate. Ativação: Estado 2 → implementar → remover `.todo` → verde →
// fluxo homologado. (Ver tests/contracts/README.md — harness.)
//
// CENÁRIO: a usuária registra a COMPRA de um medicamento (ou suplemento) com valor.
// ENTRADA: item do catálogo (`medications`, kind=medicamento|suplemento) + data + valor + quantidade.
// COMPORTAMENTO ESPERADO: nasce um EVENTO de Compra em `health_events`, vinculado ao
//   item por `EventLink{type:'medication'|'supplement', id}` (carregando o subtipo).
//   NUNCA grava em `agenda_events` (legado).
// PROJEÇÕES ESPERADAS:
//   • Catálogo — item permanece/atualiza, sem duplicar.
//   • Histórico — a compra aparece como acontecimento concluído.
//   • Gastos — entra (isFinancial: tem valor e não está cancelado).
//   • Agenda — próxima recompra programada quando recorrente.
// CRITÉRIO DE ACEITE (4 perguntas): estado permanente ✔ · acontecimento ✔ ·
//   todas as projeções ✔ · usuária vê o esperado ✔.

import { describe, it } from 'vitest'

describe('Contrato — Aquisição de medicamento/suplemento (Compra → Catálogo+Evento+Histórico+Gastos+Agenda)', () => {
  it.todo('cria um health_event de Compra vinculado ao item (EventLink type=medication|supplement)')
  it.todo('preserva o SUBTIPO (medicamento vs suplemento) no evento via EventLink')
  it.todo('NÃO escreve em agenda_events (legado)')
  it.todo('projeta a compra no Histórico como acontecimento concluído')
  it.todo('lança o valor em Gastos (isFinancial: com valor e não cancelado)')
  it.todo('programa a próxima recompra na Agenda quando recorrente')
  it.todo('NÃO duplica o item no Catálogo')
})

// DEPENDÊNCIAS DE IMPLEMENTAÇÃO (marcar quando prontas):
// [ ] Gerador POPULA EventLink{type:'medication'|'supplement'} (o tipo já existe no domínio)
// [ ] command.create suporta Ação=Compra com amount_cents
// [ ] Projeção Gastos (isFinancial) cobre a compra originada do catálogo
// [ ] Projeção Histórico cobre o evento de compra
// [ ] Projeção Agenda gera a recompra SEM agenda_events
