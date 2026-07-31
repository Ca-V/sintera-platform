// Teste de arquitetura — a tela de Perfil (Inc.4) respeita a FRONTEIRA de dados (MOBILE-016 §6 critério 4):
// nenhum acesso direto ao SDK Supabase em apps/mobile; toda a comunicação passa pelo `apiClient` (singleton
// da camada de infraestrutura, que encapsula o @sintera/api-client — ponto único do Inc.1).
//
// POR QUE ESTE TESTE EXISTE:
// O risco arquitetural do Perfil é uma tela "furar" a camada de dados e falar com o Supabase direto (acoplando
// UI a infraestrutura, quebrando a paridade Web/Mobile e a auditabilidade). Este teste FALHA no CI se qualquer
// arquivo em screens/profile/ importar o SDK do Supabase ou criar um cliente — protegendo o contrato de forma
// permanente, não só por auditoria manual.
import { describe, it, expect } from 'vitest'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, resolve } from 'node:path'

const PROFILE_DIR = resolve(process.cwd(), 'apps/mobile/src/presentation/screens/profile')

function collectSourceFiles(dir: string): string[] {
  const out: string[] = []
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) out.push(...collectSourceFiles(full))
    else if (/\.tsx?$/.test(entry)) out.push(full)
  }
  return out
}

// Proibido no Perfil: SDK Supabase direto ou criação de cliente. (Consumir o `apiClient` singleton é o caminho
// sancionado; importar TIPOS de @sintera/api-client também é permitido — por isso não é proibido aqui.)
const FORBIDDEN: { pattern: RegExp; reason: string }[] = [
  { pattern: /@supabase\//, reason: 'importa o SDK do Supabase direto (fronteira do Inc.1)' },
  { pattern: /\bcreateClient\b/, reason: 'cria um cliente Supabase (deve usar o apiClient singleton)' },
  { pattern: /\bcreateApiClient\b/, reason: 'cria um ApiClient próprio (ponto único vive na infraestrutura)' },
]

describe('Perfil respeita a fronteira de dados (MOBILE-016 §6.4)', () => {
  const files = collectSourceFiles(PROFILE_DIR)

  it('encontra os arquivos do Perfil (sanidade)', () => {
    const base = files.map((f) => f.split(/[\\/]/).pop())
    for (const name of ['profileMachine.ts', 'useProfile.ts', 'ProfileScreen.tsx']) {
      expect(base).toContain(name)
    }
  })

  it('NENHUM arquivo do Perfil acessa o Supabase direto nem cria cliente', () => {
    const violations: string[] = []
    for (const file of files) {
      const content = readFileSync(file, 'utf-8')
      for (const { pattern, reason } of FORBIDDEN) {
        if (pattern.test(content)) violations.push(`${file.split(/[\\/]/).slice(-2).join('/')}: ${reason}`)
      }
    }
    expect(violations, `Violações da fronteira do Perfil:\n${violations.join('\n')}`).toEqual([])
  })

  it('o acesso a dados do Perfil passa pelo apiClient singleton (positivo)', () => {
    const useProfile = files.find((f) => f.endsWith('useProfile.ts'))
    expect(useProfile).toBeDefined()
    const content = readFileSync(useProfile as string, 'utf-8')
    expect(content).toMatch(/infrastructure\/apiClient/)
    // Tolera o encadeamento em múltiplas linhas (`apiClient.profile\n  .getProfile(...)`).
    expect(content).toMatch(/apiClient\.profile\s*\.\s*(getProfile|updateProfile)/)
  })
})
