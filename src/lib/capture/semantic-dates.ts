// Datas semânticas (CEF §5) — engenharia da informação. Um documento tem VÁRIAS datas; a heurística
// antiga ("1ª data encontrada = data do exame") levou o EEG a "2002" e o laudo de 2009 a datas erradas.
//
// Aqui identificamos CADA data pelo seu RÓTULO/contexto e escolhemos a data de REALIZAÇÃO, nunca uma
// data de nascimento, impressão ou protocolo. Determinístico; sem juízo clínico. Baixa confiança →
// NÃO substitui um valor existente (regra do EEG "2002", CEF §5.2).

export type DateKind =
  | 'coleta' | 'realizacao' | 'liberacao' | 'assinatura'
  | 'impressao' | 'nascimento' | 'protocolo' | 'entrada' | 'desconhecida'

export interface DatedMatch {
  raw: string          // "11/05/2009"
  iso: string | null   // "2009-05-11" quando parseável
  kind: DateKind
}

export interface ExamDatePick {
  iso: string | null
  kind: DateKind
  confidence: 'high' | 'medium' | 'low'
  candidates: DatedMatch[]
}

// Rótulos por tipo (procurados ANTES da data, na mesma vizinhança).
const LABELS: { kind: DateKind; re: RegExp }[] = [
  { kind: 'nascimento', re: /(data\s+de\s+nascimento|dt\.?\s*nasc|nascimento|d\.?n\.?)/i },
  { kind: 'impressao',  re: /(data\s+impress|impress[ãa]o|impresso\s+em)/i },
  { kind: 'coleta',     re: /(data\s+da\s+coleta|coleta|coletado)/i },
  { kind: 'realizacao', re: /(data\s+(de\s+)?realiza|realizado\s+em|data\s+do\s+exame|exame\s+realizado)/i },
  { kind: 'liberacao',  re: /(liberado|libera[çc][ãa]o|data\s+de\s+libera)/i },
  { kind: 'assinatura', re: /(assinad[oa]|assinatura)/i },
  { kind: 'entrada',    re: /(data\s+de\s+entrada|entrada)/i },
  { kind: 'protocolo',  re: /(protocolo|atend\.?|acc\.?|requisi)/i },
]

// Separador de data tolerante à granulação (ver normalizeGarbledDigits): além de / . -, aceita
// 'N' — em alguns PDFs a '/' da data é mismapeada para a letra 'N' (glifo do font). Só é interpretado
// como separador DENTRO do padrão dd?sep mm?sep aaaa; nunca um replace global de 'N' (letra legítima).
const RE_DATE = /\b(\d{2})[/.\-N](\d{2})[/.\-N](\d{2,4})\b/g

// Reparo PONTUAL da granulação de dígito na leitura de datas. Assinatura OBSERVADA e comprovada por
// codepoints no laudo real (lab Precision, pedido *-SAVA): o dígito '2' é extraído como a sequência
// de 3 chars "(ᄀ)" = '(' (U+0028) + 'ᄀ' (U+1100, Hangul Choseong Kiyeok) + ')' (U+0029). U+1100 não
// ocorre em laudos em português — mapeamos "(ᄀ)" → '2'. ESPECÍFICO desta assinatura de corrupção
// (NÃO é um de-garble geral do extrator). Escopo: só a leitura/corroboração de datas — NÃO altera o
// exam_text persistido (âncora de rastreabilidade) nem o roteamento. O de-garble global do extrator
// (que reabilitaria Path A e limparia o exam_text) fica como follow-up isolado, fora deste escopo.
function normalizeGarbledDigits(text: string): string {
  return text.replace(/\(ᄀ\)/g, '2')
}

function toIso(d: string, m: string, y: string): string | null {
  const day = +d, mon = +m
  let year = +y
  if (y.length === 2) year = year >= 70 ? 1900 + year : 2000 + year
  if (mon < 1 || mon > 12 || day < 1 || day > 31 || year < 1900 || year > 2100) return null
  return `${year}-${String(mon).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

// O rótulo correto é o MAIS PRÓXIMO da data (rightmost no contexto), não o de maior prioridade —
// senão um "Dt Nasc" anterior "contamina" a data de coleta seguinte.
function classify(context: string): DateKind {
  let best: { kind: DateKind; idx: number } | null = null
  for (const { kind, re } of LABELS) {
    const g = new RegExp(re.source, re.flags.includes('g') ? re.flags : re.flags + 'g')
    let m: RegExpExecArray | null, last = -1
    while ((m = g.exec(context)) !== null) { last = m.index; if (m.index === g.lastIndex) g.lastIndex++ }
    if (last >= 0 && (best === null || last > best.idx)) best = { kind, idx: last }
  }
  return best?.kind ?? 'desconhecida'
}

// Prioridade da data de REALIZAÇÃO (nunca nascimento/impressão/protocolo).
const REALIZATION_PRIORITY: DateKind[] = ['realizacao', 'coleta', 'liberacao', 'assinatura', 'entrada', 'desconhecida']
const EXCLUDED: DateKind[] = ['nascimento', 'impressao', 'protocolo']

/**
 * Escolhe a data de REALIZAÇÃO do exame a partir do texto. Determinístico.
 */
export function pickExamDate(text: string | null | undefined): ExamDatePick {
  const t = normalizeGarbledDigits(text ?? '').replace(/\s+/g, ' ')
  const candidates: DatedMatch[] = []
  for (const m of t.matchAll(RE_DATE)) {
    const start = Math.max(0, (m.index ?? 0) - 40)
    const context = t.slice(start, (m.index ?? 0) + m[0].length)
    candidates.push({ raw: m[0], iso: toIso(m[1], m[2], m[3]), kind: classify(context) })
  }

  const usable = candidates.filter(c => c.iso && !EXCLUDED.includes(c.kind))
  if (usable.length === 0) return { iso: null, kind: 'desconhecida', confidence: 'low', candidates }

  // Escolhe pela prioridade de realização.
  for (const kind of REALIZATION_PRIORITY) {
    const hit = usable.find(c => c.kind === kind)
    if (hit) {
      const confidence: ExamDatePick['confidence'] =
        kind === 'realizacao' || kind === 'coleta' ? 'high' : kind === 'desconhecida' ? 'low' : 'medium'
      return { iso: hit.iso, kind, confidence, candidates }
    }
  }
  return { iso: usable[0].iso, kind: usable[0].kind, confidence: 'low', candidates }
}

/**
 * CORROBORAÇÃO (Obs 10) — a data (ISO) só é FATO se aparecer na FONTE. A extração da IA pode devolver uma
 * data BEM-FORMADA porém INVENTADA (sem evidência no texto: ex.: cabeçalho em imagem). Verifica se a data
 * ISO aparece no texto-fonte em alguma representação numérica comum (BR dd/mm/aaaa[aa] ou ISO), com
 * separadores / . -. Determinística. Formato válido ≠ evidência: só quem passa aqui pode ser persistido a
 * partir da IA; sem corroboração, a data fica ausente ("Sem data"), nunca uma data inventada.
 */
export function isExamDateCorroborated(iso: string | null | undefined, text: string | null | undefined): boolean {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec((iso ?? '').trim())
  if (!m || !text) return false
  const [, y, mo, d] = m
  const t = normalizeGarbledDigits(text).replace(/\s+/g, ' ')
  const y2 = y.slice(2)
  const dN = String(+d), moN = String(+mo)
  const forms: string[] = []
  // 'N' aceito como separador (granulação de PDF: '/' → 'N'); ver RE_DATE/normalizeGarbledDigits.
  for (const s of ['/', '.', '-', 'N']) {
    forms.push(`${d}${s}${mo}${s}${y}`, `${dN}${s}${moN}${s}${y}`)   // dd/mm/aaaa · d/m/aaaa
    forms.push(`${d}${s}${mo}${s}${y2}`, `${dN}${s}${moN}${s}${y2}`) // dd/mm/aa · d/m/aa
    forms.push(`${y}${s}${mo}${s}${d}`)                              // aaaa-mm-dd (ISO e variações)
  }
  return forms.some(f => t.includes(f))
}
