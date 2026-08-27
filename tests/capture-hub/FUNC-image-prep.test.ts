// FUNC · política de preparo de imagem antes da leitura assistida.
//
// O DEFEITO QUE ISTO CORRIGE (27/08): a Web reduzia a imagem para 1600px antes de enviar ao classificador; o
// aplicativo mandava o arquivo inteiro. O MESMO documento chegava ao leitor em resoluções diferentes conforme
// a ponta — e foto de celular em base64 passa de 4 MB, acima do limite de requisição da hospedagem. Não era só
// desperdício: era a leitura assistida NÃO FUNCIONAR no aplicativo, com uma mensagem que não explica nada.
//
// O mecanismo é diferente em cada ponta (canvas na Web, biblioteca nativa no aplicativo) — e tem que ser. A
// DECISÃO é que não pode: qual o tamanho, qual a qualidade, quando vale reduzir. Ela mora no core.
import { describe, it, expect } from 'vitest'
import { targetImageSize, shouldResize, IMAGE_MAX_SIDE, IMAGE_QUALITY } from '@sintera/core'

describe('política de preparo de imagem', () => {
  it('reduz preservando a proporção', () => {
    // Foto de celular deitada, 4000×3000 (4:3)
    const r = targetImageSize({ width: 4000, height: 3000 })
    expect(r).toEqual({ width: 1600, height: 1200 })
    expect(r.width / r.height).toBeCloseTo(4 / 3, 5)
  })

  it('reduz pelo MAIOR lado, seja largura ou altura', () => {
    expect(targetImageSize({ width: 3000, height: 4000 })).toEqual({ width: 1200, height: 1600 })
  })

  it('O CASO QUE IMPORTA: NUNCA amplia — imagem pequena passa intacta', () => {
    // Ampliar não acrescenta informação: inventa pixels e aumenta o envio, que é o oposto do objetivo.
    const pequena = { width: 800, height: 600 }
    expect(targetImageSize(pequena)).toEqual(pequena)
    expect(shouldResize(pequena)).toBe(false)
  })

  it('imagem exatamente no limite não é tocada', () => {
    expect(shouldResize({ width: IMAGE_MAX_SIDE, height: 900 })).toBe(false)
    expect(shouldResize({ width: IMAGE_MAX_SIDE + 1, height: 900 })).toBe(true)
  })

  it('dimensão inválida devolve a entrada em vez de produzir tamanho impossível', () => {
    for (const s of [{ width: 0, height: 100 }, { width: -5, height: 10 }, { width: NaN, height: 10 }]) {
      expect(targetImageSize(s)).toEqual(s)
    }
  })

  it('nunca devolve dimensão zero, mesmo com proporção extrema', () => {
    // Imagem 10000×3 reduziria a altura para 0,48 → arredondaria para 0, e canvas de altura 0 falha.
    const r = targetImageSize({ width: 10000, height: 3 })
    expect(r.height).toBeGreaterThanOrEqual(1)
    expect(r.width).toBe(IMAGE_MAX_SIDE)
  })

  it('a qualidade é a mesma para as duas pontas', () => {
    expect(IMAGE_QUALITY).toBeGreaterThan(0)
    expect(IMAGE_QUALITY).toBeLessThanOrEqual(1)
  })
})
