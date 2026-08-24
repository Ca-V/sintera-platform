import { describe, it, expect } from 'vitest'
import {
  buildPatientDocumentInsert, buildDocumentLinkInserts, canAssociate, allowedTargets,
  createPatientDocument, associateDocument, isDocumentSubtype, documentSubtypeLabel,
  RECEITA_TARGET_DOMAINS, DOCUMENT_SUBTYPES,
  type PatientDocWriteClient, type DocumentTargetDomain,
} from '@/lib/documents/patientDocuments'

// DOC-001 — domínio "Documentos do paciente" (opção B, isolado, sem banco).
// Cliente FAKE que REGISTRA quais tabelas foram tocadas — para provar o invariante "documento ≠ exame".
function fakeClient(): { client: PatientDocWriteClient; touched: string[] } {
  const touched: string[] = []
  let seq = 0
  const client: PatientDocWriteClient = {
    from: (table) => ({
      insert: (rows) => {
        touched.push(table)
        const n = Array.isArray(rows) ? rows.length : 1
        return { select: async () => ({ data: Array.from({ length: n }, () => ({ id: `id-${++seq}` })), error: null }) }
      },
    }),
  }
  return { client, touched }
}

describe('DOC-001 · subtipos', () => {
  it('subtipos = receita/atestado/relatorio/encaminhamento/outro', () => {
    expect(DOCUMENT_SUBTYPES.map(s => s.value)).toEqual(['receita', 'atestado', 'relatorio', 'encaminhamento', 'outro'])
    expect(isDocumentSubtype('receita')).toBe(true)
    expect(isDocumentSubtype('exame')).toBe(false)   // exame NÃO é documento do paciente (domínio separado)
    expect(documentSubtypeLabel('encaminhamento')).toBe('Encaminhamento')
  })
})

describe('DOC-001 · Receita associável a 1..N contextos (os 7 da fundadora)', () => {
  it('Receita pode associar aos 7 contextos', () => {
    expect(RECEITA_TARGET_DOMAINS).toEqual(['medicamento', 'suplemento', 'ciclo', 'composicao', 'recurso', 'habito', 'monitoramento'])
    for (const target of RECEITA_TARGET_DOMAINS) expect(canAssociate('receita', target)).toBe(true)
    expect(allowedTargets('receita')).toEqual(RECEITA_TARGET_DOMAINS)
  })
  it('cada um dos 7 casos vira um link (uma receita → N alvos)', () => {
    const associations = RECEITA_TARGET_DOMAINS.map((d, i) => ({ target_domain: d, target_id: `alvo-${i}` }))
    const links = buildDocumentLinkInserts('doc-1', 'receita', associations)
    expect(links.length).toBe(7)
    expect(links.map(l => l.target_domain)).toEqual(RECEITA_TARGET_DOMAINS)
    expect(links.every(l => l.document_id === 'doc-1')).toBe(true)
  })
  it('associação fora da especificação é rejeitada (sem regra provisória)', () => {
    // 'exame' não é alvo de Receita → inválido; documentos clínicos associam a consulta/exame.
    expect(canAssociate('receita', 'exame' as DocumentTargetDomain)).toBe(false)
    expect(() => buildDocumentLinkInserts('doc-1', 'receita', [{ target_domain: 'exame', target_id: 'x' }])).toThrow(/inválida/)
    expect(canAssociate('atestado', 'consulta')).toBe(true)
    expect(canAssociate('atestado', 'medicamento')).toBe(false)
  })
})

describe('DOC-001 · buildPatientDocumentInsert (separado de exames)', () => {
  it('monta a linha do documento com defaults', () => {
    const row = buildPatientDocumentInsert('user-1', { file_url: 'https://x/r.pdf', subtype: 'receita' })
    expect(row).toMatchObject({ user_id: 'user-1', subtype: 'receita', file_url: 'https://x/r.pdf', status: 'pending', source: 'upload_usuario' })
    expect(row.issuer).toBeNull(); expect(row.doc_date).toBeNull()
  })
})

describe('DOC-001 · createPatientDocument — INVARIANTE: nunca toca exams/exam_documents', () => {
  it('cria documento + N associações tocando SÓ patient_documents e patient_document_links', async () => {
    const { client, touched } = fakeClient()
    const r = await createPatientDocument(client, { user_id: 'user-1', doc: {
      file_url: 'https://x/receita.pdf', subtype: 'receita',
      associations: [{ target_domain: 'medicamento', target_id: 'med-1' }, { target_domain: 'suplemento', target_id: 'sup-1' }],
    } })
    expect(r.error).toBeNull()
    expect(r.id).toBe('id-1')
    expect(r.linkIds.length).toBe(2)
    expect(new Set(touched)).toEqual(new Set(['patient_documents', 'patient_document_links']))
    expect(touched).not.toContain('exams')
    expect(touched).not.toContain('exam_documents')
    expect(touched).not.toContain('medications')   // associar ≠ mutar o registro-alvo
  })
  it('documento sem associação escreve só em patient_documents', async () => {
    const { client, touched } = fakeClient()
    const r = await createPatientDocument(client, { user_id: 'u', doc: { file_url: 'https://x/atest.pdf', subtype: 'atestado' } })
    expect(r.error).toBeNull(); expect(r.linkIds).toEqual([])
    expect(touched).toEqual(['patient_documents'])
  })
  it('associação inválida não escreve links e volta erro (documento já criado)', async () => {
    const { client, touched } = fakeClient()
    const r = await createPatientDocument(client, { user_id: 'u', doc: {
      file_url: 'https://x/r.pdf', subtype: 'receita', associations: [{ target_domain: 'exame' as DocumentTargetDomain, target_id: 'x' }],
    } })
    expect(r.id).toBe('id-1')
    expect(r.error?.message).toMatch(/inválida/)
    expect(touched).toEqual(['patient_documents'])   // não tentou inserir link inválido
  })
})

describe('DOC-001 · associateDocument — associação posterior (não recria, não muta alvo)', () => {
  it('liga um documento existente a mais alvos tocando só patient_document_links', async () => {
    const { client, touched } = fakeClient()
    const r = await associateDocument(client, { document_id: 'doc-1', subtype: 'receita', associations: [
      { target_domain: 'ciclo', target_id: 'ctc-1' }, { target_domain: 'monitoramento', target_id: 'mon-1' },
    ] })
    expect(r.error).toBeNull(); expect(r.linkIds.length).toBe(2)
    expect(touched).toEqual(['patient_document_links'])   // nunca patient_documents nem o alvo
  })
})
