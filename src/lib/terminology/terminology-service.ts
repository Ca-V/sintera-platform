// Terminology Service (CAMADA DE TERMINOLOGIA — ADR-CK-001). Responsável por RESOLVER a NOMENCLATURA a partir dos
// FATOS do DUE: nome canônico · sinônimos · categoria · código · sistema terminológico · versão · proveniência.
// A IA (via DUE) apenas SUGERE candidatos/evidências — QUEM DECIDE o nome é a Terminologia. A SINTERA NÃO cria
// nomenclatura própria: usa fontes oficiais (LOINC/SNOMED/RNDS). Sem mapeamento oficial → nome PROVISÓRIO, com
// confiança + proveniência + a marca explícita de que não há código oficial (estado legítimo). EQUIPAMENTO ≠ EXAME.
import type { DocumentUnderstanding, Confidence } from '@/lib/capture/document-understanding'

export type FieldSource = 'rule' | 'kb' | 'ai' | 'ocr'
/** Referência a uma terminologia clínica OFICIAL (autoridade da nomenclatura — não a SINTERA). */
export interface TerminologyRef { system: 'LOINC' | 'SNOMEDCT' | 'RNDS'; code: string; version: string }

/** Resultado da resolução terminológica — AUDITÁVEL (nome + confiança + origem + proveniência + evidências). */
export interface TerminologyResolution {
  name: string | null            // nome canônico (oficial quando `terminology`≠null; senão PROVISÓRIO)
  confidence: Confidence
  source: FieldSource            // origem da DECISÃO: 'kb' (binding curado) | 'ai' (transcrito) | 'rule'
  terminology: TerminologyRef | null  // LOINC/SNOMED/RNDS quando mapeado — null enquanto não há vínculo oficial
  provisional: boolean           // true = ainda não ancorado em terminologia oficial (estado legítimo)
  basis: string[]                // em que o nome provisório se apoia (ex.: 'AAO','SBO','fabricante')
  evidence: string[]             // sinais que embasaram a decisão (do DUE)
  equipment: string | null       // EQUIPAMENTO identificado — guardado SEPARADAMENTE, nunca é o nome
}

const SPECIALTY_ADJECTIVE: Record<string, string> = {
  oftalmologia: 'oftalmológico', cardiologia: 'cardiológico', radiologia: 'radiológico',
  neurologia: 'neurológico', dermatologia: 'dermatológico', pneumologia: 'pneumológico',
}
function specialtyAdjective(category: string | null): string | null {
  const c = (category ?? '').trim().toLowerCase()
  return c ? (SPECIALTY_ADJECTIVE[c] ?? null) : null
}

// ── BINDING equipamento → exame (STAND-IN PROVISÓRIO do value set curado) ─────────────────────────────────────
// Pertence a ESTA camada (Terminologia). Artefato CURADO/GOVERNADO (revisão clínica + expansão sob demanda). NÃO é
// a IA inventando: o nome só é afirmado (alta confiança) quando há SINAL no documento. `defaultName` só p/
// equipamento de propósito ÚNICO. Enquanto não há mapeamento LOINC/SNOMED, cada entrada resolve `terminology=null`
// e `provisional=true`. Quando um revisor clínico ancorar a entrada a um código, preencher `terminology`.
export interface ExamCatalogEntry {
  equipment: RegExp
  equipmentLabel: string
  category: string
  basis: string[]
  defaultName?: string
  specific: { re: RegExp; name: string }[]
  terminology?: TerminologyRef    // preenchido quando ancorado a LOINC/SNOMED (roadmap governado)
}
export const EXAM_CATALOG: ExamCatalogEntry[] = [
  {
    equipment: /oculus|pentacam/i, equipmentLabel: 'Pentacam', category: 'Oftalmologia',
    basis: ['Documentação OCULUS/Pentacam', 'AAO', 'SBO'],
    specific: [
      { re: /topografia/i, name: 'Topografia da córnea' },
      { re: /tomografia|scheimpflug|belin|elevation|eleva[çc][ãa]o|paquimetr|pachymetr/i, name: 'Tomografia da córnea' },
    ],
  },
  { equipment: /humphrey|field\s*analyzer|perimetr|campo\s*visual|campimetria/i, equipmentLabel: 'Humphrey Field Analyzer', category: 'Oftalmologia', basis: ['AAO', 'SBO'], defaultName: 'Campo visual computadorizado', specific: [] },
  { equipment: /cirrus|\boct\b|coer[êe]ncia\s*[óo]ptica/i, equipmentLabel: 'OCT', category: 'Oftalmologia', basis: ['AAO', 'SBO'], defaultName: 'Tomografia de coerência óptica (OCT)', specific: [] },
  { equipment: /cem[-\s]?530|microscopia\s*especular|specular\s*microscopy|endothelial|c[ée]lulas?\s*endotelia|contagem\s*endotelial/i, equipmentLabel: 'Microscópio especular', category: 'Oftalmologia', basis: ['AAO', 'SBO'], defaultName: 'Microscopia especular da córnea', specific: [] },
]

type Facts = Pick<DocumentUnderstanding, 'device' | 'originalTitle' | 'examModality' | 'examName' | 'examCategory' | 'evidence' | 'confidence'>

/** RESOLUÇÃO TERMINOLÓGICA — determinística, sobre as EVIDÊNCIAS do DUE. Faixas: ALTA = nome canônico (sinal/
 *  equipamento de propósito único ou nome explícito no documento); MÉDIA = "Exame <especialidade> realizado no
 *  equipamento <X>" (equipamento reconhecido, protocolo não comprovado); BAIXA = "… (identificação pendente)".
 *  NUNCA fabrica um exame; o EQUIPAMENTO nunca vira o nome. */
export function resolveTerminology(du: Facts): TerminologyResolution {
  const pick = (s: string | null | undefined) => { const v = (s ?? '').trim(); return v.length ? v : null }
  const evidence = (du.evidence ?? []).filter(Boolean)
  const hay = [du.device, du.originalTitle, du.examModality, du.examName, ...evidence].filter(Boolean).join(' ')
  const entry = hay ? EXAM_CATALOG.find(e => e.equipment.test(hay)) : undefined

  if (entry) {
    const term = entry.terminology ?? null
    const provisional = term === null
    const sig = entry.specific.find(s => s.re.test(hay))
    if (sig) return { name: sig.name, confidence: 'high', source: 'kb', terminology: term, provisional, basis: entry.basis, evidence, equipment: entry.equipmentLabel }
    if (entry.defaultName) return { name: entry.defaultName, confidence: 'high', source: 'kb', terminology: term, provisional, basis: entry.basis, evidence, equipment: entry.equipmentLabel }
    const adj = specialtyAdjective(entry.category)
    const nome = adj ? `Exame ${adj} realizado no equipamento ${entry.equipmentLabel}` : `Exame realizado no equipamento ${entry.equipmentLabel}`
    return { name: nome, confidence: 'medium', source: 'kb', terminology: term, provisional, basis: entry.basis, evidence, equipment: entry.equipmentLabel }
  }

  const explicit = pick(du.examName)
  if (explicit) return { name: explicit, confidence: du.confidence, source: 'ai', terminology: null, provisional: true, basis: [], evidence, equipment: pick(du.device) }
  const modality = pick(du.examModality)
  if (modality) return { name: modality, confidence: 'medium', source: 'ai', terminology: null, provisional: true, basis: [], evidence, equipment: pick(du.device) }
  const adj = specialtyAdjective(du.examCategory)
  const nome = adj ? `Exame ${adj} (identificação pendente)` : 'Documento (identificação pendente)'
  return { name: nome, confidence: 'low', source: 'rule', terminology: null, provisional: true, basis: [], evidence, equipment: pick(du.device) }
}

/** Conveniência: só o nome de exibição resolvido pela Terminologia (o que a lista/detalhe mostram). */
export function resolveExamName(du: Facts): string | null {
  return resolveTerminology(du).name
}
