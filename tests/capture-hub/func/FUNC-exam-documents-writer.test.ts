import { describe, it, expect } from 'vitest'
import {
  buildExamDocumentInserts, createExamDocuments, attachDocumentToExam, planMultiDocumentUpload,
  isSupportedDocument, contentTypeFromUrl, SUPPORTED_DOCUMENT_MIME,
  type ExamDocWriteClient, type ExamDocumentInsert,
} from '@/lib/exams/examDocuments'

// EXDOC-004 — Múltiplos documentos por exame + anexação posterior (camada de dados isolada, sem banco).
// Cliente FAKE que REGISTRA quais tabelas/insert foram tocados — para provar o invariante "anexar ≠ novo exame".

function fakeClient(): { client: ExamDocWriteClient; touched: { table: string; rows: ExamDocumentInsert[] }[] } {
  const touched: { table: string; rows: ExamDocumentInsert[] }[] = []
  let seq = 0
  const client: ExamDocWriteClient = {
    from: (table) => ({
      insert: (rows) => {
        touched.push({ table, rows: rows as ExamDocumentInsert[] })
        return { select: async () => ({ data: (rows as ExamDocumentInsert[]).map(() => ({ id: `id-${++seq}` })), error: null }) }
      },
    }),
  }
  return { client, touched }
}

describe('EXDOC-004 · formatos suportados (auditoria: PDF/JPG/PNG)', () => {
  it('aceita PDF/JPG/PNG e rejeita o resto', () => {
    expect(SUPPORTED_DOCUMENT_MIME).toEqual(['application/pdf', 'image/jpeg', 'image/png'])
    expect(isSupportedDocument({ type: 'application/pdf', size: 100 }).ok).toBe(true)
    expect(isSupportedDocument({ type: 'image/png', size: 100 }).ok).toBe(true)
    expect(isSupportedDocument({ type: 'image/gif', size: 100 }).ok).toBe(false)
  })
  it('contentTypeFromUrl por extensão', () => {
    expect(contentTypeFromUrl('https://x/a.pdf?t=1')).toBe('application/pdf')
    expect(contentTypeFromUrl('https://x/a.JPG')).toBe('image/jpeg')
    expect(contentTypeFromUrl('https://x/a.png')).toBe('image/png')
  })
})

describe('EXDOC-004 · buildExamDocumentInserts — N documentos, MESMO exame', () => {
  it('N arquivos (mistos) → N linhas com o mesmo exam_id; 1 primário', () => {
    const rows = buildExamDocumentInserts('exam-1', 'user-1', [
      { file_url: 'https://x/a.pdf', role: 'laudo_preliminar' },
      { file_url: 'https://x/b.jpg', role: 'laudo_final' },
      { file_url: 'https://x/c.png', role: 'complementar' },
    ])
    expect(rows.length).toBe(3)
    expect(new Set(rows.map(r => r.exam_id))).toEqual(new Set(['exam-1']))  // um único evento
    expect(rows.filter(r => r.is_primary).length).toBe(1)
    expect(rows[0].is_primary).toBe(true)
    expect(rows.map(r => r.document_role)).toEqual(['laudo_preliminar', 'laudo_final', 'complementar'])
    expect(rows.every(r => r.status === 'pending' && r.source === 'upload_usuario')).toBe(true)
  })
  it('primaryIndex=-1 → nenhum primário (uso da anexação posterior)', () => {
    const rows = buildExamDocumentInserts('exam-1', 'user-1', [{ file_url: 'https://x/a.pdf' }], { primaryIndex: -1 })
    expect(rows[0].is_primary).toBe(false)
    expect(rows[0].document_role).toBe('outro')  // default
  })
})

describe('EXDOC-004 · planMultiDocumentUpload — N arquivos mistos, PDF NÃO encerra o fluxo', () => {
  it('PDF + imagem → mantém AMBOS (um PDF no meio não descarta os demais)', () => {
    const plan = planMultiDocumentUpload([
      { file_url: 'https://x/a.pdf', type: 'application/pdf' },
      { file_url: 'https://x/b.jpg', type: 'image/jpeg' },
    ])
    expect(plan.rejected).toEqual([])
    expect(plan.docs.map(d => d.file_url)).toEqual(['https://x/a.pdf', 'https://x/b.jpg'])
  })
  it('vários PDFs → todos mantidos (regra "PDF encerra o fluxo" NÃO se aplica aqui)', () => {
    const plan = planMultiDocumentUpload([
      { file_url: 'https://x/1.pdf' }, { file_url: 'https://x/2.pdf' }, { file_url: 'https://x/3.pdf' },
    ])
    expect(plan.docs.length).toBe(3)
  })
  it('formato não suportado vai para rejected SEM interromper os demais', () => {
    const plan = planMultiDocumentUpload([
      { file_url: 'https://x/a.pdf' }, { file_url: 'https://x/b.gif', type: 'image/gif' }, { file_url: 'https://x/c.png' },
    ])
    expect(plan.docs.map(d => d.file_url)).toEqual(['https://x/a.pdf', 'https://x/c.png'])
    expect(plan.rejected.map(r => r.file_url)).toEqual(['https://x/b.gif'])
  })
  it('preliminar + final (mistos) → 1 exame, N documentos, 1 primário', () => {
    const plan = planMultiDocumentUpload([
      { file_url: 'https://x/prelim.jpg', role: 'laudo_preliminar' },
      { file_url: 'https://x/final.pdf', role: 'laudo_final' },
    ])
    const rows = buildExamDocumentInserts('exam-1', 'user-1', plan.docs)
    expect(new Set(rows.map(r => r.exam_id))).toEqual(new Set(['exam-1']))  // 1 exame/evento
    expect(rows.map(r => r.document_role)).toEqual(['laudo_preliminar', 'laudo_final'])
    expect(rows.filter(r => r.is_primary).length).toBe(1)
  })
})

describe('EXDOC-004 · createExamDocuments (novo exame com N documentos)', () => {
  it('escreve N linhas SÓ em exam_documents; devolve N ids', async () => {
    const { client, touched } = fakeClient()
    const r = await createExamDocuments(client, { exam_id: 'exam-1', user_id: 'user-1', docs: [
      { file_url: 'https://x/a.pdf' }, { file_url: 'https://x/b.jpg' },
    ] })
    expect(r.error).toBeNull()
    expect(r.ids.length).toBe(2)
    expect(touched.map(t => t.table)).toEqual(['exam_documents'])   // nunca 'exams'
    expect(touched[0].rows.length).toBe(2)
  })
  it('docs vazio → no-op (sem escrita)', async () => {
    const { client, touched } = fakeClient()
    const r = await createExamDocuments(client, { exam_id: 'exam-1', user_id: 'user-1', docs: [] })
    expect(r.ids).toEqual([]); expect(touched.length).toBe(0)
  })
})

describe('EXDOC-004 · attachDocumentToExam — INVARIANTE: anexar ≠ novo exame/evento', () => {
  it('anexar posterior toca SÓ exam_documents (nunca exams); não é primário', async () => {
    const { client, touched } = fakeClient()
    const r = await attachDocumentToExam(client, { exam_id: 'exam-1', user_id: 'user-1', doc: { file_url: 'https://x/formal.pdf', role: 'laudo_final' } })
    expect(r.error).toBeNull(); expect(r.id).toBe('id-1')
    expect(touched.map(t => t.table)).toEqual(['exam_documents'])   // <- invariante: NENHUM insert em 'exams'
    expect(touched.some(t => t.table === 'exams')).toBe(false)
    const row = touched[0].rows[0]
    expect(row.exam_id).toBe('exam-1')     // vinculado ao exame existente
    expect(row.is_primary).toBe(false)
    expect(row.document_role).toBe('laudo_final')
  })
  it('propaga erro do banco sem lançar', async () => {
    const client: ExamDocWriteClient = { from: () => ({ insert: () => ({ select: async () => ({ data: null, error: new Error('rls') }) }) }) }
    const r = await attachDocumentToExam(client, { exam_id: 'e', user_id: 'u', doc: { file_url: 'https://x/a.pdf' } })
    expect(r.id).toBeNull(); expect(r.error?.message).toBe('rls')
  })
})
