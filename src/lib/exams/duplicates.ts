// Detecção de exame DUPLICADO (fundadora — `req_deteccao_duplicados`): antes de tratar como novo,
// detectar um equivalente já existente (paciente · data · emissor · título · fingerprint) e NUNCA
// duplicar em silêncio. Camada de DOMÍNIO: pura, determinística, sem IO.
//
// Sinal FORTE: `representation_fingerprint` (Reprodutibilidade) — mesmo documento+versão => mesma
// assinatura. Sinal de IDENTIDADE (quando não há fingerprint nos dois): paciente + data + emissor +
// título normalizados. Só marca duplicado o registro MAIS NOVO do par (o mais antigo permanece).

export interface DuplicateCandidate {
  id: string
  createdAt: string                      // ISO — o mais antigo é o "original"
  patientName?: string | null
  examDate?: string | null               // 'YYYY-MM-DD'
  issuer?: string | null
  title?: string | null                  // display_title ou type
  representationFingerprint?: string | null
}

function norm(s: string | null | undefined): string {
  return (s ?? '')
    .normalize('NFD').replace(/[̀-ͯ]/g, '') // remove acentos
    .toLowerCase().replace(/\s+/g, ' ').trim()
}

/**
 * Chave de equivalência do exame. `null` quando não há sinal suficiente para afirmar duplicidade
 * (ex.: sem fingerprint e sem data) — nesse caso NÃO se marca duplicado (evita falso-positivo).
 */
export function duplicateKeyOf(e: DuplicateCandidate): string | null {
  const fp = norm(e.representationFingerprint)
  if (fp) return `fp:${fp}`
  const date = norm(e.examDate)
  const title = norm(e.title)
  // Exige ao menos data + título para arriscar equivalência por identidade.
  if (!date || !title) return null
  return `id:${norm(e.patientName)}|${date}|${norm(e.issuer)}|${title}`
}

/**
 * Dado um conjunto de exames, retorna o Set de ids que são PROVÁVEIS DUPLICADOS de um registro
 * ANTERIOR (mesma chave, createdAt maior). O registro original (mais antigo) nunca é marcado.
 * Determinística; ordena por createdAt para estabilidade.
 */
export function findDuplicateIds(exams: DuplicateCandidate[]): Set<string> {
  const sorted = [...exams].sort((a, b) => a.createdAt.localeCompare(b.createdAt))
  const seen = new Map<string, string>() // key → id do original
  const dups = new Set<string>()
  for (const e of sorted) {
    const key = duplicateKeyOf(e)
    if (!key) continue
    if (seen.has(key)) dups.add(e.id)
    else seen.set(key, e.id)
  }
  return dups
}

/** Id do registro original (mais antigo) para um exame, se ele for duplicado; senão null. */
export function originalIdFor(exam: DuplicateCandidate, all: DuplicateCandidate[]): string | null {
  const key = duplicateKeyOf(exam)
  if (!key) return null
  const sorted = [...all].sort((a, b) => a.createdAt.localeCompare(b.createdAt))
  for (const e of sorted) {
    if (e.id === exam.id) continue
    if (duplicateKeyOf(e) === key) return e.id
  }
  return null
}
