import { describe, it, expect } from 'vitest'
import { structuralAnalysis } from '@/lib/capture/structural-analysis'

// FUNC — Análise Estrutural (2ª etapa; Princípio da Descoberta antes da Extração).
// Read-only, determinística, engenharia da informação. Produz a representação estrutural transitória
// sobre a qual a Segmentação e a Cobertura operam. Caso-âncora: o laudo real de 6 exames (GS-011),
// em que o extrator pegou 4 — a Análise Estrutural deve enxergar as 6 unidades, INDEPENDENTE da extração.

// Texto (já reparado) representativo do laudo Hermes/Life de 6 exames de sangue.
const LAUDO_6_EXAMES = `
CARINA SOARES DE PAIVA LEITE  B.Hte., 11/05/2009
MATERIAL - SANGUE
GLICEMIA - JEJUM
[DATA DA COLETA : 11/05/2009 10:04]
MÉTODO: COLORIMÉTRICO ENZIMÁTICO
RESULTADO:   85  mg/dL
VALORES DE REFERÊNCIA: DE 60 A 99 mg/dL
Responsável pela liberação: Myriam de Siqueira Feitosa  CRM-MG: 15416

MATERIAL - SANGUE
CORTISOL
MÉTODO: QUIMIOLUMINESCÊNCIA
RESULTADO:  16,5  MCG/DL
VALORES DE REFERÊNCIA: 08:00 HORAS: 5,0 A 25,0 MCG/DL
CRM-MG: 7787-T

MATERIAL - SANGUE
IGF-1 - SOMATOMEDINA C
RESULTADO:      149 ng/mL
VALORES DE REFERÊNCIA: 26 A 30 ANOS: 117 A 329

MATERIAL - SANGUE
HORMÔNIO DE CRESCIMENTO (GH)
RESULTADO:       7,55 ng/mL
VALORES DE REFERÊNCIA: MULHER: MENOR QUE 3,61 ng/mL

MATERIAL - SANGUE
INSULINA
RESULTADO:    10,7 MICRO UN/mL
VALOR DE REFERÊNCIA: INFERIOR A 19,1 MICRO UN/mL

MATERIAL - SANGUE
PEPTÍDEO C
RESULTADO:    1,8  ng/mL
VALOR DE REFERÊNCIA: 0,9 A 7,1 ng/mL
`

describe('FUNC · structuralAnalysis', () => {
  it('conta as 6 unidades de RESULTADO do laudo (GS-011) — independente da extração', () => {
    const s = structuralAnalysis({ text: LAUDO_6_EXAMES, pageCount: 4 })
    expect(s.resultUnits).toBe(6)
    expect(s.pageCount).toBe(4)
    expect(s.hasText).toBe(true)
  })

  it('detecta os cabeçalhos dos exames (best-effort) sem confundir com boilerplate', () => {
    const s = structuralAnalysis({ text: LAUDO_6_EXAMES })
    const headers = s.examHeaders.map(h => h.toUpperCase())
    expect(headers).toContain('GLICEMIA - JEJUM')
    expect(headers).toContain('CORTISOL')
    expect(headers).toContain('INSULINA')
    // boilerplate NÃO entra como exame
    expect(headers).not.toContain('MATERIAL - SANGUE')
    expect(headers.some(h => h.startsWith('RESULTADO'))).toBe(false)
    expect(headers.some(h => h.startsWith('VALORES DE REFER'))).toBe(false)
  })

  it('é DETERMINÍSTICA — mesmo texto → mesma representação', () => {
    const a = structuralAnalysis({ text: LAUDO_6_EXAMES, pageCount: 4 })
    const b = structuralAnalysis({ text: LAUDO_6_EXAMES, pageCount: 4 })
    expect(JSON.stringify(a)).toBe(JSON.stringify(b))
  })

  it('emissor conhecido é detectado (âncora documental leve)', () => {
    const s = structuralAnalysis({ text: 'Laudo emitido pelo Hermes Pardini — CRM-MG: 007\nMATERIAL - SANGUE\nRESULTADO: 5' })
    expect(s.distinctIssuers).toContain('hermes pardini')
    expect(s.resultUnits).toBe(1)
  })

  it('texto vazio → estrutura vazia, sem quebrar', () => {
    const s = structuralAnalysis({ text: null })
    expect(s.hasText).toBe(false)
    expect(s.resultUnits).toBe(0)
    expect(s.examHeaders).toEqual([])
  })
})
