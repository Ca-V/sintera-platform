// Smoke de ESCRITA: preenche formulários reais, submete e intercepta os POST/PATCH para
// verificar que o app envia o payload no formato que a rota /api espera. Valida o caminho
// de escrita das jornadas (criar registro, criar evento) em runtime — complementa o
// smoke-data (leitura). O CrudList é compartilhado, então validar uma CRUD valida o
// mecanismo das demais. Pré-requisito: bundle web servido em :8099.
import { chromium } from 'playwright'

const BASE = process.env.SMOKE_URL || 'http://localhost:8099'
const CHROME = process.env.CHROME_PATH || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'
let failures = 0
const jsErrors = []
const captured = [] // { method, path, body }
function check(step, ok, extra = '') { if (!ok) failures++; console.log(`${ok ? 'PASS' : 'FAIL'} · ${step}${extra ? ' — ' + extra : ''}`) }

const session = {
  access_token: 'fake.jwt.token', token_type: 'bearer', expires_in: 3600,
  expires_at: Math.floor(Date.now() / 1000) + 3600, refresh_token: 'fake-refresh',
  user: { id: '00000000-0000-0000-0000-000000000001', aud: 'authenticated', role: 'authenticated', email: 'teste@sintera.local', app_metadata: {}, user_metadata: {}, created_at: new Date(0).toISOString() },
}

const browser = await chromium.launch({ executablePath: CHROME })
const page = await browser.newPage()
page.on('pageerror', (e) => jsErrors.push(e.message))
await page.addInitScript((s) => {
  const v = JSON.stringify(s)
  for (const k of ['sb-dummy-auth-token', 'supabase.auth.token', '@supabase/auth-token']) { try { window.localStorage.setItem(k, v) } catch {} }
}, session)
await page.route('**/api/**', async (route) => {
  const req = route.request()
  const method = req.method()
  const path = new URL(req.url()).pathname
  if (method !== 'GET') {
    let body = {}
    try { body = req.postDataJSON() } catch {}
    captured.push({ method, path, body })
  }
  // GET lista vazia; escrita responde sucesso.
  const empty = { conditions: [], events: [], meds: [], vitals: [], resources: [], habits: [], measures: [], success: true }
  await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(empty) })
})

await page.goto(BASE, { waitUntil: 'networkidle' })
await page.waitForTimeout(4000)

// ── Escrita 1 — criar Condição (CRUD compartilhado) ─────────────────────────────
try {
  await page.getByText('Condições', { exact: true }).first().click({ timeout: 5000 })
  await page.waitForTimeout(1200)
  await page.getByText('Adicionar condição', { exact: false }).first().click({ timeout: 5000 })
  await page.waitForTimeout(600)
  await page.getByPlaceholder('Ex.: Hipertensão').fill('Enxaqueca')
  await page.getByText('Adicionar', { exact: true }).first().click({ timeout: 5000 })
  await page.waitForTimeout(1200)
  const post = captured.find((c) => c.path === '/api/condicoes' && c.method === 'POST')
  check('POST /api/condicoes disparado', !!post)
  check('payload da condição contém name correto', post?.body?.name === 'Enxaqueca', JSON.stringify(post?.body))
  check('payload da condição contém scope', typeof post?.body?.scope === 'string')
  await page.goBack(); await page.waitForTimeout(800)
} catch (e) { check('criar Condição', false, e.message.slice(0, 80)) }

// ── Escrita 2 — criar Evento (jornada de agenda) ────────────────────────────────
try {
  await page.getByText('Agenda', { exact: true }).first().click({ timeout: 5000 })
  await page.waitForTimeout(1000)
  await page.getByText('Novo evento', { exact: false }).first().click({ timeout: 5000 })
  await page.waitForTimeout(800)
  await page.getByPlaceholder('Ex.: Consulta com cardiologista').fill('Retorno ortopedista')
  await page.getByPlaceholder('AAAA-MM-DD').first().fill('2026-12-31')
  await page.getByText('Salvar evento', { exact: false }).first().click({ timeout: 5000 })
  await page.waitForTimeout(1200)
  const post = captured.find((c) => c.path === '/api/agenda' && c.method === 'POST')
  check('POST /api/agenda disparado', !!post)
  check('payload do evento contém title', post?.body?.title === 'Retorno ortopedista', JSON.stringify(post?.body))
  check('payload do evento contém date + type', post?.body?.date === '2026-12-31' && !!post?.body?.type)
  check('payload do evento contém reminderEnabled (bool)', typeof post?.body?.reminderEnabled === 'boolean')
} catch (e) { check('criar Evento', false, e.message.slice(0, 80)) }

// ── Escrita 3 — criar Medicamento: valida conversão de campo booleano ────────────
try {
  await page.goto(BASE, { waitUntil: 'networkidle' }) // volta ao hub de forma determinística
  await page.waitForTimeout(3000)
  await page.getByText('Medicamentos', { exact: true }).first().click({ timeout: 5000 })
  await page.waitForTimeout(1000)
  await page.getByText('Adicionar medicamento', { exact: false }).first().click({ timeout: 5000 })
  await page.waitForTimeout(700)
  await page.getByPlaceholder('Ex.: Losartana').fill('Vitamina D')
  await page.getByText('Adicionar', { exact: true }).first().click({ timeout: 5000 })
  await page.waitForTimeout(1200)
  const post = captured.find((c) => c.path === '/api/medicamentos' && c.method === 'POST')
  check('POST /api/medicamentos disparado', !!post)
  check('payload do medicamento contém name', post?.body?.name === 'Vitamina D')
  check('campo booleano repurchase vai como boolean (não string)', post?.body?.repurchase === false, `typeof=${typeof post?.body?.repurchase}`)
} catch (e) { check('criar Medicamento', false, e.message.slice(0, 80)) }

await browser.close()
console.log('\n--- POSTs capturados ---')
console.log(captured.map((c) => `${c.method} ${c.path}`).join('\n') || '(nenhum)')
console.log('--- erros de JS ---', jsErrors.slice(0, 8).join(' | ') || '(nenhum)')
console.log(`\n${failures === 0 ? 'WRITE-SMOKE OK' : 'WRITE-SMOKE FALHOU'} (${failures} falha(s))`)
process.exit(failures === 0 ? 0 : 1)
