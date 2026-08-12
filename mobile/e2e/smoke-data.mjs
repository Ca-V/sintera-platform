// Smoke de RENDER-COM-DADOS: injeta sessão, intercepta as chamadas /api com respostas
// canônicas (no formato exato das rotas da Web) e verifica que cada tela renderiza os
// dados. Valida o caminho de apresentação (parse/map/display) E re-verifica o contrato:
// se a tela esperar um campo/chave errado, o dado NÃO aparece e o teste falha — cobrindo
// justamente o que o `tsc` não pega (ele confia no tipo declarado em api.get<T>).
// Pré-requisito: bundle web exportado + servido em :8099 (ver smoke-web.mjs).
import { chromium } from 'playwright'

const BASE = process.env.SMOKE_URL || 'http://localhost:8099'
const CHROME = process.env.CHROME_PATH || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'
let failures = 0
const jsErrors = []
function check(step, ok, extra = '') { if (!ok) failures++; console.log(`${ok ? 'PASS' : 'FAIL'} · ${step}${extra ? ' — ' + extra : ''}`) }

// Respostas canônicas por caminho (formato IDÊNTICO ao das rotas /api da Web).
const FIXTURES = {
  '/api/exams': { exams: [{ id: 'ex1', type: 'Hemograma', status: 'processed', exam_date: '2026-01-15', created_at: '2026-01-15T00:00:00Z' }] },
  '/api/agenda': { events: [{ id: 'evt1', type: 'consulta', title: 'Consulta cardiologista', status: 'planejado', date: '2026-12-20', time: '14:00', amountCents: null }] },
  '/api/biomarkers/organized': { byCategory: { metabolismo_glicose: [{ id: 'b1', name: 'Glicose', displayName: 'Glicose', catalogCode: 'GLIC', value: 90, valueText: '90', unit: 'mg/dL', rangeStatus: 'within' }] }, counts: { total: 1, categories: 1, outOfRange: 0 } },
  '/api/biomarkers/history': { series: { displayName: 'Glicose', unit: 'mg/dL', count: 2, trend: 'stable', totalDeltaPercent: 0, latest: { examId: 'e2', date: '2026-02-01', value: 95, unit: 'mg/dL', referenceMin: 70, referenceMax: 99 }, measurements: [{ examId: 'e1', date: '2026-01-01', value: 90, unit: 'mg/dL', referenceMin: 70, referenceMax: 99 }, { examId: 'e2', date: '2026-02-01', value: 95, unit: 'mg/dL', referenceMin: 70, referenceMax: 99 }] } },
  '/api/education/biomarker/GLIC': { code: 'GLIC', displayName: 'Glicose', loincCode: '2345-7', source: 'medlineplus', language: 'pt', topics: [{ title: 'Exame de glicose no sangue', url: 'https://medlineplus.gov/x', summary: 'A glicose é um açúcar que serve de energia para o corpo.' }] },
  '/api/condicoes': { conditions: [{ id: 'c1', scope: 'propria', name: 'Hipertensão', relative: null, sinceLabel: '2020', notes: null }] },
  '/api/medicamentos': { meds: [{ id: 'm1', name: 'Losartana', kind: 'medicamento', brand: null, dose: '50mg', frequency: '1x ao dia', startedOn: null, untilOn: null, status: 'em_uso', notes: null }] },
  '/api/omics/panels': { panels: [{ id: 'p1', domain: 'metabolomics', technology: null, platform: null, total_features: 42, laboratory: 'Lab X', collected_on: '2026-02-01', created_at: '2026-02-01T00:00:00Z' }] },
  '/api/report/shares': { shares: [{ id: 's1', token: 'tok123', expiresAt: '2027-01-01T00:00:00Z' }] },
}
function fixtureFor(url) {
  const path = new URL(url).pathname
  return FIXTURES[path] ?? { success: true }
}

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
// Intercepta TODAS as chamadas /api → responde com o fixture do caminho.
await page.route('**/api/**', async (route) => {
  await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(fixtureFor(route.request().url())) })
})

await page.goto(BASE, { waitUntil: 'networkidle' })
await page.waitForTimeout(4000)
const body = async () => (await page.textContent('body')) ?? ''

async function open(label, marker, desc) {
  try {
    await page.getByText(label, { exact: true }).first().click({ timeout: 5000 })
    await page.waitForTimeout(1600)
    const t = await body()
    check(desc, t.includes(marker), t.includes(marker) ? '' : `faltou "${marker}"`)
    await page.goBack(); await page.waitForTimeout(900)
  } catch (e) { check(desc, false, e.message.slice(0, 60)) }
}

// Home já consumiu /api/exams + /api/agenda + /api/biomarkers/organized:
check('home mostra próximo evento (dados)', (await body()).includes('Consulta cardiologista'))
check('home mostra resumo de exames (1/1)', /1\s*\/\s*1/.test(await body()))

await open('Exames', 'Hemograma', 'Exames renderiza laudo (tipo)')
await open('Exames', 'Dados extraídos', 'Exames renderiza status legível') // reabre — marcador de status
await open('Agenda', 'Consulta cardiologista', 'Agenda renderiza evento')
await open('Indicadores', 'Glicose', 'Indicadores renderiza biomarcador')
await open('Indicadores', '90 mg/dL', 'Indicadores renderiza valor+unidade')
// Detalhe do biomarcador: Indicadores (pelo card) → tocar "Glicose" → evolução + educação
try {
  await page.getByText('Biomarcadores dos exames', { exact: false }).first().click({ timeout: 5000 })
  await page.waitForTimeout(1500)
  await page.getByText('Glicose', { exact: true }).last().click({ timeout: 5000 })
  await page.waitForTimeout(1800)
  const t = await body()
  check('Biomarcador: evolução renderiza (medições)', t.includes('Medições'))
  check('Biomarcador: contexto educativo renderiza', t.includes('Exame de glicose no sangue'))
  await page.goto(BASE, { waitUntil: 'networkidle' }); await page.waitForTimeout(3000)
} catch (e) { check('detalhe do biomarcador', false, e.message.slice(0, 60)) }

await open('Condições', 'Hipertensão', 'Condições renderiza registro')
await open('Medicamentos', 'Losartana', 'Medicamentos renderiza registro')
await open('Ômica', 'Metabolômica', 'Ômica renderiza painel (rótulo de domínio)')
await open('Relatório', 'tok123', 'Relatório renderiza link ativo')

await browser.close()
console.log('\n--- erros de JS/página ---')
console.log(jsErrors.length ? jsErrors.slice(0, 12).join('\n') : '(nenhum)')
console.log(`\n${failures === 0 ? 'DATA-SMOKE OK' : 'DATA-SMOKE FALHOU'} (${failures} falha(s))`)
process.exit(failures === 0 ? 0 : 1)
