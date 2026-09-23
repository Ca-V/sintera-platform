// @sintera/core — CARE-003 §2.1 e §5: a conta profissional e o que ela pode fazer.
//
// Regra PURA, fonte única Web↔Mobile. O que este módulo decide é uma coisa só, e é a que protege a pessoa do
// outro lado: QUANDO um perfil profissional pode agir. A resposta é sempre a mesma — depois de o registro no
// conselho estar verificado, e não antes.
//
// O QUE A VERIFICAÇÃO IMPEDE, concretamente: que alguém não habilitado envie a um usuário um documento que
// ele vai ler como clínico. O risco não depende de má-fé — basta uma pessoa bem-intencionada se cadastrar na
// categoria errada.

/** As profissões que a Rede de Cuidado reconhece. `outro` existe porque a lista real é maior que esta. */
export type Profissao = 'medico' | 'nutricionista' | 'educador_fisico' | 'fisioterapeuta' | 'outro'

export type Conselho = 'CRM' | 'CRN' | 'CREFITO' | 'CREF'

export type StatusVerificacao = 'pendente' | 'verificado' | 'recusado' | 'suspenso'

export interface PerfilProfissional {
  readonly nomeProfissional: string
  readonly profissao: Profissao
  readonly especialidade?: string | null
  readonly conselho?: Conselho | null
  readonly registroNumero?: string | null
  readonly registroUf?: string | null
  readonly statusVerificacao: StatusVerificacao
  /** Por que foi recusado ou suspenso. Vem de quem conferiu; a plataforma não o redige. */
  readonly verificacaoNota?: string | null
}

/** Qual conselho fiscaliza cada profissão. `null` quando não há conselho obrigatório. */
const CONSELHO_DA_PROFISSAO: Readonly<Record<Profissao, Conselho | null>> = {
  medico: 'CRM',
  nutricionista: 'CRN',
  fisioterapeuta: 'CREFITO',
  educador_fisico: 'CREF',
  outro: null,
}

export function conselhoDe(profissao: Profissao): Conselho | null {
  return CONSELHO_DA_PROFISSAO[profissao] ?? null
}

export function exigeConselho(profissao: Profissao): boolean {
  return conselhoDe(profissao) !== null
}

/** Nome da profissão como a pessoa lê. Mora aqui porque Web e aplicativo mostram o mesmo. */
const NOME_DA_PROFISSAO: Readonly<Record<Profissao, string>> = {
  medico: 'Médico',
  nutricionista: 'Nutricionista',
  educador_fisico: 'Profissional de educação física',
  fisioterapeuta: 'Fisioterapeuta',
  outro: 'Outra profissão',
}

export function nomeDaProfissao(profissao: Profissao): string {
  return NOME_DA_PROFISSAO[profissao] ?? NOME_DA_PROFISSAO.outro
}

/**
 * Normaliza o registro para COMPARAÇÃO — sem separadores, sem espaços, em maiúsculas.
 *
 * Deliberadamente NÃO valida formato. Os formatos variam por conselho e por região, e alguns carregam letra
 * (o CREF distingue graduado de provisionado). Uma regra de formato inventada aqui recusaria profissional
 * legítimo — que é o pior resultado possível neste ponto, porque a pessoa conclui que não é bem-vinda e não
 * volta. Modelo Aberto: o que não se reconhece fica pendente de conferência humana, não é rejeitado.
 */
export function normalizarRegistro(valor: string | null | undefined): string | null {
  if (!valor) return null
  const limpo = valor.replace(/[^0-9A-Za-zÀ-ÿ]/g, '').toUpperCase()
  return limpo.length > 0 ? limpo : null
}

/** UF em duas letras maiúsculas, ou `null`. Também não valida contra a lista de estados — só a forma. */
export function normalizarUf(valor: string | null | undefined): string | null {
  if (!valor) return null
  const limpo = valor.replace(/[^A-Za-z]/g, '').toUpperCase()
  return limpo.length === 2 ? limpo : null
}

/** O que falta para o perfil poder ser submetido à verificação. Vazio = pronto para conferência. */
export function pendenciasDoCadastro(p: PerfilProfissional): string[] {
  const faltam: string[] = []
  if (!p.nomeProfissional?.trim()) faltam.push('nome profissional')
  if (exigeConselho(p.profissao)) {
    if (!p.conselho) faltam.push('conselho')
    if (!normalizarRegistro(p.registroNumero)) faltam.push('número de registro')
    if (!normalizarUf(p.registroUf)) faltam.push('estado do registro')
  }
  return faltam
}

/**
 * O perfil está verificado e, portanto, pode agir.
 *
 * `pendente` não é o mesmo que `recusado`, e nenhum dos dois age. A distinção existe para a mensagem que a
 * pessoa lê: esperando conferência é diferente de não confirmamos seu registro.
 */
export function estaVerificado(p: PerfilProfissional): boolean {
  return p.statusVerificacao === 'verificado'
}

/** Enviar documento a um usuário exige verificação. Sem exceção, e sem depender de plano. */
export function podeEnviarDocumento(p: PerfilProfissional): boolean {
  return estaVerificado(p)
}

/**
 * Convidar paciente exige DUAS condições, e as duas de naturezas diferentes:
 * verificação (quem é) e entitlement do plano pago (o que contratou) — CARE-003 §4.1, BILLING-003 §5.
 *
 * Na fase de lançamento nenhum plano concede `prof.convidar_pacientes`, então isto devolve `false` para todo
 * mundo — que é exatamente a regra "só o paciente convida". A permissão fica cadastrada e desligada.
 */
export function podeConvidarPacientes(p: PerfilProfissional, podePeloPlano: boolean): boolean {
  return estaVerificado(p) && podePeloPlano
}

/**
 * O que a pessoa lê sobre o próprio estado. Nunca esconder o motivo: um perfil que não age sem dizer por quê
 * é a armadilha da configuração ausente outra vez — nada acontece, e nada explica.
 */
export function motivoDeNaoAgir(p: PerfilProfissional): string | null {
  if (estaVerificado(p)) return null
  const faltam = pendenciasDoCadastro(p)
  if (faltam.length > 0) {
    return `Para enviar documentos e acompanhar pacientes, complete o cadastro: ${faltam.join(', ')}.`
  }
  switch (p.statusVerificacao) {
    case 'pendente':
      return exigeConselho(p.profissao)
        ? 'Seu registro no conselho está em conferência. Enquanto isso, você já pode receber pacientes que convidarem você.'
        : 'Sua profissão não tem conselho com registro obrigatório, então não é possível confirmar um registro. Você pode receber pacientes que convidarem você, mas não enviar documentos.'
    case 'recusado':
      // A nota vem de quem conferiu e diz o que a frase genérica não diz. Quando existe, ela manda.
      return p.verificacaoNota?.trim()
        ? `Não foi possível confirmar seu registro no conselho. ${p.verificacaoNota.trim()}`
        : 'Não foi possível confirmar seu registro no conselho. Confira o número e o estado, e envie de novo.'
    case 'suspenso':
      return 'Seu registro consta como suspenso no conselho. Enquanto estiver assim, não é possível enviar documentos nem convidar pacientes.'
    default:
      return 'Seu perfil profissional ainda não está verificado.'
  }
}
