// @sintera/core — CONTRATO DO CARTÃO DE DOCUMENTO: a mesma anatomia em toda categoria.
//
// PEDIDO DA FUNDADORA (25/08): "precisa ter o mesmo padrão de nomenclatura de opcionais em todos os documentos
// inseridos, com ajustes apenas de nomenclatura por categoria. (...) pelo menos as opções de editar e excluir
// são obrigatórias."
//
// O QUE ESTAVA ERRADO, medido no mesmo dia:
//
//   tela              ver  editar  excluir  ciclo
//   Exames Web         ✓     ✓        ✓       ✓
//   Receitas Web       ✓     ✓        ✓       —
//   Exames Mobile      ✓     ✗        ✓       ✓
//   Receitas Mobile    ✓     ✗        ✓       —
//
// NENHUMA tela do Mobile permitia editar um documento. E `updateDocument` existia no api-client com ZERO
// consumidores — a capacidade estava escrita e nunca ligada.
//
// A REGRA: ver · editar · excluir existem em TODO documento, sem exceção. A ação de CICLO — o que se faz com
// aquele documento ao longo da vida dele — é o único ponto que varia por categoria, e é declarada aqui, não
// inventada na tela.

/** As categorias documentais da plataforma, para efeito de AÇÕES no cartão. */
export type DocumentCategory = 'exame' | 'pedido' | 'receita' | 'atestado' | 'relatorio' | 'encaminhamento' | 'outro'

/** O que uma ação faz, para a tela escolher a aparência sem decidir o texto. */
export type CardActionKind = 'view' | 'edit' | 'delete' | 'lifecycle'

export interface CardAction {
  key: string
  label: string
  kind: CardActionKind
  /** Confirmação obrigatória antes de executar (exclusão, e o que mais for irreversível). */
  confirms?: boolean
}

/** OBRIGATÓRIAS — presentes em todo documento, com a MESMA redação em toda tela e nas duas plataformas. */
export const DOCUMENT_BASE_ACTIONS: readonly CardAction[] = [
  { key: 'view',   label: 'Ver documento', kind: 'view' },
  { key: 'edit',   label: 'Editar',        kind: 'edit' },
  { key: 'delete', label: 'Excluir',       kind: 'delete', confirms: true },
]

/**
 * Ações de CICLO por categoria — o que acontece com aquele documento ao longo do tempo.
 *
 * Só o pedido tem ciclo hoje: ele é a ORIGEM do fluxo assistencial (Q1) e caminha para agendamento e
 * realização. Exame, receita e atestado são registros do que já aconteceu — não têm etapa seguinte.
 *
 * A ponte receita → aquisição ("gerar um item a comprar") está registrada como decisão em aberto: quando
 * existir, entra AQUI, e as duas pontas a ganham ao mesmo tempo.
 */
const LIFECYCLE: Partial<Record<DocumentCategory, readonly CardAction[]>> = {
  pedido: [
    { key: 'fulfill',  label: 'Marcar como realizado', kind: 'lifecycle' },
    { key: 'schedule', label: 'Agendar',               kind: 'lifecycle' },
  ],
}

/**
 * O conjunto COMPLETO de ações de um cartão, na ordem de exibição: ciclo primeiro (é o que a pessoa costuma
 * querer fazer), depois ver, editar e excluir.
 *
 * Uma categoria nova nasce com ver/editar/excluir sem ninguém precisar lembrar — que é o ponto.
 */
export function documentCardActions(category: DocumentCategory): CardAction[] {
  return [...(LIFECYCLE[category] ?? []), ...DOCUMENT_BASE_ACTIONS]
}

/** As obrigatórias estão todas presentes? Guarda para o teste — e para a próxima tela que alguém escrever. */
export function hasRequiredActions(actions: readonly CardAction[]): boolean {
  return (['view', 'edit', 'delete'] as CardActionKind[]).every(k => actions.some(a => a.kind === k))
}
