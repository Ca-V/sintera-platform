// @sintera/api-client — CARE-003: leitura e escrita da Rede de Cuidado.
//
// Só o IO. A regra — quem pode iniciar, quem ativa, o que aparece em cada seção — mora em `@sintera/core`, e
// o RLS do banco é quem a IMPÕE. Esta camada nem tenta filtrar por segurança: se uma consulta aqui devolvesse
// dado indevido, o defeito seria a policy, não este arquivo.
//
// LEITURA DOS CONVITES pela visão `care_invites_do_remetente`, não pela tabela. A visão omite `para_user_id` e
// `token` de propósito: saber se a pessoa criou conta transforma o silêncio dela em cobrança (CARE-003 §3.1).
// Consultar a tabela direto aqui derrubaria essa decisão sem que nada acusasse.
import type { SupabaseClient } from '@supabase/supabase-js'
import type { VinculoNaLista, ConviteNaLista, Profissao, StatusVinculo, StatusConvite, DirecaoConvite } from '@sintera/core'
import { withTimeout } from '../net/timeout'
import { asError } from '../net/errors'

export interface RedeDeCuidado {
  readonly vinculos: VinculoNaLista[]
  readonly convites: ConviteNaLista[]
}

interface LinhaVinculo {
  id: string
  status: StatusVinculo
  escopo: string[] | null
  aceito_em: string | null
  professional_profiles: { nome_profissional: string; profissao: Profissao; especialidade: string | null } | null
}

interface LinhaConvite {
  id: string
  para_contato: string
  status: StatusConvite
  criado_em: string
  expira_em: string
}

/** Vínculos e convites da pessoa autenticada. LANÇA em falha operacional (convenção de leitura). */
export async function getRedeDeCuidado(client: SupabaseClient, signal?: AbortSignal): Promise<RedeDeCuidado> {
  const { signal: s, cleanup } = withTimeout(signal)
  try {
    const { data: { session } } = await client.auth.getSession()
    if (!session) throw new Error('Não autenticado')
    const uid = session.user.id

    const [links, invites] = await Promise.all([
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (client as any)
        .from('care_links')
        .select('id, status, escopo, aceito_em, professional_profiles(nome_profissional, profissao, especialidade)')
        .eq('paciente_user_id', uid)
        .order('criado_em', { ascending: false })
        .abortSignal(s),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (client as any)
        .from('care_invites_do_remetente')
        .select('id, para_contato, status, criado_em, expira_em')
        .eq('de_user_id', uid)
        .order('criado_em', { ascending: false })
        .abortSignal(s),
    ])
    if (links.error) throw asError(links.error)
    if (invites.error) throw asError(invites.error)

    return {
      vinculos: ((links.data ?? []) as LinhaVinculo[]).map((l) => ({
        id: l.id,
        // Perfil ausente só acontece se o profissional apagou a conta com o vínculo de pé. A linha não some —
        // é histórico de acesso — então ela precisa de um rótulo em vez de quebrar a tela.
        nomeProfissional: l.professional_profiles?.nome_profissional ?? 'Profissional removido',
        profissao: l.professional_profiles?.profissao ?? 'outro',
        especialidade: l.professional_profiles?.especialidade ?? null,
        status: l.status,
        escopo: l.escopo ?? [],
        desde: l.aceito_em ? new Date(l.aceito_em) : null,
      })),
      convites: ((invites.data ?? []) as LinhaConvite[]).map((c) => ({
        id: c.id,
        paraContato: c.para_contato,
        status: c.status,
        criadoEm: new Date(c.criado_em),
        expiraEm: new Date(c.expira_em),
      })),
    }
  } finally {
    cleanup()
  }
}

/**
 * Convida um profissional. O `token` e o prazo vêm do DEFAULT do banco — não se gera token no cliente
 * (Hermes/Expo não tem Web Crypto, e token fraco aqui é acesso indevido ao aceite).
 *
 * `direcao` é sempre `paciente_convida_profissional` nesta função. O convite na direção oposta depende do
 * plano profissional e da questão 3 do Briefing Jurídico — quando existir, terá função própria, para que
 * ninguém a chame por engano passando um parâmetro.
 */
export async function convidarProfissional(
  client: SupabaseClient, paraContato: string, signal?: AbortSignal,
): Promise<{ id: string }> {
  const { signal: s, cleanup } = withTimeout(signal)
  try {
    const { data: { session } } = await client.auth.getSession()
    if (!session) throw new Error('Não autenticado')
    const contato = paraContato.trim()
    if (!contato) throw new Error('Informe o e-mail ou telefone do profissional')

    const direcao: DirecaoConvite = 'paciente_convida_profissional'
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (client as any)
      .from('care_invites')
      .insert({ de_user_id: session.user.id, para_contato: contato, direcao })
      .select('id')
      .single()
      .abortSignal(s)
    if (error) throw asError(error)
    return { id: (data as { id: string }).id }
  } finally {
    cleanup()
  }
}

/**
 * Encerra o acesso de um profissional. O vínculo NÃO é apagado: vira `revogado`, com instante e autor.
 * Apagar a linha apagaria a prova de que aquele profissional teve acesso aos dados da pessoa.
 */
export async function revogarVinculo(client: SupabaseClient, vinculoId: string, signal?: AbortSignal): Promise<void> {
  const { signal: s, cleanup } = withTimeout(signal)
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (client as any)
      .from('care_links')
      .update({ status: 'revogado', revogado_em: new Date().toISOString(), revogado_por: 'paciente' })
      .eq('id', vinculoId)
      .abortSignal(s)
    if (error) throw asError(error)
  } finally {
    cleanup()
  }
}

/** Cancela um convite que ainda não foi respondido. Só quem enviou pode — o RLS confere. */
export async function cancelarConvite(client: SupabaseClient, conviteId: string, signal?: AbortSignal): Promise<void> {
  const { signal: s, cleanup } = withTimeout(signal)
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (client as any)
      .from('care_invites')
      .update({ status: 'cancelado' })
      .eq('id', conviteId)
      .abortSignal(s)
    if (error) throw asError(error)
  } finally {
    cleanup()
  }
}
