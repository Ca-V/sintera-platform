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

const SYSTEM = `Você extrai medicamentos/suplementos de uma IMAGEM (caixa/embalagem ou receita)
ou de uma FALA transcrita. Liste os itens. Para cada item, SEPARE bem:
- name: apenas o nome do produto, sem dose nem frequência. Ex.: "Losartana", "Vitamina D".
- dose: quantidade por vez. Ex.: "50 mg", "2 comprimidos", "1000 UI". null se ausente.
- frequency: com que frequência usa. Ex.: "1x ao dia", "2x por semana", "de 8 em 8 horas",
  "1 comprimido à noite". null se ausente.
- started_on: data de início NO FORMATO YYYY-MM-DD, se a pessoa indicar quando começou
  (resolva expressões como "desde ontem", "semana passada", "dia 10" usando a data de HOJE
  informada na mensagem). null se não indicada.
- pack_quantity: número de unidades na embalagem (ex.: 30 comprimidos → 30). Só número. null se não dito.
- daily_consumption: quantas unidades por dia (ex.: "1 por dia" → 1). Só número. null se não dito.
- purchased_on: data da compra YYYY-MM-DD, se disser quando comprou (use HOJE para resolver relativos). null se não dito.
Responda APENAS com JSON válido: {"items":[{"name":"","dose":null,"frequency":null,"started_on":null,"pack_quantity":null,"daily_consumption":null,"purchased_on":null}]}.
NÃO coloque dose ou frequência dentro de name — separe nos campos certos.
Não invente o que não foi dito/visto. Não forneça orientação médica.`

interface ScanItem {
  name: string; dose: string | null; frequency: string | null; startedOn: string | null
  packQty: number | null; dailyCons: number | null; purchasedOn: string | null
}

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
        { type: 'text', text: `HOJE é ${new Date().toISOString().slice(0, 10)}. A pessoa ditou: "${text.slice(0, 500)}". Extraia os medicamentos/suplementos no formato JSON pedido, separando nome, dose, frequência e início de uso.` },
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
              startedOn: typeof o.started_on === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(o.started_on.trim()) ? o.started_on.trim() : null,
              packQty: typeof o.pack_quantity === 'number' && isFinite(o.pack_quantity) && o.pack_quantity > 0 ? o.pack_quantity : null,
              dailyCons: typeof o.daily_consumption === 'number' && isFinite(o.daily_consumption) && o.daily_consumption > 0 ? o.daily_consumption : null,
              purchasedOn: typeof o.purchased_on === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(o.purchased_on.trim()) ? o.purchased_on.trim() : null,
            }
          })
          .filter((x): x is ScanItem => x !== null)
          .slice(0, 20)
      }
    } catch { /* devolve vazio */ }
  }

  return NextResponse.json({ items })
}
