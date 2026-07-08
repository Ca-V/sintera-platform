// ============================================================
// QA-001 — Harness de auditoria visual automatizada (SINTERA)
// ============================================================
// Executa o fluxo autônomo do PROCESSO_HOMOLOGACAO.md:
//  bypass Vercel → login (usuário de auditoria) → crawl desktop+mobile →
//  screenshots + heurística de overflow horizontal + erros de console.
// Uso: node scripts/qa/qa001-harness.mjs
// Config por env (com defaults desta execução):
//   QA_BASE, QA_SHARE, QA_EMAIL, QA_PASS, QA_TOKEN, QA_EXAM_ID, QA_OMICS_ID, QA_OUT
import { chromium } from '@playwright/test'
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const BASE  = process.env.QA_BASE  || 'https://sintera-platform-git-feat-rel-001-6d777a-carina-projectsintera.vercel.app'
const SHARE = process.env.QA_SHARE || (BASE + '/?_vercel_share=LokJMk4hxsIHqz27cZpzn4RPaZ5Vh0uf')
const EMAIL = process.env.QA_EMAIL || 'qa-audit+rel001@sintera.internal'
const PASS  = process.env.QA_PASS  || 'QaAudit!Rel001'
const TOKEN = process.env.QA_TOKEN || 'qaauditrel0018f3c2a9b4e6d7c1a0b5f8e2d9c4a7b60'
const EXAM  = process.env.QA_EXAM_ID  || 'e0b0d6fc-a380-4f38-94d8-24e103055768'
const OMICS = process.env.QA_OMICS_ID || '8c98054a-4000-4f49-9f8b-90edeb7c4e2b'
const OUT   = process.env.QA_OUT   || join(process.cwd(), 'qa001-artifacts')

// Rotas auditadas (slug → path). Cobrem REL-001 + amostra representativa da plataforma.
const ROUTES = [
  ['home-painel',        '/dashboard'],
  ['relatorio',          '/dashboard/relatorio'],       // ← foco REL-001
  ['exams-lista',        '/dashboard/exams'],
  ['exams-detalhe',      `/dashboard/exams/${EXAM}`],    // ← origem do bug recorrente do header
  ['medicamentos',       '/dashboard/medicamentos'],
  ['medidas',            '/dashboard/medidas'],
  ['sinais-vitais',      '/dashboard/sinais-vitais'],
  ['condicoes',          '/dashboard/condicoes'],
  ['habitos',            '/dashboard/habitos'],
  ['recursos',           '/dashboard/recursos'],
  ['historico',          '/dashboard/historico'],
  ['timeline',           '/dashboard/timeline'],
  ['agenda',             '/dashboard/agenda'],
  ['omics-lista',        '/dashboard/omics'],
  ['omics-detalhe',      `/dashboard/omics/${OMICS}`],
  ['insights',           '/dashboard/insights'],
  ['gastos',             '/dashboard/gastos'],
  ['profile',            '/dashboard/profile'],
  ['configuracoes',      '/dashboard/configuracoes'],
  ['saude',              '/dashboard/saude'],
  ['prevencao',          '/dashboard/prevencao'],
  ['ciclo',              '/dashboard/ciclo'],
]
const PUBLIC_ROUTES = [
  ['login',              '/login'],
  ['relatorio-partilha', `/r/${TOKEN}`],                 // ← REL-001 link público
]
const VIEWPORTS = [
  { name: 'desktop', width: 1280, height: 900, isMobile: false },
  { name: 'mobile',  width: 390,  height: 844, isMobile: true  },
]

const OVERFLOW_FN = () => {
  const vw = window.innerWidth
  const de = document.documentElement
  const docW = Math.max(de.scrollWidth, document.body ? document.body.scrollWidth : 0)
  const offenders = []
  for (const el of Array.from(document.querySelectorAll('body *'))) {
    const r = el.getBoundingClientRect()
    if (r.width > 4 && r.right > vw + 2 && r.left > -4 && r.width <= vw * 1.5) {
      const cls = (typeof el.className === 'string' ? el.className : '').slice(0, 70)
      offenders.push({ tag: el.tagName.toLowerCase(), cls, right: Math.round(r.right), w: Math.round(r.width) })
      if (offenders.length >= 6) break
    }
  }
  return { vw, docW, horizontalOverflow: docW > vw + 2, offenders }
}

async function settle(page) {
  await page.waitForLoadState('domcontentloaded').catch(() => {})
  await page.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => {})
  await page.waitForTimeout(900) // fetch client-side + animações
}

async function crawl(context, vp, requireAuth, results) {
  const page = await context.newPage()
  const errors = []
  page.on('pageerror', e => errors.push(String(e).slice(0, 200)))
  page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text().slice(0, 200)) })
  const routes = requireAuth ? ROUTES : PUBLIC_ROUTES
  for (const [slug, path] of routes) {
    errors.length = 0
    let status = 0
    try {
      const resp = await page.goto(BASE + path, { waitUntil: 'commit', timeout: 45000 })
      status = resp ? resp.status() : 0
      await settle(page)
    } catch (e) {
      results.push({ vp: vp.name, slug, path, error: 'goto: ' + String(e).slice(0, 160) })
      continue
    }
    const finalUrl = page.url().replace(BASE, '')
    const ov = await page.evaluate(OVERFLOW_FN).catch(() => null)
    const shotPath = join(OUT, vp.name, `${slug}.png`)
    await page.screenshot({ path: shotPath, fullPage: true }).catch(() => {})
    results.push({
      vp: vp.name, slug, path, status, finalUrl,
      horizontalOverflow: ov ? ov.horizontalOverflow : null,
      docW: ov ? ov.docW : null, vw: ov ? ov.vw : null,
      offenders: ov ? ov.offenders : [],
      errors: [...errors].slice(0, 5),
      shot: `${vp.name}/${slug}.png`,
    })
    process.stdout.write(`  [${vp.name}] ${slug} → ${status} ${finalUrl}${ov && ov.horizontalOverflow ? '  ⚠ OVERFLOW' : ''}${errors.length ? '  ⚠ err' : ''}\n`)
  }
  await page.close()
}

async function login(context) {
  const page = await context.newPage()
  // 1) injeta cookie de bypass da Vercel
  await page.goto(SHARE, { waitUntil: 'domcontentloaded', timeout: 45000 })
  // 2) login como usuário de auditoria — resiliente a cold start (retry + fallback)
  for (let attempt = 1; attempt <= 3; attempt++) {
    await page.goto(BASE + '/login', { waitUntil: 'domcontentloaded', timeout: 45000 })
    await page.fill('input[type=email]', EMAIL)
    await page.fill('input[type=password]', PASS)
    await page.click('button[type=submit]')
    const ok = await page.waitForURL('**/dashboard**', { timeout: 35000 }).then(() => true).catch(() => false)
    if (ok) break
    // fallback: a sessão pode já estar setada mesmo sem o redirect concluir
    await page.goto(BASE + '/dashboard', { waitUntil: 'domcontentloaded', timeout: 45000 }).catch(() => {})
    if (page.url().includes('/dashboard')) break
    await page.waitForTimeout(1500)
  }
  await settle(page)
  const url = page.url().replace(BASE, '')
  await page.close()
  return url
}

async function run() {
  mkdirSync(OUT, { recursive: true })
  for (const vp of VIEWPORTS) mkdirSync(join(OUT, vp.name), { recursive: true })
  const browser = await chromium.launch({ headless: true })
  const results = []
  const ONLY = process.env.QA_ONLY
  const vps = VIEWPORTS.filter(v => !ONLY || v.name === ONLY)
  const meta = { base: BASE, startedAt: new Date().toISOString(), viewports: vps.map(v => v.name), logins: {} }
  for (const vp of vps) {
    const context = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, isMobile: vp.isMobile, hasTouch: vp.isMobile, deviceScaleFactor: 1 })
    const landed = await login(context)
    meta.logins[vp.name] = landed
    process.stdout.write(`\n[${vp.name}] login → ${landed}\n`)
    await crawl(context, vp, false, results) // públicas
    if (landed.includes('/dashboard')) await crawl(context, vp, true, results)
    else process.stdout.write(`  ✗ login não chegou ao /dashboard (${landed}); pulando rotas autenticadas\n`)
    await context.close()
  }
  await browser.close()
  const overflowCount = results.filter(r => r.horizontalOverflow).length
  const errorCount = results.filter(r => (r.errors && r.errors.length) || r.error).length
  const summary = { meta, totals: { rows: results.length, overflow: overflowCount, withErrors: errorCount }, results }
  writeFileSync(join(OUT, 'qa001-report.json'), JSON.stringify(summary, null, 2))
  process.stdout.write(`\n=== QA-001 done: ${results.length} páginas · overflow=${overflowCount} · comErros=${errorCount} ===\n`)
  process.stdout.write(`Artefatos: ${OUT}\n`)
}

run().catch(e => { console.error('HARNESS FATAL', e); process.exit(1) })
