// Registra consentimento auditável (LGPD) em consent_records.
// O insert é restrito a service_role (migração 015), então usamos o admin client.
import { NextRequest, NextResponse } from 'next/server'
import { createHash } from 'crypto'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdmin } from '@supabase/supabase-js'

// Versão vigente dos Termos / Política de dados de saúde. Ao atualizar os
// documentos, suba esta versão — o consentimento é registrado por (tipo, versão).
const CONSENT_VERSION = '2026-06-15'
const VALID_TYPES = new Set(['terms', 'health_data'])

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error: authErr } = await supabase.auth.getUser()
  if (authErr || !user) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }

  let body: { types?: string[] }
  try { body = await request.json() } catch { body = {} }
  const types = (body.types ?? ['terms', 'health_data']).filter(t => VALID_TYPES.has(t))
  if (types.length === 0) {
    return NextResponse.json({ error: 'Nenhum tipo de consentimento válido.' }, { status: 400 })
  }

  // Insert é service_role only (ver migração 015 — sem policy de INSERT p/ authenticated).
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY
  if (!serviceKey) {
    console.error('[consent] service role key não configurada')
    return NextResponse.json({ error: 'Configuração interna ausente' }, { status: 500 })
  }
  const admin = createAdmin(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey)

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || null
  const userAgent = request.headers.get('user-agent') || null

  // document_hash é CHAR(64): sha256 hex. Ancora a versão; pode evoluir para
  // hash do conteúdo real do documento quando este for versionado em arquivo.
  const rows = types.map(consent_type => ({
    user_id: user.id,
    consent_type,
    version: CONSENT_VERSION,
    document_hash: createHash('sha256').update(`${consent_type}:${CONSENT_VERSION}`).digest('hex'),
    ip_address: ip,
    user_agent: userAgent,
  }))

  const { error } = await admin
    .from('consent_records')
    .upsert(rows, { onConflict: 'user_id,consent_type,version', ignoreDuplicates: true })

  if (error) {
    console.error('[consent] erro ao gravar:', error.message)
    return NextResponse.json({ error: 'Falha ao registrar consentimento.' }, { status: 500 })
  }

  return NextResponse.json({ success: true, recorded: rows.length })
}
