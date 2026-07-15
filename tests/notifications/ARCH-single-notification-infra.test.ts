import { describe, it, expect } from 'vitest'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'

// ARCH · NOTIF-001 — REGRA ARQUITETURAL (fundadora 14/07): a infraestrutura de notificações é ÚNICA.
// NENHUM módulo pode implementar notificação própria. O envio por canal (e-mail/WhatsApp) só pode
// ocorrer na infraestrutura sancionada — o worker de notificações e os adapters de canal. Qualquer
// novo `resend.emails.send`, `new Resend(` ou `sendWhatsAppReminder(` fora do allowlist é violação.
// Guarda automática — impede divergência (Estabilidade Arquitetural), não depende de disciplina manual.

const SRC = join(process.cwd(), 'src')

// Chamadas de ENVIO direto por canal. Detecta acoplamento de notificação dentro de um módulo.
const FORBIDDEN_SENDS = [/resend\.emails\.send/, /\bnew\s+Resend\s*\(/, /sendWhatsAppReminder\s*\(/]

// Arquivos autorizados a falar diretamente com um canal:
//  - o WORKER de notificações (orquestrador único);
//  - o e-mail transacional de boas-vindas (auth, não é notificação de evento);
//  - os ADAPTERS/templates de canal (a própria infraestrutura).
const ALLOW = [
  'src/app/api/agenda/reminders/route.ts',
  'src/app/api/email/welcome/route.ts',
  'src/lib/email/',
  'src/lib/whatsapp/',
  'src/lib/notifications/',
]

function walk(dir: string, out: string[] = []): string[] {
  for (const e of readdirSync(dir)) {
    const p = join(dir, e)
    if (statSync(p).isDirectory()) { if (e !== 'node_modules') walk(p, out) }
    else if (/\.(ts|tsx)$/.test(e) && !/\.test\.tsx?$/.test(e)) out.push(p)
  }
  return out
}

const rel = (p: string) => relative(process.cwd(), p).replace(/\\/g, '/')
const allowed = (p: string) => ALLOW.some(a => rel(p).startsWith(a) || rel(p) === a)

describe('ARCH · NOTIF-001 — infraestrutura de notificações ÚNICA (nenhum módulo notifica sozinho)', () => {
  const files = walk(SRC)

  it('há arquivos-fonte para auditar', () => {
    expect(files.length).toBeGreaterThan(0)
  })

  it('envio direto por canal (e-mail/WhatsApp) só existe na infraestrutura sancionada', () => {
    const violations: string[] = []
    for (const f of files) {
      if (allowed(f)) continue
      const src = readFileSync(f, 'utf8')
      for (const re of FORBIDDEN_SENDS) {
        if (re.test(src)) violations.push(`${rel(f)} → ${re.source}`)
      }
    }
    expect(
      violations,
      `Módulo enviando notificação por conta própria (use a infra NOTIF-001): ${violations.join(' · ')}`,
    ).toEqual([])
  })
})
