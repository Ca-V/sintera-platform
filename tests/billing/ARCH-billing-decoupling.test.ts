import { describe, it, expect } from 'vitest'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { entitlementsFrom } from '@/lib/billing/load'

// ARCH · BILLING-001 — REGRA ARQUITETURAL: o comercial é DESACOPLADO. Nenhum módulo pode conhecer
// regra comercial nem tocar as tabelas de billing (billing_plans/subscriptions) direto — só consome
// o contrato `Entitlements`. Toda a lógica de plano/assinatura vive em src/lib/billing/ e num futuro
// serviço/rota de billing. Guarda automática contra acoplamento (Estabilidade Arquitetural).

const SRC = join(process.cwd(), 'src')
const FORBIDDEN = [/from\(['"]subscriptions['"]\)/, /from\(['"]billing_plans['"]\)/]
const ALLOW = ['src/lib/billing/', 'src/app/api/billing/']

function walk(dir: string, out: string[] = []): string[] {
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
  it('nenhum módulo acessa as tabelas de billing direto (só src/lib/billing ou api/billing)', () => {
    const violations: string[] = []
    for (const f of walk(SRC)) {
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
