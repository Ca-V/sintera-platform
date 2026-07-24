// Teste de arquitetura — a Home é uma COMPOSIÇÃO, nunca dona de lógica de domínio (MOBILE-014 §2.1).
//
// POR QUE ESTE TESTE EXISTE:
// O principal risco arquitetural do Incremento 3 (e dos futuros) é a Home acumular lógica de domínio —
// consultas ao Supabase, acesso a dados de domínio, regras de negócio. Este teste FALHA imediatamente se
// qualquer arquivo em apps/mobile/src/presentation/home/ introduzir a fronteira proibida, protegendo o
// contrato de forma permanente no CI (não só por auditoria manual pontual).
//
// Fronteira verificada: nenhum arquivo da Home importa o SDK do Supabase nem o @sintera/api-client (a
// camada de dados). A Home consome apenas: sessão (useAuth), navegação, primitives/DS/theme.
import { describe, it, expect } from 'vitest'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, resolve } from 'node:path'

const HOME_DIR = resolve(process.cwd(), 'apps/mobile/src/presentation/home')

/** Lista recursivamente os arquivos .ts/.tsx sob um diretório. */
function collectSourceFiles(dir: string): string[] {
  const out: string[] = []
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) out.push(...collectSourceFiles(full))
    else if (/\.tsx?$/.test(entry)) out.push(full)
  }
  return out
}

// Padrões proibidos na Home: acesso a dados de domínio / SDK Supabase (fronteira do Inc. 1 + §2.1 do MOBILE-014).
const FORBIDDEN: { pattern: RegExp; reason: string }[] = [
  { pattern: /@supabase\//, reason: 'importa o SDK do Supabase (a Home não acessa dados)' },
  { pattern: /@sintera\/api-client/, reason: 'importa o @sintera/api-client (camada de dados de domínio)' },
  { pattern: /\bcreateApiClient\b/, reason: 'cria um cliente de API (dados de domínio)' },
  { pattern: /\bcreateClient\b/, reason: 'cria um cliente Supabase' },
]

describe('Home é composição, não dona de lógica de domínio (MOBILE-014 §2.1)', () => {
  const files = collectSourceFiles(HOME_DIR)

  it('encontra os componentes da Home (sanidade)', () => {
    expect(files.length).toBeGreaterThan(0)
    const base = files.map((f) => f.split(/[\\/]/).pop())
    // Os 6 slots nomeados + HomeShell devem existir (contrato de slots §3.4).
    for (const name of ['HomeShell.tsx', 'WelcomeSlot.tsx', 'QuickActionsSlot.tsx', 'SummarySlot.tsx', 'TimelineSlot.tsx', 'InsightsSlot.tsx', 'FooterSlot.tsx']) {
      expect(base).toContain(name)
    }
  })

  it('NENHUM arquivo da Home cruza a fronteira de dados de domínio (Supabase / api-client)', () => {
    const violations: string[] = []
    for (const file of files) {
      const content = readFileSync(file, 'utf-8')
      for (const { pattern, reason } of FORBIDDEN) {
        if (pattern.test(content)) {
          violations.push(`${file.split(/[\\/]/).slice(-2).join('/')}: ${reason}`)
        }
      }
    }
    expect(violations, `Violações do contrato "Home é só composição":\n${violations.join('\n')}`).toEqual([])
  })
})
