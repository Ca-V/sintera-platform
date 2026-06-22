// ============================================================
// Escanear medicamento/suplemento/receita por foto (visão da IA)
// ============================================================
// Recebe uma imagem (base64) e devolve os itens transcritos
// (nome · dose · frequência), para PRÉ-PREENCHER o cadastro — a usuária revisa
// e confirma. Transcrição factual do que está visível; NÃO dá orientação
// médica e NÃO inventa dados. Não armazena a imagem.
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'

const MODEL = 'claude-haiku-4-5-20251001'

const SYSTEM = `Você transcreve, de uma imagem, informações de medicamentos/suplementos.
A imagem pode ser uma caixa/embalagem ou uma receita. Liste os itens visíveis.
Para cada item, extraia:
- name: nome do produto (obrigatório)
- dose: concentração/dose se visível (ex.: "50 mg", "1000 UI") ou null
- frequency: posologia se indicada (ex.: "1x ao dia", "8/8h") ou null
Responda APENAS com JSON válido: {"items":[{"name":"","dose":null,"frequency":null}]}.
Transcreva só o que está visível — não invente. Não forneça orientação médica.`

interface ScanItem { name: string; dose: string | null; frequency: string | null }

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  let body: { imageBase64?: string; mediaType?: string; text?: string }
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Corpo inválido' }, { status: 400 }) }
  const imageBase64 = body.imageBase64
  const mediaType = body.mediaType || 'image/jpeg'
  const text = typeof body.text === 'string' ? body.text.trim() : ''
  if (!imageBase64 && !text) return NextResponse.json({ error: 'Imagem ou texto ausente' }, { status: 400 })
  if (!process.env.ANTHROPIC_API_KEY) return NextResponse.json({ error: 'IA indisponível' }, { status: 503 })

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY, timeout: 60_000 })
  // Conteúdo: foto (visão) OU texto ditado pela usuária.
  const content = imageBase64
    ? [
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        { type: 'image', source: { type: 'base64', media_type: mediaType as any, data: imageBase64 } } as any,
        { type: 'text', text: 'Transcreva os medicamentos/suplementos desta imagem no formato JSON pedido.' },
      ]
    : [
        { type: 'text', text: `A pessoa ditou: "${text.slice(0, 500)}". Extraia os medicamentos/suplementos no formato JSON pedido.` },
      ]
  let raw = ''
  try {
    const msg = await client.messages.create({
      model: MODEL,
      max_tokens: 1024,
      temperature: 0,
      system: SYSTEM,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      messages: [{ role: 'user', content: content as any }],
    })
    raw = msg.content[0]?.type === 'text' ? msg.content[0].text : ''
  } catch {
    return NextResponse.json({ error: 'Falha ao interpretar.' }, { status: 502 })
  }

  // Extrai o objeto JSON da resposta.
  const m = raw.match(/\{[\s\S]*\}/)
  let items: ScanItem[] = []
  if (m) {
    try {
      const obj = JSON.parse(m[0]) as { items?: unknown }
      if (Array.isArray(obj.items)) {
        items = obj.items
          .map((it): ScanItem | null => {
            const o = it as Record<string, unknown>
            const name = typeof o.name === 'string' ? o.name.trim() : ''
            if (!name) return null
            return {
              name: name.slice(0, 120),
              dose: typeof o.dose === 'string' && o.dose.trim() ? o.dose.trim().slice(0, 60) : null,
              frequency: typeof o.frequency === 'string' && o.frequency.trim() ? o.frequency.trim().slice(0, 60) : null,
            }
          })
          .filter((x): x is ScanItem => x !== null)
          .slice(0, 20)
      }
    } catch { /* devolve vazio */ }
  }

  return NextResponse.json({ items })
}
