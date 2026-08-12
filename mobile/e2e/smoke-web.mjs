// Smoke test funcional do app Mobile rodando como WEB (react-native-web + expo-router).
// É a validação funcional possível SEM device: exporta o app para web, serve o bundle e
// dirige um Chromium headless verificando que o app boota, renderiza e navega — validando
// a camada de runtime (render dos componentes RN, roteamento, guarda de sessão), que o
// `tsc` não cobre.
//
// Fase 1 (sem sessão): jornada de autenticação (login → cadastro → recuperar senha).
// Fase 2 (sessão injetada no storage): cada tela AUTENTICADA principal monta sem crashar
//   (os dados falham porque o backend é dummy — o que se valida é o RENDER em runtime).
// Jornadas com DADOS reais exigem backend Supabase — etapa de homologação nativa.
//
// Como rodar (a partir da RAIZ do repo, que tem o Playwright instalado):
//   1. cd mobile && EXPO_OFFLINE=1 CI=1 EXPO_PUBLIC_SUPABASE_URL=https://dummy.supabase.co \
//        EXPO_PUBLIC_SUPABASE_ANON_KEY=dummy EXPO_PUBLIC_API_URL=https://dummy.local \
//        npx expo export --platform web
//   2. (cd mobile/dist && python3 -m http.server 8099 &)
//   3. node mobile/e2e/smoke-web.mjs
import { chromium } from 'playwright'

const BASE = process.env.SMOKE_URL || 'http://localhost:8099'
const CHROME = process.env.CHROME_PATH || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'
let failures = 0
const jsErrors = []

function check(step, ok, extra = '') {
  if (!ok) failures++
  console.log(`${ok ? 'PASS' : 'FAIL'} · ${step}${extra ? ' — ' + extra : ''}`)
}

const browser = await chromium.launch({ executablePath: CHROME })

// ── Fase 1 — sem sessão: jornada de autenticação ────────────────────────────────
{
  const page = await browser.newPage()
  page.on('pageerror', (e) => jsErrors.push('auth: ' + e.message))
  await page.goto(BASE, { waitUntil: 'networkidle' })
  await page.waitForTimeout(3500)
  const body = async () => (await page.textContent('body')) ?? ''
  let t = await body()
  check('boot + render inicial', t.length > 0, `${t.length} chars`)
  check('login renderiza (SINTERA + Entrar)', t.includes('SINTERA') && /Entrar/.test(t))
  check('campos de formulário', (await page.locator('input').count()) >= 2)
  try {
    await page.getByText('Criar conta', { exact: false }).first().click({ timeout: 4000 })
    await page.waitForTimeout(1200)
    check('navegar → Cadastro', (await body()).includes('Criar conta'))
    await page.getByText('Entrar', { exact: false }).first().click({ timeout: 4000 })
    await page.waitForTimeout(800)
    await page.getByText('Esqueci minha senha', { exact: false }).first().click({ timeout: 4000 })
    await page.waitForTimeout(1200)
    check('navegar → Recuperar senha', (await body()).includes('Recuperar senha'))
  } catch (e) { check('navegação de auth', false, e.message) }
  await page.close()
}

// ── Fase 2 — sessão injetada: telas autenticadas montam sem crashar ─────────────
{
  const future = Math.floor(Date.now() / 1000) + 3600
  const session = {
    access_token: 'fake.jwt.token', token_type: 'bearer', expires_in: 3600, expires_at: future,
    refresh_token: 'fake-refresh',
    user: { id: '00000000-0000-0000-0000-000000000001', aud: 'authenticated', role: 'authenticated', email: 'teste@sintera.local', app_metadata: {}, user_metadata: {}, created_at: new Date(0).toISOString() },
  }
  const page = await browser.newPage()
  page.on('pageerror', (e) => jsErrors.push('app: ' + e.message))
  await page.addInitScript((s) => {
    const v = JSON.stringify(s)
    for (const k of ['sb-dummy-auth-token', 'supabase.auth.token', '@supabase/auth-token']) {
      try { window.localStorage.setItem(k, v) } catch {}
    }
  }, session)
  await page.goto(BASE, { waitUntil: 'networkidle' })
  await page.waitForTimeout(4000)
  const body = async () => (await page.textContent('body')) ?? ''
  check('hub autenticado renderiza', /Sua saúde organizada/.test(await body()))

  // Cada tela: abre pelo card do hub, confere um marcador distintivo, volta.
  const screens = [
    ['Agenda', 'Novo evento'],
    ['Histórico', 'Histórico'],
    ['Gastos', 'Gastos'],
    ['Exames', 'Enviar exame'],
    ['Indicadores', 'Indicadores'],
    ['Ômica', 'Novo painel'],
    ['Condições', 'Adicionar condição'],
    ['Sinais vitais', 'Registrar medição'],
    ['Medidas', 'Registrar medida'],
    ['Ciclo', 'Registrar menstruação'],
    ['Medicamentos', 'Adicionar medicamento'],
    ['Recursos', 'Adicionar recurso'],
    ['Hábitos', 'Adicionar hábito'],
    ['Relatório', 'Gerar link'],
    ['Perfil', 'Privacidade'],
  ]
  for (const [label, marker] of screens) {
    const before = jsErrors.length
    try {
      await page.getByText(label, { exact: true }).first().click({ timeout: 5000 })
      await page.waitForTimeout(1400)
      const t = await body()
      const ok = t.includes(marker) && jsErrors.length === before
      check(`tela "${label}" monta`, ok, ok ? '' : (jsErrors.length > before ? 'pageerror' : `sem marcador "${marker}"`))
      await page.goBack()
      await page.waitForTimeout(900)
    } catch (e) {
      check(`tela "${label}" monta`, false, e.message.slice(0, 60))
      try { await page.goto(BASE, { waitUntil: 'networkidle' }); await page.waitForTimeout(2500) } catch {}
    }
  }
  await page.close()
}

await browser.close()
console.log('\n--- erros de JS/página ---')
console.log(jsErrors.length ? jsErrors.slice(0, 15).join('\n') : '(nenhum)')
console.log(`\n${failures === 0 ? 'SMOKE OK' : 'SMOKE FALHOU'} (${failures} falha(s))`)
process.exit(failures === 0 ? 0 : 1)
