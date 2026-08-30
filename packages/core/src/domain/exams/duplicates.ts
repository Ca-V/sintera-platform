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

// ── DOCUMENTOS (receita · atestado · relatório · encaminhamento) ────────────────────────────────────────────
//
// Mesma disciplina dos exames, sujeito diferente. Mora AQUI, e não num módulo próprio, para as duas naturezas
// compartilharem a normalização: duas implementações de "o que conta como o mesmo texto" divergiriam, e a
// plataforma passaria a acusar duplicata de um jeito para exame e de outro para receita.
//
// ACHADO NA HOMOLOGAÇÃO (30/08): a fundadora tinha duas receitas do mesmo médico, uma escrita "Dr(a). Victor
// Cunha Diniz" e outra "Victor Cunha Diniz". Comparar emissor sem tirar o tratamento faria a plataforma ver dois
// médicos onde há um.

/** Documento reduzido ao que permite dizer se já existe. */
export interface DocumentDuplicateCandidate {
  id: string
  createdAt: string
  subtype: string
  issuer?: string | null
  docDate?: string | null            // 'YYYY-MM-DD'
  /** Impressão do ARQUIVO. Sinal mais forte que existe: mesmo arquivo, mesmo documento. */
  sha256?: string | null
}

/**
 * Normaliza o nome de quem emitiu, tirando o tratamento profissional.
 *
 * "Dr(a). Victor Cunha Diniz" e "Victor Cunha Diniz" são a mesma pessoa. Sem isto, a mesma receita transcrita
 * duas vezes — uma pela leitura assistida, que escreve o tratamento, e outra à mão — apareceria como dois
 * emissores distintos, e a duplicata passaria batida.
 */
export function normalizeIssuer(s: string | null | undefined): string {
  return norm(s).replace(/^(dr\(a\)\.?|dra?\.?|prof\.?|profa?\.?)\s+/i, '').trim()
}

/**
 * Chave de equivalência do documento. `null` quando não há sinal suficiente — e aí NÃO se acusa.
 *
 * A ordem dos sinais é deliberada: o ARQUIVO vence tudo (mesmo arquivo é o mesmo documento, sem discussão).
 * Faltando ele, exige-se tipo + emissor + data juntos. Duas receitas do mesmo médico SEM data não recebem
 * chave: é normal ter várias, e acusar aí transformaria a proteção em incômodo.
 */
export function documentDuplicateKey(d: DocumentDuplicateCandidate): string | null {
  const fp = norm(d.sha256)
  if (fp) return `sha:${fp}`

  const emissor = normalizeIssuer(d.issuer)
  const data = norm(d.docDate)
  const tipo = norm(d.subtype)
  if (!emissor || !data || !tipo) return null
  return `id:${tipo}|${emissor}|${data}`
}

/**
 * O documento que está entrando já existe entre os guardados? Devolve o EXISTENTE, ou `null`.
 *
 * Não decide nada: quem decide é a pessoa, informada. É a regra permanente da fundadora — toda informação que
 * entra é conferida, e havendo correspondência a plataforma informa e pergunta.
 */
export function findExistingDocument(
  entrando: DocumentDuplicateCandidate,
  guardados: readonly DocumentDuplicateCandidate[],
): DocumentDuplicateCandidate | null {
  const chave = documentDuplicateKey(entrando)
  if (!chave) return null
  // O mais ANTIGO é o original — é ele que se mostra como "já existe".
  const ordenados = [...guardados].sort((a, b) => a.createdAt.localeCompare(b.createdAt))
  return ordenados.find(g => g.id !== entrando.id && documentDuplicateKey(g) === chave) ?? null
}

/** Como a plataforma anuncia o achado. Texto único: as duas pontas dizem o mesmo. */
export function existingDocumentMessage(existente: DocumentDuplicateCandidate, rotuloTipo: string): string {
  const quem = existente.issuer?.trim()
  const [y, m, d] = (existente.docDate ?? '').split('-')
  const quando = d && m && y ? `${d}/${m}/${y}` : null
  const detalhe = [quem, quando].filter(Boolean).join(' · ')
  return detalhe
    ? `Já existe ${rotuloTipo.toLowerCase()} igual guardado: ${detalhe}.`
    : `Já existe ${rotuloTipo.toLowerCase()} igual guardado.`
}
