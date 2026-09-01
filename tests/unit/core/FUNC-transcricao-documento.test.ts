// CATRACA — TODO DOCUMENTO PRECISA SER LIDO, E O QUE NÃO SE LEU PRECISA SER DITO.
//
// DECISÃO DA FUNDADORA (01/09/2026): "todos os documentos que são adicionados precisam ser lidos e
// transcritos. [...] de dezenove precisa ler dezenove. [...] de forma segura, auditável, rastreável."
//
// Este arquivo trava a fronteira mais perigosa do recurso: a plataforma NUNCA pode gravar como lido o que não
// leu. Errar para "não li" é recuperável — tenta-se de novo. Errar para "li" grava um vazio com aparência de
// leitura completa, e ninguém descobre depois.
import { describe, it, expect } from 'vitest'
import {
  avaliarTranscricao, buscavel, combinarTranscricoes, origemLabel, statusFrase, MARCADOR_ILEGIVEL,
  type StatusDaTranscricao,
} from '@sintera/core'

describe('a transcrição só é aceita quando há o que aceitar', () => {
  it('texto limpo e sem marcador é leitura COMPLETA', () => {
    const t = avaliarTranscricao({ texto: 'HEMOGRAMA COMPLETO\nHemoglobina: 13,4 g/dL', status: 'ok' })
    expect(t.status).toBe('ok')
    expect(t.trechosIlegiveis).toBe(0)
    expect(t.texto).toContain('Hemoglobina')
  })

  it('trecho ilegível torna a leitura PARCIAL — mesmo que o modelo diga "ok"', () => {
    // A EVIDÊNCIA VENCE A DECLARAÇÃO. O modelo pode afirmar que leu tudo e ter escrito marcadores.
    const t = avaliarTranscricao({
      texto: `Paciente: ${MARCADOR_ILEGIVEL}\nData: 12/07/2023`,
      status: 'ok',
      trechos_ilegiveis: 0,
    })
    expect(t.status).toBe('parcial')
    expect(t.trechosIlegiveis).toBe(1)
  })

  it('conta os marcadores NO TEXTO, não o número que o modelo declarou', () => {
    const t = avaliarTranscricao({
      texto: `a ${MARCADOR_ILEGIVEL} b [ILEGIVEL] c [ilegivel]`,
      status: 'ok',
      trechos_ilegiveis: 99,
    })
    expect(t.trechosIlegiveis).toBe(3)
  })

  it('só marcadores, sem conteúdo, é ILEGÍVEL — não é leitura', () => {
    const t = avaliarTranscricao({ texto: `${MARCADOR_ILEGIVEL} ${MARCADOR_ILEGIVEL}`, status: 'ok' })
    expect(t.status).toBe('ilegivel')
  })
})

describe('A REGRA MAIS IMPORTANTE: na dúvida, NÃO é lido', () => {
  it('resposta ausente, nula ou de outro tipo vira FALHOU — nunca "ok"', () => {
    for (const bruta of [null, undefined, {} as never, 'texto solto' as never, 42 as never]) {
      expect(avaliarTranscricao(bruta as never).status, String(bruta)).toBe('falhou')
    }
  })

  it('texto vazio ou só espaço NÃO é leitura', () => {
    for (const texto of ['', '   ', '\n\n', null, undefined, 123]) {
      const t = avaliarTranscricao({ texto, status: 'ok' })
      expect(t.texto, String(texto)).toBeNull()
      expect(t.status, String(texto)).toBe('falhou')
    }
  })

  it('SEM TEXTO, "ilegivel" e "falhou" continuam distintos', () => {
    // Um é fato sobre o documento (foto escura); o outro é problema nosso (rede, cota). Só o segundo se
    // resolve tentando de novo — e confundir os dois foi o que fez "nada novo" responder por cinco situações.
    expect(avaliarTranscricao({ texto: null, status: 'ilegivel' }).status).toBe('ilegivel')
    expect(avaliarTranscricao({ texto: null, status: 'ok' }).status).toBe('falhou')
    expect(avaliarTranscricao({ texto: null }).status).toBe('falhou')
  })

  it('NENHUMA entrada malformada consegue produzir "ok"', () => {
    const lixo = [null, undefined, {}, { status: 'ok' }, { texto: '' }, { texto: '   ', status: 'ok' }]
    for (const b of lixo) expect(avaliarTranscricao(b as never).status, JSON.stringify(b)).not.toBe('ok')
  })
})

describe('o que a busca alcança', () => {
  it('lido e parcialmente lido são pesquisáveis; ilegível e falhou não', () => {
    expect(buscavel('ok')).toBe(true)
    expect(buscavel('parcial')).toBe(true)
    expect(buscavel('ilegivel')).toBe(false)
    expect(buscavel('falhou')).toBe(false)
  })
})

describe('o que a pessoa lê', () => {
  const TODOS: StatusDaTranscricao[] = ['ok', 'parcial', 'ilegivel', 'falhou']

  it('"falhou" DIZ que a falha é nossa, e convida a tentar de novo', () => {
    const f = statusFrase('falhou')
    expect(f).toContain('não porque o documento esteja vazio')
    expect(f).toContain('tentar novamente')
  })

  it('"ilegível" fala do DOCUMENTO, e diz o que costuma resolver', () => {
    const f = statusFrase('ilegivel')
    expect(f).toContain('nada nele estava legível')
    expect(f).toContain('foto mais nítida')
    // E deixa claro que nada se perdeu.
    expect(f).toContain('continua guardado')
  })

  it('parcial diz QUANTOS trechos, e concorda em número', () => {
    expect(statusFrase('parcial', 1)).toContain('1 trecho ilegível')
    expect(statusFrase('parcial', 3)).toContain('3 trechos ilegíveis')
  })

  it('as quatro frases são DIFERENTES entre si — era essa distinção que faltava', () => {
    const frases = TODOS.map(s => statusFrase(s))
    expect(new Set(frases).size).toBe(4)
  })

  it('nenhuma frase avalia o documento nem dá orientação clínica (ADR-000 / RDC 657)', () => {
    for (const s of TODOS) {
      expect(statusFrase(s), s).not.toMatch(/normal|alterado|preocupante|grave|procure um médico|diagnóstic/i)
    }
  })
})

describe('o documento de várias páginas', () => {
  const ok = (t: string) => avaliarTranscricao({ texto: t, status: 'ok' })
  const falha = avaliarTranscricao(null)
  const ilegivel = avaliarTranscricao({ texto: '', status: 'ilegivel' })

  it('junta na ORDEM recebida — é a ordem em que ela fotografou', () => {
    const c = combinarTranscricoes([ok('Página um'), ok('Página dois')])
    expect(c.status).toBe('ok')
    expect(c.texto!.indexOf('Página um')).toBeLessThan(c.texto!.indexOf('Página dois'))
    expect(c.texto).toContain('página 1 de 2')
  })

  it('UMA PÁGINA NÃO LIDA IMPEDE O DOCUMENTO DE SER "ok"', () => {
    // Chamar de completo um documento de três páginas em que a segunda falhou é a mesma mentira que
    // "processado" contava — dividida em pedaços.
    const c = combinarTranscricoes([ok('a'), falha, ok('c')])
    expect(c.status).toBe('parcial')
  })

  it('a página que faltou é DECLARADA no corpo do texto, no lugar dela', () => {
    const c = combinarTranscricoes([ok('a'), falha])
    expect(c.texto).toContain('não foi possível ler esta página')
  })

  it('nenhuma página lida: "falhou" vence "ilegível" — só ele se resolve tentando de novo', () => {
    expect(combinarTranscricoes([falha, ilegivel]).status).toBe('falhou')
    expect(combinarTranscricoes([ilegivel, ilegivel]).status).toBe('ilegivel')
  })

  it('trechos ilegíveis somam entre as páginas', () => {
    const c = combinarTranscricoes([ok(`a ${MARCADOR_ILEGIVEL}`), ok(`b ${MARCADOR_ILEGIVEL}`)])
    expect(c.trechosIlegiveis).toBe(2)
    expect(c.status).toBe('parcial')
  })

  it('uma página só não ganha cabeçalho de página — seria ruído', () => {
    const c = combinarTranscricoes([ok('Documento inteiro')])
    expect(c.texto).toBe('Documento inteiro')
  })

  it('sem páginas, não há transcrição', () => {
    expect(combinarTranscricoes([]).status).toBe('falhou')
  })
})

describe('a origem do texto é dita, porque as origens não são equivalentes', () => {
  it('cópia do arquivo e leitura de pixels têm rótulos DIFERENTES', () => {
    // Guardar as duas como se fossem a mesma coisa faria a plataforma tratar interpretação de imagem como
    // fato literal — e depois ninguém saberia qual era qual.
    expect(origemLabel('pdf_nativo')).not.toBe(origemLabel('transcricao_visao'))
    expect(origemLabel('transcricao_visao')).toContain('imagem')
    expect(origemLabel('recuperado_de_marcadores')).toContain('extraído')
  })

  it('origem desconhecida não inventa rótulo', () => {
    expect(origemLabel(null)).toBeNull()
    expect(origemLabel('qualquer_coisa')).toBeNull()
  })
})
