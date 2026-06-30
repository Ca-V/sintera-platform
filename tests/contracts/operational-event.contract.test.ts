// ============================================================
// CONTRATO DE FLUXO — Acontecimento operacional (Etapa 1 · Quadro Grupo 3)
// ============================================================
// Natureza: PREPARAÇÃO (Frente B). `it.todo` — não executa, não quebra o gate.
//
// CENÁRIO: a usuária registra um acontecimento sobre um item JÁ cadastrado — não é
//   cadastro nem aquisição. É a "porta operacional" (Ação→Objeto→Entidade).
// ENTRADA: item do catálogo + Ação (início|suspensão|troca|manutenção|renovação|encerramento) + data.
// COMPORTAMENTO ESPERADO: EVENTO em `health_events` + `EventLink` → item. O catálogo
//   NÃO representa a ação; a mudança de estado é sempre um evento.
// REGRA: é a AÇÃO que projeta, não o objeto.

import { describe, it } from 'vitest'

describe('Contrato — Acontecimento operacional (Ação sobre item do catálogo)', () => {
  it.todo('INÍCIO de tratamento → Evento + (status no Catálogo)')
  it.todo('SUSPENSÃO → Evento + Histórico')
  it.todo('TROCA (ex.: lente) → Evento + Histórico + Agenda (próxima troca)')
  it.todo('MANUTENÇÃO → Evento + Histórico (+ Gastos quando houver custo)')
  it.todo('RENOVAÇÃO → Evento + Agenda (lembrete) [ver contrato dedicado]')
  it.todo('ENCERRAMENTO → Evento + Histórico (+ status final no Catálogo)')
  it.todo('toda ação operacional vincula o evento ao item via EventLink')
  it.todo('NENHUMA ação operacional escreve em agenda_events')
})

// DEPENDÊNCIAS DE IMPLEMENTAÇÃO:
// [ ] "Registrar acontecimento" (porta operacional) disponível a partir do item do catálogo
// [ ] command.create suporta as Ações operacionais
// [ ] EventLink populado em cada ação
// [ ] Projeções Histórico/Agenda/Gastos por ação (conforme critério)
