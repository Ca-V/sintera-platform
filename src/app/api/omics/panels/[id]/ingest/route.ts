// POST /api/omics/panels/:id/ingest — ingestão estruturada (CSV ou JSON).
// Fluxo: Parser → Validação → Mapeamento pelo catálogo + Versionamento +
// Persistência (via função omics_ingest). O arquivo original é preservado pelo
// cliente (storage) e referenciado em source_file. OCR de PDF: fase posterior.
import { NextRequest, NextResponse } from 'next/server'
import { omicsAuth } from '@/lib/omics/server'

interface Row { name?: string; value?: string; unit?: string; category?: string; method?: string; detection_status?: string; external_id?: string }

// Mapeia cabeçalhos comuns (pt/en) para os campos canônicos.
const HEADER_MAP: Record<string, keyof Row> = {
  name: 'name', nome: 'name', feature: 'name', metabolite: 'name', metabolito: 'name', analito: 'name', analyte: 'name',
  value: 'value', valor: 'value', resultado: 'value', result: 'value',
  unit: 'unit', unidade: 'unit', unidade_medida: 'unit',
  category: 'category', categoria: 'category',
  method: 'method', metodo: 'method', 'método': 'method',
  detection_status: 'detection_status', deteccao: 'detection_status', 'detecção': 'detection_status', status: 'detection_status',
  external_id: 'external_id', id_externo: 'external_id', hmdb: 'external_id', kegg: 'external_id', id: 'external_id',
}

function splitCsvLine(line: string, delim: string): string[] {
  const out: string[] = []
  let cur = '', inQ = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (inQ) {
      if (ch === '"') { if (line[i + 1] === '"') { cur += '"'; i++ } else inQ = false }
      else cur += ch
    } else if (ch === '"') inQ = true
    else if (ch === delim) { out.push(cur); cur = '' }
    else cur += ch
  }
  out.push(cur)
  return out.map(s => s.trim())
}

function parseCsv(text: string): Row[] {
  const lines = text.split(/\r?\n/).filter(l => l.trim() !== '')
  if (lines.length < 2) return []
  const delim = (lines[0].match(/;/g)?.length ?? 0) > (lines[0].match(/,/g)?.length ?? 0) ? ';' : ','
  const decimalComma = delim === ';'
  const headers = splitCsvLine(lines[0], delim).map(h => HEADER_MAP[h.toLowerCase()] ?? null)
  const rows: Row[] = []
  for (let i = 1; i < lines.length; i++) {
    const cells = splitCsvLine(lines[i], delim)
    const row: Row = {}
    headers.forEach((key, idx) => {
      if (!key) return
      let v = cells[idx] ?? ''
      if (key === 'value' && decimalComma) v = v.replace(/\./g, '').replace(',', '.')
      if (v) row[key] = v
    })
    if (row.name || row.external_id) rows.push(row)
  }
  return rows
}

function normalizeJson(raw: unknown): Row[] {
  if (!Array.isArray(raw)) return []
  return (raw as Array<Record<string, unknown>>).map(o => {
    const row: Row = {}
    for (const [k, v] of Object.entries(o)) {
      const key = HEADER_MAP[k.toLowerCase()]
      if (key && v != null && String(v).trim() !== '') row[key] = String(v).trim()
    }
    return row
  }).filter(r => r.name || r.external_id)
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { error, supabase, userId } = await omicsAuth()
  if (error) return error

  let body: { format?: string; content?: string; rows?: Row[]; source_file?: string; measured_on?: string; note?: string }
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Corpo inválido' }, { status: 400 }) }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any
  const { data: panel } = await db.from('omics_panels').select('domain, collected_on').eq('id', id).eq('user_id', userId).maybeSingle()
  if (!panel) return NextResponse.json({ error: 'Painel não encontrado' }, { status: 404 })

  // Parser
  let rows: Row[] = []
  try {
    if (Array.isArray(body.rows)) rows = normalizeJson(body.rows)
    else if (body.format === 'json') rows = normalizeJson(JSON.parse(body.content ?? '[]'))
    else rows = parseCsv(body.content ?? '')
  } catch {
    return NextResponse.json({ error: 'Não foi possível interpretar o arquivo.' }, { status: 422 })
  }
  // Validação
  if (rows.length === 0) return NextResponse.json({ error: 'Nenhuma linha válida encontrada (esperado cabeçalho com nome/valor).' }, { status: 422 })
  if (rows.length > 20000) return NextResponse.json({ error: 'Arquivo excede 20.000 linhas.' }, { status: 413 })

  // Mapeamento (catálogo) + Versionamento + Persistência
  const { data, error: e } = await db.rpc('omics_ingest', {
    p_panel: id, p_domain: panel.domain, p_rows: rows,
    p_measured_on: body.measured_on || panel.collected_on || null,
    p_source_file: body.source_file || null, p_note: body.note || null,
  })
  if (e) return NextResponse.json({ error: e.message }, { status: 500 })

  return NextResponse.json({ ok: true, ...(data ?? {}), total_rows: rows.length })
}
