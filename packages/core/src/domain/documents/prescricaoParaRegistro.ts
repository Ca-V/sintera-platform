// @sintera/core — DA RECEITA PARA O QUE ELA PRESCREVE.
//
// A REGRA É DA FUNDADORA (30/08), e o modelo é dela: "é importante que a receita direcione para o que ela
// prescreve. Se é uma receita de medicamento, que vá para medicamento; se é de suplemento, que vá para
// suplemento; se é de algum dispositivo, que seja salva também como dispositivo."
//
// E a exigência que emoldura tudo: "o uso de toda a plataforma precisa ser extremamente fácil, rápido,
// prático, de fácil compreensão e execução. E tudo da forma mais automática possível."
//
// A DECISÃO DE PRODUTO, e por que ela não é "salvar sozinho". Criar um registro clínico a partir de leitura
// automática é a plataforma PRODUZINDO conteúdo, não organizando — a linha que ela não cruza em lugar nenhum
// (ADR-000 · RDC 657). E um erro de transcrição ("50mg" lido como "5mg") viraria um registro que ninguém
// conferiu e que vai num relatório levado ao médico.
//
// Mas "perguntar" também não precisa ser um formulário. O caminho é TUDO PRONTO, UM TOQUE: os itens já vêm
// marcados, o destino já vem escolhido, e confirmar é um gesto. O toque de confirmação custa um segundo e é
// exatamente o que separa TRANSCREVER de PRESCREVER.
//
// FRONTEIRA: classificar "Vitamina D" como suplemento é reconhecer uma CATEGORIA DE PRODUTO, do mesmo tipo do
// fato "este documento é uma receita". Não é dizer para que serve, nem se a dose está certa, nem se deve ser
// tomado. O destino aparece visível e trocável — classificação que se mostra e se corrige é diferente de
// classificação que decide calada.
import type { MedKind } from '../medications'
import type { ResourceType } from '../resources'
import type { DocumentTargetDomain } from './patientDocuments'

/**
 * As quatro categorias que a fundadora nomeou. NÃO é `MedKind`: é o destino dentro da plataforma, e os quatro
 * não moram todos no mesmo lugar.
 *
 * Medicamento e suplemento são a mesma tabela, distinguidos por `kind`. Dispositivo e produto pertencem a
 * RECURSOS DE SAÚDE, que é o domínio deles — com prescritor, arquivo e tipo próprios. Forçá-los para dentro de
 * Medicamentos criaria um dispositivo que não aparece em Recursos, que é onde a pessoa vai procurá-lo.
 */
export type DestinoPrescrito = 'medicamento' | 'suplemento' | 'dispositivo' | 'produto'

/** Onde cada destino é gravado, e como o vínculo com a receita o nomeia. */
export interface DestinoDaPlataforma {
  /** Domínio do VÍNCULO documento↔registro. Restrito ao que o banco aceita hoje. */
  readonly dominio: DocumentTargetDomain
  /** `kind` quando o registro vai para Medicamentos; `null` quando vai para Recursos. */
  readonly medKind: MedKind | null
  /**
   * `resource_type` quando o registro vai para Recursos; `null` quando vai para Medicamentos.
   *
   * TIPADO de propósito. Estava como `string` e a tela precisava de um `as never` para passar — que é
   * exatamente o buraco por onde um valor inválido entraria e o banco recusaria, com a falha engolida pelo
   * caminho de erro. Tipado, o compilador recusa antes.
   */
  readonly resourceType: ResourceType | null
  /** Como a pessoa lê o destino na tela. */
  readonly label: string
}

const DESTINOS: Record<DestinoPrescrito, DestinoDaPlataforma> = {
  medicamento: { dominio: 'medicamento', medKind: 'medicamento', resourceType: null, label: 'Medicamento' },
  suplemento:  { dominio: 'suplemento',  medKind: 'suplemento',  resourceType: null, label: 'Suplemento' },
  // `recurso` é o domínio de vínculo que aponta para `health_resources` — o único que existe hoje para eles.
  dispositivo: { dominio: 'recurso', medKind: null, resourceType: 'dispositivo_medico', label: 'Dispositivo' },
  produto:     { dominio: 'recurso', medKind: null, resourceType: 'outro',              label: 'Produto' },
}

export function destinoDaPlataforma(d: DestinoPrescrito): DestinoDaPlataforma {
  return DESTINOS[d]
}

/** Os quatro destinos, na ordem em que a pessoa os vê ao trocar. */
export const DESTINOS_PRESCRITOS: readonly { id: DestinoPrescrito; label: string }[] =
  (['medicamento', 'suplemento', 'dispositivo', 'produto'] as const).map(id => ({ id, label: DESTINOS[id].label }))

export interface ItemPrescrito {
  /** O texto transcrito do papel, inteiro e sem alteração — é ele que vai para o nome do registro. */
  readonly texto: string
  /** Para onde a plataforma PROPÕE levar. Sempre visível, sempre trocável. */
  readonly destino: DestinoPrescrito
  /**
   * A proposta é firme ou é o palpite conservador?
   *
   * `false` quando nada no texto indicou a categoria e caiu no padrão. A tela marca esses para conferência —
   * um palpite que se anuncia é honesto; um palpite silencioso é o que corrói a confiança.
   */
  readonly reconhecido: boolean
}

/** Sem sinal nenhum, propõe MEDICAMENTO: é o caso majoritário de uma receita, e o mais conservador. */
const DESTINO_PADRAO: DestinoPrescrito = 'medicamento'

/**
 * Palavras que indicam a categoria, por CLASSE e não por lista fechada de produtos (Modelo Aberto).
 *
 * Uma lista de nomes comerciais envelheceria em semanas e daria a impressão falsa de cobertura. Estas são
 * marcas de FORMA e de NATUREZA — o que costuma aparecer escrito no próprio papel.
 */
const SINAIS: { destino: DestinoPrescrito; termos: readonly string[] }[] = [
  {
    destino: 'suplemento',
    termos: [
      'vitamina', 'vitaminas', 'complexo b', 'polivitaminico', 'multivitaminico',
      'omega', 'omega 3', 'colageno', 'creatina', 'whey', 'proteina',
      'magnesio', 'zinco', 'calcio', 'ferro', 'potassio', 'selenio',
      'probiotico', 'probioticos', 'suplemento', 'coenzima', 'aminoacido',
    ],
  },
  {
    destino: 'dispositivo',
    termos: [
      'aparelho', 'dispositivo', 'orteses', 'ortese', 'protese', 'palmilha', 'palmilhas',
      'colar cervical', 'imobilizador', 'tala', 'muleta', 'muletas', 'bengala', 'cadeira de rodas',
      'meia de compressao', 'meias de compressao', 'cinta', 'joelheira', 'tornozeleira',
      'glicosimetro', 'oximetro', 'nebulizador', 'inalador', 'cpap', 'sonda', 'cateter',
      'lente', 'lentes', 'oculos', 'aparelho auditivo',
    ],
  },
  {
    destino: 'produto',
    termos: ['curativo', 'curativos', 'gaze', 'atadura', 'esparadrapo', 'seringa', 'agulha', 'luva', 'luvas'],
  },
]

/** Minúsculas e sem acento — é assim que se compara texto que veio de leitura óptica. */
function chave(s: string): string {
  return s.trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
}

/**
 * A categoria que o texto do item indica, ou `null` quando nada indicou.
 *
 * Compara por PALAVRA INTEIRA: "ferro" casa em "Ferro quelato", e não casa dentro de "Ferrosos" nem de nomes
 * que apenas contêm a sequência. Um casamento por pedaço de palavra classificaria errado com confiança, que é
 * a pior combinação possível.
 */
export function destinoIndicado(texto: string): DestinoPrescrito | null {
  const palavras = chave(texto).split(/[^a-z0-9]+/).filter(Boolean)
  const conjunto = new Set(palavras)
  const inteiro = palavras.join(' ')
  for (const { destino, termos } of SINAIS) {
    for (const t of termos) {
      const casa = t.includes(' ') ? inteiro.includes(t) : conjunto.has(t)
      if (casa) return destino
    }
  }
  return null
}

/**
 * Os itens transcritos da receita → a proposta que a pessoa confirma com um toque.
 *
 * Preserva a ordem do papel: é assim que ela vai conferir, lendo de cima para baixo. Itens repetidos são
 * mantidos — uma receita pode mesmo repetir um nome com posologias diferentes, e sumir com a segunda linha
 * seria decidir por ela.
 */
export function itensParaRegistrar(itens?: readonly string[] | null): ItemPrescrito[] {
  return (itens ?? [])
    .map(i => i.trim())
    .filter(Boolean)
    .map(texto => {
      const indicado = destinoIndicado(texto)
      return { texto, destino: indicado ?? DESTINO_PADRAO, reconhecido: indicado !== null }
    })
}

/** A pergunta, com o número de itens. Uma redação só para as duas pontas. */
export function convitePrescricao(quantos: number): string {
  if (quantos <= 0) return ''
  return quantos === 1
    ? 'Esta receita prescreve 1 item. Registrar?'
    : `Esta receita prescreve ${quantos} itens. Registrar?`
}

/**
 * A ressalva que acompanha o convite.
 *
 * Diz de onde veio o texto e a quem cabe conferir. Sem ela, a proposta pareceria uma afirmação da plataforma
 * sobre o tratamento da pessoa — e não é: é o que está escrito no papel, oferecido para conferência.
 */
export const AVISO_PRESCRICAO =
  'Transcrito do documento. Confira contra a receita antes de registrar — a SINTERA copia o que está escrito e ' +
  'não interpreta o que foi prescrito.'
