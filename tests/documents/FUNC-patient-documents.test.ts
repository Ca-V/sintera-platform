import { describe, it, expect } from 'vitest'
import {
  buildPatientDocumentInsert, buildDocumentLinkInserts, canAssociate, allowedTargets,
  createPatientDocument, associateDocument, isDocumentSubtype, documentSubtypeLabel,
  RECEITA_TARGET_DOMAINS, DOCUMENT_SUBTYPES, documentSubtitle,
  type PatientDocWriteClient, type DocumentTargetDomain,
} from '@sintera/core'

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
    const links = buildDocumentLinkInserts('doc-1', 'u-1', 'receita', associations)
    expect(links.length).toBe(7)
    expect(links.map(l => l.target_domain)).toEqual(RECEITA_TARGET_DOMAINS)
    expect(links.every(l => l.document_id === 'doc-1')).toBe(true)
    // `user_id` em TODO link: a RLS de `patient_document_links` exige `auth.uid() = user_id`. Um link sem
    // dono seria rejeitado pelo banco na hora de gravar — falha que só apareceria em produção.
    expect(links.every(l => l.user_id === 'u-1')).toBe(true)
  })
  it('associação fora da especificação é rejeitada (sem regra provisória)', () => {
    // 'exame' não é alvo de Receita → inválido; documentos clínicos associam a consulta/exame.
    expect(canAssociate('receita', 'exame' as DocumentTargetDomain)).toBe(false)
    expect(() => buildDocumentLinkInserts('doc-1', 'u-1', 'receita', [{ target_domain: 'exame', target_id: 'x' }])).toThrow(/inválida/)
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
    const r = await associateDocument(client, { document_id: 'doc-1', user_id: 'u-1', subtype: 'receita', associations: [
      { target_domain: 'ciclo', target_id: 'ctc-1' }, { target_domain: 'monitoramento', target_id: 'mon-1' },
    ] })
    expect(r.error).toBeNull(); expect(r.linkIds.length).toBe(2)
    expect(touched).toEqual(['patient_document_links'])   // nunca patient_documents nem o alvo
  })
})

// DOC-002 — a LINHA DE IDENTIFICAÇÃO do cartão. Achado na homologação (25/08): sem emissor e sem data, três
// receitas viravam três cartões idênticos ("Receita" / "Sem emissor informado") e não havia como distingui-las.
describe('DOC-002 · documentSubtitle — o cartão nunca fica anônimo', () => {
  it('emissor e data do documento vencem, nessa ordem', () => {
    expect(documentSubtitle({ issuer: 'Dra. Ana', doc_date: '2026-07-08', created_at: '2026-08-25T00:00:00Z' }))
      .toBe('Dra. Ana · 08/07/2026')
  })
  it('só emissor', () => {
    expect(documentSubtitle({ issuer: 'Dra. Ana', doc_date: null, created_at: '2026-08-25T00:00:00Z' }))
      .toBe('Dra. Ana')
  })
  it('só data do documento', () => {
    expect(documentSubtitle({ issuer: null, doc_date: '2026-07-08', created_at: '2026-08-25T00:00:00Z' }))
      .toBe('08/07/2026')
  })
  it('SEM emissor e SEM data → cai na data de inclusão, e não em texto vazio', () => {
    // É o caso real do primeiro documento guardado na homologação. Sem isto, o cartão não identifica nada.
    expect(documentSubtitle({ issuer: null, doc_date: null, created_at: '2026-08-25T14:45:15Z' }))
      .toBe('Adicionado em 25/08/2026')
  })
  it('emissor em branco conta como ausente', () => {
    expect(documentSubtitle({ issuer: '   ', doc_date: null, created_at: '2026-08-25T00:00:00Z' }))
      .toBe('Adicionado em 25/08/2026')
  })
  it('sem nada, degrada sem quebrar', () => {
    expect(documentSubtitle({ issuer: null, doc_date: null, created_at: null }))
      .toBe('Sem emissor informado')
  })
})
