// FUNC — fundação de API: mapa de erro → resposta HTTP (padrão da plataforma).
import { describe, it, expect } from 'vitest'
import { errorToResponse, ValidationError, BadRequestError } from '@/lib/api/http'

describe('errorToResponse', () => {
  it('ValidationError → 422 com a mensagem', async () => {
    const r = errorToResponse(new ValidationError('Informe o nome.'))
    expect(r.status).toBe(422)
    expect(await r.json()).toEqual({ error: 'Informe o nome.' })
  })

  it('BadRequestError → 400', async () => {
    const r = errorToResponse(new BadRequestError('id é obrigatório.'))
    expect(r.status).toBe(400)
    expect(await r.json()).toEqual({ error: 'id é obrigatório.' })
  })

  it('erro genérico → 500 com detail truncado', async () => {
    const r = errorToResponse(new Error('boom'))
    expect(r.status).toBe(500)
    const body = await r.json()
    expect(body.error).toBe('Falha ao processar a requisição.')
    expect(body.detail).toContain('boom')
  })
})
