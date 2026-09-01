// CATRACA — A BUSCA TEM DE ALCANÇAR TODO TEXTO QUE A PESSOA ESCREVEU.
//
// ─────────────────────────────────────────────────────────────────────────────────────────────────────────
// REGRA PERMANENTE DA FUNDADORA: "É obrigatório que a opção de buscar dentro da plataforma busque qualquer
// palavra que esteja dentro da plataforma. Seja palavra estrutural da plataforma, palavra que o usuário
// adicionou ou palavra que esteja em algum documento adicionado."
//
// ESTA REGRA JÁ FOI QUEBRADA QUATRO VEZES, sempre do mesmo jeito: a coluna existe, o dado está lá, e a
// consulta não a inclui. Nada reclama, porque não havia nada que pudesse reclamar.
//
//   1. "dermatologista"  — `professional_name` criado na migração 151, ausente da consulta
//   2. "água"            — `description` de life_habits; procurava-se só por `category`, o valor técnico
//   3. dentro da receita — `transcricao` criado na migração 154
//   4. "Exames laboratoriais" — `display_title` NUNCA esteve na busca. `type` guarda o rótulo legado, muitas
//                          vezes o nome do arquivo; `display_title` é o que a pessoa lê na tela. Ela procurava
//                          pelo que via, e não achava. Encontrado por este teste, antes de ela reportar.
//
// ─────────────────────────────────────────────────────────────────────────────────────────────────────────
// COMO ESTE TESTE FUNCIONA, e por que ele não vira uma lista que envelhece.
//
// Ele LÊ O ESQUEMA REAL do banco — `src/lib/supabase/types.ts`, gerado a partir da produção — e descobre
// sozinho as colunas que guardam TEXTO ESCRITO POR UMA PESSOA. Depois exige que cada uma esteja na consulta
// de busca, ou esteja declarada abaixo como exceção COM MOTIVO.
//
// Acrescentar uma coluna de texto numa migração passa a quebrar este teste até alguém decidir o que fazer com
// ela. É o oposto de uma lista mantida à mão: a lista se descobre, e o que se mantém é a exceção.
//
// Depende dos tipos estarem em dia — que é o item 5 do PROTOCOLO-ENTREGA, acrescentado no mesmo dia que este
// teste e pelo mesmo motivo.
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const RAIZ = resolve(__dirname, '../..')
const TIPOS = readFileSync(resolve(RAIZ, 'src/lib/supabase/types.ts'), 'utf8')
const BUSCA = readFileSync(resolve(RAIZ, 'packages/api-client/src/search/search.ts'), 'utf8')

/** As tabelas que a busca cobre. Uma tabela nova de registro da pessoa entra aqui. */
const TABELAS = [
  'exams', 'patient_documents', 'life_habits', 'medications', 'health_resources',
  'health_conditions', 'health_events', 'activity_sessions', 'biomarkers', 'clinical_results',
] as const

/**
 * O que conta como TEXTO DE PESSOA.
 *
 * Nomes que costumam guardar o que alguém escreveu ou o que um documento diz. Não pega tudo — pega o que
 * historicamente importou, e erra para o lado de exigir demais: uma coluna a mais na lista custa uma linha
 * de exceção; uma a menos custa uma busca que não encontra.
 */
const PARECE_TEXTO_DE_PESSOA = /(^|_)(name|title|text|notes|description|label|transcricao|issuer|brand)($|_)/

/** Sufixos de METADADO. `text_transcription_status` casa o padrão acima e não é texto de ninguém. */
const E_METADADO = /_(status|origin|version|id|at|hash|url|by|kind|type|code|system|role)$/

/**
 * As exceções, cada uma COM O MOTIVO.
 *
 * Uma exceção sem motivo é uma omissão disfarçada de decisão. Se você está acrescentando uma linha aqui,
 * escreva por que a pessoa nunca vai procurar por esse conteúdo.
 */
const NAO_BUSCAVEIS: Record<string, string> = {
  'exams.exam_text_origin': 'metadado de proveniência, não conteúdo',
  'exams.patient_name': 'está na busca',
  'biomarkers.raw_text': 'está na busca por clinical_results; em biomarkers é a linha bruta já coberta por exam_text',
  'clinical_results.reference_text': 'valor de referência do laudo — número e faixa, não termo de busca',
  'patient_documents.transcricao_origin': 'metadado de proveniência, não conteúdo',
  'life_habits.plan_name': 'está na busca',
  'medications.prescriber_name': 'está na busca',
  'health_events.professional_name': 'está na busca',
  'health_conditions.since_label': 'está na busca',
}

/** Extrai as colunas `string` do bloco Row de uma tabela nos tipos gerados. */
function colunasDeTexto(tabela: string): string[] {
  const inicio = TIPOS.indexOf(`      ${tabela}: {`)
  if (inicio < 0) return []
  const fim = TIPOS.indexOf('Insert:', inicio)
  const bloco = TIPOS.slice(inicio, fim > inicio ? fim : undefined)
  return [...bloco.matchAll(/^ {10}([a-z_0-9]+): (?:string|string \| null)$/gm)]
    .map(m => m[1])
    .filter(c => PARECE_TEXTO_DE_PESSOA.test(c) && !E_METADADO.test(c))
}

/**
 * A consulta de busca menciona esta coluna?
 *
 * A FRONTEIRA À ESQUERDA É O QUE FAZ ESTE TESTE VALER. Uma verificação por `includes` simples daria
 * `name.ilike.` como presente só porque existe `professional_name.ilike.` — e então `medications.name`,
 * `health_resources.name` e `health_conditions.name` passariam sem nunca terem sido conferidos.
 *
 * Foi exatamente o que aconteceu na primeira versão deste arquivo: ele passava, e eu só descobri porque
 * tentei sabotá-lo de propósito. Um teste que não falha quando deveria é pior que teste nenhum — dá a
 * garantia sem entregar a verificação, que é a mesma família de defeito que ele existe para pegar.
 */
function estaNaBusca(coluna: string): boolean {
  const c = coluna.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  // Precedida por início de interpolação, vírgula, parêntese ou aspas — nunca por parte de outro nome.
  return new RegExp(`[\`,('"]${c}\\.ilike[.']`).test(BUSCA)
}

describe('a busca alcança todo texto que a pessoa escreveu', () => {
  it('os tipos do banco estão em dia — sem isso este teste não vale nada', () => {
    // Até 01/09/2026 este arquivo era um stub de 233 linhas cobrindo 6 das 67 tabelas. Um teste que lesse o
    // stub passaria sempre e não provaria coisa alguma.
    expect(TIPOS.length).toBeGreaterThan(50_000)
    expect(TIPOS).toContain('transcricao')
    expect(TIPOS).toContain('display_title')
  })

  for (const tabela of TABELAS) {
    it(`${tabela}: toda coluna de texto está na busca, ou tem exceção com motivo`, () => {
      const colunas = colunasDeTexto(tabela)
      expect(colunas.length, `nenhuma coluna encontrada em ${tabela} — os tipos mudaram de formato?`)
        .toBeGreaterThan(0)

      const faltando = colunas.filter(c => !estaNaBusca(c) && !NAO_BUSCAVEIS[`${tabela}.${c}`])
      expect(faltando, [
        `Estas colunas de ${tabela} guardam texto e a busca não as alcança:`,
        ...faltando.map(c => `  • ${tabela}.${c}`),
        '',
        'A regra da fundadora é que a busca encontre QUALQUER palavra da plataforma.',
        'Ou inclua a coluna em packages/api-client/src/search/search.ts,',
        `ou declare a exceção em NAO_BUSCAVEIS deste arquivo — COM O MOTIVO.`,
      ].join('\n')).toEqual([])
    })
  }

  it('as quatro quebras conhecidas continuam corrigidas', () => {
    // Uma catraca vale pelo que ela impede de voltar.
    expect(estaNaBusca('professional_name'), 'o achado "dermatologista"').toBe(true)
    expect(estaNaBusca('description'), 'o achado "água"').toBe(true)
    expect(estaNaBusca('transcricao'), 'buscar dentro da receita').toBe(true)
    expect(estaNaBusca('display_title'), 'o nome que a pessoa VÊ no exame').toBe(true)
  })

  it('NENHUMA exceção pode ficar sem motivo escrito', () => {
    for (const [chave, motivo] of Object.entries(NAO_BUSCAVEIS)) {
      expect(motivo.trim().length, `${chave} está na lista de exceções sem explicar por quê`)
        .toBeGreaterThan(10)
    }
  })
})
