// Rótulos de status do exame — genéricos por ESTADO e Modelo Aberto (status desconhecido degrada p/ "processando",
// nunca vira "erro" na tela). Puro/determinístico.
import { describe, it, expect } from 'vitest'
import {
  examProcessingState,
  examStatusLabel,
  isExamFailed,
  isExamProcessing,
} from '../../apps/mobile/src/presentation/screens/exams/examStatus'

describe('examStatus (rótulos genéricos por estado)', () => {
  it('mapeia os códigos conhecidos (modelo canônico único — C1)', () => {
    expect(examProcessingState('processed')).toBe('ready')
    expect(examProcessingState('error')).toBe('failed')
    expect(examProcessingState('pending')).toBe('pending')       // pending distinto de processing (paridade Web)
    expect(examProcessingState('processing')).toBe('processing')
    expect(examProcessingState(null)).toBe('none')
    expect(examProcessingState('')).toBe('none')
  })

  it('status DESCONHECIDO degrada para "processing" (Modelo Aberto), não para erro', () => {
    expect(examProcessingState('queued_v2')).toBe('processing')
    expect(isExamFailed('queued_v2')).toBe(false)
  })

  it('rótulos amigáveis — nunca expõe o código cru; MESMOS da Web (C1)', () => {
    expect(examStatusLabel('processing')).toBe('Processando')
    expect(examStatusLabel('pending')).toBe('Aguardando')
    expect(examStatusLabel('error')).toBe('Não foi possível ler o documento')
    expect(examStatusLabel('processed')).toBeNull() // pronto → sem ruído (o selo de completude cobre)
    expect(examStatusLabel(null)).toBeNull()
  })

  it('predicados', () => {
    expect(isExamProcessing('pending')).toBe(true)
    expect(isExamFailed('error')).toBe(true)
    expect(isExamFailed('processed')).toBe(false)
  })
})
