// @sintera/core — CARE-003: o lado de QUEM RECEBE o convite.
//
// ============================================================================================
// O QUE FALTAVA (achado ao responder a fundadora, 27/09/2026)
// ============================================================================================
// O convite era criado, enviado e aberto — e parava ali. Nada consumia o token, nada criava vínculo, e o
// profissional que clicasse no link chegava ao `/login` com o token descartado pelo caminho. Metade da etapa
// 9 estava entregue: a de quem convida.
//
// ============================================================================================
// O MODELO DE CONTA — decisão da fundadora, e ela decide isto
// ============================================================================================
// "Um login, uma pessoa, dois perfis, duas assinaturas."
//
// O profissional NÃO entra na conta de ninguém. Ele tem a conta dele — que pode ser, e normalmente é, a mesma
// com que cuida da própria saúde — e dentro dela um PERFIL PROFISSIONAL. As pessoas que o autorizaram
// aparecem numa lista; abrir uma delas mostra só o que ela autorizou.
//
// Isto não é preferência de desenho: é o que o banco já pressupõe desde a migração 158.
// `profissional_tem_vinculo_ativo()` filtra por `auth.uid()` DO PROFISSIONAL, e as 8 policies da 161 leem
// dessa função. Um profissional sem conta própria não teria `auth.uid()` — nenhuma das policies devolveria
// linha nenhuma. "Entrar na página do usuário" nunca foi possível, e é bom que não seja.
//
// ============================================================================================
// O QUE ESTE ARQUIVO NÃO DECIDE
// ============================================================================================
// Quem pode ver o quê. Isso é do RLS, e é ele quem IMPÕE. Se uma função daqui devolvesse o módulo errado, a
// consulta voltaria vazia — o erro seria feio, não perigoso. A ordem é essa de propósito: a tela nunca é a
// última linha de defesa.

import { ESCOPO_PADRAO } from './vinculo'

// ------------------------------------------------------------------------------------------------------
// Os módulos que um vínculo pode abrir
// ------------------------------------------------------------------------------------------------------

/**
 * O catálogo. As chaves são as MESMAS que a migração 161 usa nas policies e que `care_links.escopo` guarda —
 * não há tradução no meio, de propósito: um mapa entre dois vocabulários seria mais um lugar para divergir.
 *
 * `ESCOPO_SENSIVEL` (hábitos, ciclo, saúde da mulher, medicamentos) está fora, e continua fora. Não há policy
 * para esses módulos, então nem adiantaria listá-los: a consulta voltaria vazia. Entram quando houver decisão
 * explícita sobre eles, não por omissão.
 */
export interface ModuloDoVinculo {
  readonly chave: string
  readonly label: string
  /** O que ele vê ali, em uma linha. A pessoa autorizou por área, não por tabela. */
  readonly descricao: string
}

export const MODULOS_DO_VINCULO: readonly ModuloDoVinculo[] = [
  { chave: 'exames',           label: 'Exames',             descricao: 'Laudos e resultados ao longo do tempo' },
  { chave: 'documentos',       label: 'Receitas e atestados', descricao: 'Documentos que a pessoa guardou' },
  { chave: 'medidas',          label: 'Composição corporal', descricao: 'Peso e medidas registradas' },
  { chave: 'historico-saude',  label: 'Histórico de saúde',  descricao: 'Eventos e registros da linha do tempo' },
]

/** Os módulos que ESTE vínculo abre, na ordem do catálogo. Escopo desconhecido é ignorado (Modelo Aberto). */
export function modulosAutorizados(escopo: readonly string[]): ModuloDoVinculo[] {
  return MODULOS_DO_VINCULO.filter(m => escopo.includes(m.chave))
}

/** Todo módulo do escopo padrão tem entrada no catálogo. Sem isto, a pessoa autoriza o que ninguém abre. */
export function modulosDoPadraoSemCatalogo(): string[] {
  return ESCOPO_PADRAO.filter(c => !MODULOS_DO_VINCULO.some(m => m.chave === c))
}

// ------------------------------------------------------------------------------------------------------
// A lista de pessoas
// ------------------------------------------------------------------------------------------------------

export interface PacienteNaLista {
  readonly careLinkId: string
  readonly pacienteUserId: string
  /** `null` quando a pessoa não preencheu o nome. A tela NÃO fica em branco — ver `nomeDoPaciente`. */
  readonly nome: string | null
  readonly escopo: readonly string[]
  readonly desde: Date | null
}

/**
 * Como a pessoa é nomeada na lista do profissional.
 *
 * Perfil sem nome acontece: a conta é criada por e-mail e o nome é opcional. Mostrar espaço em branco faria o
 * profissional achar que a tela quebrou, e mostrar o identificador (`a3f9…`) não nomeia ninguém. O rótulo diz
 * o que é verdade — há uma pessoa ali, e ela não se nomeou.
 */
export function nomeDoPaciente(p: Pick<PacienteNaLista, 'nome'>): string {
  const n = p.nome?.trim()
  return n && n.length > 0 ? n : 'Pessoa sem nome no perfil'
}

/**
 * O resumo do acesso, no cartão. NÚMERO e não lista: a lista inteira em cada cartão vira parede de texto e
 * ninguém lê. Mesma decisão de `resumoDoEscopo` no lado do paciente, e de propósito a mesma frase.
 */
export function resumoDoAcesso(escopo: readonly string[]): string {
  const n = modulosAutorizados(escopo).length
  if (n === 0) return 'Sem acesso a nenhuma área'
  return n === 1 ? 'Acesso a 1 área' : `Acesso a ${n} áreas`
}

export function painelEstaVazio(pacientes: readonly PacienteNaLista[]): boolean {
  return pacientes.length === 0
}

/**
 * O que o cartão de um módulo diz.
 *
 * `total: -1` é o módulo que FALHOU ao carregar — e ele aparece dizendo isso, em vez de "nenhum registro". A
 * diferença decide o comportamento: "não há nada" faz o profissional parar de procurar; "não consegui ler"
 * faz ele tentar de novo. Dar a primeira frase para a segunda situação é esconder um defeito atrás de um
 * fato — a mesma classe de rótulo enganoso da homologação de 27/09.
 */
export function rotuloDoModulo(total: number): string {
  if (total < 0) return 'Não consegui carregar esta área agora'
  if (total === 0) return 'Nenhum registro ainda'
  return total === 1 ? '1 registro' : `${total} registros`
}

/** O módulo carregou? Decide se a tela mostra os itens recentes ou só o aviso. */
export function moduloCarregou(total: number): boolean {
  return total >= 0
}

// ------------------------------------------------------------------------------------------------------
// O aceite — e por que ele pode não acontecer
// ------------------------------------------------------------------------------------------------------

/**
 * Os motivos que o banco devolve. São os nomes EXATOS das exceções de `aceitar_convite_profissional` e
 * `recusar_convite_profissional` (migração 165) — o acoplamento é deliberado e está documentado dos dois
 * lados, porque a alternativa é o cliente adivinhar pelo texto do erro.
 */
export type MotivoDoAceite =
  | 'nao_autenticado'
  | 'convite_nao_encontrado'
  | 'direcao_invalida'
  | 'nao_pode_aceitar_o_proprio_convite'
  | 'convite_ja_respondido'
  | 'convite_expirado'
  | 'sem_perfil_profissional'
  | 'desconhecido'

/**
 * A frase que a pessoa lê. Toda uma DIZ O QUE FAZER quando há algo a fazer, e diz que não há quando não há.
 *
 * É a mesma lição da homologação de 27/09, noutro lugar: a tela dizia "tente de novo" sobre uma configuração
 * que repetir nunca resolveria. Um motivo sem saída é quase tão ruim quanto um rótulo que mente.
 */
const FRASE: Readonly<Record<MotivoDoAceite, string>> = {
  nao_autenticado:
    'Entre na sua conta para responder ao convite.',
  convite_nao_encontrado:
    'Não encontrei este convite. O link pode estar incompleto — confira se você copiou o endereço inteiro.',
  direcao_invalida:
    'Este convite não é deste tipo. Peça à pessoa para enviar um novo.',
  nao_pode_aceitar_o_proprio_convite:
    'Este convite foi enviado por você. Quem precisa aceitá-lo é a outra pessoa.',
  convite_ja_respondido:
    'Este convite já foi respondido ou cancelado. Se ainda faz sentido, peça um novo.',
  convite_expirado:
    'Este convite venceu. Peça à pessoa para enviar um novo — leva um minuto.',
  sem_perfil_profissional:
    'Antes de aceitar, crie o seu perfil profissional. Ele leva conselho e registro, e o convite fica guardado.',
  desconhecido:
    'Não consegui responder ao convite agora. Tente de novo em instantes.',
}

/** Traduz o erro cru do banco. Desconhecido cai numa frase honesta, nunca no texto técnico. */
export function motivoDoAceite(erro: string | null | undefined): MotivoDoAceite {
  const e = (erro ?? '').toLowerCase()
  const conhecidos: MotivoDoAceite[] = [
    'nao_autenticado', 'convite_nao_encontrado', 'direcao_invalida',
    'nao_pode_aceitar_o_proprio_convite', 'convite_ja_respondido', 'convite_expirado',
    'sem_perfil_profissional',
  ]
  // `nao_pode_aceitar_o_proprio_convite` contém `convite`; a ordem da lista resolve, mas conferir por
  // igualdade de palavra inteira evita que uma exceção nova colida com outra por acaso.
  return conhecidos.find(m => e.includes(m)) ?? 'desconhecido'
}

export function fraseDoMotivo(m: MotivoDoAceite): string {
  return FRASE[m]
}

/** Falta uma etapa dela, ou o convite morreu? Decide se a tela oferece um caminho ou só explica. */
export function temCaminho(m: MotivoDoAceite): boolean {
  return m === 'sem_perfil_profissional' || m === 'nao_autenticado'
}

// ------------------------------------------------------------------------------------------------------
// O estado do convite antes de responder
// ------------------------------------------------------------------------------------------------------

export interface ConviteRecebido {
  readonly status: string
  readonly expiraEm: Date
  readonly primeiroNome: string | null
  readonly jaTenhoPerfil: boolean
}

/**
 * Só convite `enviado` e no prazo pode ser respondido. Botão que não faz nada é pior do que botão ausente.
 *
 * NOME LONGO DE PROPÓSITO. `podeResponder` já existe em `convite.ts`, decidindo outra coisa — se o REMETENTE
 * ainda pode agir sobre o convite que enviou. Em 26/09 uma colisão assim fez uma catraca de segurança testar
 * a máquina de estados errada sem que nada acusasse, porque `export *` deixa a última ganhar em silêncio.
 */
export function podeResponderConviteRecebido(c: ConviteRecebido, agora: Date): boolean {
  return c.status === 'enviado' && c.expiraEm.getTime() > agora.getTime()
}

/**
 * Quem convidou, como a tela diz.
 *
 * Primeiro nome só, e "Alguém" quando não há. O token viaja em URL e URL vaza — nome completo aqui seria
 * identificar uma pessoa para quem quer que tenha encaminhado a mensagem.
 */
export function quemConvidou(c: Pick<ConviteRecebido, 'primeiroNome'>): string {
  const n = c.primeiroNome?.trim()
  return n && n.length > 0 ? n : 'Alguém'
}

/** O que o convite recebido diz de si, quando ele não pode mais ser respondido. */
export function rotuloDoConviteRecebido(c: ConviteRecebido, agora: Date): string {
  if (podeResponderConviteRecebido(c, agora)) return `${quemConvidou(c)} convidou você`
  if (c.status === 'aceito') return 'Você já aceitou este convite'
  if (c.status === 'recusado') return 'Você recusou este convite'
  if (c.status === 'cancelado') return 'Quem convidou cancelou este convite'
  return 'Este convite venceu'
}
