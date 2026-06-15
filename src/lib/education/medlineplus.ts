// ============================================================
// SINTERA — Camada Educacional: MedlinePlus Connect (NIH)
// ============================================================
// Busca conteúdo educativo LEIGO sobre O QUE É um exame, a partir do código
// LOINC do tipo de exame. Ver docs/clinical/GOVERNANCA-CIENTIFICA.md §1.1.
//
// FRONTEIRA (não-negociável):
//   - É material EDUCATIVO sobre o exame em geral, NUNCA interpretação do
//     resultado da usuária. Só enviamos o código LOINC do TIPO de exame —
//     nenhum valor, nenhum dado de saúde individual sai daqui.
//   - O MedlinePlus oferece conteúdo em inglês ('en') e espanhol ('es'); não
//     há português. A camada é claramente rotulada como referência externa.
//
// Este arquivo é PURO (sem fetch): monta a URL e parseia a resposta JSON do
// Connect. O fetch propriamente vive em fetchMedlinePlusByLoinc (abaixo), para
// manter a lógica testável sem rede.
// ============================================================

/** OID do sistema de códigos LOINC, exigido pelo MedlinePlus Connect. */
export const LOINC_OID = '2.16.840.1.113883.6.1'

export const MEDLINEPLUS_CONNECT_BASE = 'https://connect.medlineplus.gov/service'

export type MedlineLanguage = 'en' | 'es'

export interface MedlineTopic {
  title: string
  url: string
  /** Resumo em texto puro (HTML removido), quando disponível. */
  summary: string | null
}

/**
 * Monta a URL do MedlinePlus Connect para um código LOINC.
 * Pura — não faz requisição.
 */
export function buildConnectUrl(loincCode: string, language: MedlineLanguage = 'en'): string {
  const params = new URLSearchParams({
    'mainSearchCriteria.v.cs': LOINC_OID,
    'mainSearchCriteria.v.c': loincCode,
    'knowledgeResponseType': 'application/json',
    'informationRecipient.languageCode.c': language,
  })
  return `${MEDLINEPLUS_CONNECT_BASE}?${params.toString()}`
}

/** Remove tags HTML e normaliza espaços de um resumo. */
function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Parseia a resposta JSON do Connect (formato Atom serializado) numa lista de
 * tópicos. Tolerante a campos ausentes; retorna [] se não houver entradas.
 * Pura — recebe o objeto já desserializado.
 */
export function parseConnectResponse(json: unknown): MedlineTopic[] {
  const feed = (json as { feed?: { entry?: unknown } } | null)?.feed
  const rawEntries = feed?.entry
  if (!Array.isArray(rawEntries)) return []

  const topics: MedlineTopic[] = []
  for (const e of rawEntries) {
    const entry = e as {
      title?: { _value?: string } | string
      link?: Array<{ href?: string }> | { href?: string }
      summary?: { _value?: string } | string
    }

    const title = typeof entry.title === 'string' ? entry.title : entry.title?._value ?? ''
    const links = Array.isArray(entry.link) ? entry.link : entry.link ? [entry.link] : []
    const url = links.find(l => l?.href)?.href ?? ''
    const rawSummary = typeof entry.summary === 'string' ? entry.summary : entry.summary?._value ?? ''
    const summary = rawSummary ? stripHtml(rawSummary) : null

    if (title && url) topics.push({ title, url, summary })
  }
  return topics
}

/**
 * Busca tópicos educativos do MedlinePlus para um código LOINC.
 * Faz a requisição (server-side), com timeout. Em qualquer falha de rede ou
 * formato, retorna [] — a camada é não-essencial e nunca deve quebrar a página.
 * NÃO envia nenhum dado individual da usuária — apenas o código do tipo de exame.
 */
export async function fetchMedlinePlusByLoinc(
  loincCode: string,
  language: MedlineLanguage = 'en',
  timeoutMs = 6000,
): Promise<MedlineTopic[]> {
  if (!loincCode) return []
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const res = await fetch(buildConnectUrl(loincCode, language), {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
      // Conteúdo do tipo de exame muda raramente; cache de 1 dia no edge.
      next: { revalidate: 86400 },
    })
    if (!res.ok) return []
    const json = await res.json()
    return parseConnectResponse(json)
  } catch {
    return []
  } finally {
    clearTimeout(timer)
  }
}
