// @sintera/core — O TEXTO DO LAUDO: o que a plataforma leu, e o que ela NÃO leu.
//
// ─────────────────────────────────────────────────────────────────────────────────────────────────────────
// O DEFEITO (homologação de 01/09/2026), e é dos graves: a plataforma dizia ter lido o que não leu.
//
// Dez dos dezenove exames da fundadora estavam marcados `status = 'processed'` com `exam_text` VAZIO. A tela
// dizia "processado"; a busca não encontrava uma palavra sequer dentro deles; e nada, em lugar nenhum,
// distinguia um exame lido de um exame apenas guardado.
//
// A causa é uma linha que não existe. Em `analyze/route.ts`, o caminho de PDF grava `exam_text`; o caminho de
// IMAGEM (foto do laudo) não grava nada. O modelo LÊ a foto — tanto que preencheu título, emissor e data —
// mas o que ele leu nunca foi persistido como texto. Escrito e nunca ligado, de novo.
//
// A consequência bate direto na regra permanente dela: "É obrigatório que a opção de buscar dentro da
// plataforma busque qualquer palavra que esteja dentro da plataforma [...] ou palavra que esteja em algum
// documento adicionado." Ela buscou, não achou, e concluiu que a palavra não estava lá. Estava.
// ─────────────────────────────────────────────────────────────────────────────────────────────────────────
//
// O QUE ESTE MÓDULO FAZ, E O QUE ELE SE PROÍBE DE FAZER.
//
// Faz: recompõe o texto pesquisável A PARTIR DO QUE JÁ FOI LIDO DO DOCUMENTO. Cada marcador extraído guarda
// `raw_text` — a LINHA LITERAL do laudo ("Linfocitos :38,5% 1.170Nmm3 1.000 A 3.500Nmm3") — mais o nome do
// exame e o material, ambos transcritos. Essas palavras são do documento, não nossas.
//
// NÃO faz: não usa o nome NORMALIZADO do marcador (o nosso rótulo de catálogo, "Linfócitos" com acento). Ele
// já tem consulta própria na busca, e misturá-lo aqui faria `exam_text` conter palavras que o documento pode
// não conter. Um resultado de busca que aponta um laudo por uma palavra que não está nele é pior do que não
// achar: destrói a confiança na busca inteira.
//
// E NÃO chama de completo o que é parcial — ver `estadoDaLeitura`.

/** Um pedaço do laudo que a plataforma já leu e guardou (hoje, uma linha de `biomarkers`). */
export interface FragmentoDoLaudo {
  /** A linha LITERAL do laudo. É esta a fonte da verdade deste módulo. */
  readonly rawText?: string | null
  /** Material transcrito do laudo ("Sangue", "Urina"). */
  readonly sourceMaterial?: string | null
  /** Nome do exame como o LAUDO o escreve ("Hemograma"). */
  readonly sourceExamName?: string | null
}

const limpo = (s: string | null | undefined): string => (s ?? '').replace(/\s+/g, ' ').trim()

/**
 * Recompõe o texto pesquisável do laudo a partir dos fragmentos já lidos.
 *
 * Agrupa por exame e material — que é como o laudo se organiza — e lista as linhas literais, sem repetir.
 * Devolve `null` quando não há nada de verdade: texto vazio é ausência, e ausência não pode virar string
 * vazia gravada, que faria o registro parecer lido.
 */
export function textoRecuperado(fragmentos: readonly FragmentoDoLaudo[]): string | null {
  const grupos = new Map<string, string[]>()
  const vistas = new Set<string>()

  for (const f of fragmentos) {
    const linha = limpo(f.rawText)
    if (!linha) continue
    // A MESMA linha não entra duas vezes: laudos repetem cabeçalho por página, e um texto inflado por
    // repetição atrapalha quem for ler e não ajuda quem busca.
    if (vistas.has(linha)) continue
    vistas.add(linha)

    const exame = limpo(f.sourceExamName)
    const material = limpo(f.sourceMaterial)
    const cabecalho = [exame, material].filter(Boolean).join(' — ')
    const chave = cabecalho || ''
    const atual = grupos.get(chave)
    if (atual) atual.push(linha)
    else grupos.set(chave, [linha])
  }

  if (grupos.size === 0) return null

  const blocos: string[] = []
  for (const [cabecalho, linhas] of grupos) {
    blocos.push(cabecalho ? `${cabecalho}\n${linhas.join('\n')}` : linhas.join('\n'))
  }
  return blocos.join('\n\n')
}

// ── O que a pessoa vê sobre a leitura ────────────────────────────────────────────────────────────────────

export type NivelDaLeitura = 'completo' | 'recuperado' | 'nao_transcrito'

export interface EstadoDaLeitura {
  readonly nivel: NivelDaLeitura
  /** Frase pronta para a tela. Factual: diz o que aconteceu, nunca avalia o documento. */
  readonly frase: string
  /** A busca alcança o conteúdo deste documento? É isto que a tela precisa dizer sem rodeio. */
  readonly buscavel: boolean
}

/** Qualidades de PDF em que NÃO há camada de texto para extrair — o documento entrou como imagem. */
const SEM_CAMADA_DE_TEXTO = new Set(['image', 'insufficient_text'])

/**
 * Em que estado está a leitura deste documento.
 *
 * Existe para acabar com o pior dos silêncios desta plataforma: "processado" significando cinco coisas
 * diferentes, entre elas "não li nada". A pessoa precisa saber, olhando o exame, se a busca alcança o
 * conteúdo dele — senão ela busca, não acha, e conclui que o dado não existe.
 */
export function estadoDaLeitura(params: {
  readonly temTexto: boolean
  readonly pdfQuality?: string | null
  readonly fragmentos?: number
}): EstadoDaLeitura {
  const { temTexto, pdfQuality, fragmentos = 0 } = params
  const imagem = SEM_CAMADA_DE_TEXTO.has((pdfQuality ?? '').trim())

  if (temTexto && !imagem) {
    return { nivel: 'completo', frase: 'Texto do documento lido — a busca alcança o conteúdo.', buscavel: true }
  }
  if (temTexto) {
    // Entrou como imagem E tem texto: o que há é o recomposto do que foi extraído, não o laudo inteiro.
    return {
      nivel: 'recuperado',
      frase: 'Documento enviado como imagem. A busca alcança o que foi extraído dele, não o texto completo.',
      buscavel: true,
    }
  }
  if (fragmentos > 0) {
    return {
      nivel: 'recuperado',
      frase: 'Documento enviado como imagem. A busca alcança o que foi extraído dele, não o texto completo.',
      buscavel: true,
    }
  }
  return {
    nivel: 'nao_transcrito',
    frase: imagem
      ? 'Documento enviado como imagem e não transcrito — a busca não alcança o conteúdo dele.'
      : 'O conteúdo deste documento não foi transcrito — a busca não alcança o que está escrito nele.',
    buscavel: false,
  }
}

/** Um aviso curto para a LISTA, onde não cabe a frase inteira. `null` quando não há o que avisar. */
export function selo(estado: EstadoDaLeitura): string | null {
  return estado.nivel === 'completo' ? null
    : estado.nivel === 'recuperado' ? 'Lido como imagem'
    : 'Conteúdo não transcrito'
}
