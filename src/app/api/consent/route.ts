import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'
import fs from 'fs'
import path from 'path'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

function hashDocument(filename: string): string {
  const filePath = path.join(process.cwd(), 'public', 'docs', filename)
  const content = fs.readFileSync(filePath, 'utf-8')
  return crypto.createHash('sha256').update(content, 'utf8').digest('hex')
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await req.json()
    if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 })

    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || req.headers.get('x-real-ip')
      || null
    const userAgent = req.headers.get('user-agent') || null

    const termsHash   = hashDocument('terms-v2.0.txt')
    const privacyHash = hashDocument('privacy-v2.0.txt')

    const { error } = await supabaseAdmin.from('consent_records').insert([
      {
        user_id:       userId,
        consent_type:  'terms',
        version:       '2.0',
        document_hash: termsHash,
        ip_address:    ip,
        user_agent:    userAgent,
      },
      {
        user_id:       userId,
        consent_type:  'health_data',
        version:       '2.0',
        document_hash: privacyHash,
        ip_address:    ip,
        user_agent:    userAgent,
      },
    ])

    if (error) {
      console.error('[consent] insert error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[consent] unexpected error:', err)
    return NextResponse.json({ error: 'internal error' }, { status: 500 })
  }
}