// CATRACA — "nada novo" nunca mais pode responder por cinco situações diferentes.
//
// A fundadora autorizou tudo, tocou em sincronizar e leu "Nada novo desde a última vez". Três vezes, em dias
// diferentes, concluindo a cada vez que a plataforma não funcionava. A plataforma sabia distinguir o motivo —
// só não dizia. Estes testes existem para que a distinção não possa ser desfeita.
import { describe, it, expect } from 'vitest'
import { resumoSincronizacao, type DiagnosticoSync } from '@sintera/core'

const BASE: DiagnosticoSync = {
  concedidas: ['Steps', 'HeartRate'],
  negadas: [],
  historico: false,
  diasJanela: 28,
  porTipo: [{ tipo: 'Steps', registros: 0 }, { tipo: 'HeartRate', registros: 0 }],
  amostras: 0, sessoes: 0, gravadas: 0, visiveis: 0, gravadasSessoes: 0,
}

describe('resumo da sincronização do Health Connect', () => {
  it('todo resultado traz os fatos que o sustentam — permissões e janela, sempre', () => {
    const r = resumoSincronizacao(BASE)
    expect(r.fatos.some(f => f.includes('Permissões'))).toBe(true)
    expect(r.fatos.some(f => f.includes('Janela'))).toBe(true)
  })

  it('cofre vazio: diz que está VAZIO e por quê — não "nada novo"', () => {
    const r = resumoSincronizacao(BASE)
    expect(r.vazio).toBe(true)
    expect(r.frase).toContain('vazio')
    // A explicação que faltava: os apps escrevem a partir do momento em que são ligados.
    expect(r.frase).toContain('a partir do momento')
    expect(r.frase).not.toContain('Nada novo')
  })

  it('leitura RECUSADA nunca se disfarça de ausência de dado', () => {
    const r = resumoSincronizacao({
      ...BASE,
      porTipo: [
        { tipo: 'Steps', registros: 0, erro: 'janela além do permitido' },
        { tipo: 'HeartRate', registros: 0, erro: 'janela além do permitido' },
      ],
    })
    expect(r.frase).toContain('recusou')
    expect(r.frase).not.toContain('vazio')
    // O motivo técnico chega à pessoa: é o que separa "está quebrado" de "falta um ajuste".
    expect(r.fatos.some(f => f.includes('janela além do permitido'))).toBe(true)
  })

  it('sem permissão de histórico, a tela DIZ que o Health Connect não entrega o mais antigo', () => {
    const r = resumoSincronizacao(BASE)
    expect(r.fatos.some(f => f.includes('histórico'))).toBe(true)
  })

  it('lido e não gravado é assumido como problema NOSSO, não do aparelho', () => {
    const r = resumoSincronizacao({
      ...BASE,
      porTipo: [{ tipo: 'Steps', registros: 12 }],
      amostras: 12, gravadas: 0, visiveis: 0,
    })
    expect(r.frase).toContain('nosso')
    expect(r.vazio).toBe(false)
  })

  it('nenhuma permissão concedida não vira "vazio" — vira falta de autorização', () => {
    const r = resumoSincronizacao({ ...BASE, concedidas: [], negadas: ['Steps'], porTipo: [] })
    expect(r.frase).toContain('permissão')
    expect(r.vazio).toBe(true)
  })

  it('só sobra "Nada novo" quando houve dado e ele já estava guardado', () => {
    const r = resumoSincronizacao({
      ...BASE,
      porTipo: [{ tipo: 'Steps', registros: 40 }],
      amostras: 40, gravadas: 0, visiveis: 0, sessoes: 0, gravadasSessoes: 0,
    })
    // 40 lidos, 0 gravados e 40 amostras construídas = defeito nosso, não "nada novo".
    expect(r.frase).not.toBe('Nada novo desde a última vez.')
  })

  it('quando vem dado, separa o que APARECE do que só foi guardado', () => {
    const r = resumoSincronizacao({
      ...BASE,
      porTipo: [{ tipo: 'Steps', registros: 30 }, { tipo: 'Weight', registros: 2 }],
      amostras: 32, gravadas: 32, visiveis: 2, gravadasSessoes: 0,
    })
    expect(r.frase).toContain('2 leituras')
    expect(r.frase).toContain('30')
    expect(r.frase).toContain('sem tela própria')
    expect(r.vazio).toBe(false)
  })

  it('os tipos aparecem com nome em português, e o desconhecido não some', () => {
    const r = resumoSincronizacao({
      ...BASE,
      porTipo: [{ tipo: 'OxygenSaturation', registros: 3 }, { tipo: 'TipoNovoQualquer', registros: 5 }],
      amostras: 8, gravadas: 8, visiveis: 8,
    })
    expect(r.fatos.some(f => f.startsWith('saturação de oxigênio'))).toBe(true)
    expect(r.fatos.some(f => f.startsWith('TipoNovoQualquer'))).toBe(true)
  })
})
