// @sintera/core — CARE-003 §8 etapa 5: o que a Rede de Cuidado MOSTRA.
//
// BASE ÚNICA. O menu e as seções desta tela eram decididos duas vezes — uma em `src/app/dashboard/
// rede-de-cuidado/page.tsx`, outra em `RedeCuidadoMenuScreen.tsx` — com as mesmas três linhas digitadas nos
// dois lugares. Enquanto as duas listas eram iguais, ninguém notava; no dia em que uma mudasse, as pontas
// divergiriam em silêncio. O mecanismo pode divergir (Pressable × Link); a DECISÃO — quais linhas, em que
// ordem, com que texto e em que estado — não.

export type DestinoRede = 'relatorio' | 'profissionais' | 'compartilhamentos'

export interface LinhaDoMenu {
  readonly destino: DestinoRede
  readonly label: string
  readonly disponivel: boolean
}

/**
 * As linhas do menu, na ordem. `Compartilhamentos` segue indisponível — depende do Care Space (CARE-001),
 * que é Fase 4. Prometer o que não existe é o que corrói a confiança, então ele aparece com o motivo.
 */
export const MENU_REDE: readonly LinhaDoMenu[] = [
  { destino: 'relatorio', label: 'Relatórios', disponivel: true },
  { destino: 'profissionais', label: 'Profissionais', disponivel: true },
  { destino: 'compartilhamentos', label: 'Compartilhamentos', disponivel: false },
]

// ------------------------------------------------------------------------------------------------------
// A tela de Profissionais
// ------------------------------------------------------------------------------------------------------

import type { StatusVinculo } from './vinculo'
import type { StatusConvite } from './convite'
import { estaVencido } from './convite'
import { type Profissao, nomeDaProfissao } from '../professional/perfil'

export interface VinculoNaLista {
  readonly id: string
  readonly nomeProfissional: string
  readonly profissao: Profissao
  readonly especialidade?: string | null
  readonly status: StatusVinculo
  readonly escopo: readonly string[]
  readonly desde?: Date | null
}

export interface ConviteNaLista {
  readonly id: string
  readonly paraContato: string
  readonly status: StatusConvite
  readonly criadoEm: Date
  readonly expiraEm: Date
}

export type ChaveSecao = 'acompanhando' | 'convites' | 'encerrados'

export interface SecaoDaRede {
  readonly chave: ChaveSecao
  readonly titulo: string
  readonly vinculos: readonly VinculoNaLista[]
  readonly convites: readonly ConviteNaLista[]
}

/**
 * Como a tela se organiza.
 *
 * Três decisões embutidas, e as três têm motivo:
 *
 * 1. Só vínculo ATIVO aparece em "Acompanhando você". Um vínculo convidado ainda não concede nada, e mostrá-lo
 *    ao lado dos ativos sugeriria acesso que não existe.
 * 2. Convite vencido aparece como vencido, nunca como pendente. Pendência que nunca resolve vira ruído, e
 *    ruído é o que faz a pessoa parar de ler os avisos que importam.
 * 3. Encerrados NÃO somem. Revogar é ato dela e fica registrado — é o histórico de quem já teve acesso aos
 *    dados dela, e esconder isso seria esconder exatamente o que a auditoria existe para preservar.
 */
export function secoesDaRedeDeCuidado(
  vinculos: readonly VinculoNaLista[],
  convites: readonly ConviteNaLista[],
  agora: Date,
): SecaoDaRede[] {
  const ativos = vinculos.filter(v => v.status === 'ativo')
  const encerrados = vinculos.filter(v => v.status === 'revogado' || v.status === 'encerrado')
  const pendentes = convites.filter(c => c.status === 'enviado' && !estaVencido(c, agora))
  const resolvidos = convites.filter(c => c.status !== 'enviado' || estaVencido(c, agora))

  const secoes: SecaoDaRede[] = []
  if (ativos.length > 0) {
    secoes.push({ chave: 'acompanhando', titulo: 'Acompanhando você', vinculos: ativos, convites: [] })
  }
  if (pendentes.length > 0) {
    secoes.push({ chave: 'convites', titulo: 'Convites enviados', vinculos: [], convites: pendentes })
  }
  if (encerrados.length > 0 || resolvidos.length > 0) {
    secoes.push({ chave: 'encerrados', titulo: 'Encerrados', vinculos: encerrados, convites: resolvidos })
  }
  return secoes
}

/** A tela está vazia quando não há nada em nenhuma seção — nem ativo, nem convite, nem histórico. */
export function redeEstaVazia(vinculos: readonly VinculoNaLista[], convites: readonly ConviteNaLista[], agora: Date): boolean {
  return secoesDaRedeDeCuidado(vinculos, convites, agora).length === 0
}

/** Como o profissional é identificado na lista. Nunca o identificador cru da profissão. */
export function descricaoDoProfissional(v: Pick<VinculoNaLista, 'profissao' | 'especialidade'>): string {
  const base = nomeDaProfissao(v.profissao)
  const esp = v.especialidade?.trim()
  return esp ? `${base} · ${esp}` : base
}

/**
 * Quantos módulos este profissional enxerga, para a pessoa saber de relance o tamanho do acesso que concedeu.
 * Número, não lista: a lista inteira em cada cartão vira parede de texto e ninguém lê.
 */
export function resumoDoEscopo(escopo: readonly string[]): string {
  const n = escopo.length
  if (n === 0) return 'Sem acesso a nenhuma área'
  return n === 1 ? 'Acesso a 1 área' : `Acesso a ${n} áreas`
}
