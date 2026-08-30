// FUNC — LEITURA DO DOCUMENTO × o que a pessoa declarou.
//
// O caso que originou esta regra (homologação, 25/08): em "Receitas e atestados" a fundadora marcou RECEITA,
// anexou um PEDIDO DE EXAME e um LAUDO, e os dois foram gravados como receita. A plataforma sabia classificar
// desde sempre — mas só o Capture Center da Web olhava.
import { describe, it, expect } from 'vitest'
import {
  documentDivergence, autofillFrom, kindNoun, documentSubtypeLabel,
  type DocumentReading,
} from '@sintera/core'

const leitura = (p: Partial<DocumentReading>): DocumentReading => ({
  kind: 'clinical_document', confidence: 'high', ...p,
})

describe('divergência — o caso real da homologação', () => {
  it('marcou Receita e anexou um PEDIDO DE EXAME → avisa e sugere o destino', () => {
    const v = documentDivergence('receita', leitura({ kind: 'medical_order' }), documentSubtypeLabel)
    expect(v.diverges).toBe(true)
    expect(v.message).toBe('Você marcou Receita, mas este documento parece um pedido de exame.')
    expect(v.suggestedKind).toBe('medical_order')
  })

  it('marcou Receita e anexou um LAUDO → avisa', () => {
    const v = documentDivergence('receita', leitura({ kind: 'exam' }), documentSubtypeLabel)
    expect(v.diverges).toBe(true)
    expect(v.message).toContain('um laudo de exame')
    expect(v.suggestedKind).toBe('exam')
  })
})

describe('divergência DENTRO do domínio documental (subtipo)', () => {
  it('marcou Receita e é Atestado → avisa', () => {
    const v = documentDivergence('receita', leitura({ subtype: 'atestado' }), documentSubtypeLabel)
    expect(v.diverges).toBe(true)
    // minúscula no meio da frase: o rótulo é 'Atestado', mas a frase é uma frase.
    expect(v.message).toBe('Você marcou Receita, mas este documento parece um atestado.')
  })
  it('marcou Atestado e É atestado → silêncio', () => {
    expect(documentDivergence('atestado', leitura({ subtype: 'atestado' }), documentSubtypeLabel).diverges).toBe(false)
  })
  it('subtipo lido como "outro" NÃO contraria a pessoa — ela sabe mais que o palpite genérico', () => {
    expect(documentDivergence('receita', leitura({ subtype: 'outro' }), documentSubtypeLabel).diverges).toBe(false)
  })
})

describe('quando NÃO avisar — duvidar sem base é pior que ficar calado', () => {
  it('confiança BAIXA nunca avisa', () => {
    const v = documentDivergence('receita', leitura({ kind: 'exam', confidence: 'low' }), documentSubtypeLabel)
    expect(v.diverges).toBe(false)
    expect(v.message).toBeNull()
  })
  it('confiança média já avisa — é sinal suficiente para perguntar', () => {
    expect(documentDivergence('receita', leitura({ kind: 'exam', confidence: 'medium' }), documentSubtypeLabel).diverges).toBe(true)
  })
  it('sem leitura, silêncio', () => {
    expect(documentDivergence('receita', null, documentSubtypeLabel).diverges).toBe(false)
  })
  it('kind sem substantivo declarado (other/unknown) não vira frase truncada', () => {
    expect(documentDivergence('receita', leitura({ kind: 'other' }), documentSubtypeLabel).diverges).toBe(false)
    expect(documentDivergence('receita', leitura({ kind: 'unknown' }), documentSubtypeLabel).diverges).toBe(false)
    expect(kindNoun('other')).toBeNull()
  })
})

describe('autopreenchimento — propõe, não decide', () => {
  it('preenche emissor e data quando os campos estão vazios', () => {
    const r = autofillFrom(leitura({ issuer: 'Dra. Ana', docDate: '2026-07-08' }), { issuer: '', docDate: '' })
    expect(r).toEqual({ issuer: 'Dra. Ana', docDate: '2026-07-08', professional: '', institution: '', items: [] })
  })
  it('NÃO sobrescreve o que a pessoa digitou — ela é a autoridade sobre o próprio registro', () => {
    const r = autofillFrom(
      leitura({ issuer: 'Dra. Ana', docDate: '2026-07-08' }),
      { issuer: 'Dr. Carlos', docDate: '2026-01-02' },
    )
    expect(r).toEqual({ issuer: 'Dr. Carlos', docDate: '2026-01-02', professional: '', institution: '', items: [] })
  })
  it('campo com só espaços conta como vazio', () => {
    const r = autofillFrom(leitura({ issuer: 'Dra. Ana' }), { issuer: '   ', docDate: '' })
    expect(r.issuer).toBe('Dra. Ana')
  })
  it('leitura sem emissor nem data deixa os campos como estavam', () => {
    const r = autofillFrom(leitura({}), { issuer: '', docDate: '' })
    expect(r).toEqual({ issuer: '', docDate: '', professional: '', institution: '', items: [] })
  })
  it('sem leitura, nada muda', () => {
    expect(autofillFrom(null, { issuer: 'X', docDate: '2026-01-01' })).toEqual({ issuer: 'X', docDate: '2026-01-01', professional: '', institution: '', items: [] })
  })
})
