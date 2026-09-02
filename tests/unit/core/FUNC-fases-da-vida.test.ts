// CATRACA — a fase da vida é ARITMÉTICA, e a fronteira com o clínico passa aqui.
//
// A fundadora pediu (31/08) que a plataforma contextualize o acompanhamento desde bebê até idoso. O perfil
// guardava FAIXA ETÁRIA, e faixa não serve para o começo da vida: "0 a 5 anos" trata um recém-nascido e uma
// criança de cinco anos como a mesma coisa, quando entre os 2 e os 8 meses muda tudo.
//
// O QUE ESTES TESTES PROTEGEM, além do cálculo: que este módulo continue sem conteúdo clínico. Ele calcula
// idade e nomeia a fase. Não diz o que fazer em cada uma — isso exige responsável técnico com CRM (ADR-CK-001)
// e não mora aqui. A fronteira entre organizar e interpretar é o que separa a SINTERA de software médico.
import { describe, it, expect } from 'vitest'
import {
  idadeEm, faseDaVida, idadeLabel, faixaDerivada, faseLabel, FASES,
  MOTIVO_DATA_NASCIMENTO, LIMITE_DATA_NASCIMENTO,
} from '@sintera/core'

const HOJE = new Date(2026, 7, 31) // 31/08/2026, hora local

describe('idade', () => {
  it('anos, meses e dias', () => {
    expect(idadeEm('1990-08-31', HOJE)).toMatchObject({ anos: 36, meses: 0, dias: 0 })
    expect(idadeEm('1990-09-01', HOJE)).toMatchObject({ anos: 35, meses: 11, dias: 30 })
  })

  it('o dia do aniversário já conta o ano — ninguém diz "faço 36 amanhã" no próprio dia', () => {
    expect(idadeEm('2000-08-31', HOJE)?.anos).toBe(26)
  })

  it('DIA ANTERIOR AO ANIVERSÁRIO ainda é a idade anterior', () => {
    expect(idadeEm('2000-09-01', HOJE)?.anos).toBe(25)
  })

  it('não usa 30 dias fixos ao emprestar do mês — fevereiro e os meses de 31 quebrariam', () => {
    // De 31/01 a 01/03/2026: fevereiro tem 28 dias em 2026.
    expect(idadeEm('2026-01-31', new Date(2026, 2, 1))).toMatchObject({ anos: 0, meses: 1, dias: 1 })
  })

  it('DATA FUTURA devolve null — idade negativa não existe', () => {
    expect(idadeEm('2027-01-01', HOJE)).toBeNull()
  })

  it('erro de digitação no ano é recusado, não vira idade absurda', () => {
    expect(idadeEm('1092-05-10', HOJE)).toBeNull()
  })

  it('data malformada devolve null — idade inventada é pior que idade ausente', () => {
    for (const v of ['31/08/1990', '1990-13-01', 'ontem', '', null, undefined]) {
      expect(idadeEm(v as string, HOJE), String(v)).toBeNull()
    }
  })
})

describe('a fase da vida', () => {
  const casos: [string, string][] = [
    ['2026-08-20', 'recem-nascido'],     // 11 dias
    ['2026-07-01', 'lactente'],          // 2 meses
    ['2025-01-10', 'lactente'],          // 1 ano
    ['2023-01-10', 'primeira-infancia'], // 3 anos
    ['2019-01-10', 'infancia'],          // 7 anos
    ['2012-01-10', 'adolescencia'],      // 14 anos
    ['2001-01-10', 'adulto-jovem'],      // 25 anos
    ['1986-01-10', 'adulto'],            // 40 anos
    ['1950-01-10', 'idoso'],             // 76 anos
  ]
  for (const [nasc, esperado] of casos) {
    it(`${nasc} → ${esperado}`, () => expect(faseDaVida(nasc, HOJE)).toBe(esperado))
  }

  it('O CORTE DE RECÉM-NASCIDO É EM DIAS, não em meses — é onde a faixa etária falhava', () => {
    expect(faseDaVida('2026-08-03', HOJE)).toBe('recem-nascido')  // 28 dias
    expect(faseDaVida('2026-08-02', HOJE)).toBe('lactente')       // 29 dias
  })

  it('sem data, não há fase — ausência permanece ausência', () => {
    expect(faseDaVida(null, HOJE)).toBeNull()
  })

  it('toda fase tem rótulo legível e uma faixa dita', () => {
    for (const f of FASES) {
      expect(faseLabel(f.id)).toBe(f.label)
      expect(f.desde.length).toBeGreaterThan(3)
    }
  })
})

describe('como a idade é DITA', () => {
  it('no primeiro mês, em DIAS — é assim que se fala de um recém-nascido', () => {
    expect(idadeLabel('2026-08-20', HOJE)).toBe('11 dias')
  })

  it('até os dois anos, em MESES — "0 anos" seria correto e inútil', () => {
    expect(idadeLabel('2026-02-28', HOJE)).toBe('6 meses')
    expect(idadeLabel('2025-08-31', HOJE)).toBe('12 meses')
  })

  it('depois disso, em anos', () => {
    expect(idadeLabel('1990-08-31', HOJE)).toBe('36 anos')
  })

  it('singular no primeiro dia e no primeiro mês', () => {
    expect(idadeLabel('2026-08-30', HOJE)).toBe('1 dia')
    expect(idadeLabel('2026-07-31', HOJE)).toBe('1 mês')
  })
})

describe('a faixa etária passa a ser DERIVADA', () => {
  it('vem da data, e não de um segundo campo que envelheceria sozinho', () => {
    expect(faixaDerivada('1990-08-31', HOJE)).toBe('35-44')
    expect(faixaDerivada('2015-01-01', HOJE)).toBe('0-17')
    expect(faixaDerivada('1950-01-01', HOJE)).toBe('65+')
  })

  it('sem data, devolve null — e a faixa que a pessoa escolheu continua valendo', () => {
    expect(faixaDerivada(null, HOJE)).toBeNull()
  })
})

describe('o que a plataforma diz ANTES de pedir a data', () => {
  it('declara a finalidade, como a LGPD exige — e como a confiança exige antes da lei', () => {
    expect(MOTIVO_DATA_NASCIMENTO).toContain('organizar')
    expect(MOTIVO_DATA_NASCIMENTO).toContain('fase da vida')
  })

  it('diz que é OPCIONAL e o que continua funcionando sem — recusar precisa ser escolha informada', () => {
    expect(MOTIVO_DATA_NASCIMENTO).toContain('opcional')
    expect(MOTIVO_DATA_NASCIMENTO).toContain('continua funcionando')
  })

  it('diz que dá para APAGAR, e que apagar reverte', () => {
    expect(MOTIVO_DATA_NASCIMENTO).toContain('apagá-la')
  })

  it('DIZ O QUE NÃO FAZ. O silêncio aqui seria lido como a promessa oposta', () => {
    expect(LIMITE_DATA_NASCIMENTO).toContain('não usa')
    expect(LIMITE_DATA_NASCIMENTO).toContain('avaliar')
    expect(LIMITE_DATA_NASCIMENTO).toContain('médico')
  })
})
