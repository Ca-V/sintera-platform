// FUNC-001 — Roteamento da captura (Condições = reference implementation do CAP-002).
// Espelha os cenários da matriz de homologação RI-001: dado o que a IA leu + o que a
// usuária confirmou, o que é persistido (exame/condição/vínculo). Suite RÁPIDA (sem IA).
//
// Camada 1 (Funcional) da suíte reutilizável do Capture Hub. A MESMA função é usada na
// produção (condicoes/page.tsx save()) — o teste cobre a decisão real, não uma cópia.

import { describe, it, expect } from 'vitest'
import { decideCaptureRouting } from '@/lib/capture/capture-routing'

describe('FUNC-001 · roteamento do salvamento duplo (matriz RI-001)', () => {
  it('Receita médica (não é exame, sem condição afirmada no doc) → nada a salvar sozinho', () => {
    // Receita: isExam=false. Se a usuária não afirma condição, não há registro.
    const r = decideCaptureRouting({ hasCondition: false, isExam: false, hasFile: true })
    expect(r.createExam).toBe(false)
    expect(r.createCondition).toBe(false)
    expect(r.canSave).toBe(false)
  })

  it('Receita com condição afirmada pela usuária → cria só Condição (não Exame)', () => {
    const r = decideCaptureRouting({ hasCondition: true, isExam: false, hasFile: true })
    expect(r.createExam).toBe(false)
    expect(r.createCondition).toBe(true)
    expect(r.linkConditionToExam).toBe(false)
  })

  it('Laudo laboratorial SEM diagnóstico (ex.: exame negativo) → cria só Exame', () => {
    const r = decideCaptureRouting({ hasCondition: false, isExam: true, hasFile: true })
    expect(r.createExam).toBe(true)
    expect(r.createCondition).toBe(false)
    expect(r.linkConditionToExam).toBe(false)
    expect(r.canSave).toBe(true)
  })

  it('Laudo COM diagnóstico afirmado → cria Exame + Condição VINCULADOS', () => {
    const r = decideCaptureRouting({ hasCondition: true, isExam: true, hasFile: true })
    expect(r.createExam).toBe(true)
    expect(r.createCondition).toBe(true)
    expect(r.linkConditionToExam).toBe(true)
  })

  it('Condição digitada manualmente (sem documento) → cria só Condição', () => {
    const r = decideCaptureRouting({ hasCondition: true, isExam: false, hasFile: false })
    expect(r.createExam).toBe(false)
    expect(r.createCondition).toBe(true)
    expect(r.linkConditionToExam).toBe(false)
  })

  it('Exame existe INDEPENDENTE da conclusão (isExam basta, com arquivo)', () => {
    // Regra da fundadora: normal/negativo/positivo → todos criam exame.
    for (const hasCondition of [false, true]) {
      expect(decideCaptureRouting({ hasCondition, isExam: true, hasFile: true }).createExam).toBe(true)
    }
  })

  it('isExam sem arquivo NÃO cria exame (não há documento a persistir)', () => {
    expect(decideCaptureRouting({ hasCondition: false, isExam: true, hasFile: false }).createExam).toBe(false)
  })
})
