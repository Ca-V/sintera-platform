import { describe, it, expect } from 'vitest'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

// ARCH — Integridade da CAMADA DE GOVERNANÇA (torna a governança automaticamente verificável, GOV-001).
// Encoda Constitutional Invariants do ADR-000 como guarda automática:
//   • o documento constitucional raiz existe e é normativo (Constitutional Invariants);
//   • todo documento de governança referencia a raiz ADR-000 (invariante 5: "toda decisão arquitetural
//     cita os princípios afetados"; invariante 6: novo domínio adere ao arcabouço).
// Guarda de disciplina — impede que um doc de governança derive sem se ancorar na raiz.

const DOCS = join(process.cwd(), 'docs')
const read = (name: string) => readFileSync(join(DOCS, name), 'utf8')

// Documentos que compõem a camada de governança (devem existir e referenciar o ADR-000).
const GOVERNANCE_DOCS = [
  'COMPLIANCE-001_GOVERNANCA.md',
  'DATA-001_CANONICAL_HEALTH_DATA_MODEL.md',
  'DATA-002_DATA_GOVERNANCE.md',
  'API-001_API_GOVERNANCE.md',
  'AI-001_AI_GOVERNANCE.md',
  'EVENTS-001_DOMAIN_EVENTS.md',
  'ARCH-FEATURE-FLAGS.md',
  'TENANT-001_TENANT_GOVERNANCE.md',
  'OPS-001_OBSERVABILITY_GOVERNANCE.md',
  'GOV-001_GOVERNANCE_COVERAGE_MATRIX.md',
]

describe('ARCH · integridade da camada de governança', () => {
  it('o documento constitucional raiz ADR-000 existe e é NORMATIVO', () => {
    const adr = read('ADR-000_ARCHITECTURAL_PRINCIPLES.md')
    expect(adr).toMatch(/Constitutional Invariants/)
    // princípios permanentes essenciais presentes
    for (const p of ['Canonical Data Model', 'Vendor Neutrality', 'Original Document Preservation', 'Traceability']) {
      expect(adr, `ADR-000 deve declarar o princípio "${p}"`).toContain(p)
    }
  })

  it('todo documento de governança EXISTE', () => {
    const missing = GOVERNANCE_DOCS.filter(d => !existsSync(join(DOCS, d)))
    expect(missing, `docs de governança ausentes: ${missing.join(', ')}`).toEqual([])
  })

  it('todo documento de governança REFERENCIA a raiz ADR-000', () => {
    const semRef = GOVERNANCE_DOCS.filter(d => !/ADR-000/.test(read(d)))
    expect(semRef, `docs de governança sem referência ao ADR-000: ${semRef.join(', ')}`).toEqual([])
  })

  it('GOV-001 mantém a Matriz de Cobertura e a Governance Version', () => {
    const gov = read('GOV-001_GOVERNANCE_COVERAGE_MATRIX.md')
    expect(gov).toMatch(/Matriz de Cobertura/)
    expect(gov).toMatch(/Governance Version/)
  })
})
