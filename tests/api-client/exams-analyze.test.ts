// PONTE TRANSITÓRIA (ADR-020) — analyzeExam reusa a rota /analyze da Web por Bearer. Testa a integração de rede
// (URL, método, header) e os caminhos de erro, com fetch/sessão mockados. Regra de negócio (extração) vive na Web.
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { analyzeExam } from '../../packages/api-client/src/exams/analyze'

// Cliente Supabase mínimo (só a parte usada: auth.getSession).
function clientWithSession(token: string | null) {
  return { auth: { getSession: async () => ({ data: { session: token ? { access_token: token } : null } }) } } as never
}

describe('analyzeExam (ponte Mobile → /analyze da Web)', () => {
  beforeEach(() => vi.restoreAllMocks())

  it('faz POST em {webBaseUrl}/api/exams/{id}/analyze com Bearer (normaliza a barra final)', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true })
    vi.stubGlobal('fetch', fetchMock)
    const r = await analyzeExam(clientWithSession('tok123'), 'https://web.app/', 'exam-1')
    expect(r.error).toBeNull()
    expect(fetchMock).toHaveBeenCalledWith(
      'https://web.app/api/exams/exam-1/analyze',
      expect.objectContaining({ method: 'POST', headers: { Authorization: 'Bearer tok123' } }),
    )
  })

  it('sem webBaseUrl → erro e NÃO chama a rede', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    const r = await analyzeExam(clientWithSession('t'), undefined, 'e1')
    expect(r.error).toBeTruthy()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('sem sessão → não autenticado (não chama a rede)', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    const r = await analyzeExam(clientWithSession(null), 'https://web.app', 'e1')
    expect(r.error?.message).toMatch(/autenticado/i)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('resposta não-ok → erro com o status', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 401 }))
    const r = await analyzeExam(clientWithSession('t'), 'https://web.app', 'e1')
    expect(r.error?.message).toMatch(/401/)
  })
})
