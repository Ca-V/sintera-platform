import { describe, it } from 'vitest'

/**
 * Contrato transversal — invariantes globais da SINTERA.
 * Referenciado por todo contrato de jornada que dispara automação ou projeção.
 * Passos ficam `it.todo` até a implementação/Estado 2 liberar cada nível.
 * Ver CONTRACT_TEST_GUIDE.md (§6).
 */

describe('Invariante de transparência — toda automação explica "por que isso aconteceu?"', () => {
  it.todo('lembrete de recompra explica: "...porque você registrou uma compra"')
  it.todo('indicador atualizado explica: "...porque um exame foi processado"')
  it.todo('relatório atualizado explica: "...porque novos eventos foram registrados"')
  it.todo('toda automação relevante produz uma explicação não vazia, em linguagem da usuária')
})

describe('Invariante canônico — "nenhuma projeção escreve outra projeção"', () => {
  it.todo('Agenda/Histórico/Gastos/Indicadores/Relatório apenas LEEM (não escrevem)')
  it.todo('apenas telas de Registrar (ActionForm/CaptureCenter) e Compartilhar ESCREVEM')
  it.todo('ActionForm escreve Evento; as projeções derivam do Evento')
})

describe('Invariante de texto canônico — mesmo estado, mesma frase', () => {
  it.todo('sucesso de upload diz "Documento enviado" (nunca "Arquivo recebido"/"Upload concluído")')
  it.todo('erro de leitura diz "Não consegui ler a imagem" (nunca "Falha no OCR")')
  it.todo('pendência diz "Aguardando confirmação" (nunca "Em análise"/"Pendente de revisão")')
})

describe('Invariante factual — RDC 657/2022', () => {
  it.todo('nenhuma superfície interpreta/diagnostica; leitura é sempre descritiva')
  it.todo('relatório organiza conhecimento existente — nunca cria conhecimento novo')
})
