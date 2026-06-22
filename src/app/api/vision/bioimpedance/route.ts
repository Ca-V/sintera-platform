// ============================================================
// Escanear laudo de bioimpedância por foto (visão da IA)
// ============================================================
// Recebe uma imagem (base64) de um laudo de bioimpedância (ex.: do
// nutricionista) e devolve as medidas transcritas (peso, gordura corporal,
// massa muscular, água corporal, gordura visceral, massa óssea, taxa metabólica)
// e a data — para PRÉ-PREENCHER o cadastro, que a pessoa revisa e confirma.
// Transcrição factual; NÃO interpreta, NÃO diagnostica, NÃO inventa. Não
// armazena a imagem (armazenamento opcional é feito pelo cliente).
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'

const MODEL = 'claude-haiku-4-5-20251001'

const SYSTEM = `Você transcreve um LAUDO DE BIOIMPEDÂNCIA (composição corporal) a partir de uma IMAGEM.
Extraia, EXATAMENTE como impresso (mantendo a vírgula decimal), os campos:
- peso (kg)
- gordura_corporal (percentual de gordura, %)
- massa_muscular (massa muscular/magra, kg)
- agua_corporal (água corporal total, %)
- gordura_visceral (nível de gordura visceral)
- massa_ossea (massa óssea, kg)
- taxa_metabolica (taxa metabólica basal, kcal)
- measured_on (data do exame NO FORMATO YYYY-MM-DD, se visível)
Use null para o que NÃO estiver visível. NÃO calcule IMC. NÃO converta unidades. NÃO interprete.
Responda APENAS com JSON válido:
{"measured_on":null,"peso":null,"gordura_corporal":null,"massa_muscular":null,"agua_corporal":null,"gordura_visceral":null,"massa_ossea":null,"taxa_metabolica":null}
Não invente o que não estiver visível. Não forneça orientação médica.`

function s(v: unknown): string | null {
  if (typeof v === 'number' && isFinite(v)) return String(v)
  return typeof v === 'string' && v.trim() ? v.trim().slice(0, 24) : null
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  let body: { imageBase64?: string; mediaType?: string }
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Corpo inválido' }, { status: 400 }) }
  const imageBase64 = body.imageBase64
  const mediaType = body.mediaType || 'image/jpeg'
  if (!imageBase64) return NextResponse.json({ error: 'Imagem ausente' }, { status: 400 })
  if (!process.env.ANTHROPIC_API_KEY) return NextResponse.json({ error: 'IA indisponível' }, { status: 503 })

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY, timeout: 60_000 })
  const content = [
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    { type: 'image', source: { type: 'base64', media_type: mediaType as any, data: imageBase64 } } as any,
    { type: 'text', text: 'Transcreva as medidas deste laudo de bioimpedância no formato JSON pedido.' },
  ]

  let raw = ''
  try {
    const msg = await client.messages.create({
      model: MODEL,
      max_tokens: 512,
      temperature: 0,
      system: SYSTEM,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      messages: [{ role: 'user', content: content as any }],
    })
    raw = msg.content[0]?.type === 'text' ? msg.content[0].text : ''
  } catch {
    return NextResponse.json({ error: 'Falha ao interpretar.' }, { status: 502 })
  }

  const m = raw.match(/\{[\s\S]*\}/)
  if (!m) return NextResponse.json({ result: null })
  try {
    const o = JSON.parse(m[0]) as Record<string, unknown>
    const result = {
      measured_on: typeof o.measured_on === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(o.measured_on.trim()) ? o.measured_on.trim() : null,
      peso: s(o.peso),
      gordura_corporal: s(o.gordura_corporal),
      massa_muscular: s(o.massa_muscular),
      agua_corporal: s(o.agua_corporal),
      gordura_visceral: s(o.gordura_visceral),
      massa_ossea: s(o.massa_ossea),
      taxa_metabolica: s(o.taxa_metabolica),
    }
    return NextResponse.json({ result })
  } catch {
    return NextResponse.json({ result: null })
  }
}
