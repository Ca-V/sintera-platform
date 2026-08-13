// Terminology Service (CAMADA DE TERMINOLOGIA — ADR-CK-001). Responsável por RESOLVER a NOMENCLATURA a partir dos
// FATOS do DUE: nome canônico · sinônimos · categoria · código · sistema terminológico · versão · proveniência.
// A IA (via DUE) apenas SUGERE candidatos/evidências — QUEM DECIDE o nome é a Terminologia. A SINTERA NÃO cria
// nomenclatura própria: usa fontes oficiais (LOINC/SNOMED/RNDS). Sem mapeamento oficial → nome PROVISÓRIO, com
// confiança + proveniência + a marca explícita de que não há código oficial (estado legítimo). EQUIPAMENTO ≠ EXAME.
import type { DocumentUnderstanding, Confidence } from '@/lib/capture/document-understanding'

/** Origem da DECISÃO do nome (proveniência da Terminologia — nunca "KB clínica", que é outra camada):
 *  'terminology-official' = ancorado a LOINC/SNOMED/RNDS · 'terminology-catalog' = value-set provisório da
 *  Terminologia · 'document' = nome transcrito do próprio documento · 'pending' = não identificado. */
export type NameSource = 'terminology-official' | 'terminology-catalog' | 'document' | 'pending'
/** Referência a uma terminologia clínica OFICIAL (autoridade da nomenclatura — não a SINTERA). */
export interface TerminologyRef { system: 'LOINC' | 'SNOMEDCT' | 'RNDS'; code: string; version: string }

/** Resultado da resolução terminológica — AUDITÁVEL (nome + confiança + origem + proveniência + DECISÕES). */
export interface TerminologyResolution {
  name: string | null            // nome canônico (oficial quando `terminology`≠null; senão PROVISÓRIO)
  confidence: Confidence
  source: NameSource
  terminology: TerminologyRef | null  // LOINC/SNOMED/RNDS quando mapeado — null enquanto não há vínculo oficial
  provisional: boolean           // true = ainda não ancorado em terminologia oficial (estado legítimo)
  basis: string[]                // em que o nome provisório se apoia (ex.: 'AAO','SBO','fabricante')
  evidence: string[]             // sinais (do DUE) que embasaram a decisão
  equipment: string | null       // EQUIPAMENTO identificado — guardado SEPARADAMENTE, nunca é o nome
  decisionLog: string[]          // trilha das DECISÕES (auditoria): o que foi visto → regra → candidato → resolução
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
  const log: string[] = [`DUE: evidências = [${evidence.join(', ') || '—'}]${du.device ? ` · equipamento = "${du.device}"` : ''}`]
  const entry = hay ? EXAM_CATALOG.find(e => e.equipment.test(hay)) : undefined

  if (entry) {
    log.push(`value-set: equipamento reconhecido → "${entry.equipmentLabel}" (${entry.category})`)
    const term = entry.terminology ?? null
    const provisional = term === null
    log.push(term ? `ancorado a ${term.system} ${term.code} (v${term.version})` : 'sem ancoragem oficial (LOINC/SNOMED) → PROVISÓRIO')
    const sig = entry.specific.find(s => s.re.test(hay))
    if (sig) {
      log.push(`sinal de protocolo casou → candidato "${sig.name}" (confiança alta)`)
      return { name: sig.name, confidence: 'high', source: term ? 'terminology-official' : 'terminology-catalog', terminology: term, provisional, basis: entry.basis, evidence, equipment: entry.equipmentLabel, decisionLog: log }
    }
    if (entry.defaultName) {
      log.push(`equipamento de propósito único → "${entry.defaultName}" (confiança alta)`)
      return { name: entry.defaultName, confidence: 'high', source: term ? 'terminology-official' : 'terminology-catalog', terminology: term, provisional, basis: entry.basis, evidence, equipment: entry.equipmentLabel, decisionLog: log }
    }
    const adj = specialtyAdjective(entry.category)
    const nome = adj ? `Exame ${adj} realizado no equipamento ${entry.equipmentLabel}` : `Exame realizado no equipamento ${entry.equipmentLabel}`
    log.push(`sem sinal de protocolo → nomeia pelo equipamento, sem afirmar o exame (confiança média)`)
    return { name: nome, confidence: 'medium', source: 'terminology-catalog', terminology: term, provisional, basis: entry.basis, evidence, equipment: entry.equipmentLabel, decisionLog: log }
  }

  const explicit = pick(du.examName)
  if (explicit) {
    log.push(`equipamento não reconhecido; nome EXPLÍCITO no documento → "${explicit}"`)
    return { name: explicit, confidence: du.confidence, source: 'document', terminology: null, provisional: true, basis: [], evidence, equipment: pick(du.device), decisionLog: log }
  }
  const modality = pick(du.examModality)
  if (modality) {
    log.push(`sem nome explícito; usa a modalidade observada → "${modality}"`)
    return { name: modality, confidence: 'medium', source: 'document', terminology: null, provisional: true, basis: [], evidence, equipment: pick(du.device), decisionLog: log }
  }
  const adj = specialtyAdjective(du.examCategory)
  const nome = adj ? `Exame ${adj} (identificação pendente)` : 'Documento (identificação pendente)'
  log.push('nada identificável com confiança → identificação PENDENTE (não inventa nome)')
  return { name: nome, confidence: 'low', source: 'pending', terminology: null, provisional: true, basis: [], evidence, equipment: pick(du.device), decisionLog: log }
}

/** Conveniência: só o nome de exibição resolvido pela Terminologia (o que a lista/detalhe mostram). */
export function resolveExamName(du: Facts): string | null {
  return resolveTerminology(du).name
}
