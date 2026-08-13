// Base de CONHECIMENTO CLÍNICO curado (C6) — dados versionados com PROVENIÊNCIA OBRIGATÓRIA por atributo. É a fonte
// dos entries que o Clinical Knowledge Service resolve a partir da Clinical Identity. Conteúdo EDUCATIVO sobre o que o
// exame É (nunca interpretação do resultado da usuária — fronteira RDC-657). Cada campo carrega origem + versão +
// confiança + data de revisão; nenhum campo pode nascer sem proveniência (o construtor `sourced` exige-a).
//
// GOVERNANÇA: este é o CONTEÚDO INICIAL de curadoria, ancorado em fontes oficiais reconhecidas (AAO, CBO, ESCRS). O
// responsável técnico (curatedBy) é atribuído na validação clínica formal — enquanto pendente, fica null e a confiança
// reflete que a entrada é baseada em fonte, mas ainda não assinada. Ampliar a base = adicionar entries curados aqui.
import type { ClinicalKnowledge, Sourced, Provenance } from './clinical-knowledge-service'

/** Constrói um campo com proveniência (OBRIGATÓRIA — não há como criar um campo sem origem). */
export function sourced<T>(value: T, prov: Provenance): Sourced<T> {
  return {
    value,
    source: prov.source,
    version: prov.version ?? null,
    confidence: prov.confidence,
    lastReviewed: prov.lastReviewed,
    curatedBy: prov.curatedBy ?? null,
  }
}

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
const AAO = 'American Academy of Ophthalmology (AAO)'
const CBO = 'Conselho Brasileiro de Oftalmologia (CBO)'

// Proveniência-padrão de cada entry (herdada por todos os campos; um campo pode sobrescrever a origem quando diferir).
function ophthalmoDefaults(source: string): Provenance {
  return { source, version: 'ckb-0.1.0', confidence: 'medium', lastReviewed: CURATED, curatedBy: null }
}

// ── SEED — exames da homologação em curso (oftalmologia por imagem). Base extensível: novos exames = novos entries. ──

const CORNEAL_TOPOGRAPHY: KnowledgeEntry = (() => {
  const d = ophthalmoDefaults(CBO)
  const aao = ophthalmoDefaults(AAO)
  return {
    knowledge: {
      canonicalName: sourced('Topografia de córnea', d),
      description: sourced(
        'Exame de imagem que mapeia a curvatura e a espessura da córnea (superfícies anterior e posterior), gerando mapas de elevação e de paquimetria.',
        d,
      ),
      aliases: sourced(
        ['topografia da córnea', 'topografia corneana', 'tomografia de córnea', 'mapeamento corneano', 'corneal topography'],
        d,
      ),
      purpose: sourced(
        'Avaliar a forma, a curvatura e a regularidade da córnea para detectar e acompanhar astigmatismos irregulares e ectasias (como o ceratocone) e apoiar o planejamento cirúrgico.',
        aao,
      ),
      howItWorks: sourced(
        'Uma câmera rotacional de Scheimpflug (ex.: Pentacam) captura imagens da córnea, sem contato, e reconstrói os mapas topográficos/tomográficos.',
        d,
      ),
      measures: sourced(
        ['curvatura anterior e posterior', 'paquimetria (espessura corneana)', 'mapas de elevação', 'profundidade da câmara anterior'],
        d,
      ),
      bodySystem: sourced('Córnea — sistema visual', d),
      whenIndicated: sourced(
        'Suspeita ou acompanhamento de ceratocone/ectasia, avaliação pré-operatória de cirurgia refrativa, astigmatismo irregular e adaptação de lentes de contato.',
        aao,
      ),
      suggestedPeriodicity: sourced(
        'Não é exame de rastreio populacional; a frequência é definida pela indicação clínica. No acompanhamento de ceratocone, tipicamente a cada 6 a 12 meses, a critério do oftalmologista.',
        { ...aao, confidence: 'low' },
      ),
      limitations: sourced(
        'Não avalia acuidade visual nem o fundo de olho; a qualidade depende da fixação do paciente e do filme lacrimal.',
        d,
      ),
      specialty: sourced('Oftalmologia', d),
      evidenceLevel: sourced('Consenso de diretrizes (AAO Preferred Practice Pattern; CBO)', aao),
      references: sourced(
        [
          'American Academy of Ophthalmology — Preferred Practice Pattern: Refractive Errors & Refractive Surgery',
          'Conselho Brasileiro de Oftalmologia (CBO) — diretrizes de córnea',
        ],
        aao,
      ),
      terminology: null,
    },
    match: {
      codes: [],
      names: ['Topografia de córnea', 'topografia da córnea', 'topografia corneana', 'tomografia de córnea', 'corneal topography', 'mapeamento corneano'],
    },
  }
})()

const SPECULAR_MICROSCOPY: KnowledgeEntry = (() => {
  const d = ophthalmoDefaults(CBO)
  const aao = ophthalmoDefaults(AAO)
  return {
    knowledge: {
      canonicalName: sourced('Microscopia especular da córnea', d),
      description: sourced(
        'Exame de imagem não invasivo que fotografa e quantifica a camada endotelial da córnea.',
        d,
      ),
      aliases: sourced(
        ['microscopia especular', 'microscopia especular de córnea', 'contagem endotelial', 'specular microscopy'],
        d,
      ),
      purpose: sourced(
        'Avaliar a saúde do endotélio corneano — densidade celular e morfologia (pleomorfismo/polimegatismo) — para estimar a reserva funcional da córnea.',
        aao,
      ),
      howItWorks: sourced(
        'Um microscópio especular projeta e capta a luz refletida na interface endotélio–humor aquoso, gerando imagem das células endoteliais para contagem automatizada.',
        d,
      ),
      measures: sourced(
        ['densidade endotelial (células/mm²)', 'coeficiente de variação (polimegatismo)', 'hexagonalidade (pleomorfismo)', 'paquimetria central'],
        d,
      ),
      bodySystem: sourced('Endotélio corneano — sistema visual', d),
      whenIndicated: sourced(
        'Pré e pós-operatório de catarata e de transplante de córnea, distrofias endoteliais (ex.: Fuchs), uso prolongado de lentes de contato e avaliação de córnea doadora.',
        aao,
      ),
      suggestedPeriodicity: sourced(
        'Definida pela indicação clínica; no acompanhamento de distrofia endotelial ou pós-transplante, conforme orientação do oftalmologista.',
        { ...aao, confidence: 'low' },
      ),
      limitations: sourced(
        'A contagem pode ser limitada em córneas edemaciadas ou opacas e amostra apenas uma pequena região do endotélio.',
        d,
      ),
      specialty: sourced('Oftalmologia', d),
      evidenceLevel: sourced('Consenso de diretrizes / literatura oftalmológica (AAO BCSC; CBO)', aao),
      references: sourced(
        [
          'American Academy of Ophthalmology — Basic and Clinical Science Course: External Disease and Cornea',
          'Conselho Brasileiro de Oftalmologia (CBO) — diretrizes de córnea',
        ],
        aao,
      ),
      terminology: null,
    },
    match: {
      codes: [],
      names: ['Microscopia especular da córnea', 'microscopia especular', 'microscopia especular de córnea', 'contagem endotelial', 'specular microscopy'],
    },
  }
})()

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
