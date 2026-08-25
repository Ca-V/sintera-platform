// FUNC · HIP-014 §2/§8.1 — a HORA da medição.
//
// O caso que motiva tudo isto: o diário de pressão que o médico pede em hipertensão — "meça de manhã e à noite
// por duas semanas e me traga". Duas medições, mesma data. Sem hora elas são duas linhas indistinguíveis e sem
// ordem definida entre si, e a série deixa de ser série.
//
// Antes da migração 148 o banco não tinha onde guardar a hora. Estes testes cobrem a regra pura: QUEM precisa de
// hora, como ordenar quando ela existe, e como não quebrar o que foi gravado antes dela existir.
import { describe, it, expect } from 'vitest'
import {
  requiresTimeOfDay, measurementInstant, compareMeasurementsDesc, hasTimeOfDay,
  toBodyMetricRow, VITAL_SIGNS, BODY_METRICS,
} from '@sintera/core'

describe('HIP-014 · o dado de conector também guarda a hora', () => {
  const amostra = {
    metric: 'pressao_arterial',
    value: 128,
    unit: 'mmHg',
    recordedAt: '2026-08-25T07:14:00.000Z',
    provenance: { source: 'health_connect', connectorVersion: '1.0.0', externalId: 'abc' },
  }

  it('preserva o INSTANTE da leitura, não só o dia', () => {
    const row = toBodyMetricRow(amostra, 'u1')
    expect(row?.measured_at).toBe('2026-08-25T07:14:00.000Z')
    expect(row?.measured_on).toBe('2026-08-25')
  })

  it('a hora sobrevivente é hora de verdade, não a âncora do dia', () => {
    const row = toBodyMetricRow(amostra, 'u1')
    expect(hasTimeOfDay(row?.measured_at)).toBe(true)
  })

  it('medição de conector e medição manual ordenam juntas, na mesma série', () => {
    const doConector = toBodyMetricRow(amostra, 'u1')!
    const manualDaNoite = { measured_at: '2026-08-25T21:30:00.000Z', measured_on: '2026-08-25' }
    const serie = [doConector, manualDaNoite].sort(compareMeasurementsDesc)
    expect(serie[0]).toBe(manualDaNoite)   // 21:30 vem antes de 07:14
    expect(serie).toHaveLength(2)          // origens diferentes coexistem; nenhuma é escolhida
  })
})

describe('HIP-014 · hasTimeOfDay — o marcador de "hora não registrada"', () => {
  it('meia-noite UTC exata é MARCADOR, não medição à meia-noite', () => {
    expect(hasTimeOfDay('2026-08-25T00:00:00.000Z')).toBe(false)
    expect(hasTimeOfDay('2026-08-25T00:00:00Z')).toBe(false)
  })

  it('qualquer outro instante é hora de verdade', () => {
    expect(hasTimeOfDay('2026-08-25T07:30:00.000Z')).toBe(true)
    expect(hasTimeOfDay('2026-08-25T21:00:00.000Z')).toBe(true)
  })

  it('uma medição feita à meia-noite LOCAL não é confundida com o marcador', () => {
    // Meia-noite em Brasília = 03:00Z. O marcador é meia-noite UTC — não colidem.
    expect(hasTimeOfDay('2026-08-26T03:00:00.000Z')).toBe(true)
  })

  it('ausência não é hora', () => {
    expect(hasTimeOfDay(null)).toBe(false)
    expect(hasTimeOfDay(undefined)).toBe(false)
    expect(hasTimeOfDay('')).toBe(false)
  })
})

describe('HIP-014 · requiresTimeOfDay', () => {
  it('todo sinal vital pede hora — inclusive o desconhecido', () => {
    for (const v of VITAL_SIGNS) {
      expect(requiresTimeOfDay(v.value), `${v.value} deveria pedir hora`).toBe(true)
    }
  })

  it('pressão e glicemia pedem hora — são o caso que motivou a regra', () => {
    expect(requiresTimeOfDay('pressao_arterial')).toBe(true)
    expect(requiresTimeOfDay('glicemia')).toBe(true)
  })

  it('composição corporal não pede — o dia é a granularidade que importa', () => {
    for (const m of BODY_METRICS) {
      expect(requiresTimeOfDay(m.value), `${m.value} não deveria pedir hora`).toBe(false)
    }
  })

  it('métrica desconhecida/nula não pede hora, e não quebra', () => {
    expect(requiresTimeOfDay('metrica_que_nao_existe')).toBe(false)
    expect(requiresTimeOfDay(null)).toBe(false)
    expect(requiresTimeOfDay(undefined)).toBe(false)
    expect(requiresTimeOfDay('')).toBe(false)
  })
})

describe('HIP-014 · measurementInstant', () => {
  it('usa a hora quando ela existe', () => {
    expect(measurementInstant('2026-08-25T07:30:00.000Z', '2026-08-25')).toBe('2026-08-25T07:30:00.000Z')
  })

  it('cai para o dia quando não há hora — linhas anteriores à migração 148', () => {
    expect(measurementInstant(null, '2026-08-25')).toBe('2026-08-25T00:00:00.000Z')
    expect(measurementInstant(undefined, '2026-08-25')).toBe('2026-08-25T00:00:00.000Z')
    expect(measurementInstant('   ', '2026-08-25')).toBe('2026-08-25T00:00:00.000Z')
  })

  it('sem dia nem hora devolve null em vez de inventar uma data', () => {
    expect(measurementInstant(null, null)).toBeNull()
    expect(measurementInstant('', '')).toBeNull()
  })
})

describe('HIP-014 · compareMeasurementsDesc', () => {
  const manha = { measured_at: '2026-08-25T07:00:00.000Z', measured_on: '2026-08-25' }
  const noite = { measured_at: '2026-08-25T21:00:00.000Z', measured_on: '2026-08-25' }

  it('O CASO CENTRAL: manhã e noite do mesmo dia ficam em ordem, e nenhuma some', () => {
    const serie = [manha, noite].sort(compareMeasurementsDesc)
    expect(serie).toHaveLength(2)          // nenhuma foi colapsada
    expect(serie[0]).toBe(noite)           // mais recente primeiro
    expect(serie[1]).toBe(manha)
  })

  it('sem hora, duas do mesmo dia empatam — é o defeito que a migração 148 corrige', () => {
    const a = { measured_at: null, measured_on: '2026-08-25' }
    const b = { measured_at: null, measured_on: '2026-08-25' }
    expect(compareMeasurementsDesc(a, b)).toBe(0)
  })

  it('mistura hora e sem-hora sem quebrar: o dia serve de âncora', () => {
    const antiga = { measured_at: null, measured_on: '2026-08-20' }
    const serie = [antiga, noite, manha].sort(compareMeasurementsDesc)
    expect(serie).toEqual([noite, manha, antiga])
  })

  it('é determinístico: ordenar duas vezes dá o mesmo resultado', () => {
    const entrada = [manha, { measured_at: null, measured_on: '2026-08-20' }, noite]
    const uma = [...entrada].sort(compareMeasurementsDesc)
    const outra = [...entrada].sort(compareMeasurementsDesc)
    expect(uma).toEqual(outra)
  })
})
