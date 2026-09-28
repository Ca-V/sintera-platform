// ARCH · texto que o core possui não pode ser digitado de novo numa tela.
//
// ============================================================================================
// O DEFEITO QUE ISTO IMPEDE (homologação da fundadora, 28/09/2026)
// ============================================================================================
// Ela abriu Composição Corporal na Web e no Android lado a lado e mandou os prints. Dez divergências, todas
// de PALAVRA, nenhuma de lógica:
//
//   "Como cada indicador evoluiu ao longo do tempo?"  ×  "Evolução"
//   "Como está o seu progresso?"                      ×  "Jornada de peso"
//   "O que mudou entre duas avaliações?"              ×  "Comparar avaliações"
//   "Adicionar medida"                                ×  "Nova medida"
//   "Média" / "Informado"                             ×  "Confiabilidade média" / "Informado pela usuária"
//   "Gordura · Massa Muscular · Água · Visceral · TMB" × nomes completos
//   "25 de set. de 2026"                              ×  "25/09/2026"
//   marcos do mais recente ao mais antigo             ×  do mais antigo ao mais recente
//
// Cada tela era coerente CONSIGO MESMA. Ninguém decidiu divergir — a segunda implementação simplesmente não
// soube da primeira. É o modo de falha que a BASE ÚNICA nomeia: a decisão digitada duas vezes.
//
// ============================================================================================
// A REGRA
// ============================================================================================
// Se `SCREEN_COPY` possui a frase, a tela não pode conter aquela frase como literal — tem de lê-la de lá.
// A catraca não julga estilo nem exige que toda frase esteja no core; ela só impede que uma frase que JÁ está
// no core seja redigitada, que é onde a divergência nasce.

import { describe, it, expect } from 'vitest'
import { readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { SCREEN_COPY } from '@sintera/core'

const ROOT = process.cwd()

/**
 * As telas cobertas, por bloco de copy. A lista cresce à medida que cada tela é trazida para o core — e
 * crescer é o trabalho, não um débito: cobrir tudo de uma vez exigiria reescrever a plataforma inteira num
 * commit, que é justamente o que o princípio de estabilidade arquitetural proíbe.
 */
const COBERTAS: readonly { bloco: keyof typeof SCREEN_COPY; arquivos: string[] }[] = [
  {
    bloco: 'composicao',
    arquivos: [
      'src/app/dashboard/medidas/page.tsx',
      'apps/mobile/src/presentation/screens/composicao/ComposicaoScreen.tsx',
    ],
  },
  {
    bloco: 'profissionais',
    arquivos: [
      'src/app/dashboard/rede-de-cuidado/profissionais/page.tsx',
      'apps/mobile/src/presentation/screens/rede/ProfissionaisScreen.tsx',
    ],
  },
  {
    bloco: 'compartilhamentos',
    arquivos: [
      'src/app/dashboard/rede-de-cuidado/compartilhamentos/page.tsx',
      'apps/mobile/src/presentation/screens/rede/CompartilhamentosScreen.tsx',
    ],
  },
]

const semComentarios = (s: string) =>
  s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1').replace(/\{\/\*[\s\S]*?\*\/\}/g, '')

/** Frases curtas demais casam por acaso ("Peso", "Marcos:"). Só as que identificam uma decisão entram. */
const LONGA = 12

/** Escapa a frase para uso em expressão regular. */
const escapar = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/**
 * A frase aparece como TEXTO, e não como identificador?
 *
 * Sem esta distinção a catraca acusava `function ProfissionaisPage()` e `CompartilhamentosScreen` — o nome do
 * componente contém a palavra do título, e renomear componentes para satisfazer um teste seria deixar o teste
 * mandar na arquitetura. Texto é o que está entre aspas ou entre tags.
 */
function apareceComoTexto(src: string, frase: string): boolean {
  const f = escapar(frase)
  return new RegExp(`(["'\`]\\s*${f})|(>\\s*${f})`).test(src)
}

describe('ARCH · CATRACA — a copy do core não é redigitada na tela', () => {
  it('as telas cobertas existem — senão a catraca não mede nada', () => {
    for (const c of COBERTAS) {
      for (const a of c.arquivos) {
        expect(existsSync(join(ROOT, a)), `${a} não existe: a lista está desatualizada`).toBe(true)
      }
    }
  })

  it.each(COBERTAS.map(c => [c.bloco, c] as const))('bloco "%s"', (_nome, cobertura) => {
    const bloco = SCREEN_COPY[cobertura.bloco] as Record<string, unknown>
    const frases = Object.entries(bloco)
      .filter((e): e is [string, string] => typeof e[1] === 'string' && e[1].length >= LONGA)

    expect(frases.length, 'bloco sem frases longas: a cobertura não mede nada').toBeGreaterThan(2)

    const repetidas: string[] = []
    for (const arquivo of cobertura.arquivos) {
      const src = semComentarios(readFileSync(join(ROOT, arquivo), 'utf8'))
      for (const [chave, frase] of frases) {
        if (apareceComoTexto(src, frase)) {
          repetidas.push(`${arquivo}: "${chave}" redigitada — "${frase.slice(0, 60)}…"`)
        }
      }
    }

    expect(
      repetidas,
      'A frase já mora em SCREEN_COPY. Digitá-la de novo na tela cria um segundo dono da mesma decisão,\n' +
        'e as duas pontas divergem no dia em que uma mudar — em silêncio, porque as duas "funcionam".\n' +
        'Leia de SCREEN_COPY.\n\n' + repetidas.join('\n'),
    ).toEqual([])
  })

  it('CATRACA · DATE-001 — nenhuma tela coberta formata data pelo locale do aparelho', () => {
    // `toLocaleDateString` escrevia "25 de set. de 2026" na Web e o aplicativo escrevia "25/09/2026" — a
    // mesma data com duas caras. Pior: o resultado muda com o idioma do aparelho, então nem dentro de uma
    // ponta ele é estável.
    const infratores: string[] = []
    for (const c of COBERTAS) {
      for (const arquivo of c.arquivos) {
        const src = semComentarios(readFileSync(join(ROOT, arquivo), 'utf8'))
        if (/toLocaleDateString|toLocaleString/.test(src)) infratores.push(arquivo)
      }
    }
    expect(
      infratores,
      'Use `formatDateBR` do core: determinístico, sem `Date`, e o mesmo nas duas pontas.\n\n' +
        infratores.join('\n'),
    ).toEqual([])
  })
})
