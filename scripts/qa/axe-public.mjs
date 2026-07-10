// Revalidação WCAG AA (color-contrast) da superfície pública — paleta teal.
// Uso: BASE=http://localhost:3000 node scripts/qa/axe-public.mjs
import { chromium } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

const BASE = process.env.BASE || 'http://localhost:3000'
const ROUTES = ['/', '/login', '/lista-de-espera', '/termos', '/privacidade', '/lgpd']

const browser = await chromium.launch()
const context = await browser.newContext({ viewport: { width: 1280, height: 900 } })
let totalViolations = 0
for (const route of ROUTES) {
  const page = await context.newPage()
  try {
    await page.goto(BASE + route, { waitUntil: 'networkidle', timeout: 45000 })
    await page.waitForTimeout(600)
    const results = await new AxeBuilder({ page })
      .withRules(['color-contrast'])
      .analyze()
    const v = results.violations
    const count = v.reduce((s, x) => s + x.nodes.length, 0)
    totalViolations += count
    if (count === 0) {
      console.log(`✓ ${route.padEnd(18)} color-contrast: 0`)
    } else {
      console.log(`✗ ${route.padEnd(18)} color-contrast: ${count}`)
      for (const x of v) for (const n of x.nodes.slice(0, 8)) {
        console.log(`    · ${n.target}  |  ${(n.any?.[0]?.message || '').slice(0, 120)}`)
      }
    }
  } catch (e) {
    console.log(`! ${route.padEnd(18)} erro: ${String(e).slice(0, 100)}`)
  } finally {
    await page.close()
  }
}
await browser.close()
console.log(`\nTOTAL color-contrast: ${totalViolations}`)
process.exit(totalViolations === 0 ? 0 : 1)
