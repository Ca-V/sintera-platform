// FUNC · VAL-001 §2.1 e §4 — os eventos do portão, e o único braço que é sorteável.
//
// DUAS CATRACAS, e as duas guardam coisas que não se consertam depois:
//
// 1. NOME DE EVENTO É DECISÃO, NÃO DETALHE. Retenção não se mede para trás. Se Web e aplicativo emitirem
//    nomes diferentes para o mesmo fato, a série nasce partida — e os eventos que faltaram, faltaram.
//
// 2. `metadata` NUNCA CARREGA DADO DE SAÚDE. A coluna é `jsonb` livre, sem validação no banco. O primeiro
//    "só para facilitar a análise" põe glicemia numa tabela de telemetria de produto, que tem outra
//    finalidade, outra retenção e outra base legal.

import { describe, it, expect } from 'vitest'
import {
  EVENTOS, EVENTOS_CICLO, EVENTOS_LEGADOS, ehEventoConhecido, problemasNoMetadata,
  METADATA_PROIBIDA, METADATA_PERMITIDA,
  hashEstavel, bracoDoConvite, deveOferecerConvite, metadataDaCoorte,
} from '@sintera/core'

describe('VAL-001 §4 · o catálogo de eventos', () => {
  it('não tem nome repetido — dois fatos com o mesmo nome são indistinguíveis na análise', () => {
    expect(new Set(EVENTOS).size).toBe(EVENTOS.length)
  })

  it('todo nome é minúsculo com sublinhado — mistura de convenção quebra agrupamento', () => {
    for (const e of EVENTOS) expect(e, `${e} fora da convenção`).toMatch(/^[a-z][a-z0-9_]*$/)
  })

  it('os cinco eventos que já corriam continuam no catálogo', () => {
    for (const legado of ['exam_analyzed_success', 'exam_detail_viewed', 'feedback_submitted',
                          'perfil_segmentacao', 'problema_reportado']) {
      expect(EVENTOS_LEGADOS, `${legado} sumiu — quebraria a série que já existe`).toContain(legado)
    }
  })

  it('`primeiro_valor` existe — é o evento que o portão mais depende', () => {
    expect(EVENTOS_CICLO).toContain('primeiro_valor')
  })

  it('nome fora do catálogo é rejeitado', () => {
    expect(ehEventoConhecido('primeiro_valor')).toBe(true)
    expect(ehEventoConhecido('first_value')).toBe(false)
    expect(ehEventoConhecido('')).toBe(false)
  })
})

describe('VAL-001 §4 · CATRACA — metadata não carrega saúde', () => {
  it('metadata vazia ou ausente não tem problema', () => {
    expect(problemasNoMetadata(null)).toEqual([])
    expect(problemasNoMetadata({})).toEqual([])
  })

  it('chave permitida passa', () => {
    expect(problemasNoMetadata({ origem: 'web', plano: 'evolucao', coorte: 'oferece' })).toEqual([])
  })

  it.each(['valor', 'resultado', 'glicemia', 'peso', 'diagnostico', 'medicamento'])(
    'a chave "%s" é recusada, e o motivo diz por quê', (chave) => {
      const p = problemasNoMetadata({ [chave]: 123 })
      expect(p).toHaveLength(1)
      expect(p[0].porque).toMatch(/descreve saúde/i)
    })

  it('pega a chave composta, não só a exata — `valor_exame` não escapa', () => {
    expect(problemasNoMetadata({ valor_exame: 1 })).toHaveLength(1)
    expect(problemasNoMetadata({ ultimo_peso: 1 })).toHaveLength(1)
    expect(problemasNoMetadata({ VALOR: 1 }), 'maiúscula não escapa').toHaveLength(1)
  })

  it('chave desconhecida é sinalizada — o padrão é suspeitar, não deixar passar', () => {
    const p = problemasNoMetadata({ qualquer_coisa_nova: 1 })
    expect(p).toHaveLength(1)
    expect(p[0].porque).toMatch(/fora da lista conhecida/i)
  })

  it('nenhuma chave permitida colide com uma proibida', () => {
    for (const ok of METADATA_PERMITIDA) {
      expect(METADATA_PROIBIDA, `${ok} está nas duas listas`).not.toContain(ok)
    }
  })
})

describe('VAL-001 §2.1 · o sorteio do convite', () => {
  it('é determinístico — a mesma pessoa cai sempre no mesmo braço', () => {
    const id = '395a149b-0f05-4c36-8d7c-32843dcd9b36'
    const primeiro = bracoDoConvite(id)
    for (let i = 0; i < 50; i++) expect(bracoDoConvite(id)).toBe(primeiro)
  })

  it('divide perto da metade — senão um braço não teria amostra', () => {
    let oferece = 0
    const n = 4000
    for (let i = 0; i < n; i++) if (deveOferecerConvite(`usuario-de-teste-${i}`)) oferece++
    const proporcao = oferece / n
    expect(proporcao).toBeGreaterThan(0.45)
    expect(proporcao).toBeLessThan(0.55)
  })

  it('sementes diferentes dão divisões diferentes — experimentos não se contaminam', () => {
    const ids = Array.from({ length: 500 }, (_, i) => `u${i}`)
    const a = ids.map(i => bracoDoConvite(i, 'experimento-a'))
    const b = ids.map(i => bracoDoConvite(i, 'experimento-b'))
    const iguais = a.filter((x, i) => x === b[i]).length
    // Se as sementes fossem ignoradas, seriam 100% iguais. Independentes ficam perto de 50%.
    expect(iguais / ids.length).toBeLessThan(0.65)
  })

  it('o hash é estável e não depende do runtime', () => {
    expect(hashEstavel('')).toBe(0x811c9dc5)
    expect(hashEstavel('a')).toBe(hashEstavel('a'))
    expect(hashEstavel('a')).not.toBe(hashEstavel('b'))
  })

  it('a metadata da coorte não diz nada sobre a pessoa', () => {
    const m = metadataDaCoorte('395a149b-0f05-4c36-8d7c-32843dcd9b36')
    expect(Object.keys(m).sort()).toEqual(['coorte', 'versao'])
    expect(problemasNoMetadata(m), 'a própria metadata da coorte precisa passar na catraca').toEqual([])
  })

  it('a versão do experimento vai junto — sem ela não se sabe de qual sorteio veio o braço', () => {
    expect(metadataDaCoorte('u1', 'experimento-x').versao).toBe('experimento-x')
  })
})
