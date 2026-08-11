// FUNC — regra de data do lembrete de troca (única lógica de negócio pura do Ciclo).
import { describe, it, expect } from 'vitest'
import { reminderDesired } from '@/lib/ciclo/service'

const TODAY = '2026-08-11'

describe('reminderDesired', () => {
  it('sem lembrete ligado → null', () => {
    expect(reminderDesired({ kind: 'diu_hormonal', reminder: false }, '2027-01-31', TODAY)).toBeNull()
  })

  it('pílula → null (troca não se aplica)', () => {
    expect(reminderDesired({ kind: 'pilula', reminder: true }, '2027-01-31', TODAY)).toBeNull()
  })

  it('sem data de troca (replaceOn) → null', () => {
    expect(reminderDesired({ kind: 'diu_hormonal', reminder: true }, null, TODAY)).toBeNull()
  })

  it('troca futura → 30 dias antes, com título "Trocar …"', () => {
    const r = reminderDesired({ kind: 'diu_hormonal', reminder: true }, '2027-01-31', TODAY)
    expect(r?.date).toBe('2027-01-01') // 31/jan − 30 dias
    expect(r?.title).toContain('Trocar')
  })

  it('clamp: 30 dias antes já no passado → hoje (nunca no passado)', () => {
    const r = reminderDesired({ kind: 'diu_hormonal', reminder: true }, '2026-08-20', TODAY)
    expect(r?.date).toBe(TODAY) // 20/ago − 30 dias = 21/jul (passado) → hoje
  })
})
