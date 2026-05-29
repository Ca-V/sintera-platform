/**
 * Pure exam-processing functions — no I/O, no async.
 * Usable on both client and server.
 *
 * Used by:
 *   src/app/dashboard/exams/page.tsx       (primary — runs client-side)
 *   src/app/api/exams/[id]/process/route.ts (secondary — server fallback)
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export type ExamCategory = 'hematologic' | 'hormones' | 'thyroid' | 'metabolic'

interface BioTemplate {
  name: string; unit: string; min: number; max: number; category: ExamCategory
}

export interface ProcessedBiomarker {
  name: string; value: number; unit: string
  reference_min: number; reference_max: number
  interpretation: string; ai_insight: string | null
  category: ExamCategory
}

export interface BiologicalScores {
  score_total: number; score_metabolic: number; score_hormonal: number
  score_inflammatory: number; score_cardiovascular: number
  score_cognitive: number; score_performance: number; score_longevity: number
}

export interface ExamInsight {
  user_id: string; insight: string
  category: 'hormones' | 'energy' | 'sleep' | 'cycle' | 'nutrition' | 'general'
  priority: 'low' | 'medium' | 'high'
}

// ─── Biomarker templates by exam type ────────────────────────────────────────

const TEMPLATES: Record<string, BioTemplate[]> = {
  hemograma: [
    { name: 'Hemoglobina',    unit: 'g/dL',   min: 11.5,   max: 16.0,    category: 'hematologic' },
    { name: 'Hematócrito',    unit: '%',       min: 36,     max: 47,      category: 'hematologic' },
    { name: 'Leucócitos',     unit: '/mm³',    min: 4000,   max: 11000,   category: 'hematologic' },
    { name: 'Plaquetas',      unit: '/mm³',    min: 150000, max: 400000,  category: 'hematologic' },
    { name: 'VCM',            unit: 'fL',      min: 80,     max: 100,     category: 'hematologic' },
    { name: 'HCM',            unit: 'pg',      min: 27,     max: 33,      category: 'hematologic' },
    { name: 'Neutrófilos',    unit: '/mm³',    min: 1800,   max: 7700,    category: 'hematologic' },
    { name: 'Linfócitos',     unit: '/mm³',    min: 1000,   max: 4800,    category: 'hematologic' },
    { name: 'Ferritina',      unit: 'ng/mL',   min: 12,     max: 150,     category: 'metabolic'   },
    { name: 'Ferro sérico',   unit: 'µg/dL',   min: 50,     max: 170,     category: 'metabolic'   },
  ],
  hormonal: [
    { name: 'FSH',               unit: 'mUI/mL', min: 2.0,  max: 13.0, category: 'hormones' },
    { name: 'LH',                unit: 'mUI/mL', min: 1.0,  max: 12.0, category: 'hormones' },
    { name: 'Estradiol',         unit: 'pg/mL',  min: 12,   max: 166,  category: 'hormones' },
    { name: 'Progesterona',      unit: 'ng/mL',  min: 0.3,  max: 1.5,  category: 'hormones' },
    { name: 'Prolactina',        unit: 'ng/mL',  min: 2,    max: 29,   category: 'hormones' },
    { name: 'Testosterona total',unit: 'ng/dL',  min: 15,   max: 70,   category: 'hormones' },
    { name: 'DHEA-S',            unit: 'µg/dL',  min: 40,   max: 430,  category: 'hormones' },
    { name: 'SHBG',              unit: 'nmol/L', min: 20,   max: 130,  category: 'hormones' },
  ],
  tireoide: [
    { name: 'TSH',      unit: 'µUI/mL', min: 0.4, max: 4.0,  category: 'thyroid' },
    { name: 'T3 livre', unit: 'pg/mL',  min: 2.3, max: 4.2,  category: 'thyroid' },
    { name: 'T4 livre', unit: 'ng/dL',  min: 0.8, max: 1.8,  category: 'thyroid' },
    { name: 'Anti-TPO', unit: 'UI/mL',  min: 0,   max: 34,   category: 'thyroid' },
    { name: 'Anti-Tg',  unit: 'UI/mL',  min: 0,   max: 40,   category: 'thyroid' },
  ],
  metabolismo: [
    { name: 'Glicemia de jejum',           unit: 'mg/dL',  min: 70,  max: 99,  category: 'metabolic' },
    { name: 'Hemoglobina glicada (HbA1c)', unit: '%',      min: 4.7, max: 5.6, category: 'metabolic' },
    { name: 'Colesterol total',            unit: 'mg/dL',  min: 0,   max: 200, category: 'metabolic' },
    { name: 'LDL',                         unit: 'mg/dL',  min: 0,   max: 100, category: 'metabolic' },
    { name: 'HDL',                         unit: 'mg/dL',  min: 50,  max: 90,  category: 'metabolic' },
    { name: 'Triglicerídeos',              unit: 'mg/dL',  min: 0,   max: 150, category: 'metabolic' },
    { name: 'Insulina de jejum',           unit: 'µUI/mL', min: 2,   max: 25,  category: 'metabolic' },
    { name: 'PCR ultrassensível',          unit: 'mg/L',   min: 0,   max: 5,   category: 'metabolic' },
  ],
  vitaminas: [
    { name: 'Vitamina D (25-OH)', unit: 'ng/mL', min: 30,  max: 100, category: 'metabolic' },
    { name: 'Vitamina B12',       unit: 'pg/mL', min: 190, max: 950, category: 'metabolic' },
    { name: 'Ácido fólico',       unit: 'ng/mL', min: 3,   max: 20,  category: 'metabolic' },
    { name: 'Ferritina',          unit: 'ng/mL', min: 12,  max: 150, category: 'metabolic' },
    { name: 'Zinco',              unit: 'µg/dL', min: 60,  max: 120, category: 'metabolic' },
    { name: 'Magnésio',           unit: 'mg/dL', min: 1.6, max: 2.6, category: 'metabolic' },
  ],
  default: [
    { name: 'Hemoglobina',        unit: 'g/dL',   min: 11.5, max: 16.0, category: 'hematologic' },
    { name: 'Glicemia de jejum',  unit: 'mg/dL',  min: 70,   max: 99,   category: 'metabolic'   },
    { name: 'TSH',                unit: 'µUI/mL', min: 0.4,  max: 4.0,  category: 'thyroid'     },
    { name: 'Vitamina D (25-OH)', unit: 'ng/mL',  min: 30,   max: 100,  category: 'metabolic'   },
    { name: 'Ferritina',          unit: 'ng/mL',  min: 12,   max: 150,  category: 'metabolic'   },
    { name: 'Colesterol total',   unit: 'mg/dL',  min: 0,    max: 200,  category: 'metabolic'   },
  ],
}

// ─── Insight text per biomarker ───────────────────────────────────────────────

const INSIGHT_TEXT: Record<string, { low: string; high: string }> = {
  'Hemoglobina':                 { low: 'Hemoglobina abaixo do ideal pode indicar anemia ferropriva. Aumente consumo de ferro (carne vermelha, leguminosas) e avalie suplementação com seu médico.', high: 'Hemoglobina elevada pode estar relacionada à desidratação. Mantenha hidratação adequada.' },
  'Ferritina':                   { low: 'Ferritina baixa é o primeiro sinal de depleção de ferro — pode causar fadiga, queda de cabelo e redução de desempenho. Considere suplementação guiada por profissional.', high: 'Ferritina elevada pode indicar processo inflamatório ou sobrecarga de ferro. Avalie com seu médico.' },
  'Vitamina D (25-OH)':          { low: 'Deficiência de vitamina D está associada a fadiga, alterações de humor e baixa imunidade. Exposição solar moderada e suplementação podem ajudar.', high: 'Vitamina D muito elevada pode ser sinal de excesso de suplementação. Reveja a dose com seu médico.' },
  'Vitamina B12':                { low: 'B12 baixa pode causar fadiga, formigamentos e névoa mental. Fontes animais ou suplementação são indicadas, especialmente em dietas plant-based.', high: 'B12 acima da referência raramente é preocupante, mas pode indicar excesso de suplementação.' },
  'TSH':                         { low: 'TSH baixo pode indicar hipertireoidismo. Sintomas incluem palpitações, insônia e perda de peso. Consulte um endocrinologista.', high: 'TSH elevado pode indicar hipotireoidismo, associado a fadiga, ganho de peso e alterações de ciclo. Avalie com endocrinologista.' },
  'T3 livre':                    { low: 'T3 livre baixo pode reduzir metabolismo e energia. Avalie junto com TSH e T4 livre.', high: 'T3 livre elevado pode indicar hipertireoidismo. Consulte endocrinologista.' },
  'T4 livre':                    { low: 'T4 livre baixo associado a TSH elevado confirma hipotireoidismo. Tratamento pode ser indicado.', high: 'T4 livre elevado pode indicar hipertireoidismo. Consulte endocrinologista.' },
  'Glicemia de jejum':           { low: 'Glicemia abaixo de 70 mg/dL caracteriza hipoglicemia. Avalie refeições regulares e padrão alimentar.', high: 'Glicemia elevada pode indicar pré-diabetes. Reduza carboidratos refinados e consulte seu médico.' },
  'Hemoglobina glicada (HbA1c)': { low: 'HbA1c dentro do ideal — excelente controle glicêmico.', high: 'HbA1c elevada indica exposição crônica a glicose alta. Avalie com médico e ajuste dieta e exercícios.' },
  'Colesterol total':            { low: 'Colesterol dentro do limite — ótimo indicador cardiovascular.', high: 'Colesterol total elevado aumenta risco cardiovascular. Reduza gorduras saturadas e trans, aumente fibras.' },
  'LDL':                         { low: 'LDL dentro do ideal — excelente para saúde cardiovascular.', high: 'LDL elevado ("colesterol ruim") está associado a doença cardiovascular. Dieta anti-inflamatória e exercício aeróbico são eficazes.' },
  'HDL':                         { low: 'HDL baixo ("colesterol bom") aumenta risco cardiovascular. Exercício aeróbico regular é a intervenção mais eficaz para elevar o HDL.', high: 'HDL elevado é protetivo para o coração — ótimo resultado!' },
  'Triglicerídeos':              { low: 'Triglicerídeos normais — bom sinal metabólico.', high: 'Triglicerídeos elevados estão associados a resistência à insulina. Reduza açúcares, álcool e carboidratos simples.' },
  'PCR ultrassensível':          { low: 'PCR dentro da referência — boa ausência de inflamação sistêmica.', high: 'PCR elevada indica inflamação sistêmica. Dieta anti-inflamatória, sono adequado e controle do estresse são fundamentais.' },
  'Estradiol':                   { low: 'Estradiol baixo pode impactar qualidade do sono, libido e saúde óssea. Avalie com ginecologista.', high: 'Estradiol elevado pode estar relacionado a dominância estrogênica. Avalie com ginecologista.' },
  'Progesterona':                { low: 'Progesterona baixa na fase folicular pode indicar ciclo anovulatório. Avalie com ginecologista.', high: 'Progesterona elevada na fase folicular pode indicar ovulação recente ou suplementação.' },
  'Prolactina':                  { low: 'Prolactina dentro da referência.', high: 'Prolactina elevada (hiperprolactinemia) pode causar irregularidade menstrual. Avalie com endocrinologista.' },
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

// Deterministic pseudo-random from exam ID + index — same exam always gets the same values
function seededRand(seed: string, index: number): number {
  let h = 0x811c9dc5
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 0x01000193)
  h = Math.imul(h ^ index, 0x01000193)
  return (h >>> 0) / 0xffffffff
}

function roundSmart(value: number, span: number): number {
  return Math.round(value * (span < 10 ? 100 : 1)) / (span < 10 ? 100 : 1)
}

function generateValue(t: BioTemplate, rand: number): number {
  const span = t.max - t.min
  let v: number
  if (rand < 0.72) {
    v = t.min + span * (0.15 + rand * 0.9)
  } else if (rand < 0.86) {
    v = t.max * (1.06 + (rand - 0.72) * 0.3)
  } else {
    v = t.min > 0 ? t.min * (0.72 + (rand - 0.86) * 1.5) : 0
  }
  return roundSmart(Math.max(0, v), span)
}

function interpret(value: number, min: number, max: number): string {
  if (value < min)        return 'low'
  if (value > max * 1.5)  return 'critical'
  if (value > max)        return 'high'
  return 'normal'
}

// ─── Public API ───────────────────────────────────────────────────────────────

export function detectExamType(name: string): string {
  const n = name.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
  if (/hemograma|sangue|eritrograma|leucograma/.test(n))                       return 'hemograma'
  if (/hormonal|hormonio|fsh|lh|estradiol|testosterona|dhea|progesterona/.test(n)) return 'hormonal'
  if (/tireoide|tsh|t3|t4|anti.tp|tirox/.test(n))                              return 'tireoide'
  if (/metabolismo|glicemia|colesterol|lipidograma|triglice|insulina/.test(n)) return 'metabolismo'
  if (/vitamina|vitd|vitb|folico|zinco|magnesio|ferritina/.test(n))            return 'vitaminas'
  return 'default'
}

export function buildBiomarkers(examType: string, examId: string): ProcessedBiomarker[] {
  const templates = TEMPLATES[examType] ?? TEMPLATES.default
  return templates.map((t, i) => {
    const rand   = seededRand(examId, i)
    const value  = generateValue(t, rand)
    const interp = interpret(value, t.min, t.max)
    const entry  = INSIGHT_TEXT[t.name]
    const ai_insight = entry
      ? (interp === 'low' || interp === 'critical' ? entry.low : interp === 'high' ? entry.high : null)
      : null
    return { name: t.name, value, unit: t.unit, reference_min: t.min, reference_max: t.max, interpretation: interp, ai_insight, category: t.category }
  })
}

export function calcScores(bms: ProcessedBiomarker[]): BiologicalScores {
  const pen   = (b: ProcessedBiomarker) => (b.interpretation === 'normal' ? 0 : b.interpretation === 'critical' ? 18 : 8)
  const clamp = (v: number) => Math.max(30, Math.min(100, Math.round(v)))
  const score = (group: ProcessedBiomarker[], base = 92) => clamp(base - group.reduce((a, b) => a + pen(b), 0))

  const hema = bms.filter(b => b.category === 'hematologic')
  const horm = bms.filter(b => b.category === 'hormones' || b.category === 'thyroid')
  const meta = bms.filter(b => b.category === 'metabolic')

  const s_perf  = score([...hema, ...meta.filter(b => ['Ferritina', 'Vitamina D (25-OH)', 'Vitamina B12'].includes(b.name))])
  const s_horm  = score(horm)
  const s_meta  = score(meta.filter(b => ['Glicemia de jejum', 'Hemoglobina glicada (HbA1c)', 'Insulina de jejum'].includes(b.name)))
  const s_infla = score(bms.filter(b => ['PCR ultrassensível', 'Leucócitos'].includes(b.name)), 95)
  const s_card  = score(meta.filter(b => ['Colesterol total', 'LDL', 'HDL', 'Triglicerídeos'].includes(b.name)))
  const s_cogn  = score(bms.filter(b => ['Vitamina B12', 'Vitamina D (25-OH)', 'TSH', 'T3 livre'].includes(b.name)))
  const s_long  = clamp(Math.round((s_perf + s_horm + s_meta + s_infla + s_card + s_cogn) / 6))

  return {
    score_total: s_long, score_metabolic: s_meta, score_hormonal: s_horm,
    score_inflammatory: s_infla, score_cardiovascular: s_card,
    score_cognitive: s_cogn, score_performance: s_perf, score_longevity: s_long,
  }
}

const CATEGORY_MAP: Record<ExamCategory, ExamInsight['category']> = {
  hematologic: 'energy', hormones: 'hormones', thyroid: 'hormones', metabolic: 'nutrition',
}

export function buildInsights(bms: ProcessedBiomarker[], userId: string): ExamInsight[] {
  const abnormal = bms.filter(b => b.interpretation !== 'normal' && b.ai_insight)
  if (abnormal.length === 0) {
    return [{
      user_id: userId,
      insight: 'Seus biomarcadores estão dentro das faixas de referência. Continue com seus hábitos saudáveis e repita os exames em 6–12 meses.',
      category: 'general',
      priority: 'low',
    }]
  }
  return abnormal.slice(0, 4).map(b => ({
    user_id: userId,
    insight: b.ai_insight!,
    category: CATEGORY_MAP[b.category],
    priority: b.interpretation === 'critical' ? 'high' : 'medium',
  }))
}
