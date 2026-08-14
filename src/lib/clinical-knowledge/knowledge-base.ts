// Base de CONHECIMENTO CLÍNICO curado (C6) — dados versionados com PROVENIÊNCIA OBRIGATÓRIA e RASTREÁVEL por atributo.
// É a fonte dos entries que o Clinical Knowledge Service resolve a partir da Clinical Identity. Conteúdo EDUCATIVO
// sobre o que o exame É (nunca interpretação do resultado da usuária — fronteira RDC-657). Cada campo lista TODAS as
// fontes que o sustentam; consenso parcial fica registrado. Nenhum campo nasce sem fonte (o builder `sourced` exige-a).
//
// GOVERNANÇA: conteúdo INICIAL de curadoria, ancorado em fontes oficiais reconhecidas (AAO, CBO). O responsável técnico
// (curatedBy) é atribuído na validação clínica formal — enquanto pendente, null, e a confiança reflete "baseado em
// fonte, ainda não assinado". Ampliar a base = adicionar entries curados aqui (evolução progressiva por homologação).
import type { ClinicalKnowledge, SourceRef } from './clinical-knowledge-service'
import { sourced } from './clinical-knowledge-service'

export { sourced }

/** Entrada da base: o conhecimento + as CHAVES de casamento (códigos oficiais e nomes/aliases normalizáveis). A
 *  resolução usa a Clinical Identity — por código quando houver, senão por nome/modalidade (sem depender do C7/C8). */
export interface KnowledgeEntry {
  knowledge: ClinicalKnowledge
  match: {
    codes: { system: string; code: string }[]   // vazio enquanto não houver ancoragem oficial (C7)
    names: string[]                              // nome canônico + sinônimos (casados por forma normalizada)
  }
}

/** Normaliza um nome para casamento robusto: minúsculas, sem acentos, sem pontuação, espaços colapsados. */
export function normalizeName(s: string): string {
  return s
    .normalize('NFD').replace(/[̀-ͯ]/g, '')  // remove acentos
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

// Data desta curadoria inicial (fato de proveniência). Fontes reais; responsável técnico atribuído na revisão formal.
const CURATED = '2026-08-13'

/** Construtores de FONTE identificada (fonte + versão + data + afirmação sustentada). Reaproveitados pelos entries. */
const AAO = (statement?: string): SourceRef => ({
  source: 'American Academy of Ophthalmology (AAO)', version: 'PPP/BCSC', lastReviewed: CURATED, statement: statement ?? null,
})
const CBO = (statement?: string): SourceRef => ({
  source: 'Conselho Brasileiro de Oftalmologia (CBO)', version: '2024', lastReviewed: CURATED, statement: statement ?? null,
})

// ── SEED — exames da homologação em curso (oftalmologia por imagem). Base extensível: novos exames = novos entries. ──

const CORNEAL_TOPOGRAPHY: KnowledgeEntry = {
  knowledge: {
    canonicalName: sourced('Topografia de córnea', { sources: [CBO()], confidence: 'high' }),
    description: sourced(
      'Exame de imagem que mapeia a curvatura e a espessura da córnea (superfícies anterior e posterior), gerando mapas de elevação e de paquimetria.',
      { sources: [CBO(), AAO()], confidence: 'high' },
    ),
    aliases: sourced(
      ['topografia da córnea', 'topografia corneana', 'tomografia de córnea', 'mapeamento corneano', 'corneal topography'],
      { sources: [CBO()], confidence: 'medium' },
    ),
    purpose: sourced(
      'Avaliar a forma, a curvatura e a regularidade da córnea para detectar e acompanhar astigmatismos irregulares e ectasias (como o ceratocone) e apoiar o planejamento cirúrgico.',
      { sources: [AAO('finalidade em cirurgia refrativa e ectasias'), CBO('uso em ceratocone')], confidence: 'high' },
    ),
    howItWorks: sourced(
      'Uma câmera rotacional de Scheimpflug (ex.: Pentacam) captura imagens da córnea, sem contato, e reconstrói os mapas topográficos/tomográficos.',
      { sources: [AAO()], confidence: 'medium' },
    ),
    measures: sourced(
      ['curvatura anterior e posterior', 'paquimetria (espessura corneana)', 'mapas de elevação', 'profundidade da câmara anterior'],
      { sources: [AAO()], confidence: 'medium' },
    ),
    bodySystem: sourced('Córnea — sistema visual', { sources: [CBO()], confidence: 'high' }),
    whenIndicated: sourced(
      'Suspeita ou acompanhamento de ceratocone/ectasia, avaliação pré-operatória de cirurgia refrativa, astigmatismo irregular e adaptação de lentes de contato.',
      { sources: [AAO(), CBO()], confidence: 'high' },
    ),
    suggestedPeriodicity: sourced(
      'Não é exame de rastreio populacional; a frequência é definida pela indicação clínica. No acompanhamento de ceratocone, tipicamente a cada 6 a 12 meses, a critério do oftalmologista.',
      { sources: [AAO('sem consenso de rastreio; intervalo de acompanhamento por juízo clínico')], confidence: 'low', consensus: 'partial' },
    ),
    limitations: sourced(
      'Não avalia acuidade visual nem o fundo de olho; a qualidade depende da fixação do paciente e do filme lacrimal.',
      { sources: [AAO()], confidence: 'medium' },
    ),
    specialty: sourced('Oftalmologia', { sources: [CBO()], confidence: 'high' }),
    evidenceLevel: sourced(
      'Consenso de diretrizes (AAO Preferred Practice Pattern; CBO)',
      { sources: [AAO(), CBO()], confidence: 'medium' },
    ),
    references: sourced(
      [
        'American Academy of Ophthalmology — Preferred Practice Pattern: Refractive Errors & Refractive Surgery',
        'Conselho Brasileiro de Oftalmologia (CBO) — diretrizes de córnea',
      ],
      { sources: [AAO(), CBO()], confidence: 'high' },
    ),
    terminology: null,
  },
  match: {
    codes: [],
    names: ['Topografia de córnea', 'topografia da córnea', 'topografia corneana', 'tomografia de córnea', 'corneal topography', 'mapeamento corneano'],
  },
}

const SPECULAR_MICROSCOPY: KnowledgeEntry = {
  knowledge: {
    canonicalName: sourced('Microscopia especular da córnea', { sources: [CBO()], confidence: 'high' }),
    description: sourced(
      'Exame de imagem não invasivo que fotografa e quantifica a camada endotelial da córnea.',
      { sources: [CBO(), AAO()], confidence: 'high' },
    ),
    aliases: sourced(
      ['microscopia especular', 'microscopia especular de córnea', 'contagem endotelial', 'specular microscopy'],
      { sources: [CBO()], confidence: 'medium' },
    ),
    purpose: sourced(
      'Avaliar a saúde do endotélio corneano — densidade celular e morfologia (pleomorfismo/polimegatismo) — para estimar a reserva funcional da córnea.',
      { sources: [AAO(), CBO()], confidence: 'high' },
    ),
    howItWorks: sourced(
      'Um microscópio especular projeta e capta a luz refletida na interface endotélio–humor aquoso, gerando imagem das células endoteliais para contagem automatizada.',
      { sources: [AAO()], confidence: 'medium' },
    ),
    measures: sourced(
      ['densidade endotelial (células/mm²)', 'coeficiente de variação (polimegatismo)', 'hexagonalidade (pleomorfismo)', 'paquimetria central'],
      { sources: [AAO()], confidence: 'medium' },
    ),
    bodySystem: sourced('Endotélio corneano — sistema visual', { sources: [CBO()], confidence: 'high' }),
    whenIndicated: sourced(
      'Pré e pós-operatório de catarata e de transplante de córnea, distrofias endoteliais (ex.: Fuchs), uso prolongado de lentes de contato e avaliação de córnea doadora.',
      { sources: [AAO(), CBO()], confidence: 'high' },
    ),
    suggestedPeriodicity: sourced(
      'Definida pela indicação clínica; no acompanhamento de distrofia endotelial ou pós-transplante, conforme orientação do oftalmologista.',
      { sources: [AAO('intervalo por juízo clínico; sem consenso de rastreio')], confidence: 'low', consensus: 'partial' },
    ),
    limitations: sourced(
      'A contagem pode ser limitada em córneas edemaciadas ou opacas e amostra apenas uma pequena região do endotélio.',
      { sources: [AAO()], confidence: 'medium' },
    ),
    specialty: sourced('Oftalmologia', { sources: [CBO()], confidence: 'high' }),
    evidenceLevel: sourced(
      'Consenso de diretrizes / literatura oftalmológica (AAO BCSC; CBO)',
      { sources: [AAO(), CBO()], confidence: 'medium' },
    ),
    references: sourced(
      [
        'American Academy of Ophthalmology — Basic and Clinical Science Course: External Disease and Cornea',
        'Conselho Brasileiro de Oftalmologia (CBO) — diretrizes de córnea',
      ],
      { sources: [AAO(), CBO()], confidence: 'high' },
    ),
    terminology: null,
  },
  match: {
    codes: [],
    names: ['Microscopia especular da córnea', 'microscopia especular', 'microscopia especular de córnea', 'contagem endotelial', 'specular microscopy'],
  },
}

/** A base curada (append-only por curadoria). Ordem não importa — a resolução é por chave. */
export const KNOWLEDGE_BASE: KnowledgeEntry[] = [CORNEAL_TOPOGRAPHY, SPECULAR_MICROSCOPY]

/** Resolve um entry por CÓDIGO oficial (preferido) e, na ausência, por NOME normalizado. Retorna null se não curado. */
export function findEntry(concept: { code?: string | null; system?: string | null; name?: string | null }): KnowledgeEntry | null {
  // 1) Por código oficial (quando a Clinical Identity já traz terminologia ancorada — C7 futuro).
  if (concept.code && concept.system) {
    const byCode = KNOWLEDGE_BASE.find(e =>
      e.match.codes.some(c => c.system === concept.system && c.code === concept.code),
    )
    if (byCode) return byCode
  }
  // 2) Por nome/alias normalizado (caminho de hoje — identidade provisória sem código oficial).
  if (concept.name) {
    const target = normalizeName(concept.name)
    if (target) {
      const byName = KNOWLEDGE_BASE.find(e => e.match.names.some(n => normalizeName(n) === target))
      if (byName) return byName
    }
  }
  return null
}
