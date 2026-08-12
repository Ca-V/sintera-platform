// Smoke test funcional do app Mobile rodando como WEB (react-native-web + expo-router).
// É a validação funcional possível SEM device: exporta o app para web, serve o bundle e
// dirige um Chromium headless verificando que o app boota, renderiza e navega — validando
// a camada de runtime (render dos componentes RN, roteamento, guarda de sessão), que o
// `tsc` não cobre. Jornadas autenticadas exigem backend real (Supabase) — fora do escopo.
//
// Como rodar (a partir da RAIZ do repo, que tem o Playwright instalado):
//   1. cd mobile && EXPO_OFFLINE=1 CI=1 EXPO_PUBLIC_SUPABASE_URL=https://dummy.supabase.co \
//        EXPO_PUBLIC_SUPABASE_ANON_KEY=dummy EXPO_PUBLIC_API_URL=https://dummy.local \
//        npx expo export --platform web
//   2. (cd mobile/dist && python3 -m http.server 8099 &)
//   3. node mobile/e2e/smoke-web.mjs
// O Playwright é resolvido subindo até node_modules da raiz. Chrome pré-instalado em
// /opt/pw-browsers (ajuste CHROME_PATH se necessário).
import { chromium } from 'playwright'

const BASE = process.env.SMOKE_URL || 'http://localhost:8099'
const CHROME = process.env.CHROME_PATH || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'
const errors = []
let failures = 0

const browser = await chromium.launch({ executablePath: CHROME })
const page = await browser.newPage()
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()) })
page.on('pageerror', (e) => errors.push('PAGEERROR: ' + e.message))

function check(step, ok, extra = '') {
  if (!ok) failures++
  console.log(`${ok ? 'PASS' : 'FAIL'} · ${step}${extra ? ' — ' + extra : ''}`)
}
const bodyText = async () => (await page.textContent('body')) ?? ''

await page.goto(BASE, { waitUntil: 'networkidle' })
await page.waitForTimeout(3500) // React monta + Guard redireciona p/ (auth)/login

const t = await bodyText()
check('boot + render inicial', t.length > 0, `${t.length} chars`)
check('tela de login (SINTERA + Entrar)', t.includes('SINTERA') && /Entrar/.test(t))
check('campos de formulário presentes', (await page.locator('input').count()) >= 2)

let navRegister = false
try {
  await page.getByText('Criar conta', { exact: false }).first().click({ timeout: 4000 })
  await page.waitForTimeout(1500)
  navRegister = (await bodyText()).includes('Criar conta')
} catch (e) { errors.push('nav register: ' + e.message) }
check('navegar para Cadastro', navRegister)

let navRecover = false
try {
  await page.getByText('Entrar', { exact: false }).first().click({ timeout: 4000 })
  await page.waitForTimeout(1000)
  await page.getByText('Esqueci minha senha', { exact: false }).first().click({ timeout: 4000 })
  await page.waitForTimeout(1500)
  navRecover = (await bodyText()).includes('Recuperar senha')
} catch (e) { errors.push('nav recover: ' + e.message) }
check('navegar para Recuperar senha', navRecover)

// Erros de JS reais reprovam (404 de asset estático do servidor de teste é ignorado).
const jsErrors = errors.filter((e) => !/Failed to load resource.*404/.test(e))
check('sem erros de JS/página', jsErrors.length === 0, jsErrors.slice(0, 5).join(' | '))

await browser.close()
console.log(`\n${failures === 0 ? 'SMOKE OK' : 'SMOKE FALHOU'} (${failures} falha(s))`)
process.exit(failures === 0 ? 0 : 1)
