import { describe, it, expect } from 'vitest'
import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs'
import { join, relative } from 'node:path'
import { entitlementsFrom } from '@sintera/core'

// ARCH · BILLING-001 — REGRA ARQUITETURAL: o comercial é DESACOPLADO. Nenhum módulo pode conhecer
// regra comercial nem tocar as tabelas de billing (billing_plans/subscriptions) direto — só consome
// o contrato `Entitlements`. Guarda automática contra acoplamento (Estabilidade Arquitetural).
//
// A VARREDURA PASSOU A INCLUIR `packages/` E O APLICATIVO (22/09/2026). Enquanto o billing morava em
// `src/lib/billing/`, varrer só `src/` bastava. Com a regra no core e o IO no api-client — para que o
// aplicativo alcance —, uma catraca que olhasse apenas `src/` deixaria de vigiar justamente os lugares
// novos: o Mobile poderia consultar `subscriptions` direto e nada acusaria.

const RAIZES = ['src', 'packages/core/src', 'packages/api-client/src', 'apps/mobile/src']
  .map(p => join(process.cwd(), p))
const FORBIDDEN = [/from\(['"]subscriptions['"]\)/, /from\(['"]billing_plans['"]\)/]
// O ÚNICO lugar que pode tocar as tabelas é o adaptador de IO do comercial — e a rota de billing da Web.
const ALLOW = ['packages/api-client/src/billing/', 'src/app/api/billing/']

function walk(dir: string, out: string[] = []): string[] {
  if (!existsSync(dir)) return out
  for (const e of readdirSync(dir)) {
    const p = join(dir, e)
    if (statSync(p).isDirectory()) { if (e !== 'node_modules') walk(p, out) }
    else if (/\.(ts|tsx)$/.test(e) && !/\.test\.tsx?$/.test(e)) out.push(p)
  }
  return out
}
const rel = (p: string) => relative(process.cwd(), p).replace(/\\/g, '/')
const allowed = (p: string) => ALLOW.some(a => rel(p).startsWith(a))

describe('ARCH · BILLING-001 — comercial desacoplado (módulos só consomem entitlements)', () => {
  it('nenhum módulo acessa as tabelas de billing direto (so o adaptador de IO do comercial)', () => {
    const violations: string[] = []
    for (const f of RAIZES.flatMap(r => walk(r))) {
      if (allowed(f)) continue
      const src = readFileSync(f, 'utf8')
      for (const re of FORBIDDEN) if (re.test(src)) violations.push(`${rel(f)} → ${re.source}`)
    }
    expect(violations, `Módulo tocando billing direto (use Entitlements): ${violations.join(' · ')}`).toEqual([])
  })

  it('o contrato entitlementsFrom é a via de consumo (sem assinatura → FREE concede)', () => {
    const e = entitlementsFrom(null, null)
    expect(e.plan).toBe('free')
    expect(e.can('x')).toBe(true)
  })
})
