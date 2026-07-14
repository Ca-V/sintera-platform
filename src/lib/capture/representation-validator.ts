// Representation Validator — 4ª camada (CEF §4.1): "posso confiar nesta ESTRUTURA?".
//
// Princípio da Validação entre Camadas: o extrator NÃO certifica a própria saída — quem valida é uma camada
// SEPARADA. Aqui validamos a REPRESENTAÇÃO produzida pelo processador contra o MODELO CLÍNICO (o esqueleto
// esperado do tipo). Não valida OCR nem LLM; valida a estrutura.
//
// Regras (CEF §4.1): "rotula, não oculta" (nunca esconder dado válido; nunca marcar grupo quebrado como
// completo); **nunca alega falsa completude** (§4.0.1). Reprodutibilidade do conteúdo e completude da
// estrutura são medidas SEPARADAS: um exame pode ser `certified=true` (estrutura íntegra/confiável) E
// `completeness='partial'` (faltam campos do esqueleto) — *reprodutivelmente incompleto*, explícito.
//
// Puro/determinístico. RDC 657: mede presença/ausência estrutural, não interpreta clínica.

import type { ClinicalModel, ProcessorResult } from './clinical-processors/types'

export type RepresentationCompleteness = 'complete' | 'partial' | 'empty'

export interface RepresentationVerdict {
  /** A estrutura é confiável (há representação íntegra para seguir)? Separado da completude. */
  certified: boolean
  /** completude ESTRUTURAL contra o modelo (esqueleto) — nunca alega completo sem estar. */
  completeness: RepresentationCompleteness
  /** Regiões detectadas (ex.: OD/OE) — '—' quando o modelo não é por região. */
  regions: string[]
  /** Campos do modelo presentes (auditoria). */
  presentFields: string[]
  /** Campos do modelo AUSENTES por região (rotula, não oculta). */
  missing: { region: string; fields: string[] }[]
  /** Motivo auditável. */
  reason: string
}

const REGIONLESS = '—'

/**
 * Valida a representação de um ProcessorResult contra o seu Modelo Clínico. Puro/determinístico.
 * Só o resultado `parametric` é validado por campos/região aqui; demais tipos passam por checagem mínima.
 */
export function validateRepresentation(result: ProcessorResult, model: ClinicalModel): RepresentationVerdict {
  const out = result.output
  if (!out || result.extractedUnits === 0) {
    return { certified: false, completeness: 'empty', regions: [], presentFields: [], missing: [],
      reason: 'sem representação estruturada → não certificável (document_only; preserva o documento)' }
  }
  if (out.kind !== 'parametric') {
    // Narrativo/estruturado: checagem mínima — há conteúdo, segue como parcial (validação por campos é do
    // modelo parametric; narrativo é validado por presença de achados quando esse processador existir).
    return { certified: true, completeness: 'partial', regions: [REGIONLESS], presentFields: [], missing: [],
      reason: `representação ${out.kind} presente; validação por campos não se aplica (sem esqueleto de campos)` }
  }

  const params = out.parameters
  const modelFields = model.fields.map(f => f.name)
  const regionAware = model.fields.some(f => f.regionAware)

  // Regiões detectadas (ex.: OD/OE). Sem região → um "grupo" único.
  const regions = regionAware
    ? [...new Set(params.map(p => p.region).filter((r): r is string => !!r))]
    : [REGIONLESS]
  const regionsForCheck = regions.length ? regions : [REGIONLESS]

  const presentFields = [...new Set(params.map(p => p.name))]

  // Por região: quais campos do modelo estão presentes × ausentes ("rotula, não oculta").
  const missing: { region: string; fields: string[] }[] = []
  for (const region of regionsForCheck) {
    const inRegion = new Set(
      params.filter(p => (regionAware ? p.region === region : true)).map(p => p.name),
    )
    const absent = modelFields.filter(f => !inRegion.has(f))
    if (absent.length) missing.push({ region, fields: absent })
  }

  // Completude: 'complete' só quando NENHUM campo do esqueleto falta em NENHUMA região detectada.
  // Conservador por design (§4.0.1 — nunca falsa completude). Certificado = há estrutura íntegra a seguir.
  const completeness: RepresentationCompleteness = missing.length === 0 ? 'complete' : 'partial'
  const reason = completeness === 'complete'
    ? `representação certificada: ${presentFields.length} campo(s) em ${regionsForCheck.join('/')} — esqueleto do modelo completo`
    : `representação parcial (certificada, incompleta): faltam ${missing.map(m => `${m.region}:[${m.fields.join(', ')}]`).join(' · ')}`

  return { certified: true, completeness, regions: regionsForCheck, presentFields, missing, reason }
}
