// A BUSCA TEM DE ACHAR O QUE A PESSOA ESCREVEU — não o nome da coluna.
//
// REGRA PERMANENTE DA FUNDADORA: "é obrigatório que a opção de buscar dentro da plataforma busque qualquer
// palavra que esteja dentro da plataforma — seja palavra estrutural, palavra que a usuária adicionou, ou
// palavra que esteja em algum documento adicionado."
//
// O DEFEITO (01/09/2026): a consulta de hábitos procurava SÓ por `category`, que guarda o valor técnico —
// 'atividade_fisica', 'hidratacao'. Ninguém digita isso. Ela escreveu "Água, 3L por dia" e "Musculação,
// diário"; procurar por "água" ou "musculação" não achava nada. A coluna `description` existia, o dado estava
// lá, e a consulta não a incluía.
//
// É o MESMO achado de "dermatologista", que já custou um ciclo: coluna criada, busca não atualizada.
//
// E há a segunda metade: desde 31/08/2026 a rotina de atividade física mora em MONITORAMENTO. O registro
// continua em `life_habits`, mas o resultado da busca precisa levar à tela onde ele aparece — mandar para
// Hábitos abriria uma tela onde ele já não está.
import { describe, it, expect } from 'vitest'
import { searchRecords } from '../../packages/api-client/src/search/search'
import { mockSupabase, mockQueryBuilder, fakeSession } from './supabaseMock'

/** Só `life_habits` devolve linhas; todo o resto vem vazio, para o teste falar de uma coisa só. */
function comHabitos(linhas: unknown[]) {
  const vazio = mockQueryBuilder({ data: [], error: null })
  return mockSupabase({
    session: fakeSession('u1'),
    from: (t: string) => (t === 'life_habits' ? mockQueryBuilder({ data: linhas, error: null }) : vazio),
  })
}

// Os registros REAIS dela.
const agua = { id: 'h-agua', category: 'hidratacao', description: 'Água', frequency: '3L por dia', notes: null }
const musculacao = { id: 'h-musc', category: 'atividade_fisica', description: 'Musculação', frequency: 'Diário', notes: null }

describe('a busca dentro de Hábitos', () => {
  it('O CASO DELA: "água" encontra o hábito que ela escreveu', async () => {
    const hits = await searchRecords(comHabitos([agua]), 'água')
    const h = hits.find(x => x.kind === 'habito')
    expect(h).toBeDefined()
    expect(h?.title).toBe('Água')
  })

  it('a CONSULTA inclui descrição, frequência e observações — não só a categoria', async () => {
    // Sem isto o teste acima passaria por acaso (o mock devolve linhas independentemente do filtro).
    // Aqui se prova que a cláusula foi de fato construída — era a cláusula ausente que causou o defeito.
    let filtro = ''
    const vazio = mockQueryBuilder({ data: [], error: null })
    const client = mockSupabase({
      session: fakeSession('u1'),
      from: (t: string) => {
        if (t !== 'life_habits') return vazio
        const b = mockQueryBuilder({ data: [], error: null }) as Record<string, unknown>
        const or = b.or as (s: string) => unknown
        b.or = (s: string) => { filtro = s; return or(s) }
        return b as ReturnType<typeof mockQueryBuilder>
      },
    })
    await searchRecords(client, 'água')
    expect(filtro).toContain('description.ilike')
    expect(filtro).toContain('frequency.ilike')
    expect(filtro).toContain('notes.ilike')
    expect(filtro).toContain('category.ilike')
  })

  it('O TÍTULO NÃO É NOME DE BANCO. "atividade_fisica" nunca chega aos olhos de ninguém', async () => {
    const hits = await searchRecords(comHabitos([musculacao]), 'musculação')
    const h = hits.find(x => x.kind === 'habito')
    expect(h?.title).toBe('Musculação')
    expect(JSON.stringify(hits)).not.toContain('atividade_fisica')
    expect(JSON.stringify(hits)).not.toContain('hidratacao')
  })

  it('sem descrição, cai no RÓTULO da categoria — nunca no valor técnico', async () => {
    const semDescricao = { id: 'h-x', category: 'sono', description: null, frequency: null, notes: null }
    const hits = await searchRecords(comHabitos([semDescricao]), 'sono')
    expect(hits.find(x => x.kind === 'habito')?.title).toBe('Sono')
  })

  it('A ROTINA DE ATIVIDADE LEVA A MONITORAMENTO, não a Hábitos', async () => {
    // Mudou de endereço em 31/08/2026. Levar a Hábitos abriria a tela onde ela já não aparece.
    const hits = await searchRecords(comHabitos([musculacao]), 'musculação')
    expect(hits.find(x => x.kind === 'habito')?.section).toBe('monitoramento')
  })

  it('os demais hábitos continuam levando a Hábitos', async () => {
    const hits = await searchRecords(comHabitos([agua]), 'água')
    expect(hits.find(x => x.kind === 'habito')?.section).toBe('habitos')
  })
})
