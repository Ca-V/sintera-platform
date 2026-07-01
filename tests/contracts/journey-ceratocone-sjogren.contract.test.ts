import { describe, it } from 'vitest'

/**
 * CONTRATO DE JORNADA — Ceratocone + Sjögren (benchmark)
 * Estrutura obrigatória (CONTRACT_TEST_GUIDE.md §4):
 *
 *  1. Nome:          Ceratocone + Sjögren (associada)
 *  2. Objetivo:      acompanhar uma condição com condição associada e um DISPOSITIVO
 *                    (lente escleral) ao longo de compra, adaptação e troca.
 *  3. Pré-condições: conta ativa; profissional (oftalmo) opcional.
 *  4. Passos:        Condição (Ceratocone + Sjögren associada) → Central de Entrada
 *                    (receita + topografia) → Cadastrar dispositivo (lente) → Compra →
 *                    Adaptação/Manutenção → uso → Troca → Nova receita → Relatório.
 *  5. Estados:       Entrada → Confirmando → Sucesso → Acompanhamento (dispositivo ativo,
 *                    receita vigente) → Entrada (operação) → Sucesso.
 *  6. Projeções:     Histórico · Gastos · Agenda (troca) · Relatório.
 *  7. Automações:    lembrete de troca; vínculo receita↔lente; recompra.
 *  8. Aceite:        mesmo Card de item e mesmo ActionForm servem dispositivo e medicamento;
 *                    operação (troca/adaptação) usa a MESMA tela com verbo variável.
 *  9. Invariantes:   ver _invariants.contract.test.ts.
 * 10. Dependências:  Cadastro de item parametrizado por `kind` (📋 Estado 2) ·
 *                    ActionForm por `ActionType` (📋 Estado 2) · EventLink receita↔dispositivo (📋).
 *
 * Nota: jornada-benchmark — atravessa quase todos os conceitos estruturais. Se o template
 * suportar esta sem ajuste, cobre as jornadas de menor complexidade por construção.
 */

describe('Jornada Ceratocone + Sjögren · L1 — fluxo de UX', () => {
  it.todo('registra condição principal (Ceratocone) e ASSOCIADA (Sjögren) vinculada')
  it.todo('Central de Entrada recebe receita + topografia e sugere o tipo')
  it.todo('Cadastro de dispositivo usa o MESMO componente do medicamento, por `kind`')
  it.todo('Compra, Adaptação e Troca usam a MESMA tela de ação (verbo variável)')
  it.todo('navegação: Catálogo → ação → Histórico; Agenda → troca a partir do lembrete')
})

describe('Jornada Ceratocone + Sjögren · L2 — regras de domínio', () => {
  it.todo('Sjögren é condição associada, vinculada à principal (não solta)')
  it.todo('a lente é item do catálogo com `kind` = dispositivo (parâmetros: curva/diâmetro/validade)')
  it.todo('Troca gera DOIS efeitos canônicos: suspensão do atual + início do novo')
  it.todo('Adaptação/Manutenção gera Evento de operação no Histórico')
  it.todo('a receita vincula-se à lente via EventLink (RelatedItems mostra o vínculo)')
})

describe('Jornada Ceratocone + Sjögren · L3 — integração', () => {
  it.todo('upload de receita/topografia + criação do dispositivo no catálogo')
  it.todo('compra do dispositivo alimenta Gastos e Agenda (recompra/troca)')
  it.todo('relatório reflete condição associada, dispositivo, operações e custos')
})

describe('Jornada Ceratocone + Sjögren · transparência', () => {
  it.todo('troca explica "...porque a vida útil da lente foi atingida"')
  it.todo('lembrete de troca explica "...porque você registrou a adaptação em <data>"')
})

/**
 * COBERTURA DO CONTRATO
 *  Componentes:  CaptureCenter · Card de item (kind=dispositivo) · ActionForm ·
 *                Timeline · RelatedItems · ReportSection · SituationCard
 *  Jornadas:     compra · adaptação/manutenção · troca · nova receita
 *  Programas:    Oftalmologia
 *  Estados:      Dispositivo ativo · Receita vigente (+ Entrada · Confirmando · Sucesso · Acompanhamento)
 *  Eventos:      Compra · Adaptação · Troca (= suspensão + início)
 *  Projeções:    Histórico · Gastos · Agenda · Relatório
 */
