// ============================================================
// Escanear receita de óculos por foto (visão da IA)
// ============================================================
// Recebe uma imagem (base64) de uma receita oftalmológica e devolve o grau
// transcrito por olho (OD/OE: esférico, cilíndrico, eixo, adição), DNP, data e
// prescritor — para PRÉ-PREENCHER o cadastro, que a pessoa revisa e confirma.
// Transcrição factual do que está visível; NÃO interpreta, NÃO prescreve, NÃO
// inventa dados. Não armazena a imagem (o armazenamento é feito pelo cliente).
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'

const MODEL = 'claude-haiku-4-5-20251001'

const SYSTEM = `Você transcreve uma RECEITA OFTALMOLÓGICA DE ÓCULOS a partir de uma IMAGEM.
Extraia, EXATAMENTE como impresso, o grau de cada olho:
- OD = olho direito (pode aparecer como "OD" ou "Olho Direito").
- OE = olho esquerdo (pode aparecer como "OE", "OS" ou "Olho Esquerdo").
Para cada olho devolva: sph (esférico, ex.: "-2,00", "+1,25"), cyl (cilíndrico, ex.: "-0,75"),
axis (eixo, ex.: "180", "90"), add (adição, ex.: "+2,00"). Use null para o que não aparecer.
Devolva também: dnp (distância naso-pupilar/DP, ex.: "62" ou "31/31"), prescribed_on (data da
receita NO FORMATO YYYY-MM-DD, se visível) e prescriber (nome do profissional/clínica, se visível).
Mantenha o sinal (+/-) e a vírgula decimal como impresso. NÃO converta, NÃO calcule, NÃO interprete.
Responda APENAS com JSON válido:
{"od":{"sph":null,"cyl":null,"axis":null,"add":null},"oe":{"sph":null,"cyl":null,"axis":null,"add":null},"dnp":null,"prescribed_on":null,"prescriber":null}
Não invente o que não estiver visível. Não forneça orientação médica.`

function s(v: unknown, max = 24): string | null {
  return typeof v === 'string' && v.trim() ? v.trim().slice(0, max) : null
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
    { type: 'text', text: 'Transcreva o grau desta receita de óculos no formato JSON pedido.' },
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
    const o = JSON.parse(m[0]) as Record<string, Record<string, unknown> | unknown>
    const od = (o.od ?? {}) as Record<string, unknown>
    const oe = (o.oe ?? {}) as Record<string, unknown>
    const result = {
      od: { sph: s(od.sph), cyl: s(od.cyl), axis: s(od.axis), add: s(od.add) },
      oe: { sph: s(oe.sph), cyl: s(oe.cyl), axis: s(oe.axis), add: s(oe.add) },
      dnp: s(o.dnp),
      prescribed_on: typeof o.prescribed_on === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(o.prescribed_on.trim()) ? o.prescribed_on.trim() : null,
      prescriber: s(o.prescriber, 120),
    }
    return NextResponse.json({ result })
  } catch {
    return NextResponse.json({ result: null })
  }
}
