// @sintera/core — CARE-003: o que a pessoa JÁ COMPARTILHOU, e como ela desfaz isso.
//
// ============================================================================================
// POR QUE ESTA TELA EXISTE — E A CORREÇÃO DE UM ERRO MEU
// ============================================================================================
// `MENU_REDE` trazia "Compartilhamentos" como indisponível, com o motivo "entram junto com o espaço de
// consulta" — ou seja, dependendo do Care Space (CARE-001), que é Fase 4.
//
// Estava errado, e o erro foi de método: eu li o NOME do conceito ("compartilhamento" soa como o espaço
// colaborativo) e deduzi a dependência, em vez de olhar o que já existe. `report_shares` está em produção
// desde a migração 043, com criar/listar/revogar prontos em `@sintera/api-client`. A pessoa já cria links
// públicos pela tela de Relatório. O que faltava era o lugar onde ela VÊ o que criou e DESFAZ.
//
// Care Space é outra coisa: espaço de conversa com o profissional, com Snapshot imutável. Continua Fase 4.
//
// ============================================================================================
// ADR-001 — QUEM É DONO DO FATO
// ============================================================================================
// O domínio Relatório é dono do compartilhamento: é ele que cria o link, define seções, período e prazo. A
// Rede de Cuidado **projeta** essa informação — não duplica a regra, não cria uma segunda tabela, não decide
// o que é um link válido. Este arquivo só decide COMO a Rede de Cuidado APRESENTA o que o Relatório possui.
//
// ============================================================================================
// A DECISÃO MAIS IMPORTANTE DAQUI: O LINK É PÚBLICO
// ============================================================================================
// `report_shares` gera uma URL com token e a página `/r/<token>` não pede login. Quem tiver o endereço vê o
// relatório — encaminhou no WhatsApp, vê; caiu num print, vê. Isso não é defeito: é o que faz o link servir
// para o médico que não tem conta. Mas é um fato que muda o comportamento de quem compartilha, e por isso ele
// é dito na tela, antes, em vez de descoberto depois.

import { REPORT_GROUPS, type ReportSectionKey } from '../report/assemble'

/**
 * O estado de um link. A ordem de precedência importa e não é arbitrária: **revogado vence expirado**.
 *
 * Um link revogado e depois vencido foi encerrado por ato dela — e ela precisa ver o próprio ato, não o
 * relógio. Inverter isso apagaria da tela a decisão que ela tomou.
 */
export type EstadoDoCompartilhamento = 'ativo' | 'expirado' | 'revogado'

export interface CompartilhamentoNaLista {
  readonly id: string
  readonly token: string
  readonly criadoEm: Date
  readonly expiraEm: Date
  readonly revogado: boolean
  /** As seções incluídas no link, como o Relatório as gravou. Vazio = relatório inteiro. */
  readonly secoes: readonly string[]
}

export function estadoDoCompartilhamento(c: Pick<CompartilhamentoNaLista, 'revogado' | 'expiraEm'>, agora: Date): EstadoDoCompartilhamento {
  if (c.revogado) return 'revogado'
  return c.expiraEm.getTime() <= agora.getTime() ? 'expirado' : 'ativo'
}

/** Só link ativo pode ser revogado. Oferecer o botão nos outros seria prometer um efeito que não existe. */
export function podeRevogar(estado: EstadoDoCompartilhamento): boolean {
  return estado === 'ativo'
}

/** O link ainda abre? É a pergunta que a pessoa realmente faz — e só `ativo` responde sim. */
export function estaAberto(estado: EstadoDoCompartilhamento): boolean {
  return estado === 'ativo'
}

// ------------------------------------------------------------------------------------------------------
// O endereço
// ------------------------------------------------------------------------------------------------------

/**
 * A URL pública do link. `base` vem de quem chama porque Web e aplicativo têm origens diferentes — o
 * MECANISMO diverge, a rota `/r/<token>` não (BASE ÚNICA).
 */
export function urlDoCompartilhamento(token: string, base: string): string {
  const raiz = base.replace(/\/+$/, '')
  return `${raiz}/r/${token}`
}

// ------------------------------------------------------------------------------------------------------
// O que a pessoa lê
// ------------------------------------------------------------------------------------------------------

/**
 * O rótulo do estado. Nenhum deles é ambíguo sobre a única coisa que importa: o link abre ou não abre.
 *
 * O prazo aparece no rótulo do link ATIVO porque é a informação que muda a decisão — compartilhar de novo ou
 * deixar vencer. Nos outros estados o prazo é passado e só ocuparia espaço.
 */
export function rotuloDoCompartilhamento(c: CompartilhamentoNaLista, agora: Date, formatarData: (d: Date) => string): string {
  switch (estadoDoCompartilhamento(c, agora)) {
    case 'ativo':    return `Aberto até ${formatarData(c.expiraEm)}`
    case 'expirado': return `Venceu em ${formatarData(c.expiraEm)} — o link não abre mais`
    case 'revogado': return 'Você encerrou este link — ele não abre mais'
  }
}

/** O rótulo de TODOS os nomes de seção, na taxonomia da Sidebar (SSOT). */
const NOME_DA_SECAO: Readonly<Record<string, string>> =
  Object.fromEntries(REPORT_GROUPS.flatMap(g => g.items.map(i => [i.key, i.label] as const)))

/**
 * O que aquele link mostra, em nomes que a pessoa reconhece.
 *
 * NUNCA devolve a chave crua. Uma chave desconhecida — seção removida do produto, link antigo — é omitida da
 * contagem em vez de aparecer como `histexames`, porque a lista existe para ela saber o que expôs, e um
 * identificador interno não responde isso.
 */
export function resumoDoConteudo(secoes: readonly string[], maximo = 3): string {
  if (secoes.length === 0) return 'Relatório inteiro'
  const nomes = secoes.map(s => NOME_DA_SECAO[s]).filter((n): n is string => Boolean(n))
  if (nomes.length === 0) return 'Relatório inteiro'
  if (nomes.length <= maximo) return nomes.join(' · ')
  const restantes = nomes.length - maximo
  return `${nomes.slice(0, maximo).join(' · ')} e mais ${restantes}`
}

/** Toda seção do Relatório tem nome aqui. Se uma nova entrar sem rótulo, a catraca acusa. */
export function secoesSemNome(): ReportSectionKey[] {
  return REPORT_GROUPS.flatMap(g => g.items.map(i => i.key)).filter(k => !NOME_DA_SECAO[k])
}

// ------------------------------------------------------------------------------------------------------
// A tela
// ------------------------------------------------------------------------------------------------------

export type ChaveSecaoCompartilhamento = 'abertos' | 'encerrados'

export interface SecaoDeCompartilhamentos {
  readonly chave: ChaveSecaoCompartilhamento
  readonly titulo: string
  readonly itens: readonly CompartilhamentoNaLista[]
}

/**
 * Como a tela se organiza. Mesma forma da tela de Profissionais, e pela mesma razão:
 *
 * 1. O que está ABERTO vem primeiro, porque é o que ainda expõe dado e o que ela pode desfazer.
 * 2. ENCERRADOS não somem — vencidos e revogados juntos. É o histórico de o que já saiu da plataforma, e
 *    esconder isso seria esconder exatamente o que uma auditoria precisaria ver.
 * 3. Seção vazia não aparece. Título sem conteúdo é ruído, e ruído faz a pessoa parar de ler o que importa.
 */
export function secoesDeCompartilhamentos(
  itens: readonly CompartilhamentoNaLista[],
  agora: Date,
): SecaoDeCompartilhamentos[] {
  const abertos = itens.filter(c => estaAberto(estadoDoCompartilhamento(c, agora)))
  const encerrados = itens.filter(c => !estaAberto(estadoDoCompartilhamento(c, agora)))

  const secoes: SecaoDeCompartilhamentos[] = []
  if (abertos.length > 0) secoes.push({ chave: 'abertos', titulo: 'Links abertos', itens: abertos })
  if (encerrados.length > 0) secoes.push({ chave: 'encerrados', titulo: 'Encerrados', itens: encerrados })
  return secoes
}

export function compartilhamentosVazio(itens: readonly CompartilhamentoNaLista[]): boolean {
  return itens.length === 0
}
