// ARCH · SEC-005 — Autorização em nível de objeto (BOLA). Guarda estática de regressão: toda rota de API
// deve ter um gate de autenticação; nenhuma rota pode ser adicionada SEM autenticação sem entrar
// explicitamente na allowlist pública (com justificativa). Modelo espelha ARCH · NOTIF-001.
//
// Escopo desta guarda (SEC-005, Lote S0-A): garante a PRÉ-CONDIÇÃO de autorização (autenticação presente
// e superfície pública fechada). A prova de propriedade por objeto (A não acessa objeto de B → 404) está
// nos testes comportamentais FUNC-SEC005-ownership. NÃO altera nenhuma rota (read-only sobre o código).
import { describe, it, expect } from 'vitest'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'

const API = join(process.cwd(), 'src', 'app', 'api')

// Rotas legitimamente SEM autenticação de usuária — cada uma com razão revisada.
// Alterar esta lista é uma decisão de segurança (deve passar por revisão de PR).
const PUBLIC_ALLOW: Record<string, string> = {
  'connectors/[source]/webhook/route.ts':
    'Webhook externo do provedor; resolve a usuária pelo payload + segredo compartilhado. ' +
    'RESIDUAL SEC-005 (gate material): verificar HMAC nativo do provedor em vez de confiar no userId do corpo.',
  'email/welcome/route.ts':
    'Chamada interna/cron protegida por ADMIN_SECRET (x-admin-secret), não por sessão de usuária.',
  'waitlist/route.ts':
    'Cadastro público de lista de espera — não há usuária autenticada ainda.',
}

// Sinais aceitos de gate de autenticação/autorização no arquivo da rota.
const AUTH_SIGNALS = [
  /auth\.getUser\s*\(/,
  /omicsAuth\s*\(/,
  /authedClient/,
  /\bgetUser\s*\(/,
  // Aceita cookie (Web) OU Bearer (aplicativo). Acrescentado em 27/08, quando a homologação mostrou que as
  // rotas só liam cookie e TODA chamada do Mobile recebia 401. Continua sendo gate de verdade: valida o token
  // no servidor do Supabase e devolve um cliente no contexto da pessoa, com RLS — nunca service-role.
  /authenticateRequest\s*\(/,
  /ADMIN_SECRET/,
  /x-admin-secret/,
  /CONNECTOR_WEBHOOK_SECRET/,
]

function routeFiles(dir: string, out: string[] = []): string[] {
  for (const e of readdirSync(dir)) {
    const p = join(dir, e)
    if (statSync(p).isDirectory()) routeFiles(p, out)
    else if (e === 'route.ts') out.push(p)
  }
  return out
}

const relApi = (p: string) => relative(API, p).replace(/\\/g, '/')

describe('ARCH · SEC-005 — toda rota de API tem gate de autenticação (superfície pública fechada)', () => {
  const files = routeFiles(API)

  it('há rotas de API para auditar', () => {
    expect(files.length).toBeGreaterThan(10)
  })

  it('nenhuma rota autenticável está sem gate de auth (exceto allowlist pública documentada)', () => {
    const violations: string[] = []
    for (const f of files) {
      const key = relApi(f)
      if (key in PUBLIC_ALLOW) continue
      const src = readFileSync(f, 'utf8')
      if (!AUTH_SIGNALS.some((re) => re.test(src))) violations.push(key)
    }
    expect(
      violations,
      `Rota sem gate de autenticação (adicione o gate ou justifique em PUBLIC_ALLOW): ${violations.join(' · ')}`,
    ).toEqual([])
  })

  it('allowlist pública não tem entradas obsoletas (todo arquivo listado existe)', () => {
    const present = new Set(files.map(relApi))
    const stale = Object.keys(PUBLIC_ALLOW).filter((k) => !present.has(k))
    expect(stale, `Entradas obsoletas em PUBLIC_ALLOW: ${stale.join(' · ')}`).toEqual([])
  })

  it('toda entrada da allowlist tem justificativa não vazia', () => {
    const missing = Object.entries(PUBLIC_ALLOW).filter(([, reason]) => !reason || reason.trim().length < 20)
    expect(missing.map(([k]) => k)).toEqual([])
  })
})
