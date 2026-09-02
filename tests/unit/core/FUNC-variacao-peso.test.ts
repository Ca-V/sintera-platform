// CATRACA — GANHO E PERDA NÃO PODEM FICAR IGUAIS NA TELA.
//
// O DEFEITO (homologação de 31/08, e é do pior tipo pelo critério da própria fundadora: dado errado com
// aparência de certo).
//
// Ela foi de 61,2 kg para 64 kg — GANHOU 2,8. A Jornada de peso mostrava "−2,8 kg", e logo abaixo, no mesmo
// cartão, "+2,8". O mesmo número com dois sinais opostos na mesma tela.
//
// A causa: `lostKg` é "inicial − atual", então perda é positiva e ganho é negativo. O aplicativo escrevia
// `lostKg > 0 ? \`−${lostKg}\` : \`${lostKg}\`` — e os DOIS ramos imprimem menos, porque no segundo o número
// já vem negativo. Ganho e perda ficaram indistinguíveis num registro que vai ao médico.
//
// E a Web ACERTAVA. A regra estava escrita duas vezes, uma por ponta, e divergiu — exatamente o que a base
// única existe para impedir, na forma mais cara possível: não uma tela feia, mas um número errado sobre a
// saúde de alguém.
import { describe, it, expect } from 'vitest'
import { variacaoDePeso, ritmoDePeso, pesoLabel } from '@sintera/core'

describe('a variação de peso', () => {
  it('O CASO DA HOMOLOGAÇÃO: 61,2 → 64 é GANHO, e aparece com mais', () => {
    // lostKg = 61.2 − 64 = −2.8
    const v = variacaoDePeso(-2.8)
    expect(v?.texto).toBe('+2,8 kg')
    expect(v?.ganho).toBe(true)
  })

  it('perda aparece com menos', () => {
    const v = variacaoDePeso(2.8)
    expect(v?.texto).toBe('−2,8 kg')
    expect(v?.ganho).toBe(false)
  })

  it('GANHO E PERDA NUNCA PRODUZEM O MESMO TEXTO — era esse o defeito', () => {
    expect(variacaoDePeso(2.8)?.texto).not.toBe(variacaoDePeso(-2.8)?.texto)
  })

  it('sem variação, nem mais nem menos enganam', () => {
    expect(variacaoDePeso(0)?.texto).toBe('−0 kg')
    expect(variacaoDePeso(0)?.ganho).toBe(false)
  })

  it('vírgula decimal, porque quem lê lê em português', () => {
    expect(variacaoDePeso(-1.5)?.texto).toContain(',')
    expect(variacaoDePeso(-1.5)?.texto).not.toContain('.')
  })

  it('ausência permanece ausência', () => {
    for (const v of [null, undefined, NaN, Infinity]) {
      expect(variacaoDePeso(v as number), String(v)).toBeNull()
    }
  })
})

describe('o ritmo semanal segue a MESMA regra', () => {
  it('"−0,02 kg/semana" descrevia um ganho semanal — agora diz +', () => {
    const r = ritmoDePeso(-0.02)
    expect(r?.texto).toBe('+0,02 kg/semana')
    expect(r?.ganho).toBe(true)
  })

  it('perda semanal continua com menos', () => {
    expect(ritmoDePeso(0.35)?.texto).toBe('−0,35 kg/semana')
  })

  it('duas casas: o ritmo é lento e arredondar para uma o zeraria', () => {
    expect(ritmoDePeso(-0.02)?.texto).toContain('0,02')
  })
})

describe('o peso escrito', () => {
  it('vírgula decimal — a tela misturava "61.2 kg" com "64 kg" na mesma frase', () => {
    expect(pesoLabel(61.2)).toBe('61,2 kg')
    expect(pesoLabel(64)).toBe('64 kg')
  })

  it('ausência permanece ausência', () => {
    expect(pesoLabel(null)).toBeNull()
    expect(pesoLabel(undefined)).toBeNull()
  })
})
