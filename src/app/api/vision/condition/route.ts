// ============================================================
// Ler condição de saúde / diagnóstico / alergia de um DOCUMENTO (visão da IA)
// ============================================================
// Recebe um laudo/exame/atestado (imagem ou PDF) e TRANSCREVE a condição de saúde
// registrada NO DOCUMENTO pelo profissional, para PRÉ-PREENCHER o cadastro — a
// usuária revisa e confirma. Transcrição FACTUAL do que está escrito; a SINTERA
// NÃO infere, NÃO diagnostica e NÃO dá orientação clínica (RDC 657/2022).
// Indica também se o documento é um EXAME/laudo com resultado — para que o app
// possa salvá-lo em paralelo na página de Exames (salvamento duplo).
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'

const MODEL = 'claude-haiku-4-5-20251001'

const KINDS = ['diagnostico', 'alergia', 'condicao', 'outro']

const SYSTEM = `Você TRANSCREVE informações de um documento de saúde (laudo, exame, atestado, relatório
ou receita) — imagem ou PDF. Extraia a CONDIÇÃO DE SAÚDE / DIAGNÓSTICO / ALERGIA que estiver
REGISTRADA NO DOCUMENTO pelo profissional. Regras absolutas:
- TRANSCREVA apenas o que está ESCRITO. NÃO infira, NÃO deduza, NÃO diagnostique, NÃO complete
  com seu conhecimento. Se algo não estiver no documento, use null.
- Extraia a condição PRINCIPAL do documento (o diagnóstico/condição/alergia central).
Campos:
- name: nome da CONDIÇÃO/DIAGNÓSTICO/ALERGIA APENAS se o documento AFIRMAR explicitamente um
  diagnóstico/condição (curto). Ex.: "Hipertensão arterial", "Alergia à penicilina". Para alergia,
  inclua a substância. **null quando o documento NÃO afirma uma condição** (ex.: exame normal,
  resultado negativo, valores dentro da referência) — a existência de um exame NÃO implica condição.
- kind: um de ["diagnostico","alergia","condicao","outro"] conforme o que o documento indica.
- since: data de diagnóstico/início NO FORMATO YYYY-MM-DD se houver data explícita; ou um rótulo
  curto se o documento disser (ex.: "2020"); null se ausente.
- notes: detalhes FACTUAIS relevantes escritos no documento (ex.: gravidade, CID se citado,
  profissional/emissor, orientação registrada). Sem interpretação sua. null se nada relevante.
- is_exam: true se o documento for um EXAME LABORATORIAL ou de IMAGEM / LAUDO (ex.: hemograma, FAN,
  biópsia, PSA, ressonância, ultrassom, teste alérgico), INDEPENDENTEMENTE do resultado — normal,
  negativo, positivo ou alterado, TODOS são exames. false SÓ para receita, atestado ou declaração
  SEM resultado de exame. A existência do exame NÃO depende da conclusão clínica.
- exam_type: se is_exam=true, o NOME/tipo do exame como escrito (ex.: "Hemograma", "FAN",
  "Ressonância magnética", "PSA"). null caso contrário.
- exam_date: data do exame YYYY-MM-DD se escrita; null se ausente.
Responda APENAS com JSON válido:
{"name":null,"kind":"outro","since":null,"notes":null,"is_exam":false,"exam_type":null,"exam_date":null}
NÃO forneça diagnóstico nem orientação médica — só transcreva o que o documento registra.`

const isDate = (s: unknown): s is string => typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s.trim())

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  let body: { fileBase64?: string; imageBase64?: string; mediaType?: string }
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Corpo inválido' }, { status: 400 }) }
  const fileBase64 = body.fileBase64 || body.imageBase64
  const mediaType = body.mediaType || 'image/jpeg'
  const isPdf = mediaType === 'application/pdf'
  if (!fileBase64) return NextResponse.json({ error: 'Documento ausente' }, { status: 400 })
  const SUPPORTED_IMAGE = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  if (!isPdf && !SUPPORTED_IMAGE.includes(mediaType)) {
    return NextResponse.json({ error: 'Formato não suportado (ex.: HEIC do iPhone). Use PDF, JPG ou PNG.' }, { status: 400 })
  }
  if (!process.env.ANTHROPIC_API_KEY) return NextResponse.json({ error: 'IA indisponível' }, { status: 503 })

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY, timeout: 60_000 })
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const docBlock: any = isPdf
    ? { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: fileBase64 } }
    : { type: 'image', source: { type: 'base64', media_type: mediaType, data: fileBase64 } }

  let raw = ''
  try {
    const msg = await client.messages.create({
      model: MODEL, max_tokens: 700, temperature: 0, system: SYSTEM,
      messages: [{ role: 'user', content: [
        docBlock,
        { type: 'text', text: `HOJE é ${new Date().toISOString().slice(0, 10)}. Transcreva a condição de saúde/diagnóstico/alergia registrada neste documento no JSON pedido.` },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ] as any }],
    })
    raw = msg.content[0]?.type === 'text' ? msg.content[0].text : ''
  } catch (e) {
    console.error('[vision/condition] falha na visão:', e instanceof Error ? e.message : String(e))
    return NextResponse.json({ error: 'O serviço de leitura está temporariamente indisponível. Tente novamente em instantes.' }, { status: 502 })
  }

  const m = raw.match(/\{[\s\S]*\}/)
  if (!m) return NextResponse.json({ result: null })
  try {
    const o = JSON.parse(m[0]) as Record<string, unknown>
    const name = typeof o.name === 'string' && o.name.trim() ? o.name.trim().slice(0, 160) : null
    const result = {
      name,
      kind: typeof o.kind === 'string' && KINDS.includes(o.kind.trim()) ? o.kind.trim() : 'outro',
      since: isDate(o.since) ? (o.since as string).trim() : (typeof o.since === 'string' && o.since.trim() ? o.since.trim().slice(0, 40) : null),
      notes: typeof o.notes === 'string' && o.notes.trim() ? o.notes.trim().slice(0, 500) : null,
      isExam: o.is_exam === true,
      examType: typeof o.exam_type === 'string' && o.exam_type.trim() ? o.exam_type.trim().slice(0, 120) : null,
      examDate: isDate(o.exam_date) ? (o.exam_date as string).trim() : null,
    }
    return NextResponse.json({ result })
  } catch {
    return NextResponse.json({ result: null })
  }
}
