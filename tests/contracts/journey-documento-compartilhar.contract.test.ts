import { describe, it } from 'vitest'

/**
 * CONTRATO DE JORNADA — Documento → Compartilhar
 * Estrutura obrigatória (CONTRACT_TEST_GUIDE.md §4):
 *
 *  1. Nome:          Do documento ao compartilhamento
 *  2. Objetivo:      a usuária adiciona um documento e chega a compartilhar um relatório
 *                    factual, sem precisar descobrir onde ficam os módulos.
 *  3. Pré-condições: conta ativa; consentimento LGPD vigente; nenhum exame pendente.
 *  4. Passos:        Central de Entrada → prévia/classificação → processamento →
 *                    Dashboard → Requer atenção → Indicadores → Histórico →
 *                    Relatório → Compartilhamento.
 *  5. Estados:       Entrada → Confirmando → Processando → Sucesso → Acompanhamento →
 *                    Compartilhamento → Sucesso.
 *  6. Projeções:     Exame · Indicador (HbA1c) · Histórico · Relatório · report_shares.
 *  7. Automações:    extração iniciada; indicador atualizado; relatório reflete eventos.
 *  8. Aceite:        jornada concluível ponta a ponta; cada automação explica o "porquê".
 *  9. Invariantes:   ver _invariants.contract.test.ts (transparência · canônico · texto · RDC 657).
 * 10. Dependências:  CaptureCenter (✅) · classifier (✅) · Indicadores (✅) · Relatório (✅) ·
 *                    Compartilhamento (✅) · ActionForm (📋 Estado 2) · Dashboard por prioridade (📋).
 */

describe('Jornada Documento → Compartilhar · L1 — fluxo de UX', () => {
  it.todo('Entrada: Central de Entrada aceita arrastar/selecionar arquivo')
  it.todo('Confirmando: sugere o tipo ("Parece um exame") e permite corrigir antes de enviar')
  it.todo('Processando: mostra progresso sem bloquear a plataforma')
  it.todo('Sucesso: confirma "Documento enviado" (texto canônico)')
  it.todo('Acompanhamento: Dashboard é a âncora de retorno; "Requer atenção" lista o exame')
  it.todo('navegação: Requer atenção → "Abrir exame" → Indicadores → Histórico → Relatório')
  it.todo('orientação: em todo passo a usuária sabe onde está e qual o próximo passo')
})

describe('Jornada Documento → Compartilhar · L2 — regras de domínio', () => {
  it.todo('o documento vira Exame (projeção), não escreve outra projeção')
  it.todo('a extração popula o Indicador HbA1c via EventLink')
  it.todo('o Relatório é composto por ReportSection lendo projeções factuais')
  it.todo('Compartilhamento escreve report_shares (única projeção que escreve)')
})

describe('Jornada Documento → Compartilhar · L3 — integração', () => {
  it.todo('upload real para storage + criação de exame status pending')
  it.todo('processamento/extração end-to-end alimenta o indicador')
  it.todo('relatório montado reflete condição/medicamento/exames/gastos do período')
  it.todo('link de compartilhamento gerado e revogável')
})

describe('Jornada Documento → Compartilhar · transparência', () => {
  it.todo('indicador atualizado explica "...porque um novo exame foi processado"')
  it.todo('relatório explica "...porque novos eventos foram registrados"')
})

/**
 * COBERTURA DO CONTRATO
 *  Componentes:  CaptureCenter · IndicatorSummaryCard · IndicatorEvolutionCard ·
 *                Timeline · RelatedItems · ReportSection · SituationCard
 *  Jornadas:     captura de exame · acompanhamento de indicador · relatório · compartilhamento
 *  Programas:    Diabetes (HbA1c)
 *  Estados:      Entrada · Confirmando · Processando · Sucesso · Acompanhamento · Compartilhamento
 *  Eventos:      Exame (documento)
 *  Projeções:    Exame · Indicador · Histórico · Relatório · report_shares
 */
