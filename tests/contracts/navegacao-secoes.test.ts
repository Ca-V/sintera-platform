// Catálogo de seções da plataforma — o que as duas pontas prometem oferecer.
//
// Estes testes não conferem implementação: conferem o CONTRATO que a Web e o aplicativo passam a compartilhar.
// Se alguém renomear uma seção, mudar a ordem ou esquecer o resumo, quebra aqui — que é onde custa barato.
import { describe, it, expect } from 'vitest'
import { PLATFORM_NAV, allSections, sectionLabel, sectionSummary } from '@sintera/core'

describe('catálogo de seções da plataforma', () => {
  it('toda seção tem rótulo e resumo, sem sobra de espaço', () => {
    for (const s of allSections()) {
      expect(s.label.trim(), `rótulo vazio em ${s.id}`).not.toBe('')
      expect(s.label, `rótulo com espaço nas bordas em ${s.id}`).toBe(s.label.trim())
      expect(s.summary.trim(), `resumo vazio em ${s.id}`).not.toBe('')
      // O resumo aparece embaixo do nome, num menu. Passando disso ele vira parágrafo e a lista deixa de ser lista.
      expect(s.summary.length, `resumo longo demais em ${s.id}`).toBeLessThanOrEqual(110)
    }
  })

  it('nenhum id repetido — o id é a chave que cada plataforma mapeia para a sua rota', () => {
    const ids = allSections().map(s => s.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('nenhum rótulo repetido — dois destinos com o mesmo nome são indistinguíveis no menu', () => {
    const labels = allSections().map(s => s.label)
    expect(new Set(labels).size).toBe(labels.length)
  })

  it('o resumo NÃO promete interpretação clínica (ADR-000 · RDC 657)', () => {
    // A plataforma preserva, organiza e apresenta. Verbo que sugira leitura clínica do conteúdo não entra aqui —
    // é a fronteira que separa a SINTERA de um produto que precisaria de registro sanitário.
    const proibido = /\b(diagnóst|interpreta|avalia\b|indica que|significa que|risco de|recomend|sugere que)/i
    for (const s of allSections()) {
      expect(proibido.test(s.summary), `resumo de ${s.id} promete interpretação: "${s.summary}"`).toBe(false)
    }
  })

  it('a ordem e o agrupamento são os da Sidebar — Minha Saúde no meio, com quatro subgrupos', () => {
    expect(PLATFORM_NAV.map(g => g.id)).toEqual(['topo', 'minha-saude', 'rodape'])
    const saude = PLATFORM_NAV.find(g => g.id === 'minha-saude')!
    expect(saude.subgroups.map(s => s.label)).toEqual(['Documentos', 'Cuidados', 'Saúde', 'Histórico'])
  })

  it('consulta por id devolve o mesmo texto que está no catálogo, e null para o desconhecido', () => {
    expect(sectionLabel('monitoramento')).toBe('Monitoramento')
    expect(sectionSummary('monitoramento')).toContain('Sinais vitais')
    expect(sectionLabel('secao-que-nao-existe')).toBeNull()
    expect(sectionSummary(null)).toBeNull()
  })
})
