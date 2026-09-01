// FUNC · DOC-002 — RECEITA com dono único.
//
// O que estes testes protegem:
//  1. a receita passa a existir em Documentos, vinculada ao medicamento (antes vivia só em
//     `medications.prescription_url`, e quem procurasse em Documentos não achava);
//  2. salvar o mesmo medicamento de novo NÃO duplica a receita — sem isso, cada edição criaria mais uma;
//  3. a leitura prefere o DOCUMENTO e só cai no ponteiro legado para registros anteriores ao DOC-002.
import { describe, it, expect } from 'vitest'
import { archivePrescription, prescriptionUrlOf, type PatientDocumentDTO } from '@sintera/api-client'
import { prescriptionDocumentFor } from '@sintera/core'

const URL_RX = 'https://storage/receita-1.pdf'
const MED_ID = '11111111-1111-1111-1111-111111111111'

/** Cliente FAKE que registra as tabelas tocadas e devolve os documentos já existentes que lhe forem dados. */
function fakeClient(existing: PatientDocumentDTO[]) {
  const touched: string[] = []
  const inserted: Record<string, unknown[]> = {}
  let seq = 0

  const linkRows = existing.map(d => ({ document_id: d.id, target_id: MED_ID }))

  const builder = (table: string) => {
    const chain = {
      select: () => chain,
      eq: () => chain,
      in: () => chain,
      order: () => chain,
      abortSignal: () => chain,
      then: undefined as unknown,
    }
    // Leitura: resolve como Promise no ponto em que a função aguarda.
    const readable = Object.assign(chain, {
      then: (res: (v: { data: unknown; error: null }) => void) => {
        if (table === 'patient_document_links') return res({ data: linkRows, error: null })
        if (table === 'patient_documents') return res({ data: existing, error: null })
        return res({ data: [], error: null })
      },
    })
    return {
      ...readable,
      insert: (rows: unknown) => {
        touched.push(table)
        ;(inserted[table] ??= []).push(rows)
        const arr = Array.isArray(rows) ? rows : [rows]
        return { select: async () => ({ data: arr.map(() => ({ id: `novo-${++seq}` })), error: null }) }
      },
    }
  }

  const client = {
    auth: { getSession: async () => ({ data: { session: { user: { id: 'u-1' } } } }) },
    from: (table: string) => builder(table),
  }
  // O contrato real é SupabaseClient; o fake implementa só o que estas funções usam.
  return { client: client as never, touched, inserted }
}

const doc = (id: string, file_url: string): PatientDocumentDTO => ({
  id, subtype: 'receita', file_url, issuer: null, doc_date: null, notes: null,
  prescribed_items: null, professional_name: null, institution_name: null,
  status: 'pending', transcricao_status: null, transcricao_origin: null,
  created_at: '2026-08-25T00:00:00Z',
})

describe('DOC-002 · a receita é montada pelo domínio', () => {
  it('sempre subtipo receita, sempre com o vínculo declarado', () => {
    const input = prescriptionDocumentFor(URL_RX, { target_domain: 'medicamento', target_id: MED_ID })
    expect(input.subtype).toBe('receita')
    expect(input.associations).toEqual([{ target_domain: 'medicamento', target_id: MED_ID }])
    expect(input.file_url).toBe(URL_RX)
  })
})

describe('DOC-002 · archivePrescription', () => {
  it('arquiva a receita e NÃO toca medications nem exams', async () => {
    const { client, touched } = fakeClient([])
    const { error } = await archivePrescription(client, {
      target: { target_domain: 'medicamento', target_id: MED_ID }, fileUrl: URL_RX,
    })
    expect(error).toBeNull()
    expect(touched).toContain('patient_documents')
    expect(touched).toContain('patient_document_links')
    expect(touched).not.toContain('medications')
    expect(touched).not.toContain('exams')
    expect(touched).not.toContain('exam_documents')
  })

  it('IDEMPOTENTE — salvar o mesmo medicamento de novo não cria uma segunda receita', async () => {
    const { client, touched } = fakeClient([doc('doc-1', URL_RX)])
    const { documentId, error } = await archivePrescription(client, {
      target: { target_domain: 'medicamento', target_id: MED_ID }, fileUrl: URL_RX,
    })
    expect(error).toBeNull()
    expect(documentId).toBe('doc-1')       // reaproveita o que já existe
    expect(touched).toHaveLength(0)        // nada foi inserido
  })

  it('sem receita anexada é no-op', async () => {
    const { client, touched } = fakeClient([])
    const r = await archivePrescription(client, {
      target: { target_domain: 'medicamento', target_id: MED_ID }, fileUrl: null,
    })
    expect(r.error).toBeNull()
    expect(r.documentId).toBeNull()
    expect(touched).toHaveLength(0)
  })
})

describe('DOC-002 · prescriptionUrlOf — a fonte é o documento', () => {
  it('o documento vence o ponteiro legado', () => {
    const map = { [MED_ID]: [doc('doc-1', URL_RX)] }
    expect(prescriptionUrlOf(map, MED_ID, 'https://storage/legado.pdf')).toBe(URL_RX)
  })

  it('registro anterior ao DOC-002 ainda mostra a receita pelo ponteiro legado', () => {
    expect(prescriptionUrlOf({}, MED_ID, 'https://storage/legado.pdf')).toBe('https://storage/legado.pdf')
  })

  it('sem documento e sem legado → nada a mostrar', () => {
    expect(prescriptionUrlOf({}, MED_ID, null)).toBeNull()
  })

  it('ignora documento de outro subtipo vinculado ao mesmo medicamento', () => {
    const outro: PatientDocumentDTO = { ...doc('doc-9', 'https://storage/atestado.pdf'), subtype: 'atestado' }
    expect(prescriptionUrlOf({ [MED_ID]: [outro] }, MED_ID, null)).toBeNull()
  })
})
