// Clinical Mapping Service — RESOLVE qual conceito clínico melhor representa as evidências do DUE. A SINTERA é dona
// dos MAPEAMENTOS, NÃO da terminologia clínica. Este serviço NÃO é um catálogo: ele resolve um problema, usando
// vários RECURSOS (regras · aliases · sinônimos · heurísticas · equipamentos · catálogo interno · Terminology
// Service). O catálogo interno abaixo é apenas UM desses recursos. EQUIPAMENTO ≠ EXAME. Quando não há conceito
// oficial, resolve um nome PROVISÓRIO com confiança + proveniência (nunca fabrica; ADR-CP-001/CP-002).
import type { DocumentUnderstanding, Confidence } from '@/lib/capture/document-understanding'
import type { DecisionStep } from './contracts'

export function confidenceScore(c: Confidence | null): number {
  return c === 'high' ? 0.9 : c === 'medium' ? 0.6 : c === 'low' ? 0.3 : 0
}

const SPECIALTY_ADJECTIVE: Record<string, string> = {
  oftalmologia: 'oftalmológico', cardiologia: 'cardiológico', radiologia: 'radiológico',
  neurologia: 'neurológico', dermatologia: 'dermatológico', pneumologia: 'pneumológico',
}
function specialtyAdjective(category: string | null): string | null {
  const c = (category ?? '').trim().toLowerCase()
  return c ? (SPECIALTY_ADJECTIVE[c] ?? null) : null
}

// RECURSO do serviço (um entre vários): catálogo interno equipamento→exame. Curado/governado (C6/C7); provisório
// enquanto não há conceito oficial. NÃO é a arquitetura — é uma fonte consultada pelo Mapping Service.
export interface CatalogEntry {
  ruleId: string
  equipment: RegExp
  equipmentLabel: string
  category: string
  basis: string[]
  aliases: string[]
  defaultName?: string
  specific: { re: RegExp; name: string }[]
}
export const INTERNAL_EXAM_CATALOG: CatalogEntry[] = [
  {
    ruleId: 'MAP-OPHTH-PENTACAM', equipment: /oculus|pentacam/i, equipmentLabel: 'Pentacam', category: 'Oftalmologia',
    basis: ['Documentação OCULUS/Pentacam', 'AAO', 'SBO'], aliases: ['Tomografia de córnea', 'Topografia corneana', 'Exame do segmento anterior'],
    specific: [
      { re: /topografia/i, name: 'Topografia da córnea' },
      { re: /tomografia|scheimpflug|belin|elevation|eleva[çc][ãa]o|paquimetr|pachymetr/i, name: 'Tomografia da córnea' },
    ],
  },
  { ruleId: 'MAP-OPHTH-CAMPIMETRY', equipment: /humphrey|field\s*analyzer|perimetr|campo\s*visual|campimetria/i, equipmentLabel: 'Humphrey Field Analyzer', category: 'Oftalmologia', basis: ['AAO', 'SBO'], aliases: ['Campimetria', 'Perimetria computadorizada'], defaultName: 'Campo visual computadorizado', specific: [] },
  { ruleId: 'MAP-OPHTH-OCT', equipment: /cirrus|\boct\b|coer[êe]ncia\s*[óo]ptica/i, equipmentLabel: 'OCT', category: 'Oftalmologia', basis: ['AAO', 'SBO'], aliases: ['OCT'], defaultName: 'Tomografia de coerência óptica (OCT)', specific: [] },
  { ruleId: 'MAP-OPHTH-SPECULAR', equipment: /cem[-\s]?530|microscopia\s*especular|specular\s*microscopy|endothelial|c[ée]lulas?\s*endotelia|contagem\s*endotelial/i, equipmentLabel: 'Microscópio especular', category: 'Oftalmologia', basis: ['AAO', 'SBO'], aliases: ['Contagem endotelial'], defaultName: 'Microscopia especular da córnea', specific: [] },
]

export interface MappingResolution {
  name: string | null
  confidence: Confidence
  provisional: boolean
  basis: string[]
  aliases: string[]
  equipment: string | null
  category: string | null
  matched: boolean          // true = casou com um mapeamento conhecido; false = veio do documento/pendente
  steps: DecisionStep[]
}

type Facts = Pick<DocumentUnderstanding, 'device' | 'originalTitle' | 'examModality' | 'examName' | 'examCategory' | 'evidence' | 'confidence'>

/** Resolve o conceito que melhor representa as evidências. Determinístico. NUNCA o equipamento como nome; nunca
 *  fabrica um exame (protocolo incerto → nome genérico pelo equipamento; nada identificável → pendente). */
export function resolveClinicalMapping(du: Facts): MappingResolution {
  const pick = (s: string | null | undefined) => { const v = (s ?? '').trim(); return v.length ? v : null }
  const evidence = (du.evidence ?? []).filter(Boolean)
  const hay = [du.device, du.originalTitle, du.examModality, du.examName, ...evidence].filter(Boolean).join(' ')
  const entry = hay ? INTERNAL_EXAM_CATALOG.find(e => e.equipment.test(hay)) : undefined

  if (entry) {
    const sig = entry.specific.find(s => s.re.test(hay))
    if (sig) {
      const steps: DecisionStep[] = [{ step: 'mapping', rule: entry.ruleId, input: entry.equipmentLabel, output: sig.name, confidence: 0.9, status: 'matched' }]
      return { name: sig.name, confidence: 'high', provisional: true, basis: entry.basis, aliases: entry.aliases, equipment: entry.equipmentLabel, category: entry.category, matched: true, steps }
    }
    if (entry.defaultName) {
      const steps: DecisionStep[] = [{ step: 'mapping', rule: entry.ruleId, input: entry.equipmentLabel, output: entry.defaultName, confidence: 0.9, status: 'matched' }]
      return { name: entry.defaultName, confidence: 'high', provisional: true, basis: entry.basis, aliases: entry.aliases, equipment: entry.equipmentLabel, category: entry.category, matched: true, steps }
    }
    const adj = specialtyAdjective(entry.category)
    const nome = adj ? `Exame ${adj} realizado no equipamento ${entry.equipmentLabel}` : `Exame realizado no equipamento ${entry.equipmentLabel}`
    const steps: DecisionStep[] = [{ step: 'mapping', rule: entry.ruleId, input: entry.equipmentLabel, output: nome, confidence: 0.6, status: 'equipment_only', reason: 'protocolo não comprovado no documento' }]
    return { name: nome, confidence: 'medium', provisional: true, basis: entry.basis, aliases: entry.aliases, equipment: entry.equipmentLabel, category: entry.category, matched: true, steps }
  }

  const explicit = pick(du.examName)
  if (explicit) {
    const steps: DecisionStep[] = [{ step: 'mapping', input: 'exam_name', output: explicit, confidence: confidenceScore(du.confidence), status: 'from_document' }]
    return { name: explicit, confidence: du.confidence, provisional: true, basis: [], aliases: [], equipment: pick(du.device), category: pick(du.examCategory), matched: false, steps }
  }
  const modality = pick(du.examModality)
  if (modality) {
    const steps: DecisionStep[] = [{ step: 'mapping', input: 'exam_modality', output: modality, confidence: 0.6, status: 'from_document' }]
    return { name: modality, confidence: 'medium', provisional: true, basis: [], aliases: [], equipment: pick(du.device), category: pick(du.examCategory), matched: false, steps }
  }
  const adj = specialtyAdjective(du.examCategory)
  const nome = adj ? `Exame ${adj} (identificação pendente)` : 'Documento (identificação pendente)'
  const steps: DecisionStep[] = [{ step: 'mapping', output: nome, confidence: 0.3, status: 'pending', reason: 'nada identificável com confiança' }]
  return { name: nome, confidence: 'low', provisional: true, basis: [], aliases: [], equipment: pick(du.device), category: pick(du.examCategory), matched: false, steps }
}
