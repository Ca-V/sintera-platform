// CATRACA — o caso que a fundadora reportou, exatamente como ele aconteceu.
//
// "Adicionei a mesma receita que já estava adicionada na semana passada. Realmente a plataforma não sinalizou
// que era um documento repetido." As duas ficaram na lista, indistinguíveis.
//
// A regra dela é PERMANENTE e vale para toda entrada — digitada, enviada ou recebida de terceiros: a
// plataforma lê, identifica se já existe, e havendo correspondência INFORMA e PERGUNTA. Nunca decide sozinha.
import { describe, it, expect } from 'vitest'
import {
  findExistingDocument, existingDocumentMessage, documentDuplicateKey, normalizeIssuer,
  DOCUMENT_DUPLICATE_CHOICES,
} from '@sintera/core'

const guardada = {
  id: 'doc-1', createdAt: '2026-08-23T10:00:00Z', subtype: 'receita',
  issuer: 'Victor Cunha Diniz', docDate: '2025-09-25',
}

describe('a mesma receita, adicionada de novo', () => {
  it('É RECONHECIDA — o caso da homologação de 30/08', () => {
    const entrando = { id: '', createdAt: '', subtype: 'receita', issuer: 'Victor Cunha Diniz', docDate: '2025-09-25' }
    expect(findExistingDocument(entrando, [guardada])?.id).toBe('doc-1')
  })

  it('o tratamento profissional não engana: "Dr(a)." é a mesma pessoa', () => {
    // A leitura assistida escreve "Dr(a). Victor"; digitada à mão sai "Victor". Sem normalizar, seriam dois.
    const entrando = { id: '', createdAt: '', subtype: 'receita', issuer: 'Dr(a). Victor Cunha Diniz', docDate: '2025-09-25' }
    expect(findExistingDocument(entrando, [guardada])?.id).toBe('doc-1')
    expect(normalizeIssuer('Dra. Ana Souza')).toBe('ana souza')
  })

  it('o mesmo ARQUIVO é o sinal mais forte, mesmo sem emissor nem data', () => {
    const comHash = { ...guardada, sha256: 'abc123' }
    const entrando = { id: '', createdAt: '', subtype: 'receita', sha256: 'abc123' }
    expect(findExistingDocument(entrando, [comHash])?.id).toBe('doc-1')
  })

  it('TIPO diferente não é o mesmo documento — um atestado não repete uma receita', () => {
    const entrando = { id: '', createdAt: '', subtype: 'atestado', issuer: 'Victor Cunha Diniz', docDate: '2025-09-25' }
    expect(findExistingDocument(entrando, [guardada])).toBeNull()
  })

  it('data diferente não é repetição — duas receitas do mesmo médico são duas receitas', () => {
    const entrando = { id: '', createdAt: '', subtype: 'receita', issuer: 'Victor Cunha Diniz', docDate: '2026-01-10' }
    expect(findExistingDocument(entrando, [guardada])).toBeNull()
  })

  it('SEM SINAL SUFICIENTE, NÃO ACUSA. Acusar por engano é pior que deixar passar', () => {
    // Sem emissor e sem data, dois documentos do mesmo tipo não são comparáveis.
    expect(documentDuplicateKey({ id: '', createdAt: '', subtype: 'receita' })).toBeNull()
    const entrando = { id: '', createdAt: '', subtype: 'receita', issuer: 'Victor Cunha Diniz' }
    expect(findExistingDocument(entrando, [guardada])).toBeNull()
  })

  it('o mais ANTIGO é apontado como o original', () => {
    const nova = { ...guardada, id: 'doc-2', createdAt: '2026-08-30T10:00:00Z' }
    const entrando = { id: '', createdAt: '', subtype: 'receita', issuer: 'Victor Cunha Diniz', docDate: '2025-09-25' }
    expect(findExistingDocument(entrando, [nova, guardada])?.id).toBe('doc-1')
  })

  it('um documento não se acusa a si mesmo ao ser editado', () => {
    expect(findExistingDocument({ ...guardada }, [guardada])).toBeNull()
  })
})

describe('o que a pessoa lê e pode escolher', () => {
  it('a mensagem diz QUAL documento já existe — sem isso o aviso não é conferível', () => {
    const msg = existingDocumentMessage(guardada, 'Receita')
    expect(msg).toContain('Victor Cunha Diniz')
    expect(msg).toContain('25/09/2025')
  })

  it('as três saídas da regra dela estão todas presentes', () => {
    const ids = DOCUMENT_DUPLICATE_CHOICES.map(o => o.id)
    expect(ids).toEqual(['substituir', 'guardar-as-duas', 'cancelar'])
    // Toda opção explica o que faz: uma escolha sem consequência declarada não é uma escolha informada.
    for (const o of DOCUMENT_DUPLICATE_CHOICES) expect(o.hint.length).toBeGreaterThan(20)
  })
})
