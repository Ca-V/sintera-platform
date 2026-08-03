// Fontes ÚNICAS extraídas na revisão de encerramento: formatação de data (antes duplicada+inconsistente) e a
// mensagem de erro de carga (antes duplicada nos hooks). Puras/determinísticas.
import { describe, it, expect } from 'vitest'
import { formatExamDate } from '../../apps/mobile/src/presentation/screens/exams/examFormat'
import { loadErrorMessage } from '../../apps/mobile/src/presentation/screens/exams/loadMachine'

describe('formatExamDate (fonte única — lista e detalhe iguais)', () => {
  it('YYYY-MM-DD → DD/MM/YYYY', () => {
    expect(formatExamDate('2024-01-02')).toBe('02/01/2024')
    expect(formatExamDate('2023-12-16T00:00:00Z')).toBe('16/12/2023')
  })
  it('ausente/inválida → "Sem data" (consistente, sem "—")', () => {
    expect(formatExamDate(null)).toBe('Sem data')
    expect(formatExamDate(undefined)).toBe('Sem data')
    expect(formatExamDate('')).toBe('Sem data')
    expect(formatExamDate('lixo')).toBe('Sem data')
  })
})

describe('loadErrorMessage (fonte única)', () => {
  it('usa a mensagem do Error; senão o fallback', () => {
    expect(loadErrorMessage(new Error('rede'), 'fb')).toBe('rede')
    expect(loadErrorMessage(new Error(''), 'fb')).toBe('fb')
    expect(loadErrorMessage('x', 'fb')).toBe('fb')
    expect(loadErrorMessage(null, 'fb')).toBe('fb')
  })
})
