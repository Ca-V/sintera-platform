// Teste de arquitetura — as telas de Exames (Inc.5) respeitam a FRONTEIRA de dados (MOBILE-024 §5.4): nenhum
// acesso direto ao SDK Supabase em apps/mobile; toda a comunicação passa pelo `apiClient` (ponto único, Inc.1).
import { describe, it, expect } from 'vitest'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, resolve } from 'node:path'

const EXAMS_DIR = resolve(process.cwd(), 'apps/mobile/src/presentation/screens/exams')

function collectSourceFiles(dir: string): string[] {
  const out: string[] = []
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) out.push(...collectSourceFiles(full))
    else if (/\.tsx?$/.test(entry)) out.push(full)
  }
  return out
}

const FORBIDDEN: { pattern: RegExp; reason: string }[] = [
  { pattern: /@supabase\//, reason: 'importa o SDK do Supabase direto (fronteira do Inc.1)' },
  { pattern: /\bcreateClient\b/, reason: 'cria um cliente Supabase (deve usar o apiClient singleton)' },
  { pattern: /\bcreateApiClient\b/, reason: 'cria um ApiClient próprio (ponto único vive na infraestrutura)' },
]

describe('Exames respeitam a fronteira de dados (MOBILE-024 §5.4)', () => {
  const files = collectSourceFiles(EXAMS_DIR)

  it('encontra os arquivos de Exames (sanidade)', () => {
    const base = files.map((f) => f.split(/[\\/]/).pop())
    for (const name of ['loadMachine.ts', 'useExamsList.ts', 'useExam.ts', 'ExamsListScreen.tsx', 'ExamDetailScreen.tsx']) {
      expect(base).toContain(name)
    }
  })

  it('NENHUM arquivo de Exames acessa o Supabase direto nem cria cliente', () => {
    const violations: string[] = []
    for (const file of files) {
      const content = readFileSync(file, 'utf-8')
      for (const { pattern, reason } of FORBIDDEN) {
        if (pattern.test(content)) violations.push(`${file.split(/[\\/]/).slice(-2).join('/')}: ${reason}`)
      }
    }
    expect(violations, `Violações da fronteira de Exames:\n${violations.join('\n')}`).toEqual([])
  })

  it('o acesso a dados passa pelo apiClient.exams (positivo)', () => {
    const list = readFileSync(files.find((f) => f.endsWith('useExamsList.ts')) as string, 'utf-8')
    const detail = readFileSync(files.find((f) => f.endsWith('useExam.ts')) as string, 'utf-8')
    expect(list).toMatch(/apiClient\.exams\s*\.\s*listExams/)
    expect(detail).toMatch(/apiClient\.exams\s*\.\s*getExam/)
  })
})
