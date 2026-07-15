// NC-0008 — Descarte de laudo NARRATIVO preservando o modelo canônico.
//
// Um laudo narrativo É o resultado (document_only): se o extrator raspou "resultados",
// eles devem ser descartados da representação corrente. Mas tanto a escrita canônica
// append-only (`write_canonical_extraction`) quanto a legada (`replace_biomarkers`, via
// ponte 070) já criaram uma versão de extração e PROMOVERAM o ponteiro
// `exams.current_extraction_version_id`. Um `DELETE` cru corromperia o modelo:
//   • no caminho append-only, apagaria linhas versionadas (viola append-only) e deixaria
//     uma versão promovida órfã;
//   • em ambos, deixaria o ponteiro apontando para uma versão sem biomarcadores.
//
// O document_only correto é DE-PROMOVER o ponteiro para NULL — a MESMA semântica do estado
// pré-extração — para que a view `current_biomarkers` (que filtra por
// `current_extraction_version_id`) retorne vazio. Assim preservamos append-only,
// rastreabilidade, auditabilidade e reprodutibilidade: a versão e seus biomarcadores
// permanecem no histórico (`extraction_versions`), apenas deixam de ser a representação
// corrente. No caminho legado (não-append-only, delete+replace por design) as linhas
// descartadas também são removidas.
//
// Função PURA: sem I/O. O route apenas aplica o plano.

export interface NarrativeDiscardInput {
  /** `plan.structured` — o plano do Engine considera o documento estruturável? */
  structured: boolean
  /** `result.biomarkers.length` — quantos resultados o extrator raspou. */
  biomarkerCount: number
  /** Escrita canônica append-only (`write_canonical_extraction`) vs. legada (`replace_biomarkers`). */
  useCanonical: boolean
}

export interface NarrativeDiscardPlan {
  /** É um laudo narrativo com resultados raspados a descartar? */
  discard: boolean
  /** De-promover `current_extraction_version_id` → NULL (document_only via view). */
  depromotePointer: boolean
  /** Apagar as linhas de biomarcadores (SÓ no caminho legado, não-append-only). */
  deleteLegacyRows: boolean
}

export function planNarrativeDiscard(input: NarrativeDiscardInput): NarrativeDiscardPlan {
  const discard = !input.structured && input.biomarkerCount > 0
  if (!discard) return { discard: false, depromotePointer: false, deleteLegacyRows: false }
  // Descarta: sempre de-promove o ponteiro; só deleta linhas no caminho legado (append-only nunca deleta).
  return { discard: true, depromotePointer: true, deleteLegacyRows: !input.useCanonical }
}
