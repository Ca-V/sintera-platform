import { describe, it, expect } from 'vitest'
import {
  ATTACHMENT_FORMATS, ATTACHMENT_MIME_TYPES, ATTACHMENT_EXTENSIONS, MAX_ATTACHMENT_BYTES,
  ATTACHMENT_CARDINALITY, entryMethodsFor, isAcceptedMime, isAcceptedExtension,
  attachmentAcceptAttr, withinAttachmentLimit, needsConversion,
  SUPPORTED_NOW_MIME_TYPES, CAPABILITY_FORMATS, isSupportedNow, isDeclaredFormat, supportedNowAcceptAttr,
} from '@sintera/core'

// ANEXO-001 — política transversal de anexos (SSOT única Web+Mobile).
describe('ANEXO-001 · formatos (allowlist única inclui Word e HEIC)', () => {
  it('formatos = PDF, JPEG, PNG, HEIC, Word', () => {
    expect(ATTACHMENT_FORMATS.map(f => f.format)).toEqual(['pdf', 'jpeg', 'png', 'heic', 'word'])
    expect(isAcceptedMime('application/pdf')).toBe(true)
    expect(isAcceptedMime('image/heic')).toBe(true)
    expect(isAcceptedMime('application/vnd.openxmlformats-officedocument.wordprocessingml.document')).toBe(true)
    expect(isAcceptedMime('image/gif')).toBe(false)
    expect(ATTACHMENT_EXTENSIONS).toContain('docx')
    expect(ATTACHMENT_EXTENSIONS).toContain('heic')
  })
  it('HEIC e Word exigem conversão/normalização; PDF/JPEG/PNG não', () => {
    expect(needsConversion('image/heic')).toBe(true)
    expect(needsConversion('application/msword')).toBe(true)
    expect(needsConversion('application/pdf')).toBe(false)
    expect(needsConversion('image/png')).toBe(false)
  })
  it('isAcceptedExtension por URL/nome', () => {
    expect(isAcceptedExtension('https://x/a.pdf?t=1')).toBe(true)
    expect(isAcceptedExtension('foto.HEIC')).toBe(true)
    expect(isAcceptedExtension('doc.docx')).toBe(true)
    expect(isAcceptedExtension('planilha.xlsx')).toBe(false)
  })
  it('accept string cobre todos os MIME da allowlist', () => {
    const accept = attachmentAcceptAttr()
    for (const m of ATTACHMENT_MIME_TYPES) expect(accept).toContain(m)
  })
})

describe('ANEXO-001 · SUPORTADO HOJE × CAPACIDADE arquitetural (diferenciação explícita)', () => {
  it('suportado hoje = PDF/JPEG/PNG; capacidade (ainda não habilitada) = HEIC/Word', () => {
    expect(isSupportedNow('application/pdf')).toBe(true)
    expect(isSupportedNow('image/png')).toBe(true)
    // capacidade arquitetural: declarada, mas NÃO suportada hoje (depende de enabler de pipeline)
    expect(isSupportedNow('image/heic')).toBe(false)
    expect(isSupportedNow('application/msword')).toBe(false)
    expect(isDeclaredFormat('image/heic')).toBe(true)
    expect(isDeclaredFormat('application/msword')).toBe(true)
    expect(isDeclaredFormat('image/gif')).toBe(false)
  })
  it('capacidades listam o enabler que falta (HEIC decode; Word conversão)', () => {
    expect(CAPABILITY_FORMATS.map(c => c.format).sort()).toEqual(['heic', 'word'])
    expect(CAPABILITY_FORMATS.every(c => !!c.enabler)).toBe(true)
  })
  it('accept de HOJE não expõe capacidade não habilitada (só PDF/JPEG/PNG)', () => {
    const now = supportedNowAcceptAttr()
    expect(now).toContain('application/pdf')
    expect(now).not.toContain('image/heic')
    expect(now).not.toContain('msword')
    expect(SUPPORTED_NOW_MIME_TYPES).toEqual(['application/pdf', 'image/jpeg', 'image/png'])
  })
  it('accept DECLARADO (arquitetura) inclui a capacidade — para o rollout, não para o input de hoje', () => {
    expect(attachmentAcceptAttr()).toContain('image/heic')
    expect(isAcceptedMime('application/msword')).toBe(true)  // declarado (capacidade)
  })
})

describe('ANEXO-001 · limite ÚNICO de tamanho', () => {
  it('há um único limite e ele vale para qualquer ponto', () => {
    expect(MAX_ATTACHMENT_BYTES).toBeGreaterThan(0)
    expect(withinAttachmentLimit(MAX_ATTACHMENT_BYTES)).toBe(true)
    expect(withinAttachmentLimit(MAX_ATTACHMENT_BYTES + 1)).toBe(false)
  })
})

describe('ANEXO-001 · métodos de entrada por plataforma (consistentes)', () => {
  it('Web tem drag-and-drop; Mobile tem câmera; arquivo em ambos', () => {
    const web = entryMethodsFor('web')
    const mobile = entryMethodsFor('mobile')
    expect(web).toContain('drag_drop')
    expect(web).not.toContain('camera')
    expect(mobile).toContain('camera')
    expect(mobile).not.toContain('drag_drop')
    expect(web).toContain('file_select'); expect(mobile).toContain('file_select')
    expect(web).toContain('multiple_files'); expect(mobile).toContain('multiple_files')
  })
})

describe('ANEXO-001 · cardinalidade (PDF NÃO encerra; N docs → 1 exame)', () => {
  it('múltiplos, mistos, posterior; PDF não encerra; N→1 exame', () => {
    expect(ATTACHMENT_CARDINALITY.multiple).toBe(true)
    expect(ATTACHMENT_CARDINALITY.mixedFormats).toBe(true)
    expect(ATTACHMENT_CARDINALITY.addLater).toBe(true)
    expect(ATTACHMENT_CARDINALITY.pdfEndsFlow).toBe(false)
    expect(ATTACHMENT_CARDINALITY.manyDocumentsToOneExam).toBe(true)
  })
})
