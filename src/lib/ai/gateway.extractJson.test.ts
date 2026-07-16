// FUNC · extractJsonCandidate — extração de objeto JSON balanceado da resposta do modelo.
// Ponto crítico do pipeline: contagem de chaves ciente de strings/escapes (nunca corta em '}'
// dentro de string). Trava a robustez que o parse/salvamento depende.
import { describe, it, expect } from 'vitest'
import { extractJsonCandidate } from './gateway'

describe('extractJsonCandidate', () => {
  it('extrai objeto balanceado simples', () => {
    expect(extractJsonCandidate('{"a":1}')).toBe('{"a":1}')
  })
  it('ignora chaves DENTRO de strings (não corta cedo)', () => {
    expect(extractJsonCandidate('{"a":"x{y}z"}')).toBe('{"a":"x{y}z"}')
    expect(extractJsonCandidate('{"a":"}"}')).toBe('{"a":"}"}')
  })
  it('trata aspas escapadas dentro da string', () => {
    const s = '{"a":"he said \\"hi\\""}'
    expect(extractJsonCandidate(s)).toBe(s)
  })
  it('descarta texto ao redor do objeto (prosa do modelo)', () => {
    expect(extractJsonCandidate('Claro! {"a":1} pronto.')).toBe('{"a":1}')
  })
  it('objeto aninhado é balanceado corretamente', () => {
    expect(extractJsonCandidate('{"a":{"b":2},"c":3}')).toBe('{"a":{"b":2},"c":3}')
  })
  it('sem chave de abertura → null; truncado (sem fechar) → null', () => {
    expect(extractJsonCandidate('sem json aqui')).toBeNull()
    expect(extractJsonCandidate('{"a":1, "b":')).toBeNull()
  })
})
