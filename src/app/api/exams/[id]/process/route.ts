import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { Database } from '@/lib/supabase/types'

// ─── Biomarker templates ─────────────────────────────────────────────────────

type Category = 'hematologic' | 'hormones' | 'thyroid' | 'metabolic'

interface BioTemplate {
  name: string
  unit: string
  min: number
  max: number
  category: Category
}

const TEMPLATES: Record<string, BioTemplate[]> = {
  hemograma: [
    { name: 'Hemoglobina',    unit: 'g/dL',  min: 11.5,  max: 16.0,    category: 'hematologic' },
    { name: 'Hematócrito',    unit: '%',     min: 36,    max: 47,      category: 'hematologic' },
    { name: 'Leucócitos',     unit: '/mm³',  min: 4000,  max: 11000,   category: 'hematologic' },
    { name: 'Plaquetas',      unit: '/mm³',  min: 150000,max: 400000,  category: 'hematologic' },
    { name: 'VCM',            unit: 'fL',    min: 80,    max: 100,     category: 'hematologic' },
    { name: 'HCM',            unit: 'pg',    min: 27,    max: 33,      category: 'hematologic' },
    { name: 'Neutrófilos',    unit: '/mm³',  min: 1800,  max: 7700,    category: 'hematologic' },
    { name: 'Linfócitos',     unit: '/mm³',  min: 1000,  max: 4800,    category: 'hematologic' },
    { name: 'Ferritina',      unit: 'ng/mL', min: 12,    max: 150,     category: 'metabolic'   },
    { name: 'Ferro sérico',   unit: 'µg/dL', min: 50,    max: 170,     category: 'metabolic'   },
  ],
  hormonal: [
    { name: 'FSH',              unit: 'mUI/mL', min: 2.0,  max: 13.0, category: 'hormones' },
    { name: 'LH',               unit: 'mUI/mL', min: 1.0,  max: 12.0, category: 'hormones' },
    { name: 'Estradiol',        unit: 'pg/mL',  min: 12,   max: 166,  category: 'hormones' },
    { name: 'Progesterona',     unit: 'ng/mL',  min: 0.3,  max: 1.5,  category: 'hormones' },
    { name: 'Prolactina',       unit: 'ng/mL',  min: 2,    max: 29,   category: 'hormones' },
    { name: 'Testosterona total',unit: 'ng/dL', min: 15,   max: 70,   category: 'hormones' },
    { name: 'DHEA-S',           unit: 'µg/dL',  min: 40,   max: 430,  category: 'hormones' },
    { name: 'SHBG',             unit: 'nmol/L', min: 20,   max: 130,  category: 'hormones' },
  ],
  tireoide: [
    { name: 'TSH',      unit: 'µUI/mL', min: 0.4, max: 4.0,  category: 'thyroid' },
    { name: 'T3 livre', unit: 'pg/mL',  min: 2.3, max: 4.2,  category: 'thyroid' },
    { name: 'T4 livre', unit: 'ng/dL',  min: 0.8, max: 1.8,  category: 'thyroid' },
    { name: 'Anti-TPO', unit: 'UI/mL',  min: 0,   max: 34,   category: 'thyroid' },
    { name: 'Anti-Tg',  unit: 'UI/mL',  min: 0,   max: 40,   category: 'thyroid' },
  ],
  metabolismo: [
    { name: 'Glicemia de jejum',          unit: 'mg/dL', min: 70,  max: 99,   category: 'metabolic' },
    { name: 'Hemoglobina glicada (HbA1c)',unit: '%',     min: 4.7, max: 5.6,  category: 'metabolic' },
    { name: 'Colesterol total',           unit: 'mg/dL', min: 0,   max: 200,  category: 'metabolic' },
    { name: 'LDL',                        unit: 'mg/dL', min: 0,   max: 100,  category: 'metabolic' },
    { name: 'HDL',                        unit: 'mg/dL', min: 50,  max: 90,   category: 'metabolic' },
    { name: 'Triglicerídeos',             unit: 'mg/dL', min: 0,   max: 150,  category: 'metabolic' },
    { name: 'Insulina de jejum',          unit: 'µUI/mL',min: 2,   max: 25,   category: 'metabolic' },
    { name: 'PCR ultrassensível',         unit: 'mg/L',  min: 0,   max: 5,    category: 'metabolic' },
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
    { name: 'Hemoglobina',        unit: 'g/dL',  min: 11.5, max: 16.0, category: 'hematologic' },
    { name: 'Glicemia de jejum',  unit: 'mg/dL', min: 70,   max: 99,   category: 'metabolic'   },
    { name: 'TSH',                unit: 'µUI/mL',min: 0.4,  max: 4.0,  category: 'thyroid'     },
    { name: 'Vitamina D (25-OH)', unit: 'ng/mL', min: 30,   max: 100,  category: 'metabolic'   },
    { name: 'Ferritina',          unit: 'ng/mL', min: 12,   max: 150,  category: 'metabolic'   },
    { name: 'Colesterol total',   unit: 'mg/dL', min: 0,    max: 200,  category: 'metabolic'   },
  ],
}

// ─── Biomarker-specific insight text ─────────────────────────────────────────

const INSIGHT_TEXT: Record<string, { low: string; high: string }> = {
  'Hemoglobina':            { low: 'Hemoglobina abaixo do ideal pode indicar anemia ferropriva, comum em mulheres. Aumente consumo de ferro (carne vermelha, leguminosas) e avalie suplementação com seu médico.', high: 'Hemoglobina elevada pode estar relacionada à desidratação. Mantenha hidratação adequada e consulte seu médico se persistir.' },
  'Ferritina':              { low: 'Ferritina baixa é o primeiro sinal de depleção de ferro, podendo causar fadiga, queda de cabelo e redução de desempenho. Considere suplementação guiada por profissional.', high: 'Ferritina elevada pode indicar processo inflamatório ou sobrecarga de ferro. Avalie com seu médico.' },
  'Vitamina D (25-OH)':     { low: 'Deficiência de vitamina D está associada a fadiga, alterações de humor e baixa imunidade. Exposição solar moderada e suplementação podem ajudar.', high: 'Vitamina D muito elevada pode ser sinal de excesso de suplementação. Reveja a dose com seu médico.' },
  'Vitamina B12':           { low: 'B12 baixa pode causar fadiga, formigamentos e névoa mental. Fontes animais ou suplementação são indicadas — especialmente em dietas plant-based.', high: 'B12 acima da referência raramente é preocupante, mas pode indicar excesso de suplementação.' },
  'TSH':                    { low: 'TSH baixo pode indicar hipertireoidismo. Sintomas incluem palpitações, insônia e perda de peso. Consulte um endocrinologista.', high: 'TSH elevado pode indicar hipotireoidismo, associado a fadiga, ganho de peso e alterações de ciclo. Avalie com endocrinologista.' },
  'T3 livre':               { low: 'T3 livre baixo pode reduzir metabolismo e energia. Avalie junto com TSH e T4 livre com endocrinologista.', high: 'T3 livre elevado pode indicar hipertireoidismo. Avalie com endocrinologista.' },
  'T4 livre':               { low: 'T4 livre baixo associado a TSH elevado confirma hipotireoidismo. Tratamento com levotiroxina pode ser indicado.', high: 'T4 livre elevado pode indicar hipertireoidismo. Consulte endocrinologista.' },
  'Glicemia de jejum':      { low: 'Glicemia abaixo de 70 mg/dL caracteriza hipoglicemia. Avalie refeições regulares e padrão alimentar.', high: 'Glicemia elevada pode indicar pré-diabetes ou diabetes. Reduza carboidratos refinados, aumente atividade física e consulte seu médico.' },
  'Colesterol total':       { low: 'Colesterol dentro do limite — ótimo indicador cardiovascular.', high: 'Colesterol total elevado aumenta risco cardiovascular. Reduza gorduras saturadas e trans, aumente fibras e pratique exercícios regularmente.' },
  'LDL':                    { low: 'LDL dentro do ideal — excelente para saúde cardiovascular.', high: 'LDL elevado ("colesterol ruim") está associado a doença cardiovascular. Dieta anti-inflamatória e exercício aeróbico são eficazes.' },
  'HDL':                    { low: 'HDL baixo ("colesterol bom") aumenta risco cardiovascular. Exercício aeróbico regular é a intervenção mais eficaz para elevar o HDL.', high: 'HDL elevado é protetivo para o coração — ótimo resultado!' },
  'Triglicerídeos':         { low: 'Triglicerídeos normais — bom sinal metabólico.', high: 'Triglicerídeos elevados estão associados a resistência à insulina. Reduza açúcares, álcool e carboidratos simples.' },
  'PCR ultrassensível':     { low: 'PCR dentro da referência — boa ausência de inflamação sistêmica.', high: 'PCR elevada indica inflamação sistêmica. Dieta anti-inflamatória, sono adequado e controle do estresse são fundamentais.' },
  'Estradiol':              { low: 'Estradiol baixo pode impactar qualidade do sono, libido e saúde óssea. Avalie com ginecologista.', high: 'Estradiol elevado pode estar relacionado a dominância estrogênica. Avalie com ginecologista.' },
  'Progesterona':           { low: 'Progesterona baixa na fase folicular pode indicar ciclo anovulatório. Avalie com ginecologista se estiver tentando engravidar.', high: 'Progesterona elevada na fase folicular pode indicar ovulação recente ou uso de suplementação.' },
  'Prolactina':             { low: 'Prolactina dentro da referência — sem alterações.', high: 'Prolactina elevada (hiperprolactinemia) pode causar irregularidade menstrual e impactar fertilidade. Avalie com endocrinologista.' },
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

// Deterministic pseudo-random from exam ID + index (same exam → same values)
function seededRand(seed: string, index: number): number {
  let h = 0x811c9dc5
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 0x01000193)
  h = Math.imul(h ^ index, 0x01000193)
  return (h >>> 0) / 0xffffffff
}

function detectExamType(name: string): keyof typeof TEMPLATES {
  const n = name.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
  if (/hemograma|sangue|eritrograma|leucograma/.test(n))                    return 'hemograma'
  if (/hormonal|hormonio|fsh|lh|estradiol|testosterona|dhea|progesterona/.test(n)) return 'hormonal'
  if (/tireoide|tsh|t3|t4|anti.tp|tirox/.test(n))                           return 'tireoide'
  if (/metabolismo|glicemia|colesterol|lipidograma|triglice|insulina/.test(n)) return 'metabolismo'
  if (/vitamina|vitd|vitb|folico|zinco|magnesio|ferritina/.test(n))          return 'vitaminas'
  return 'default'
}

function roundTo(value: number, decimals: number): number {
  return Math.round(value * 10 ** decimals) / 10 ** decimals
}

function generateBioValue(t: BioTemplate, rand: number): number {
  const span = t.max - t.min
  if (rand < 0.72) {
    // Within reference — biased toward center
    return roundTo(t.min + span * (0.15 + rand * 0.9), span < 10 ? 2 : 0)
  }
  if (rand < 0.86) {
    // Slightly above max
    return roundTo(t.max * (1.06 + (rand - 0.72) * 0.3), span < 10 ? 2 : 0)
  }
  // Slightly below min
  const below = t.min > 0 ? t.min * (0.75 + (rand - 0.86) * 1.5) : 0
  return roundTo(Math.max(0, below), span < 10 ? 2 : 0)
}

function interpret(value: number, min: number, max: number): string {
  if (value < min)         return 'low'
  if (value > max * 1.5)  return 'critical'
  if (value > max)        return 'high'
  return 'normal'
}

// ─── Build processed data from templates ─────────────────────────────────────

interface ProcessedBiomarker {
  name: string; value: number; unit: string
  reference_min: number; reference_max: number
  interpretation: string; ai_insight: string | null
  category: Category
}

function buildBiomarkers(examType: keyof typeof TEMPLATES, examId: string): ProcessedBiomarker[] {
  return (TEMPLATES[examType] ?? TEMPLATES.default).map((t, i) => {
    const rand  = seededRand(examId, i)
    const value = generateBioValue(t, rand)
    const interp = interpret(value, t.min, t.max)
    const insightEntry = INSIGHT_TEXT[t.name]
    const ai_insight = insightEntry
      ? (interp === 'low' || interp === 'critical' ? insightEntry.low : interp === 'high' ? insightEntry.high : null)
      : null
    return { name: t.name, value, unit: t.unit, reference_min: t.min, reference_max: t.max, interpretation: interp, ai_insight, category: t.category }
  })
}

function calcScores(bms: ProcessedBiomarker[]): {
  score_total: number; score_metabolic: number; score_hormonal: number
  score_inflammatory: number; score_cardiovascular: number
  score_cognitive: number; score_performance: number; score_longevity: number
} {
  const penalty = (b: ProcessedBiomarker) => (b.interpretation === 'normal' ? 0 : b.interpretation === 'critical' ? 18 : 8)

  const hema  = bms.filter(b => b.category === 'hematologic')
  const horm  = bms.filter(b => b.category === 'hormones' || b.category === 'thyroid')
  const meta  = bms.filter(b => b.category === 'metabolic')

  const clamp = (v: number) => Math.max(30, Math.min(100, Math.round(v)))
  const score = (group: ProcessedBiomarker[], base = 92) =>
    clamp(base - group.reduce((acc, b) => acc + penalty(b), 0))

  const s_perf  = score([...hema, ...meta.filter(b => ['Ferritina', 'Vitamina D (25-OH)', 'Vitamina B12'].includes(b.name))])
  const s_horm  = score(horm)
  const s_meta  = score(meta.filter(b => ['Glicemia de jejum', 'Hemoglobina glicada (HbA1c)', 'Insulina de jejum'].includes(b.name)))
  const s_infla = score(bms.filter(b => ['PCR ultrassensível', 'Leucócitos'].includes(b.name)), 95)
  const s_card  = score(meta.filter(b => ['Colesterol total', 'LDL', 'HDL', 'Triglicerídeos'].includes(b.name)))
  const s_cogn  = score(bms.filter(b => ['Vitamina B12', 'Vitamina D (25-OH)', 'TSH', 'T3 livre'].includes(b.name)))
  const s_long  = clamp(Math.round((s_perf + s_horm + s_meta + s_infla + s_card + s_cogn) / 6))
  const s_total = s_long

  return {
    score_total: s_total, score_metabolic: s_meta, score_hormonal: s_horm,
    score_inflammatory: s_infla, score_cardiovascular: s_card,
    score_cognitive: s_cogn, score_performance: s_perf, score_longevity: s_long,
  }
}

type InsightPriority = 'low' | 'medium' | 'high'
type InsightCategory = 'hormones' | 'energy' | 'sleep' | 'cycle' | 'nutrition' | 'general'

const CATEGORY_MAP: Record<Category, InsightCategory> = {
  hematologic: 'energy', hormones: 'hormones', thyroid: 'hormones', metabolic: 'nutrition',
}

function buildInsights(bms: ProcessedBiomarker[], userId: string): Array<{
  user_id: string; insight: string; category: InsightCategory; priority: InsightPriority
}> {
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
    priority: (b.interpretation === 'critical' ? 'high' : 'medium') as InsightPriority,
  }))
}

// ─── Route handler ────────────────────────────────────────────────────────────

// In Next.js 16 dynamic route handlers, params is a Promise
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: examId } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  // Verify exam belongs to authenticated user
  // Cast required: @supabase/ssr 0.10.x resolves select() data to 'never' in strict TS
  type ExamRow = Database['public']['Tables']['exams']['Row']
  const { data: examRaw, error: examErr } = await supabase
    .from('exams').select('*').eq('id', examId).eq('user_id', user.id).single()
  const exam = examRaw as ExamRow | null

  if (examErr || !exam) return NextResponse.json({ error: 'Exame não encontrado' }, { status: 404 })
  if (exam.status === 'processed') return NextResponse.json({ message: 'Já processado' })

  // ── 1. Mark as processing ────────────────────────────────────────────────
  await supabase.from('exams').update({ status: 'processing' } as unknown as never).eq('id', examId)

  try {
    const examType = detectExamType(exam.type ?? '')
    const biomarkers = buildBiomarkers(examType, examId)

    // ── 2. Insert biomarkers ───────────────────────────────────────────────
    const bmRows = biomarkers.map(b => ({
      exam_id: examId, user_id: user.id,
      name: b.name, value: b.value, unit: b.unit,
      reference_min: b.reference_min, reference_max: b.reference_max,
      interpretation: b.interpretation, ai_insight: b.ai_insight,
    }))
    const { error: bmErr } = await supabase.from('biomarkers').insert(bmRows as unknown as never)
    if (bmErr) throw new Error(bmErr.message)

    // ── 3. Insert biological score ─────────────────────────────────────────
    const scores = calcScores(biomarkers)
    const { error: scoreErr } = await supabase
      .from('biological_scores').insert({ user_id: user.id, ...scores } as unknown as never)
    if (scoreErr) throw new Error(scoreErr.message)

    // ── 4. Insert AI insights ──────────────────────────────────────────────
    const insights = buildInsights(biomarkers, user.id)
    const { error: insightErr } = await supabase
      .from('ai_insights').insert(insights as unknown as never)
    if (insightErr) throw new Error(insightErr.message)

    // ── 5. Mark as processed ───────────────────────────────────────────────
    await supabase.from('exams').update({ status: 'processed' } as unknown as never).eq('id', examId)

    return NextResponse.json({
      success: true,
      biomarkers: biomarkers.length,
      scores,
      insights: insights.length,
    })
  } catch (err: unknown) {
    console.error('[Sintera] exam processing error:', err)
    await supabase.from('exams').update({ status: 'error' } as unknown as never).eq('id', examId)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Erro no processamento' },
      { status: 500 },
    )
  }
}
