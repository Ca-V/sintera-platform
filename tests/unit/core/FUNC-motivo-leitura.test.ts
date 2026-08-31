// CATRACA — a leitura que não roda tem de dizer por quê.
//
// `classifyDocument` devolvia `null` em CINCO situações completamente diferentes, todas caladas: ponte com a
// Web não configurada, arquivo ausente, sessão ausente, servidor recusando, e exceção de rede. Do lado de fora
// era sempre a mesma coisa — a pessoa fotografa a receita, os campos não se preenchem, e nada explica.
//
// A primeira dessas cinco é a que custou DOIS CICLOS de homologação: `EXPO_PUBLIC_WEB_URL` nunca esteve
// definida em nenhum build. Corrigi a variável e não corrigi o silêncio — o mesmo defeito voltaria na próxima
// configuração ausente, e voltaria igualmente invisível.
import { describe, it, expect } from 'vitest'
import { motivoLeituraLabel, type MotivoLeituraFalha } from '@sintera/core'

const TODOS: MotivoLeituraFalha[] = ['sem-ponte', 'sem-arquivo', 'sem-sessao', 'servidor', 'rede']

describe('o que a pessoa lê quando a leitura não rodou', () => {
  it('todo motivo tem frase — nenhum caminho volta a ser mudo', () => {
    for (const m of TODOS) {
      expect(motivoLeituraLabel(m).length, m).toBeGreaterThan(30)
    }
  })

  it('toda frase diz O QUE FAZER — aviso sem saída é só uma preocupação a mais', () => {
    for (const m of TODOS) {
      const t = motivoLeituraLabel(m).toLowerCase()
      expect(t.includes('à mão') || t.includes('entre de novo'), m).toBe(true)
    }
  })

  it('NENHUMA culpa a pessoa nem o documento — em todos os casos o problema é nosso ou do ambiente', () => {
    for (const m of TODOS) {
      const t = motivoLeituraLabel(m).toLowerCase()
      // "ilegível", "ruim", "tente outra foto" mandariam fotografar de novo à toa.
      for (const acusacao of ['ilegív', 'ruim', 'de novo a foto', 'refaça']) {
        expect(t.includes(acusacao), `${m} não pode dizer "${acusacao}"`).toBe(false)
      }
    }
  })

  it('TRANQUILIZA sobre o documento: ele foi anexado, e nada se perdeu', () => {
    // O medo imediato de quem vê um aviso ao anexar é ter perdido o anexo. Três das cinco frases dizem
    // explicitamente que não; as outras duas ('sem-ponte' e 'sem-sessao') falam de configuração e de sessão,
    // onde a promessa certa é outra.
    for (const m of ['sem-arquivo', 'servidor', 'rede'] as MotivoLeituraFalha[]) {
      const t = motivoLeituraLabel(m).toLowerCase()
      expect(t.includes('anexado') || t.includes('nada se perde'), m).toBe(true)
    }
  })

  it('a ponte ausente é dita como problema NOSSO, não da pessoa', () => {
    const t = motivoLeituraLabel('sem-ponte').toLowerCase()
    expect(t).toContain('versão do aplicativo')
    expect(t).toContain('atualização')
  })

  it('sessão expirada aponta o conserto certo, que é diferente dos demais', () => {
    expect(motivoLeituraLabel('sem-sessao').toLowerCase()).toContain('entre de novo')
  })
})
