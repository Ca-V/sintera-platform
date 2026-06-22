// POST /api/omics/panels/:id/ingest-pdf — ingestão de laudo ômico por PDF/foto.
// A IA TRANSCREVE o laudo em linhas estruturadas (transcrição factual, sem
// interpretar/classificar) e elas entram no MESMO pipeline omics_ingest
// (resolução pelo catálogo + versionamento + persistência). O arquivo original
// é preservado pelo cliente (storage) e referenciado em source_file.
//
// Observação: para painéis untargeted com milhares de metabólitos, o caminho
// estruturado CSV/JSON é o robusto; a extração por PDF cobre laudos legíveis.

import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { omicsAuth } from '@/lib/omics/server'

const MODEL = 'claude-haiku-4-5-20251001'
const PDF_BETA = 'pdfs-2024-09-25'

const SYSTEM = `Você TRANSCREVE um laudo de exame ômico (ex.: metabolômica, proteômica) a partir de um
documento/imagem. Liste CADA marcador medido. Para cada um, extraia EXATAMENTE como impresso:
- name: nome do marcador/metabólito/proteína (sem o valor).
- value: o valor numérico medido (mantenha como impresso). null se ausente.
- unit: unidade (ex.: µmol/L, mg/dL, ng/mL). null se ausente.
- category: a categoria/seção do laudo onde ele aparece (ex.: Aminoácidos), se houver. null se não.
- method: método analítico (ex.: LC-MS/MS), se houver. null se não.
- external_id: identificador externo (HMDB/KEGG), se impresso. null se não.
Regras: NÃO invente marcadores que não estão no laudo. NÃO calcule, NÃO converta, NÃO interprete,
NÃO classifique (nada de "normal/alto/baixo/alterado"). Apenas transcreva o que está visível.
Responda APENAS com JSON válido: {"rows":[{"name":"","value":null,"unit":null,"category":null,"method":null,"external_id":null}]}`

interface Row { name?: string; value?: string; unit?: string; category?: string; method?: string; external_id?: string }

function s(v: unknown): string | undefined {
  if (typeof v === 'number' && isFinite(v)) return String(v)
  return typeof v === 'string' && v.trim() ? v.trim() : undefined
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { error, supabase, userId } = await omicsAuth()
  if (error) return error

  let body: { fileBase64?: string; mediaType?: string; source_file?: string; measured_on?: string; note?: string }
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Corpo inválido' }, { status: 400 }) }
  const fileBase64 = body.fileBase64
  const mediaType = body.mediaType || 'application/pdf'
  if (!fileBase64) return NextResponse.json({ error: 'Arquivo ausente' }, { status: 400 })
  if (!process.env.ANTHROPIC_API_KEY) return NextResponse.json({ error: 'IA indisponível' }, { status: 503 })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any
  const { data: panel } = await db.from('omics_panels').select('domain, collected_on').eq('id', id).eq('user_id', userId).maybeSingle()
  if (!panel) return NextResponse.json({ error: 'Painel não encontrado' }, { status: 404 })

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY, timeout: 120_000 })
  const isPdf = mediaType === 'application/pdf'
  const docBlock = isPdf
    ? { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: fileBase64 } }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    : { type: 'image', source: { type: 'base64', media_type: mediaType as any, data: fileBase64 } }
  const content = [
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    docBlock as any,
    { type: 'text', text: 'Transcreva todos os marcadores deste laudo no formato JSON pedido.' },
  ]

  let raw = ''
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const msg = await (client.beta.messages.create as any)({
      model: MODEL, max_tokens: 8000, temperature: 0, system: SYSTEM,
      betas: [PDF_BETA],
      messages: [{ role: 'user', content }],
    })
    raw = msg.content?.[0]?.type === 'text' ? msg.content[0].text : ''
  } catch {
    return NextResponse.json({ error: 'Falha ao ler o laudo.' }, { status: 502 })
  }

  const m = raw.match(/\{[\s\S]*\}/)
  let rows: Row[] = []
  if (m) {
    try {
      const obj = JSON.parse(m[0]) as { rows?: unknown }
      if (Array.isArray(obj.rows)) {
        rows = obj.rows.map((it): Row | null => {
          const o = it as Record<string, unknown>
          const name = s(o.name)
          const ext = s(o.external_id)
          if (!name && !ext) return null
          const value = s(o.value)
          return {
            name, external_id: ext,
            value: value ? value.replace(',', '.') : undefined,
            unit: s(o.unit), category: s(o.category), method: s(o.method),
          }
        }).filter((x): x is Row => x !== null).slice(0, 20000)
      }
    } catch { /* rows vazio */ }
  }
  if (rows.length === 0) return NextResponse.json({ error: 'Não consegui extrair marcadores do laudo. Use CSV/JSON ou registre manualmente.' }, { status: 422 })

  const { data, error: e } = await db.rpc('omics_ingest', {
    p_panel: id, p_domain: panel.domain, p_rows: rows,
    p_measured_on: body.measured_on || panel.collected_on || null,
    p_source_file: body.source_file || null, p_note: body.note || null,
  })
  if (e) return NextResponse.json({ error: e.message }, { status: 500 })

  return NextResponse.json({ ok: true, ...(data ?? {}), total_rows: rows.length })
}
