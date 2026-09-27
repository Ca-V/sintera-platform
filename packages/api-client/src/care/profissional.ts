// @sintera/api-client — CARE-003: o lado de QUEM RECEBE o convite.
//
// Só o IO. A regra — o que é um convite respondível, o que cada frase diz, quais módulos um escopo abre —
// mora em `@sintera/core`, e o RLS do banco é quem IMPÕE o acesso.
//
// TUDO PASSA POR FUNÇÃO DO BANCO (migração 165), e não por insert/update direto. O aceite toca três linhas de
// duas tabelas e precisa ser atômico: ou nasce o vínculo E o convite vira aceito, ou nada acontece. Montar
// isso no cliente deixaria, no primeiro erro de rede no meio, um convite aceito sem vínculo — a pessoa
// acreditando que autorizou alguém que não enxerga nada.
import type { SupabaseClient } from '@supabase/supabase-js'
import type { PacienteNaLista, ConviteRecebido, PerfilProfissional, Profissao } from '@sintera/core'
import { withTimeout } from '../net/timeout'
import { asError } from '../net/errors'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Rpc = { rpc: (fn: string, args?: Record<string, unknown>) => any }

/** O perfil profissional desta conta, ou `null`. LANÇA em falha operacional (convenção de leitura). */
export async function getPerfilProfissional(client: SupabaseClient, signal?: AbortSignal): Promise<PerfilProfissional | null> {
  const { signal: s, cleanup } = withTimeout(signal)
  try {
    const { data: { session } } = await client.auth.getSession()
    if (!session) throw new Error('Não autenticado')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (client as any)
      .from('professional_profiles')
      // `id` NÃO é lido: nenhuma tela precisa dele. As funções do banco resolvem o perfil por `auth.uid()`,
      // e um identificador que circula sem uso é superfície a mais sem capacidade a mais.
      .select('nome_profissional, profissao, especialidade, conselho, registro_numero, registro_uf, status_verificacao, verificacao_nota')
      .eq('user_id', session.user.id)
      .maybeSingle()
      .abortSignal(s)
    if (error) throw asError(error)
    if (!data) return null
    return {
      nomeProfissional: data.nome_profissional,
      profissao: data.profissao,
      especialidade: data.especialidade,
      conselho: data.conselho,
      registroNumero: data.registro_numero,
      registroUf: data.registro_uf,
      statusVerificacao: data.status_verificacao,
      verificacaoNota: data.verificacao_nota ?? null,
    } as PerfilProfissional
  } finally {
    cleanup()
  }
}

export interface NovoPerfilProfissional {
  readonly nomeProfissional: string
  readonly profissao: Profissao
  readonly especialidade?: string | null
  readonly conselho?: string | null
  readonly registroNumero?: string | null
  readonly registroUf?: string | null
}

/**
 * Cria o perfil profissional desta conta.
 *
 * `status_verificacao` NÃO é enviado: o default do banco manda, e a policy de update proíbe mudá-lo. Quem
 * conferiu o registro no conselho é decisão de fora da plataforma (questão 3 do Briefing Jurídico), e até lá
 * ninguém — inclusive o próprio dono da conta — pode se declarar verificado.
 */
export async function criarPerfilProfissional(
  client: SupabaseClient, p: NovoPerfilProfissional, signal?: AbortSignal,
): Promise<PerfilProfissional> {
  const { signal: s, cleanup } = withTimeout(signal)
  try {
    const { data: { session } } = await client.auth.getSession()
    if (!session) throw new Error('Não autenticado')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (client as any).from('professional_profiles').insert({
      user_id: session.user.id,
      nome_profissional: p.nomeProfissional.trim(),
      profissao: p.profissao,
      especialidade: p.especialidade?.trim() || null,
      conselho: p.conselho || null,
      registro_numero: p.registroNumero?.trim() || null,
      registro_uf: p.registroUf?.trim() || null,
    }).abortSignal(s)
    if (error) throw asError(error)
    const criado = await getPerfilProfissional(client, s)
    if (!criado) throw new Error('Perfil criado, mas não consegui lê-lo de volta.')
    return criado
  } finally {
    cleanup()
  }
}

/** O que o convite diz a quem tem o token. `null` quando não existe. Exige sessão (a função do banco confere). */
export async function getConviteRecebido(client: SupabaseClient, token: string, signal?: AbortSignal): Promise<ConviteRecebido | null> {
  const { signal: s, cleanup } = withTimeout(signal)
  try {
    const { data, error } = await (client as unknown as Rpc)
      .rpc('convite_por_token', { p_token: token }).abortSignal(s)
    if (error) throw asError(error)
    const linha = Array.isArray(data) ? data[0] : data
    if (!linha) return null
    return {
      status: linha.status,
      expiraEm: new Date(linha.expira_em),
      primeiroNome: linha.primeiro_nome ?? null,
      jaTenhoPerfil: Boolean(linha.ja_tenho_perfil),
    }
  } finally {
    cleanup()
  }
}

/**
 * Aceita o convite e cria (ou reativa) o vínculo. Devolve o id do vínculo.
 *
 * LANÇA com a MENSAGEM CRUA do banco (`sem_perfil_profissional`, `convite_expirado`, …). Quem traduz é
 * `motivoDoAceite` no core, para que Web e aplicativo leiam a mesma frase — traduzir aqui criaria um segundo
 * dono do texto, e o texto é decisão (BASE ÚNICA).
 */
export async function aceitarConviteProfissional(client: SupabaseClient, token: string, signal?: AbortSignal): Promise<string> {
  const { signal: s, cleanup } = withTimeout(signal)
  try {
    const { data, error } = await (client as unknown as Rpc)
      .rpc('aceitar_convite_profissional', { p_token: token }).abortSignal(s)
    if (error) throw asError(error)
    return String(data ?? '')
  } finally {
    cleanup()
  }
}

/** Recusa o convite. NÃO exige perfil profissional — quem recebeu por engano precisa conseguir sair. */
export async function recusarConviteProfissional(client: SupabaseClient, token: string, signal?: AbortSignal): Promise<void> {
  const { signal: s, cleanup } = withTimeout(signal)
  try {
    const { error } = await (client as unknown as Rpc)
      .rpc('recusar_convite_profissional', { p_token: token }).abortSignal(s)
    if (error) throw asError(error)
  } finally {
    cleanup()
  }
}

/**
 * As pessoas com vínculo ATIVO com este profissional.
 *
 * Função do banco, e não consulta a `profiles`: RLS é por LINHA, e uma policy de leitura em `profiles`
 * entregaria a linha inteira — ciclo, data de nascimento, altura, objetivos — a qualquer profissional com
 * vínculo, independentemente do escopo autorizado.
 */
export async function getPacientesDoProfissional(client: SupabaseClient, signal?: AbortSignal): Promise<PacienteNaLista[]> {
  const { signal: s, cleanup } = withTimeout(signal)
  try {
    const { data, error } = await (client as unknown as Rpc)
      .rpc('pacientes_do_profissional').abortSignal(s)
    if (error) throw asError(error)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return ((data ?? []) as any[]).map((l) => ({
      careLinkId: l.care_link_id,
      pacienteUserId: l.paciente_user_id,
      nome: l.nome ?? null,
      escopo: l.escopo ?? [],
      desde: l.desde ? new Date(l.desde) : null,
    }))
  } finally {
    cleanup()
  }
}
