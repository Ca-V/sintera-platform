#!/usr/bin/env node
// ============================================================================
// Runner REPRODUZÍVEL do ambiente de demonstração — SINTERA
// ============================================================================
// Um comando recria a conta demo + todos os dados fictícios:  npm run seed:demo
//   1) cria (idempotente) o usuário demo via Admin API (auth);
//   2) chama a função SQL public.seed_demo() que popula os dados.
// Requer ENV (rodar no ambiente apropriado — NUNCA commitar o service key):
//   NEXT_PUBLIC_SUPABASE_URL   (ou SUPABASE_URL)
//   SUPABASE_SERVICE_ROLE_KEY
//   DEMO_EMAIL     (opcional, default demo@sintera.app)
//   DEMO_PASSWORD  (opcional, default Demo@2026 — troque em produção)
// Se a autenticação impedir a criação automática, crie o usuário 1x no painel
// Supabase e rode de novo: o runner localiza o usuário e só popula os dados.
// ============================================================================
import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const email = process.env.DEMO_EMAIL || 'demo@sintera.app'
const password = process.env.DEMO_PASSWORD || 'Demo@2026'

if (!url || !serviceKey) {
  console.error('❌ Faltam variáveis de ambiente: NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY.')
  process.exit(1)
}

const admin = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } })

async function ensureUser() {
  const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true })
  if (!error && data?.user) { console.log('✅ Usuário demo criado:', email); return data.user.id }
  console.log('ℹ️  Usuário demo já existe — localizando…', error?.message ? `(${error.message})` : '')
  for (let page = 1; ; page++) {
    const { data: list, error: e2 } = await admin.auth.admin.listUsers({ page, perPage: 200 })
    if (e2) throw e2
    const u = list.users.find((x) => x.email === email)
    if (u) return u.id
    if (list.users.length < 200) break
  }
  throw new Error('Não foi possível criar nem localizar o usuário demo. Crie manualmente no Supabase (Auth) e rode de novo.')
}

async function main() {
  const uid = await ensureUser()
  console.log('→ user_id:', uid)
  const { data, error } = await admin.rpc('seed_demo', { p_email: email })
  if (error) throw error
  console.log('✅', data)
  console.log(`\nPronto. Entre com ${email} para navegar a plataforma com dados de demonstração.`)
}

main().catch((e) => { console.error('❌', e.message || e); process.exit(1) })
