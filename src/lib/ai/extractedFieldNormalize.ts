// Normalização COMUM das extrações best-effort de campos textuais do laudo (emissor, médico
// solicitante…). PURA e determinística — sem I/O. TRANSCREVE; nunca infere (RDC 657).
//
// Trata dois defeitos recorrentes da resposta do modelo, que senão vazam para o card:
//   1) pontuação/aspas nas pontas;
//   2) rótulo ecoado pelo modelo (quando `labelPrefix` é fornecido e é SEGURO removê-lo);
//   3) respostas de "sem dado" que não são um nome ("N/A", "não informado", "—"…) → null;
//   4) respostas verbosas demais (provável alucinação/explicação) → null.

const NO_DATA = /^(null|n\/?a|n[ãa]o\s+informad[oa]|n[ãa]o\s+consta|n[ãa]o\s+identificad[oa]|nenhum|n[ãa]o\s+h[áa]|indispon[íi]vel|sem\s+informa[çc][ãa]o|[-–—.]+)$/i

/**
 * @param raw          resposta crua do extrator.
 * @param labelPrefix  (opcional) rótulo ecoado a remover — só passe quando NÃO houver risco de o
 *                     rótulo fazer parte de um nome legítimo (ex.: nomes de laboratório começam com
 *                     "Laboratório/Clínica/Hospital", então esses NÃO devem ser removidos).
 */
export function normalizeExtractedName(raw: string | null | undefined, labelPrefix?: RegExp): string | null {
  let s = (raw ?? '').replace(/^["'.\s]+|["'.\s]+$/g, '').trim()
  if (!s) return null
  if (labelPrefix) s = s.replace(labelPrefix, '').trim()
  if (!s || NO_DATA.test(s) || s.length > 80) return null
  return s
}
