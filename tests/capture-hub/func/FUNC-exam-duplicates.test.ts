// FUNC · Detecção de exame DUPLICADO (req_deteccao_duplicados).
//
// Certifica: fingerprint como sinal forte; identidade (paciente+data+emissor+título) como fallback;
// só o registro MAIS NOVO é marcado (o original permanece); sinal insuficiente → não marca
// (sem falso-positivo); normalização de acentos/caixa/espaços.

import { describe, it, expect } from 'vitest'
import { duplicateKeyOf, findDuplicateIds, originalIdFor, type DuplicateCandidate } from '@/lib/exams/duplicates'

const ex = (o: Partial<DuplicateCandidate> & { id: string; createdAt: string }): DuplicateCandidate => o

describe('duplicateKeyOf', () => {
  it('usa o fingerprint quando presente (sinal forte)', () => {
    const a = ex({ id: 'a', createdAt: '1', representationFingerprint: 'FP-123', title: 'x', examDate: '2026-01-01' })
    expect(duplicateKeyOf(a)).toBe('fp:fp-123')
  })

  it('cai para identidade (paciente+data+emissor+título) sem fingerprint', () => {
    const a = ex({ id: 'a', createdAt: '1', patientName: 'Ana', examDate: '2026-07-01', issuer: 'Fleury', title: 'Hemograma' })
    expect(duplicateKeyOf(a)).toBe('id:ana|2026-07-01|fleury|hemograma')
  })

  it('normaliza acentos, caixa e espaços na identidade', () => {
    const a = ex({ id: 'a', createdAt: '1', patientName: 'ANA  MARIA', examDate: '2026-07-01', issuer: 'Instituição', title: 'Avaliação Física' })
    const b = ex({ id: 'b', createdAt: '2', patientName: 'ana maria', examDate: '2026-07-01', issuer: 'instituicao', title: 'avaliacao fisica' })
    expect(duplicateKeyOf(a)).toBe(duplicateKeyOf(b))
  })

  it('sinal insuficiente (sem fingerprint e sem data OU sem título) → null (não arrisca)', () => {
    expect(duplicateKeyOf(ex({ id: 'a', createdAt: '1', title: 'Hemograma' }))).toBeNull() // sem data
    expect(duplicateKeyOf(ex({ id: 'a', createdAt: '1', examDate: '2026-07-01' }))).toBeNull() // sem título
  })
})

describe('findDuplicateIds', () => {
  it('marca apenas o registro MAIS NOVO do par (original mais antigo permanece)', () => {
    const exams = [
      ex({ id: 'orig', createdAt: '2026-07-01T10:00:00Z', representationFingerprint: 'FP' }),
      ex({ id: 'dup',  createdAt: '2026-07-02T10:00:00Z', representationFingerprint: 'FP' }),
    ]
    const dups = findDuplicateIds(exams)
    expect(dups.has('dup')).toBe(true)
    expect(dups.has('orig')).toBe(false)
  })

  it('exames com chave nula não são marcados', () => {
    const exams = [
      ex({ id: 'a', createdAt: '1', title: 'Hemograma' }), // sem data → chave nula
      ex({ id: 'b', createdAt: '2', title: 'Hemograma' }),
    ]
    expect(findDuplicateIds(exams).size).toBe(0)
  })

  it('três iguais → dois marcados como duplicados', () => {
    const mk = (id: string, t: string) => ex({ id, createdAt: t, patientName: 'Ana', examDate: '2026-07-01', title: 'TSH' })
    const dups = findDuplicateIds([mk('1', '2026-07-01'), mk('2', '2026-07-02'), mk('3', '2026-07-03')])
    expect([...dups].sort()).toEqual(['2', '3'])
  })
})

describe('originalIdFor', () => {
  it('aponta o registro original de um duplicado', () => {
    const exams = [
      ex({ id: 'orig', createdAt: '2026-07-01', representationFingerprint: 'FP' }),
      ex({ id: 'dup',  createdAt: '2026-07-02', representationFingerprint: 'FP' }),
    ]
    expect(originalIdFor(exams[1], exams)).toBe('orig')
    expect(originalIdFor(exams[0], exams)).toBe('dup') // o mais antigo "vê" o outro como par; a UI usa findDuplicateIds p/ marcar só o novo
  })

  it('exame sem par → null', () => {
    const exams = [ex({ id: 'a', createdAt: '1', representationFingerprint: 'FP-1' }), ex({ id: 'b', createdAt: '2', representationFingerprint: 'FP-2' })]
    expect(originalIdFor(exams[0], exams)).toBeNull()
  })
})
