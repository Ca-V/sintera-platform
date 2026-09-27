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
import type { VinculoNaLista, ConviteNaLista, Profissao, StatusVinculo, StatusConvite,
  EntregaDoConvite, CanalDoConvite } from '@sintera/core'
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
  canal: CanalDoConvite | null
  entrega: EntregaDoConvite | null
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
        .select('id, para_contato, status, criado_em, expira_em, canal, entrega')
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
        // Linhas anteriores à migração 163 não têm estes campos. `pendente` as descreve com exatidão: foram
        // gravadas e nunca enviadas — que é o defeito que esta correção existe para acabar.
        canal: c.canal ?? 'desconhecido',
        entrega: c.entrega ?? 'pendente',
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
  client: SupabaseClient, paraContato: string, webBaseUrl?: string, signal?: AbortSignal,
): Promise<{ id: string; entrega: EntregaDoConvite; canal: CanalDoConvite }> {
  const { signal: s, cleanup } = withTimeout(signal)
  try {
    const { data: { session } } = await client.auth.getSession()
    if (!session) throw new Error('Não autenticado')
    const contato = paraContato.trim()
    if (!contato) throw new Error('Informe o e-mail ou telefone do profissional')

    // PASSA PELA ROTA, e não por insert direto. Era o insert direto que produzia o defeito achado na
    // homologação de 27/09: a linha nascia e nada saía. Criar e enviar são um ato só — separá-los apenas
    // mudaria o lugar onde o envio seria esquecido. Ponte ADR-020, igual a analyzeExam e transcribeDocument.
    const url = new URL('/api/care/invites', webBaseUrl || '').toString()
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ paraContato: contato }),
      signal: s,
    })
    const corpo = await res.json().catch(() => ({})) as { id?: string; entrega?: EntregaDoConvite; canal?: CanalDoConvite; error?: string }
    if (!res.ok) throw new Error(corpo.error || 'Não consegui enviar o convite.')
    return {
      id: corpo.id ?? '',
      entrega: corpo.entrega ?? 'pendente',
      canal: corpo.canal ?? 'desconhecido',
    }
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
