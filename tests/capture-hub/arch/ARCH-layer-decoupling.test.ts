import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

// ARCH — CERTIFICAÇÃO DO DESACOPLAMENTO (entrega 4 da consolidação da infra, fundadora 14/07): provar que as
// CAMADAS DE ABSTRAÇÃO não conhecem modalidades clínicas. Só o Clinical Processing Engine e os processadores
// especializados podem conhecer modalidade. Se esta auditoria passa, a arquitetura universal foi atingida.

const CAP = join(process.cwd(), 'src', 'lib', 'capture')

// Módulos de CONHECIMENTO DE MODALIDADE (identidade clínica, catálogo de modelos, processadores concretos, CPE).
const MODALITY_KNOWLEDGE = [
  'clinical-identity-registry',
  'clinical-processors/models',
  'clinical-processing-engine',
  'clinical-processors/corneal-tomography',
]
// A CONTRATO (types) é permitida — é estrutura/contrato, não conhecimento de modalidade específica.

// Camadas de ABSTRAÇÃO que NÃO podem conhecer modalidade (Ingestão · Análise Estrutural · Segmentação ·
// Identity Validator · Persistência/UCDA · Cobertura · Split).
const ABSTRACTION_LAYERS = [
  'structural-analysis.ts',
  'segmentation.ts',
  'identity-validator.ts',
  'clinical-information-pipeline.ts',
  'bundle-split.ts',
  'coverage.ts',
  'ucda.ts',
]

function imports(file: string): string[] {
  const src = readFileSync(join(CAP, file), 'utf8')
  const specs: string[] = []
  const re = /(?:import|export)\s[^'"]*from\s*['"]([^'"]+)['"]/g
  let m: RegExpExecArray | null
  while ((m = re.exec(src)) !== null) specs.push(m[1])
  return specs
}

describe('ARCH · desacoplamento de camadas (arquitetura universal)', () => {
  it('nenhuma camada de abstração importa CONHECIMENTO DE MODALIDADE', () => {
    const violations: string[] = []
    for (const layer of ABSTRACTION_LAYERS) {
      for (const spec of imports(layer)) {
        if (MODALITY_KNOWLEDGE.some(k => spec.includes(k))) violations.push(`${layer} → ${spec}`)
      }
    }
    expect(violations, `camadas com conhecimento de modalidade: ${violations.join(' · ')}`).toEqual([])
  })

  it('APENAS o CPE e os processadores conhecem a Identidade Clínica / catálogo de modelos', () => {
    // Varre toda a lib de captura: quem importa o registro de identidade ou o catálogo de modelos?
    const files: string[] = []
    const walk = (dir: string, base = '') => {
      for (const e of readdirSync(join(CAP, dir || '.'), { withFileTypes: true })) {
        const rel = base ? `${base}/${e.name}` : e.name
        if (e.isDirectory()) walk(join(dir, e.name), rel)
        else if (e.name.endsWith('.ts')) files.push(rel)
      }
    }
    walk('')
    const knowers = files.filter(f =>
      imports(f).some(s => s.includes('clinical-identity-registry') || s.includes('clinical-processors/models')),
    )
    // Permitidos: o próprio Engine, os arquivos dos processadores, e os próprios módulos de conhecimento.
    const allowed = (f: string) =>
      f === 'clinical-processing-engine.ts' ||
      f.startsWith('clinical-processors/') ||
      f === 'clinical-identity-registry.ts'
    const leaks = knowers.filter(f => !allowed(f))
    expect(leaks, `conhecimento de modalidade fora do CPE/processadores: ${leaks.join(' · ')}`).toEqual([])
  })
})
