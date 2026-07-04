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
- name: o NOME/TÍTULO do produto (marca/nome comercial na frente do rótulo), sem dose nem frequência. Ex.: "Losartana", "Vitamina D".

REGRA — UM produto físico = UM item:
- Se a imagem for de UM único rótulo/frasco/embalagem/produto, retorne UM ÚNICO item, mesmo que o produto contenha VÁRIOS componentes/ativos (ex.: um suplemento com Vitamina E + Coenzima Q10 + Ômega 3 é UM produto). Use o NOME DO PRODUTO (o título comercial), NÃO separe os ativos em itens diferentes.
- Só retorne MÚLTIPLOS itens quando houver produtos DISTINTOS de fato (ex.: uma receita listando vários medicamentos diferentes, ou várias embalagens/frascos diferentes na imagem).
- dose: quantidade por vez. Ex.: "50 mg", "2 comprimidos", "1000 UI". null se ausente.
- frequency: com que frequência usa. Ex.: "1x ao dia", "2x por semana", "de 8 em 8 horas",
  "1 comprimido à noite". null se ausente.
- started_on: data de início NO FORMATO YYYY-MM-DD, se a pessoa indicar quando começou
  (resolva expressões como "desde ontem", "semana passada", "dia 10" usando a data de HOJE
  informada na mensagem). null se não indicada.
- pack_quantity: CONTEÚDO numérico da embalagem (ex.: "30 comprimidos" → 30; "50 g" → 50; "120 mL" → 120). Só número. null se não dito.
- pack_unit: unidade desse conteúdo (ex.: "comprimidos", "cápsulas", "g", "mL", "doses"). null se não dito.
- daily_consumption: quanto se usa por dia, no MESMO tipo de unidade (ex.: "1 por dia" → 1; "10 mL/dia" → 10). Só número. null se não dito.
- purchased_on: data da compra YYYY-MM-DD, se disser quando comprou (use HOJE para resolver relativos). null se não dito.
- pharmaceutical_form: a FORMA farmacêutica, APENAS se estiver EXPLICITAMENTE escrita/visível no rótulo ou receita. NÃO deduza pelo nome nem pelo seu conhecimento do medicamento. Como UM destes códigos EXATOS: comprimido, capsula, dragea, solucao_oral, suspensao_oral, xarope, gotas, spray, gel, creme, pomada, locao, injetavel, colirio, sache, adesivo, outro. null quando não estiver escrita.
- administration_route: a VIA de administração, APENAS se EXPLICITAMENTE indicada no texto (NÃO deduza). Como UM destes: Oral, Tópica, Oftálmica, Nasal, Inalatória, Sublingual, Vaginal, Retal, Intramuscular, Endovenosa, Subcutânea, Outra. null quando não indicada.
Responda APENAS com JSON válido: {"items":[{"name":"","dose":null,"frequency":null,"started_on":null,"pack_quantity":null,"pack_unit":null,"daily_consumption":null,"purchased_on":null,"pharmaceutical_form":null,"administration_route":null}]}.
NÃO coloque dose ou frequência dentro de name — separe nos campos certos.
Não invente o que não foi dito/visto. Não forneça orientação médica.`

// Listas controladas (espelham a UI). Valores fora delas são descartados (null).
const FORM_SLUGS = ['comprimido', 'capsula', 'dragea', 'solucao_oral', 'suspensao_oral', 'xarope', 'gotas', 'spray', 'gel', 'creme', 'pomada', 'locao', 'injetavel', 'colirio', 'sache', 'adesivo', 'outro']
const ROUTE_LABELS = ['Oral', 'Tópica', 'Oftálmica', 'Nasal', 'Inalatória', 'Sublingual', 'Vaginal', 'Retal', 'Intramuscular', 'Endovenosa', 'Subcutânea', 'Outra']

interface ScanItem {
  name: string; dose: string | null; frequency: string | null; startedOn: string | null
  packQty: number | null; dailyCons: number | null; purchasedOn: string | null
  form: string | null; route: string | null; packUnit: string | null
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
  // A IA de visão só aceita JPEG/PNG/WebP/GIF. Fotos de iPhone costumam ser HEIC —
  // rejeita com mensagem clara em vez de deixar a chamada falhar com erro genérico.
  const SUPPORTED_IMAGE = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  if (imageBase64 && !SUPPORTED_IMAGE.includes(mediaType)) {
    return NextResponse.json({ error: 'Formato de imagem não suportado (ex.: HEIC do iPhone). Tire a foto como JPG, ou ajuste a câmera para "Mais compatível".' }, { status: 400 })
  }
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
  } catch (e) {
    // Erro técnico fica SÓ nos logs da função; a usuária vê mensagem amigável.
    const detail = e instanceof Error ? e.message : String(e)
    console.error('[medications/scan] falha na chamada de visão:', detail)
    return NextResponse.json({ error: 'O serviço de leitura está temporariamente indisponível. Tente novamente em instantes.' }, { status: 502 })
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
              form: typeof o.pharmaceutical_form === 'string' && FORM_SLUGS.includes(o.pharmaceutical_form.trim().toLowerCase()) ? o.pharmaceutical_form.trim().toLowerCase() : null,
              route: typeof o.administration_route === 'string' && ROUTE_LABELS.includes(o.administration_route.trim()) ? o.administration_route.trim() : null,
              packUnit: typeof o.pack_unit === 'string' && o.pack_unit.trim() ? o.pack_unit.trim().slice(0, 20) : null,
            }
          })
          .filter((x): x is ScanItem => x !== null)
          .slice(0, 20)
      }
    } catch { /* devolve vazio */ }
  }

  return NextResponse.json({ items })
}
