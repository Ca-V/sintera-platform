// Exclusão de exame (P2). O núcleo testável é `storagePathFromUrl` (puro). A exclusão real depende da RLS de
// DELETE (isolada — MOBILE-030) e é verificada na homologação; aqui cobrimos o parser e a guarda de sessão.
import { describe, it, expect } from 'vitest'
import { deleteExam, storagePathFromUrl } from '../../packages/api-client/src/exams/delete'

describe('storagePathFromUrl (caminho do bucket a partir da URL assinada)', () => {
  it('extrai o caminho user-scoped', () => {
    expect(storagePathFromUrl('https://x.supabase.co/storage/v1/object/sign/exams/user-1/abc.pdf?token=t'))
      .toBe('user-1/abc.pdf')
  })
  it('decodifica caracteres escapados', () => {
    expect(storagePathFromUrl('https://x/exams/u/a%20b.pdf?token=t')).toBe('u/a b.pdf')
  })
  it('null / formato desconhecido → null', () => {
    expect(storagePathFromUrl(null)).toBeNull()
    expect(storagePathFromUrl(undefined)).toBeNull()
    expect(storagePathFromUrl('https://x/outro/caminho')).toBeNull()
  })
})

describe('deleteExam (guarda)', () => {
  it('sem sessão → não autenticado (não toca o banco)', async () => {
    const noSession = { auth: { getSession: async () => ({ data: { session: null } }) } } as never
    const r = await deleteExam(noSession, 'e1')
    expect(r.error?.message).toMatch(/autenticado/i)
  })
})
