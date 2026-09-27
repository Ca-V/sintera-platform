// @sintera/api-client — CARE-003: o que o profissional LÊ de uma pessoa que o autorizou.
//
// ============================================================================================
// QUEM IMPÕE O LIMITE
// ============================================================================================
// O RLS, e só ele. As 8 policies da migração 161 leem `profissional_tem_vinculo_ativo(user_id, '<modulo>')`,
// que confere vínculo ATIVO e o módulo no escopo. Este arquivo NÃO filtra por segurança: se uma consulta
// daqui devolvesse dado indevido, o defeito seria a policy, não este arquivo.
//
// O `.eq('user_id', ...)` existe para BUSCAR a pessoa certa, não para proteger ninguém. Pedir dado de quem
// não autorizou devolve lista vazia — não erro, e é assim que deve ser.
//
// ============================================================================================
// POR QUE NÃO REUSA OS LEITORES EXISTENTES
// ============================================================================================
// Os leitores da plataforma resolvem o dono pela SESSÃO (`session.user.id`). Reaproveitá-los exigiria
// acrescentar um parâmetro "de quem" em cada um — e um leitor que aceita dono arbitrário é exatamente o tipo
// de função que, num descuido futuro, é chamada com o id errado numa tela do próprio titular.
//
// Aqui o dono é sempre EXPLÍCITO e o arquivo inteiro existe só para este caso. Fica óbvio onde olhar.
//
// ============================================================================================
// O QUE ESTE ARQUIVO DEVOLVE
// ============================================================================================
// Data, título e nada mais — o suficiente para o profissional se situar. O documento em si continua atrás da
// tela do módulo. Nenhum campo de interpretação clínica é montado aqui: a plataforma preserva, organiza e
// apresenta, e não produz conteúdo clínico (RDC 657).
import type { SupabaseClient } from '@supabase/supabase-js'
import { withTimeout } from '../net/timeout'
import { asError } from '../net/errors'

export interface ItemDoModulo {
  readonly id: string
  /** ISO. `null` quando o registro não tem data própria — a tela decide como dizer isso. */
  readonly data: string | null
  readonly titulo: string
}

export interface ConteudoDoModulo {
  readonly chave: string
  readonly total: number
  readonly itens: readonly ItemDoModulo[]
}

/** Quantos itens recentes cada módulo mostra no resumo. Lista inteira é trabalho da tela do módulo. */
const RECENTES = 5

interface Fonte {
  tabela: string
  colunas: string
  ordem: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  mapear: (l: any) => ItemDoModulo
}

/**
 * De onde vem cada módulo. As chaves são as MESMAS das policies da 161 e de `care_links.escopo` — sem
 * tradução no meio, porque um mapa entre dois vocabulários é mais um lugar para divergir em silêncio.
 */
const FONTE: Readonly<Record<string, Fonte>> = {
  exames: {
    tabela: 'exams',
    colunas: 'id, exam_date, display_title, type',
    ordem: 'exam_date',
    mapear: (l) => ({ id: l.id, data: l.exam_date ?? null, titulo: l.display_title || l.type || 'Exame' }),
  },
  documentos: {
    tabela: 'patient_documents',
    colunas: 'id, doc_date, subtype, issuer',
    ordem: 'doc_date',
    mapear: (l) => ({ id: l.id, data: l.doc_date ?? null, titulo: l.subtype || l.issuer || 'Documento' }),
  },
  medidas: {
    tabela: 'body_metrics',
    colunas: 'id, measured_on, label, metric, value_text, unit',
    ordem: 'measured_on',
    mapear: (l) => ({
      id: l.id,
      data: l.measured_on ?? null,
      // Valor e unidade juntos: número sem unidade não diz nada, e unidade sem número menos ainda.
      titulo: [l.label || l.metric, l.value_text ? `${l.value_text}${l.unit ? ` ${l.unit}` : ''}` : null]
        .filter(Boolean).join(': ') || 'Medida',
    }),
  },
  'historico-saude': {
    tabela: 'health_events',
    colunas: 'id, event_date, title, event_type',
    ordem: 'event_date',
    mapear: (l) => ({ id: l.id, data: l.event_date ?? null, titulo: l.title || l.event_type || 'Registro' }),
  },
}

/**
 * O conteúdo dos módulos AUTORIZADOS desta pessoa.
 *
 * Módulo fora do catálogo é IGNORADO, não quebra (Modelo Aberto): escopo é `text[]` no banco e pode conter
 * valor que este cliente ainda não conhece. Derrubar a tela inteira por causa de uma chave nova seria trocar
 * uma degradação por uma falha.
 *
 * Um módulo que ERRA não zera os outros: a pessoa autorizou quatro áreas, e uma indisponível não pode apagar
 * as três que funcionam. O erro vira `total: -1`, que a tela traduz — silenciar seria pior.
 */
export async function getConteudoDosModulos(
  client: SupabaseClient, pacienteUserId: string, escopo: readonly string[], signal?: AbortSignal,
): Promise<ConteudoDoModulo[]> {
  const { signal: s, cleanup } = withTimeout(signal)
  try {
    const chaves = escopo.filter(c => FONTE[c])

    return await Promise.all(chaves.map(async (chave): Promise<ConteudoDoModulo> => {
      const f = FONTE[chave]
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data, error, count } = await (client as any)
          .from(f.tabela)
          .select(f.colunas, { count: 'exact' })
          .eq('user_id', pacienteUserId)
          .order(f.ordem, { ascending: false, nullsFirst: false })
          .limit(RECENTES)
          .abortSignal(s)
        if (error) throw asError(error)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return { chave, total: count ?? 0, itens: ((data ?? []) as any[]).map(f.mapear) }
      } catch {
        return { chave, total: -1, itens: [] }
      }
    }))
  } finally {
    cleanup()
  }
}
