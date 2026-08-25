// FUNC · ANEXO-001 — conjunto de anexos. Aqui mora a REGRA que as telas deixaram de inventar cada uma a sua.
import { describe, it, expect } from 'vitest'
import {
  acceptFiles, removeFile, withUploadedUrl, pendingUpload, isReadyToSave,
  rejectionMessage, attachmentCountLabel, MAX_ATTACHMENT_BYTES,
  type AttachedFile, type IncomingFile,
} from '@sintera/core'

const pdf = (n: string, size = 1000): IncomingFile => ({ id: n, name: n, mime: 'application/pdf', sizeBytes: size })
const jpg = (n: string, size = 1000): IncomingFile => ({ id: n, name: n, mime: 'image/jpeg', sizeBytes: size })

describe('ANEXO-001 · acceptFiles', () => {
  it('aceita VÁRIOS de uma vez', () => {
    const r = acceptFiles([], [pdf('a.pdf'), jpg('b.jpg'), jpg('c.jpg')])
    expect(r.files).toHaveLength(3)
    expect(r.rejected).toHaveLength(0)
  })

  it('aceita formatos MISTOS — PDF e imagem no mesmo conjunto', () => {
    const r = acceptFiles([], [pdf('laudo.pdf'), jpg('pedido.jpg')])
    expect(r.files.map(f => f.mime)).toEqual(['application/pdf', 'image/jpeg'])
  })

  it('PDF NÃO encerra o fluxo — dá para acrescentar depois dele', () => {
    // Era o comportamento antigo do Capture Center: o PDF fechava o fluxo e impedia juntar a foto do pedido.
    const primeiro = acceptFiles([], [pdf('laudo.pdf')])
    const depois = acceptFiles(primeiro.files, [jpg('pedido.jpg')])
    expect(depois.files).toHaveLength(2)
    expect(depois.rejected).toHaveLength(0)
  })

  it('INCLUSÃO POSTERIOR — acrescentar a um conjunto que já tem itens é normal', () => {
    const antes: AttachedFile[] = [{ id: '1', name: 'a.pdf', mime: 'application/pdf', sizeBytes: 10, url: 'https://x/a' }]
    const r = acceptFiles(antes, [jpg('b.jpg')])
    expect(r.files).toHaveLength(2)
    expect(r.files[0].url).toBe('https://x/a')   // o que já subiu não é perdido
  })

  it('recusa formato não suportado, DIZENDO qual e por quê', () => {
    const r = acceptFiles([], [{ id: 'x', name: 'planilha.xlsx', mime: 'application/vnd.ms-excel', sizeBytes: 10 }])
    expect(r.files).toHaveLength(0)
    expect(r.rejected).toEqual([{ name: 'planilha.xlsx', reason: 'formato' }])
  })

  it('recusa arquivo acima do limite ÚNICO da plataforma', () => {
    const r = acceptFiles([], [pdf('gigante.pdf', MAX_ATTACHMENT_BYTES + 1)])
    expect(r.rejected).toEqual([{ name: 'gigante.pdf', reason: 'tamanho' }])
  })

  it('exatamente no limite é aceito — a fronteira não exclui', () => {
    const r = acceptFiles([], [pdf('no-limite.pdf', MAX_ATTACHMENT_BYTES)])
    expect(r.files).toHaveLength(1)
  })

  it('aceita os bons e recusa os ruins na MESMA escolha — não descarta o lote inteiro', () => {
    const r = acceptFiles([], [
      pdf('bom.pdf'),
      { id: 'x', name: 'ruim.exe', mime: 'application/x-msdownload', sizeBytes: 10 },
      jpg('bom2.jpg'),
    ])
    expect(r.files.map(f => f.name)).toEqual(['bom.pdf', 'bom2.jpg'])
    expect(r.rejected.map(x => x.name)).toEqual(['ruim.exe'])
  })
})

describe('ANEXO-001 · ciclo de vida do conjunto', () => {
  it('remove por id', () => {
    const r = acceptFiles([], [pdf('a.pdf'), jpg('b.jpg')])
    expect(removeFile(r.files, 'a.pdf').map(f => f.name)).toEqual(['b.jpg'])
  })

  it('marca o enviado e sabe o que falta', () => {
    const r = acceptFiles([], [pdf('a.pdf'), jpg('b.jpg')])
    expect(pendingUpload(r.files)).toHaveLength(2)
    const parcial = withUploadedUrl(r.files, 'a.pdf', 'https://x/a')
    expect(pendingUpload(parcial).map(f => f.name)).toEqual(['b.jpg'])
    expect(isReadyToSave(parcial)).toBe(false)
    const completo = withUploadedUrl(parcial, 'b.jpg', 'https://x/b')
    expect(isReadyToSave(completo)).toBe(true)
  })

  it('conjunto vazio NÃO está pronto para salvar', () => {
    expect(isReadyToSave([])).toBe(false)
  })
})

describe('ANEXO-001 · a recusa é dita, nunca silenciosa', () => {
  it('sem recusa, sem mensagem', () => {
    expect(rejectionMessage([])).toBeNull()
  })
  it('um arquivo de formato errado é nomeado', () => {
    expect(rejectionMessage([{ name: 'planilha.xlsx', reason: 'formato' }]))
      .toBe('planilha.xlsx não é um formato aceito. Envie PDF ou imagem.')
  })
  it('vários viram contagem, para a mensagem não virar uma lista enorme', () => {
    const msg = rejectionMessage([
      { name: 'a.exe', reason: 'formato' }, { name: 'b.exe', reason: 'formato' },
    ])
    expect(msg).toBe('2 arquivos não são de formato aceito. Envie PDF ou imagem.')
  })
  it('formato e tamanho aparecem juntos quando os dois ocorrem', () => {
    const msg = rejectionMessage([
      { name: 'a.exe', reason: 'formato' }, { name: 'b.pdf', reason: 'tamanho' },
    ])
    expect(msg).toContain('não é um formato aceito')
    expect(msg).toContain('passa de')
  })
})

describe('ANEXO-001 · contador', () => {
  it('singular e plural com uma redação só', () => {
    expect(attachmentCountLabel(1)).toBe('1 documento')
    expect(attachmentCountLabel(3)).toBe('3 documentos')
    expect(attachmentCountLabel(0)).toBe('0 documentos')
  })
})
