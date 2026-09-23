// @sintera/core — CARE-003 §2.2 e §4: o vínculo entre a pessoa e quem a acompanha.
//
// Regra PURA, fonte única Web↔Mobile. Decide três coisas, e as três protegem o mesmo lado da relação:
// quem pode INICIAR um convite, quem pode mudar o estado do vínculo, e o que o profissional enxerga.
//
// O INVARIANTE QUE NÃO NEGOCIA (CARE-003 §1.1): nenhum vínculo existe sem ato afirmativo do titular dos
// dados. Quem inicia a conversa é questão de produto e muda com o plano; quem CRIA o acesso é sempre o
// paciente, e isso não muda nunca — nem por plano, nem por fase, nem por conveniência de produto.

export type StatusVinculo = 'convidado' | 'ativo' | 'recusado' | 'revogado' | 'encerrado'

export type Lado = 'paciente' | 'profissional'

export interface Vinculo {
  readonly status: StatusVinculo
  readonly iniciadoPor: Lado
  readonly escopo: readonly string[]
}

/**
 * O escopo padrão proposto ao aceitar: o mínimo que torna o vínculo útil.
 *
 * Hábitos, ciclo, contracepção e saúde da mulher ficam de FORA por decisão (CARE-003 §3.2). Não é pudor: são
 * os dados em que a exposição indesejada custa mais caro, e quem decide expô-los tem de ser a pessoa, num
 * gesto deliberado — não por herdar um padrão que ninguém leu.
 */
export const ESCOPO_PADRAO: readonly string[] = ['exames', 'documentos', 'medidas', 'historico-saude']

/** Fora do padrão: entram só se a pessoa marcar, um a um. */
export const ESCOPO_SENSIVEL: readonly string[] = ['habitos', 'ciclo', 'saude-da-mulher', 'medicamentos']

/** Transições válidas. Fora daqui, nada acontece. */
const TRANSICOES: Readonly<Record<StatusVinculo, readonly StatusVinculo[]>> = {
  convidado: ['ativo', 'recusado', 'encerrado'],
  ativo: ['revogado', 'encerrado'],
  recusado: [],
  revogado: [],
  encerrado: [],
}

/**
 * Quem pode aplicar cada transição.
 *
 * `ativo` só aparece para o paciente, e é a regra inteira do CARE-003 em uma linha: aceitar é criar o acesso,
 * e criar o acesso é privativo de quem é dono dele. O profissional pode recusar um convite que recebeu e pode
 * encerrar um vínculo que mantém — nunca ativar.
 */
const QUEM_PODE: Readonly<Record<StatusVinculo, readonly Lado[]>> = {
  convidado: ['paciente', 'profissional'],
  ativo: ['paciente'],
  recusado: ['paciente', 'profissional'],
  revogado: ['paciente'],
  encerrado: ['paciente', 'profissional'],
}

export function transicaoPermitida(de: StatusVinculo, para: StatusVinculo, por: Lado): boolean {
  return TRANSICOES[de].includes(para) && QUEM_PODE[para].includes(por)
}

/** Por que a transição foi recusada. `null` quando ela vale. */
export function motivoTransicaoInvalida(de: StatusVinculo, para: StatusVinculo, por: Lado): string | null {
  if (transicaoPermitida(de, para, por)) return null
  if (!TRANSICOES[de].includes(para)) {
    return TRANSICOES[de].length === 0
      ? `Um vínculo ${de} é definitivo e não muda mais de estado.`
      : `Um vínculo ${de} só pode passar para: ${TRANSICOES[de].join(', ')}.`
  }
  if (para === 'ativo') {
    return 'Só a pessoa dona dos dados pode aceitar um vínculo. O profissional convida; quem autoriza é ela.'
  }
  return `O ${por} não pode aplicar esta mudança.`
}

/**
 * Quem pode INICIAR um convite.
 *
 * O paciente, sempre. O profissional, só quando o plano dele concede `prof.convidar_pacientes` E o registro
 * no conselho está verificado — CARE-003 §4.1. Na fase de lançamento nenhum plano concede, então a regra
 * "só o paciente convida" vale sem precisar de código próprio: é a permissão desligada.
 */
export function podeIniciarConvite(por: Lado, opcoes: { planoPermite?: boolean; verificado?: boolean } = {}): boolean {
  if (por === 'paciente') return true
  return opcoes.planoPermite === true && opcoes.verificado === true
}

/** O convite do profissional exige declaração de relação assistencial existente (CARE-003 §4.2). */
export function conviteExigeDeclaracao(por: Lado): boolean {
  return por === 'profissional'
}

/**
 * O profissional enxerga este módulo desta pessoa?
 *
 * Duas condições, e as duas necessárias: vínculo ATIVO e módulo dentro do escopo. É o espelho exato da função
 * `profissional_tem_vinculo_ativo` no banco — a regra vale nos dois lugares, e o banco é quem a impõe.
 */
export function profissionalEnxerga(v: Vinculo, modulo: string): boolean {
  return v.status === 'ativo' && v.escopo.includes(modulo)
}

/**
 * O vínculo concede algum acesso hoje?
 *
 * Só `ativo`. `convidado` não concede nada — e isso é deliberado: antes do aceite o profissional não vê o
 * nome da pessoa, não sabe se ela tem conta, e não sabe se o convite foi aberto. Saber transformaria a recusa
 * em constrangimento e o silêncio em cobrança.
 */
export function concedeAcesso(v: Vinculo): boolean {
  return v.status === 'ativo'
}

/** Escopo válido: sem duplicatas, sem vazios. Não restringe QUAIS módulos — lista aberta (ADR-000). */
export function normalizarEscopo(escopo: readonly string[]): string[] {
  return [...new Set(escopo.map(m => m.trim()).filter(Boolean))]
}
