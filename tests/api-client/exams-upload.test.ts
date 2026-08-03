// uploadExam (Inc.6) — único caminho de escrita de exame ainda sem teste. Cobre a construção do path user-scoped
// (nome do arquivo NUNCA é id), o upload ao Storage + signed URL, e as guardas (sem sessão / erros). Mocks de
// fetch/Storage — sem rede real. Complementa a homologação (runtime nativo).
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { uploadExam } from '../../packages/api-client/src/exams/upload'

function makeClient(
  session: unknown,
  storageApi: { upload: ReturnType<typeof vi.fn>; createSignedUrl: ReturnType<typeof vi.fn> },
) {
  return {
    auth: { getSession: async () => ({ data: { session } }) },
    storage: { from: () => storageApi },
  } as never
}

const okStorage = () => ({
  upload: vi.fn(async () => ({ error: null })),
  createSignedUrl: vi.fn(async () => ({ data: { signedUrl: 'https://x/signed?token=t' }, error: null })),
})

describe('exams.uploadExam', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    vi.stubGlobal('fetch', vi.fn(async () => ({ arrayBuffer: async () => new ArrayBuffer(1024) })))
  })

  it('sobe ao bucket em path user-scoped (userId/…ext), com contentType, e devolve UploadResult', async () => {
    const storage = okStorage()
    const client = makeClient({ user: { id: 'u1' } }, storage)
    const r = await uploadExam(client, { uri: 'file://x.pdf', mimeType: 'application/pdf', sizeBytes: 1024 })

    expect(r.error).toBeNull()
    expect(r.data).toMatchObject({ url: 'https://x/signed?token=t', mimeType: 'application/pdf', sizeBytes: 1024 })
    // path começa com o userId e termina com a extensão do MIME (nome do arquivo original NÃO é usado como id)
    const path = storage.upload.mock.calls[0][0] as string
    expect(path.startsWith('u1/')).toBe(true)
    expect(path.endsWith('.pdf')).toBe(true)
    expect(r.data?.storagePath).toBe(path)
    expect(storage.upload.mock.calls[0][2]).toMatchObject({ contentType: 'application/pdf', upsert: false })
  })

  it('sem sessão → { data: null, error } (não sobe nada)', async () => {
    const storage = okStorage()
    const r = await uploadExam(makeClient(null, storage), { uri: 'file://x', mimeType: 'image/jpeg', sizeBytes: 1 })
    expect(r.data).toBeNull()
    expect(r.error?.message).toMatch(/autenticado/i)
    expect(storage.upload).not.toHaveBeenCalled()
  })

  it('erro no upload → { data: null, error } (não gera signed URL)', async () => {
    const storage = okStorage()
    storage.upload = vi.fn(async () => ({ error: new Error('storage cheio') }))
    const client = makeClient({ user: { id: 'u1' } }, storage)
    const r = await uploadExam(client, { uri: 'file://x.png', mimeType: 'image/png', sizeBytes: 1 })
    expect(r.data).toBeNull()
    expect(r.error).toBeTruthy()
    expect(storage.createSignedUrl).not.toHaveBeenCalled()
  })

  it('erro ao gerar signed URL → { data: null, error }', async () => {
    const storage = okStorage()
    storage.createSignedUrl = vi.fn(async () => ({ data: null, error: new Error('sign falhou') }))
    const client = makeClient({ user: { id: 'u1' } }, storage)
    const r = await uploadExam(client, { uri: 'file://x.jpg', mimeType: 'image/jpeg', sizeBytes: 1 })
    expect(r.data).toBeNull()
    expect(r.error).toBeTruthy()
  })
})
