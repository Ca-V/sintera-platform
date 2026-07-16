// FUNC · Normalização do médico solicitante (EXA-F003) — robustez da identificação do card.
// TRANSCREVE o nome; descarta rótulo ecoado e respostas de "sem dado" (RDC 657 / não inferir).

import { describe, it, expect } from 'vitest'
import { normalizeRequestingPhysician } from '@/lib/ai/requestingPhysician'

describe('normalizeRequestingPhysician (EXA-F003)', () => {
  it('mantém o nome transcrito, aparando aspas/pontuação das pontas', () => {
    expect(normalizeRequestingPhysician('Dr. João Silva')).toBe('Dr. João Silva')
    expect(normalizeRequestingPhysician('"Dra. Maria Souza."')).toBe('Dra. Maria Souza')
    expect(normalizeRequestingPhysician('  Dr. Pedro  ')).toBe('Dr. Pedro')
  })

  it('remove rótulo ecoado pelo modelo (não deve vazar para o card)', () => {
    expect(normalizeRequestingPhysician('Solicitante: Dr. João Silva')).toBe('Dr. João Silva')
    expect(normalizeRequestingPhysician('Médico solicitante: Dra. Ana')).toBe('Dra. Ana')
    expect(normalizeRequestingPhysician('Requisitante - Dr. Luiz')).toBe('Dr. Luiz')
    expect(normalizeRequestingPhysician('Médico: Dr. Carlos')).toBe('Dr. Carlos')
  })

  it('NÃO remove "Dr./Dra." (é parte do nome, não rótulo)', () => {
    expect(normalizeRequestingPhysician('Dr. João')).toBe('Dr. João')
    expect(normalizeRequestingPhysician('Dra. Beatriz Lima')).toBe('Dra. Beatriz Lima')
  })

  it('respostas de "sem dado" viram null (nunca aparecem como nome)', () => {
    for (const v of ['null', 'Null', 'N/A', 'NA', 'não informado', 'Não consta', 'não identificado', 'nenhum', 'não há', 'indisponível', 'sem informação', '-', '—', '.']) {
      expect(normalizeRequestingPhysician(v)).toBeNull()
    }
  })

  it('vazio/nulo/verboso demais → null', () => {
    expect(normalizeRequestingPhysician('')).toBeNull()
    expect(normalizeRequestingPhysician(null)).toBeNull()
    expect(normalizeRequestingPhysician(undefined)).toBeNull()
    expect(normalizeRequestingPhysician('x'.repeat(81))).toBeNull()
  })
})
