// @sintera/api-client — BUSCA GLOBAL nos registros da pessoa. Uma implementação, duas pontas.
//
// PEDIDO DA FUNDADORA (28/08): "qualquer palavra que estiver dentro da plataforma precisa ser encontrada.
// Quando eu digito 'vitamina D', devem aparecer todos os lugares que têm vitamina D — pode ser suplemento, pode
// ser resultado de exame — para eu escolher em qual quero entrar."
//
// COMO. Uma consulta por domínio, em PARALELO, cada uma com `ilike` e limite pequeno. Não há tabela de índice
// nem função no banco: nenhuma migração é necessária, e cada consulta atravessa o RLS normalmente — a busca
// enxerga exatamente o que a pessoa enxerga, nem um registro a mais.
//
// POR QUE PARALELO E NÃO UMA CONSULTA SÓ. Uma função SQL com UNION seria um round-trip em vez de dez, e é o
// caminho certo quando o volume crescer. Mas exigiria DDL em produção, e a busca vale hoje. Quando doer,
// troca-se AQUI dentro, sem que nenhuma tela perceba.
//
// FALHA PARCIAL NÃO DERRUBA A BUSCA. Se uma consulta falhar — tabela indisponível, permissão, o que for — ela
// contribui com zero resultados e as outras seguem. Uma busca que devolve 8 de 10 domínios é útil; uma que
// devolve erro porque um domínio tropeçou não é.
import type { SupabaseClient } from '@supabase/supabase-js'
import { shouldQuery, type SearchHit } from '@sintera/core'

/** Achados por domínio. Pequeno de propósito: a tela é um celular, e quem não achou refina a palavra. */
const LIMITE_POR_DOMINIO = 6

/** Escapa os curingas do `ilike` para que "100%" não vire "qualquer coisa". */
function termo(query: string): string {
  return `%${query.trim().replace(/[\\%_]/g, m => '\\' + m)}%`
}

type Linha = Record<string, unknown>
const texto = (v: unknown): string => (typeof v === 'string' ? v : '')

/** Data legível curta (dd/mm/aaaa). Vazio quando não há data. */
function quando(iso: unknown): string {
  const s = texto(iso).slice(0, 10)
  const [y, m, d] = s.split('-')
  return d && m && y ? `${d}/${m}/${y}` : ''
}

/**
 * Procura o termo em TODOS os domínios de registro da pessoa.
 *
 * Devolve os achados crus, sem ordenar: quem ordena, agrupa e limita é o core (`rankHits`/`groupHits`), para
 * que as duas pontas apresentem a MESMA lista na MESMA ordem.
 */
export async function searchRecords(client: SupabaseClient, query: string): Promise<SearchHit[]> {
  if (!shouldQuery(query)) return []
  const q = termo(query)

  // `PromiseLike`, e não `Promise`: o construtor de consulta do Supabase é *thenable* — dá para esperar, mas não
  // tem `.catch`. Exigir `Promise` aqui obrigaria cada chamada a um `await` extra só para satisfazer o tipo.
  /**
   * Uma consulta que nunca derruba a busca: erro vira lista vazia — MAS ELE É DITO.
   *
   * A primeira versão desta função só olhava `data` e engolia `error`. Na homologação de 30/08 isso escondeu um
   * defeito caro: eu tinha escrito `type` e `date` onde as colunas se chamam `event_type` e `event_date`. O
   * Supabase NÃO LANÇA nesse caso — devolve `data: null` e o erro no campo `error`. Como eu só olhava `data`,
   * TRÊS dos doze domínios (agenda, recursos e condições) devolviam vazio sem um sinal sequer, e a fundadora
   * buscou "dermatologista", que estava lá em três eventos, e não achou nada.
   *
   * Degradar é certo; degradar CALADO não. A busca continua útil com 9 de 12 domínios, mas quem mantém o código
   * precisa saber que 3 morreram — senão o defeito só aparece quando alguém procura a palavra exata.
   */
  async function busca(nome: string, fn: () => PromiseLike<{ data: unknown; error?: unknown }>): Promise<Linha[]> {
    try {
      const { data, error } = await fn()
      if (error) {
        console.warn(`[SINTERA] busca: domínio "${nome}" falhou e devolveu vazio.`, error)
        return []
      }
      return Array.isArray(data) ? (data as Linha[]) : []
    } catch (e) {
      console.warn(`[SINTERA] busca: domínio "${nome}" lançou e devolveu vazio.`, e)
      return []
    }
  }

  const [meds, recursos, indicadores, resultados, exames, documentos, condicoes, habitos, eventos, atividades, sinais] =
    await Promise.all([
      busca('medicamentos', () => client.from('medications').select('id, name, brand, kind, dose').or(`name.ilike.${q},brand.ilike.${q},prescriber_name.ilike.${q},notes.ilike.${q}`).limit(LIMITE_POR_DOMINIO)),
      busca('recursos', () => client.from('health_resources').select('id, name, brand, resource_type').or(`name.ilike.${q},brand.ilike.${q}`).limit(LIMITE_POR_DOMINIO)),
      busca('indicadores', () => client.from('biomarkers').select('id, name, value, unit, exam_id, exams(exam_date)').ilike('name', q).limit(LIMITE_POR_DOMINIO)),
      busca('resultados', () => client.from('clinical_results').select('id, name, exam_id').or(`name.ilike.${q},raw_text.ilike.${q}`).limit(LIMITE_POR_DOMINIO)),
      busca('exames', () => client.from('exams').select('id, type, issuer, exam_date').or(`type.ilike.${q},issuer.ilike.${q},notes.ilike.${q},exam_text.ilike.${q}`).limit(LIMITE_POR_DOMINIO)),
      busca('documentos', () => client.from('patient_documents').select('id, subtype, issuer, doc_date').or(`subtype.ilike.${q},issuer.ilike.${q},notes.ilike.${q}`).limit(LIMITE_POR_DOMINIO)),
      busca('condições', () => client.from('health_conditions').select('id, name, scope').ilike('name', q).limit(LIMITE_POR_DOMINIO)),
      busca('hábitos', () => client.from('life_habits').select('id, category, notes').ilike('category', q).limit(LIMITE_POR_DOMINIO)),
      busca('agenda', () => client.from('health_events').select('id, title, event_type, event_date, professional_name, establishment, notes').or(`title.ilike.${q},professional_name.ilike.${q},establishment.ilike.${q},notes.ilike.${q}`).limit(LIMITE_POR_DOMINIO)),
      busca('atividades', () => client.from('activity_sessions').select('id, title, activity_type, started_at').or(`title.ilike.${q},activity_type.ilike.${q}`).limit(LIMITE_POR_DOMINIO)),
      busca('sinais vitais', () => client.from('body_metrics').select('id, label, metric, value_text, unit, measured_on').or(`label.ilike.${q},metric.ilike.${q}`).limit(LIMITE_POR_DOMINIO)),
    ])

  const hits: SearchHit[] = []

  // Medicamento e suplemento moram na MESMA tabela, distinguidos por `kind` — como na Web e no aplicativo.
  for (const r of meds) {
    const suplemento = texto(r.kind) === 'suplemento'
    hits.push({
      kind: suplemento ? 'suplemento' : 'medicamento',
      id: texto(r.id),
      title: texto(r.name),
      subtitle: [texto(r.brand), texto(r.dose)].filter(Boolean).join(' · ') || null,
      section: suplemento ? 'suplementos' : 'medicamentos',
    })
  }

  for (const r of recursos) {
    hits.push({ kind: 'recurso', id: texto(r.id), title: texto(r.name), subtitle: texto(r.brand) || null, section: 'recursos' })
  }

  // INDICADOR — o caso que originou o pedido: "vitamina D" é um analito dentro de um laudo. O subtítulo traz o
  // valor e a data porque é o que distingue a mesma vitamina D medida em exames diferentes.
  for (const r of indicadores) {
    const exame = r.exams as { exam_date?: unknown } | null
    const valor = [texto(r.value), texto(r.unit)].filter(Boolean).join(' ')
    const data = quando(exame?.exam_date)
    hits.push({
      kind: 'indicador', id: texto(r.id), title: texto(r.name),
      subtitle: [valor, data && `exame de ${data}`].filter(Boolean).join(' · ') || null,
      section: 'historico-exames',
    })
  }
  for (const r of resultados) {
    hits.push({ kind: 'indicador', id: texto(r.id), title: texto(r.name), subtitle: null, section: 'historico-exames' })
  }

  for (const r of exames) {
    const data = quando(r.exam_date)
    hits.push({
      kind: 'exame', id: texto(r.id), title: texto(r.type) || 'Exame',
      subtitle: [texto(r.issuer), data].filter(Boolean).join(' · ') || null,
      section: 'exames',
    })
  }

  for (const r of documentos) {
    const data = quando(r.doc_date)
    hits.push({
      kind: 'documento', id: texto(r.id), title: texto(r.subtype) || 'Documento',
      subtitle: [texto(r.issuer), data].filter(Boolean).join(' · ') || null,
      section: 'documentos',
    })
  }

  for (const r of condicoes) {
    hits.push({ kind: 'condicao', id: texto(r.id), title: texto(r.name), subtitle: texto(r.scope) || null, section: 'condicoes' })
  }

  for (const r of habitos) {
    hits.push({ kind: 'habito', id: texto(r.id), title: texto(r.category), subtitle: texto(r.notes) || null, section: 'habitos' })
  }

  for (const r of eventos) {
    hits.push({
      kind: 'evento', id: texto(r.id), title: texto(r.title),
      subtitle: [texto(r.professional_name), quando(r.event_date)].filter(Boolean).join(' · ') || null,
      section: 'agenda',
    })
  }

  for (const r of atividades) {
    hits.push({
      kind: 'atividade', id: texto(r.id),
      title: texto(r.title) || texto(r.activity_type),
      subtitle: quando(r.started_at) || null,
      section: 'monitoramento',
    })
  }

  for (const r of sinais) {
    const valor = [texto(r.value_text), texto(r.unit)].filter(Boolean).join(' ')
    hits.push({
      kind: 'sinal', id: texto(r.id),
      title: texto(r.label) || texto(r.metric),
      subtitle: [valor, quando(r.measured_on)].filter(Boolean).join(' · ') || null,
      section: 'monitoramento',
    })
  }

  return hits.filter(h => h.title.trim() !== '')
}
