// CATRACA — A PLATAFORMA DIZIA TER LIDO O QUE NÃO LEU.
//
// O DEFEITO (homologação de 01/09/2026). Dez dos dezenove exames da fundadora estavam com
// `status = 'processed'` e `exam_text` VAZIO. A tela dizia "processado", a busca não achava uma palavra
// dentro deles, e nada distinguia um exame lido de um exame apenas guardado.
//
// A causa: em `analyze/route.ts` o caminho de PDF grava `exam_text` e o caminho de IMAGEM não grava nada.
// O modelo LÊ a foto — preencheu título, emissor e data — e o que ele leu nunca virou texto.
//
// Bate direto na regra permanente dela: a busca tem de encontrar qualquer palavra que esteja em qualquer
// documento adicionado. Ela buscou, não achou, e concluiu que a palavra não estava lá. Estava.
import { describe, it, expect } from 'vitest'
import { textoRecuperado, estadoDaLeitura, selo, type FragmentoDoLaudo } from '@sintera/core'

// Linhas REAIS do hemograma dela (exame 23c0123b, 63 marcadores, nenhum deles pesquisável até agora).
const hemograma: FragmentoDoLaudo[] = [
  { rawText: 'Linfocitos             :38,5%     1.170Nmm3  1.000 A 3.500Nmm3', sourceMaterial: 'Sangue', sourceExamName: 'Hemograma' },
  { rawText: 'Monocitos              :14,1%       430Nmm3  200 A 1.000Nmm3', sourceMaterial: 'Sangue', sourceExamName: 'Hemograma' },
  { rawText: 'Plaquetas:   187.000Nmm3  150.000 A 450.000Nmm3', sourceMaterial: 'Sangue', sourceExamName: 'Hemograma' },
  { rawText: 'HEMOGLOBINA GLICADA (A1C):    5,3 %', sourceMaterial: 'Sangue', sourceExamName: 'Hemoglobina Glicada (A1C)' },
]

describe('o texto recuperado do laudo', () => {
  it('O CASO DELA: buscar "hemograma" passa a encontrar o exame', () => {
    const t = textoRecuperado(hemograma) ?? ''
    expect(t.toLowerCase()).toContain('hemograma')
    expect(t.toLowerCase()).toContain('sangue')
    expect(t).toContain('187.000Nmm3')
  })

  it('agrupa por exame e material, que é como o laudo se organiza', () => {
    const t = textoRecuperado(hemograma) ?? ''
    expect(t).toContain('Hemograma — Sangue')
    expect(t).toContain('Hemoglobina Glicada (A1C) — Sangue')
  })

  it('A MESMA LINHA NÃO ENTRA DUAS VEZES — laudo repete cabeçalho por página', () => {
    const repetido = [...hemograma, hemograma[0], hemograma[0]]
    const t = textoRecuperado(repetido) ?? ''
    expect(t.split('Linfocitos').length - 1).toBe(1)
  })

  it('espaço em excesso não muda o que é a mesma linha', () => {
    const t = textoRecuperado([
      { rawText: 'Plaquetas:   187.000Nmm3' },
      { rawText: 'Plaquetas: 187.000Nmm3' },
    ]) ?? ''
    expect(t.split('Plaquetas').length - 1).toBe(1)
  })

  it('sem cabeçalho, as linhas valem sozinhas', () => {
    expect(textoRecuperado([{ rawText: 'Colesterol total: 180 mg/dL' }])).toBe('Colesterol total: 180 mg/dL')
  })

  it('NADA LIDO CONTINUA NADA — nunca devolve texto vazio para parecer lido', () => {
    // Gravar '' faria o registro passar por lido, que é exatamente o defeito que este módulo existe para matar.
    expect(textoRecuperado([])).toBeNull()
    expect(textoRecuperado([{ rawText: '   ' }, { rawText: null }, {}])).toBeNull()
  })

  it('NÃO INVENTA: o rótulo normalizado do catálogo não entra no texto do documento', () => {
    // "Linfocitos" (sem acento) é o que o laudo escreve. "Linfócitos" é o NOSSO nome, e tem busca própria.
    // Misturá-lo aqui faria a busca apontar um laudo por uma palavra que ele não contém.
    const t = textoRecuperado(hemograma) ?? ''
    expect(t).toContain('Linfocitos')
    expect(t).not.toContain('Linfócitos')
  })
})

describe('o estado da leitura — o fim do "processado" que não quer dizer nada', () => {
  it('PDF com texto: a busca alcança o conteúdo', () => {
    const e = estadoDaLeitura({ temTexto: true, pdfQuality: 'good_text' })
    expect(e.nivel).toBe('completo')
    expect(e.buscavel).toBe(true)
    expect(selo(e)).toBeNull()
  })

  it('FOTO com o texto recuperado: diz que é parcial, e não finge ser o laudo inteiro', () => {
    const e = estadoDaLeitura({ temTexto: true, pdfQuality: 'image' })
    expect(e.nivel).toBe('recuperado')
    expect(e.buscavel).toBe(true)
    expect(e.frase).toContain('não o texto completo')
    expect(selo(e)).toBe('Lido como imagem')
  })

  it('O CASO GRAVE: foto sem nada extraído — a plataforma DIZ que não alcança', () => {
    const e = estadoDaLeitura({ temTexto: false, pdfQuality: 'image', fragmentos: 0 })
    expect(e.nivel).toBe('nao_transcrito')
    expect(e.buscavel).toBe(false)
    expect(e.frase).toContain('não alcança')
    expect(selo(e)).toBe('Conteúdo não transcrito')
  })

  it('"insufficient_text" é o mesmo caso: PDF sem camada de texto', () => {
    expect(estadoDaLeitura({ temTexto: false, pdfQuality: 'insufficient_text' }).nivel).toBe('nao_transcrito')
  })

  it('sem texto e sem qualidade conhecida, também NÃO se afirma que foi lido', () => {
    const e = estadoDaLeitura({ temTexto: false, pdfQuality: null, fragmentos: 0 })
    expect(e.buscavel).toBe(false)
    expect(e.frase).toContain('não foi transcrito')
  })

  it('há fragmentos extraídos mesmo sem texto gravado: é recuperável, e se diz isso', () => {
    // Os 63 marcadores do hemograma dela existiam enquanto `exam_text` estava vazio.
    const e = estadoDaLeitura({ temTexto: false, pdfQuality: null, fragmentos: 63 })
    expect(e.nivel).toBe('recuperado')
    expect(e.buscavel).toBe(true)
  })

  it('NENHUMA FRASE AFIRMA LEITURA COMPLETA quando ela não houve', () => {
    for (const q of ['image', 'insufficient_text']) {
      for (const temTexto of [true, false]) {
        const e = estadoDaLeitura({ temTexto, pdfQuality: q })
        expect(e.nivel, `${q}/${temTexto}`).not.toBe('completo')
      }
    }
  })
})
