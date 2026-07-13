import { describe, it, expect } from 'vitest'
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

// ARCH — REGRA ARQUITETURAL (fundadora 13/07): nenhum processador do Clinical Processing Engine pode
// conhecer PDF, Bundle, OCR, páginas ou Segmentação. Todos consomem EXCLUSIVAMENTE a CertifiedCDU.
// Isto preserva o desacoplamento para sempre: trocar a fonte (DICOM/HL7/FHIR) muda o adaptador de
// conteúdo, nunca um processador. Guarda automática — não depende de disciplina manual.

const PROC_DIR = join(process.cwd(), 'src', 'lib', 'capture', 'clinical-processors')

// Módulos de matéria-prima que um processador JAMAIS pode importar (o CPE só conhece CertifiedCDU).
const FORBIDDEN = [
  'pdf', 'ocr', 'gateway',
  'clinical-information-pipeline', // Bundle
  'structural-analysis', 'segmentation', 'bundle-split',
  'supabase', // sem I/O de banco dentro de um processador
]

function importSpecifiers(src: string): string[] {
  const specs: string[] = []
  const re = /(?:import|export)\s[^'"]*from\s*['"]([^'"]+)['"]/g
  let m: RegExpExecArray | null
  while ((m = re.exec(src)) !== null) specs.push(m[1])
  return specs
}

const files = readdirSync(PROC_DIR).filter(f => f.endsWith('.ts'))

describe('ARCH · desacoplamento dos processadores do CPE', () => {
  it('há arquivos de processador para auditar', () => {
    expect(files.length).toBeGreaterThan(0)
  })

  it('nenhum arquivo em processors/ importa matéria-prima proibida (PDF/Bundle/OCR/páginas/DB)', () => {
    const violations: string[] = []
    for (const f of files) {
      const specs = importSpecifiers(readFileSync(join(PROC_DIR, f), 'utf8'))
      for (const s of specs) {
        const low = s.toLowerCase()
        if (FORBIDDEN.some(bad => low.includes(bad))) violations.push(`${f} → ${s}`)
      }
    }
    expect(violations, `imports proibidos: ${violations.join(' · ')}`).toEqual([])
  })

  it('processadores concretos importam SOMENTE de ./types (única porta = a CertifiedCDU)', () => {
    // index.ts (executor) e types.ts (contrato) são a fronteira sancionada; os demais são processadores.
    const concrete = files.filter(f => f !== 'index.ts' && f !== 'types.ts')
    const violations: string[] = []
    for (const f of concrete) {
      const specs = importSpecifiers(readFileSync(join(PROC_DIR, f), 'utf8'))
      for (const s of specs) {
        if (s !== './types' && !s.startsWith('./')) violations.push(`${f} → ${s}`)
      }
    }
    expect(violations, `processador importando fora de ./: ${violations.join(' · ')}`).toEqual([])
  })
})
