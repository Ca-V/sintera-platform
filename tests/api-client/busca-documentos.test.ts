// A BUSCA TEM DE ACHAR O NOME DO MEDICAMENTO DENTRO DA RECEITA.
//
// REGRA PERMANENTE DA FUNDADORA: "é obrigatório que a opção de buscar dentro da plataforma busque qualquer
// palavra que esteja dentro da plataforma — seja palavra estrutural, palavra que a usuária adicionou, ou
// palavra que esteja em algum documento adicionado."
//
// A migração 151 criou `prescribed_items`, e "losartana" é exatamente o que a pessoa digita ao procurar uma
// receita. Criar a coluna e não incluí-la na busca reproduziria o achado 1 desta homologação: ela procurou
// "dermatologista", o dado ESTAVA na plataforma, e a busca não achou porque a coluna não estava na consulta.
//
// E há uma armadilha específica aqui: `prescribed_items` é uma LISTA, e `ilike` não se aplica a array. Uma
// cláusula de array seria ACEITA pelo banco e não casaria nada — falha silenciosa, a família de defeito que
// esta busca já teve. Por isso a comparação é feita em memória, e por isso ela precisa de teste.
import { describe, it, expect } from 'vitest'
import { searchRecords } from '../../packages/api-client/src/search/search'
import { mockSupabase, mockQueryBuilder, fakeSession } from './supabaseMock'

/**
 * `patient_documents` é consultado DUAS vezes, e o mock precisa distinguir.
 *
 * A consulta por TEXTO usa `.or(...)`; a de ITENS PRESCRITOS usa `.not(...)`. Um mock que devolvesse as mesmas
 * linhas para as duas tornaria impossível testar o caso mais importante — "esta palavra NÃO deveria achar" —
 * porque a linha voltaria pela outra consulta de qualquer jeito, e o teste passaria sem provar nada.
 *
 * A decisão é tomada no momento de resolver, quando a cadeia de chamadas já está registrada.
 */
function comDocumentos(porTexto: unknown[], comItens: unknown[] = porTexto) {
  const vazio = mockQueryBuilder({ data: [], error: null })
  const construtor = () => {
    const b = mockQueryBuilder({ data: [], error: null }) as Record<string, unknown>
    b.then = (resolve: (r: { data: unknown; error: unknown }) => unknown) => {
      const chamou = (b as { __calls: Record<string, unknown[]> }).__calls
      const data = chamou.or ? porTexto : chamou.not ? comItens : []
      return Promise.resolve({ data, error: null }).then(resolve)
    }
    return b as ReturnType<typeof mockQueryBuilder>
  }
  return mockSupabase({
    session: fakeSession('u1'),
    from: (t: string) => (t === 'patient_documents' ? construtor() : vazio),
  }) as never
}

const receita = {
  id: 'doc-1', subtype: 'receita', issuer: 'Victor Cunha Diniz',
  professional_name: 'Victor Cunha Diniz', institution_name: null,
  prescribed_items: ['Losartana 50mg', 'Vitamina D 2000UI'],
  doc_date: '2025-09-25',
}

describe('busca pelo que a receita prescreve', () => {
  it('O CASO CENTRAL: "losartana" acha a receita', async () => {
    const hits = await searchRecords(comDocumentos([receita]), 'losartana')
    expect(hits.some(h => h.kind === 'documento' && h.id === 'doc-1')).toBe(true)
  })

  it('acha pelo SEGUNDO item também — a receita não é só o primeiro remédio', async () => {
    const hits = await searchRecords(comDocumentos([receita]), 'vitamina')
    expect(hits.some(h => h.id === 'doc-1')).toBe(true)
  })

  it('caixa e acento não atrapalham, como não atrapalham no resto da busca', async () => {
    for (const termo of ['LOSARTANA', 'Losartaná']) {
      const hits = await searchRecords(comDocumentos([receita]), termo)
      expect(hits.some(h => h.id === 'doc-1'), termo).toBe(true)
    }
  })

  it('palavra que não está em item nenhum não traz a receita por engano', async () => {
    const hits = await searchRecords(comDocumentos([], [{ ...receita, issuer: null, professional_name: null }]), 'dipirona')
    expect(hits.some(h => h.id === 'doc-1')).toBe(false)
  })

  it('receita SEM itens não quebra a busca', async () => {
    const hits = await searchRecords(comDocumentos([], [{ ...receita, prescribed_items: null }]), 'losartana')
    expect(hits.some(h => h.id === 'doc-1')).toBe(false)
  })

  it('o documento NÃO aparece duas vezes quando casa por texto E por item', async () => {
    // "victor" casa o profissional; a mesma linha volta nas duas consultas. Um resultado repetido faria a
    // pessoa achar que tem duas receitas iguais — que é justamente o que ela reportou como defeito.
    const hits = await searchRecords(comDocumentos([receita]), 'victor')
    expect(hits.filter(h => h.id === 'doc-1')).toHaveLength(1)
  })
})

describe('o que o resultado da busca mostra', () => {
  it('O QUE FOI PRESCRITO VEM PRIMEIRO — achar a receita e não dizer de que remédio é devolve o trabalho', async () => {
    const [hit] = await searchRecords(comDocumentos([receita]), 'losartana')
    expect(hit.subtitle?.indexOf('Losartana 50mg')).toBe(0)
  })

  it('mostra o PROFISSIONAL, não a instituição — é por quem a pessoa procura o documento', async () => {
    const comClinica = { ...receita, professional_name: 'Victor Cunha Diniz', institution_name: 'Vox Dei' }
    const [hit] = await searchRecords(comDocumentos([comClinica]), 'losartana')
    expect(hit.subtitle).toContain('Victor Cunha Diniz')
  })

  it('documento ANTERIOR à migração continua achável pelo campo antigo', async () => {
    const antigo = {
      id: 'doc-2', subtype: 'atestado', issuer: 'Vox Dei Hospital Dia',
      professional_name: null, institution_name: null, prescribed_items: null, doc_date: '2023-09-19',
    }
    const hits = await searchRecords(comDocumentos([antigo]), 'vox dei')
    expect(hits.some(h => h.id === 'doc-2')).toBe(true)
  })
})
