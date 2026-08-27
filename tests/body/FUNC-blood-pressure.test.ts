// FUNC · pressão arterial escrita à mão (homologação de 27/08).
//
// O CASO REAL: a fundadora digitou "12/8" — como se fala em português. A plataforma gravou "12/8 mmHg", e isso
// tem duas consequências que só aparecem depois:
//   • o GRÁFICO usa o primeiro número, então "12/8" vira 12 e "120/80" vira 120 — misturados, a linha do tempo
//     deixa de significar qualquer coisa;
//   • `12 mmHg` é fisicamente impossível, e é esse dado que vai para relatório e para a RNDS.
//
// A plataforma NÃO CONVERTE sozinha: trocar 12/8 por 120/80 seria interpretar o que ela quis dizer. Ela nota e
// pergunta — mesma disciplina do aviso de divergência de documento.
import { describe, it, expect } from 'vitest'
import { readBloodPressure, bloodPressureHint } from '@sintera/core'

describe('leitura da pressão', () => {
  it('reconhece a forma em mmHg e não diz nada', () => {
    const r = readBloodPressure('120/80')
    expect(r).toMatchObject({ sistolica: 120, diastolica: 80, plausivel: true, sugestao: null })
    expect(bloodPressureHint('120/80')).toBeNull()
  })

  it('O CASO REAL: "12/8" é reconhecido e SUGERIDO, não convertido', () => {
    const r = readBloodPressure('12/8')
    expect(r.plausivel).toBe(false)
    expect(r.sugestao).toBe('120/80')
    expect(bloodPressureHint('12/8')).toContain('120/80 mmHg')
  })

  it('aceita os separadores que se escrevem à mão', () => {
    for (const t of ['12/8', '12 / 8', '12x8', '12X8']) {
      expect(readBloodPressure(t).sugestao, t).toBe('120/80')
    }
  })

  it('outras leituras faladas comuns', () => {
    expect(readBloodPressure('13/9').sugestao).toBe('130/90')
    expect(readBloodPressure('11/7').sugestao).toBe('110/70')
  })

  it('sistólica MENOR que diastólica não é leitura de pressão — não sugere nada', () => {
    // Sem esta checagem, "8/12" viraria a sugestão "80/120", que é impossível.
    expect(readBloodPressure('8/12').sugestao).toBeNull()
  })

  it('não sugere para valor que já é plausível, mesmo estranho', () => {
    // 90/60 é pressão baixa, não erro de unidade. Julgar se está boa seria conteúdo clínico.
    expect(readBloodPressure('90/60')).toMatchObject({ plausivel: true, sugestao: null })
    expect(bloodPressureHint('90/60')).toBeNull()
  })

  it('texto que não é pressão devolve leitura vazia, sem quebrar', () => {
    for (const t of ['', '  ', 'normal', '120', 'abc/def', null, undefined]) {
      expect(readBloodPressure(t).sistolica, String(t)).toBeNull()
      expect(bloodPressureHint(t), String(t)).toBeNull()
    }
  })

  it('a dica NUNCA afirma — sugere e explica por quê', () => {
    const dica = bloodPressureHint('12/8') ?? ''
    expect(dica).toContain('costuma significar')
    expect(dica).toContain('comparação ao longo do tempo')
    // Não manda, não corrige, não fala em erro.
    expect(dica).not.toMatch(/errad|inválid|corrija|obrigat/i)
  })
})
