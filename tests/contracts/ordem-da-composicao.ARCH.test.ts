// ARCH · a ORDEM das seções de Composição Corporal é a mesma nas duas pontas.
//
// ============================================================================================
// A LIÇÃO QUE EU SÓ APRENDI NA SEGUNDA VOLTA
// ============================================================================================
// Em 28/09/2026 eu trouxe o TEXTO desta tela para o core, criei a catraca que impede redigitá-lo, e declarei
// a paridade resolvida. A fundadora comparou de novo, seção por seção, e mostrou que não estava:
//
//   Web:  Última medição → Progresso → Evolução (marcos dentro) → Comparação → Registros
//   App:  Progresso → Última medição → Evolução → Comparação → Marcos (bloco solto) → Registros
//
// As palavras passaram a bater e a ORDEM continuou divergindo. Eu tinha corrigido metade da decisão e
// chamado de inteira — o mesmo erro de método que já tinha cometido com o Compartilhamentos e com a etapa 9
// do convite: declarar pronto o que eu tinha olhado, e não o que a pessoa vai usar.
//
// Duas telas com as mesmas seções em sequências diferentes não são o mesmo produto: quem usa as duas
// reaprende a tela cada vez que troca de aparelho.
//
// ============================================================================================
// O QUE ESTA CATRACA FAZ
// ============================================================================================
// Lê a ordem em que cada tela renderiza os títulos das seções e compara com `SECOES_COMPOSICAO`, no core.
// É estática — casa a posição de cada texto no arquivo, o que só funciona porque o texto agora vem do core
// e tem um identificador único (`SCREEN_COPY.composicao.<chave>`).
//
// LIMITE DECLARADO: ela mede a ordem no CÓDIGO, não na tela renderizada. Um bloco condicional que nunca
// aparece continua contando. Não há substituto para abrir as duas lado a lado — foi assim que o defeito
// apareceu, e é assim que ele será confirmado como resolvido.

import { describe, it, expect } from 'vitest'
import { readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { SECOES_COMPOSICAO, FORMAS_DE_ADICIONAR, ROTULO_ADICIONAR, posicaoDaSecao } from '@sintera/core'

const ROOT = process.cwd()
const WEB = 'src/app/dashboard/medidas/page.tsx'
const APP = 'apps/mobile/src/presentation/screens/composicao/ComposicaoScreen.tsx'

/**
 * O que marca cada seção no código.
 *
 * "Última medição" NÃO é uma chave de copy fixa: o título vem de `atualidadeDoResumo`, que muda conforme a
 * idade do dado — foi o acerto de 31/08/2026, quando a tela chamava de "atual" um número de 2023. Por isso
 * o marcador dela é a variável, e não um texto.
 */
const MARCADOR_DA_SECAO: Readonly<Record<string, string>> = {
  'ultima-medicao': 'atualidade.titulo',
  'progresso': 'SCREEN_COPY.composicao.journeyTitle',
  'evolucao': 'SCREEN_COPY.composicao.evoTitle',
  'comparacao': 'SCREEN_COPY.composicao.compareTitle',
  'registros': 'SCREEN_COPY.composicao.historyTitle',
}

function ordemNoArquivo(caminho: string): string[] {
  const src = readFileSync(join(ROOT, caminho), 'utf8')
  return SECOES_COMPOSICAO
    .map(s => ({ secao: s, pos: src.indexOf(MARCADOR_DA_SECAO[s]) }))
    .filter(x => x.pos >= 0)
    .sort((a, b) => a.pos - b.pos)
    .map(x => x.secao)
}

describe('ARCH · CATRACA — a ordem das seções não diverge entre as pontas', () => {
  it('as duas telas existem', () => {
    expect(existsSync(join(ROOT, WEB)), `${WEB} não existe`).toBe(true)
    expect(existsSync(join(ROOT, APP)), `${APP} não existe`).toBe(true)
  })

  it('o catálogo de seções e os títulos estão completos', () => {
    // Uma seção sem título mapeado sairia do cálculo em silêncio, e a catraca passaria sem medir nada.
    for (const s of SECOES_COMPOSICAO) {
      expect(MARCADOR_DA_SECAO[s], `seção "${s}" sem marcador mapeado`).toBeTruthy()
    }
    expect(SECOES_COMPOSICAO.length).toBeGreaterThan(3)
  })

  it.each([['Web', WEB], ['aplicativo', APP]])('a %s renderiza as seções na ordem do core', (_nome, arquivo) => {
    const ordem = ordemNoArquivo(arquivo)
    expect(ordem.length, `${arquivo}: nenhum título de seção encontrado — a tela deixou de ler do core?`)
      .toBeGreaterThan(3)

    // Cada seção encontrada tem de aparecer depois da anterior, segundo o catálogo.
    const posicoes = ordem.map(posicaoDaSecao)
    const crescente = posicoes.every((p, i) => i === 0 || p > posicoes[i - 1])
    expect(
      crescente,
      `${arquivo} renderiza [${ordem.join(' → ')}]\n` +
        `o core define    [${SECOES_COMPOSICAO.join(' → ')}]\n\n` +
        'Seções iguais em sequências diferentes não são o mesmo produto: quem usa as duas pontas reaprende\n' +
        'a tela cada vez que troca de aparelho.',
    ).toBe(true)
  })

  it('as duas pontas rendem exatamente a MESMA sequência', () => {
    expect(ordemNoArquivo(APP)).toEqual(ordemNoArquivo(WEB))
  })

  it('os marcos NÃO são seção — eles vivem dentro da evolução', () => {
    // Num card próprio viram lista de datas sem pergunta. É o que estava errado no aplicativo.
    expect(posicaoDaSecao('marcos')).toBe(-1)
    for (const arquivo of [WEB, APP]) {
      const src = readFileSync(join(ROOT, arquivo), 'utf8')
      const evo = src.indexOf('SCREEN_COPY.composicao.evoTitle')
      const marcos = src.indexOf('SCREEN_COPY.composicao.evoMilestones')
      const comparacao = src.indexOf('SCREEN_COPY.composicao.compareTitle')
      if (marcos < 0) continue
      expect(marcos, `${arquivo}: marcos antes da evolução`).toBeGreaterThan(evo)
      expect(marcos, `${arquivo}: marcos fora do bloco da evolução`).toBeLessThan(comparacao)
    }
  })
})

describe('ARCH · CATRACA — uma porta só para adicionar dados', () => {
  // Princípio permanente de ENTRADA DOCUMENTAL ÚNICA, aplicado aqui. O aplicativo tinha "Escanear laudo de
  // bioimpedância" como botão separado — uma forma privilegiada, ao lado de outra que não a mencionava, e que
  // a Web nem tinha. Quem não reconhecesse a palavra "bioimpedância" não descobriria que dava para fotografar.
  it('as três formas existem e cada uma explica o que faz', () => {
    expect(FORMAS_DE_ADICIONAR.map(f => f.forma)).toEqual(['documento', 'manual', 'dispositivo'])
    for (const f of FORMAS_DE_ADICIONAR) {
      expect(f.label.length, `"${f.forma}" sem rótulo`).toBeGreaterThan(5)
      expect(f.descricao.length, `"${f.forma}" sem descrição — escolher às cegas faz desistir`).toBeGreaterThan(30)
    }
  })

  it('o rótulo do botão é genérico — não pode nomear só uma das formas', () => {
    expect(ROTULO_ADICIONAR).not.toMatch(/bioimped|laudo|balan|digit|medida/i)
  })

  it('nenhuma tela oferece um botão separado de escanear laudo', () => {
    for (const arquivo of [WEB, APP]) {
      const src = readFileSync(join(ROOT, arquivo), 'utf8')
        .replace(/\/\*[\s\S]*?\*\//g, '').replace(/\{\/\*[\s\S]*?\*\/\}/g, '')
      expect(
        /label=["'{][^}\n]*[Ee]scanear/.test(src),
        `${arquivo}: botão separado de escanear voltou — ele pertence ao botão único`,
      ).toBe(false)
    }
  })
})
