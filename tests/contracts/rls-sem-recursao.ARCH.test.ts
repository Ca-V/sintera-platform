// ARCH · RECURSÃO DE RLS — duas policies não podem se chamar em círculo.
//
// ============================================================================================
// ESTE ARQUIVO EXISTE POR CAUSA DE UM DEFEITO QUE DERRUBOU A PLATAFORMA EM PRODUÇÃO
// ============================================================================================
// 28/09/2026. A migração 165 acrescentou uma policy em `professional_profiles` cuja condição consulta
// `care_links`. A policy de `care_links` (migração 158) já consultava `professional_profiles`.
//
// O Postgres aborta a consulta inteira:
//   42P17 — infinite recursion detected in policy for relation "care_links"
//
// E NÃO PAROU NA TELA QUE EU ESTAVA CONSTRUINDO. As 8 policies da migração 161 chamam
// `profissional_tem_vinculo_ativo()`, que é `security invoker` e lê `care_links`. A recursão subiu por elas.
// Medido em produção, com sessão autenticada, antes da correção:
//
//   exams · biomarkers · patient_documents · body_metrics · health_events → todos 42P17
//
// Exames, Receitas e atestados, Composição Corporal e Histórico de Saúde ficaram fora do ar por cerca de uma
// hora, para qualquer pessoa autenticada.
//
// POR QUE EU NÃO VI. Conferi a 165 com consultas anônimas: devolviam `200 []`. Sem policy aplicável, a RLS
// NEGA antes de avaliar a condição — a recursão nunca acontece para o anônimo. Testei no único papel em que o
// defeito não existe e li o silêncio como aprovação.
//
// ============================================================================================
// O QUE ESTA CATRACA FAZ
// ============================================================================================
// Monta o grafo "policy da tabela A menciona a tabela B" a partir das migrações e procura ciclo. Um ciclo
// nesse grafo é exatamente o 42P17. É estática — roda na CI, sem banco.
//
// LIMITE DECLARADO, e ele é real: a catraca NÃO expande funções `security invoker` chamadas pelas policies.
// `profissional_tem_vinculo_ativo()` lê `care_links` por dentro, e esta catraca não enxerga essa aresta. Ela
// teria pego o defeito de 28/09 — que era referência direta dos dois lados — mas não pegaria um ciclo que
// passe só por dentro de uma função invoker. Para esse caso não há substituto para medir no banco com
// `role=authenticated`, que é o que o roteiro de homologação passa a exigir.
//
// Referência de função `security definer` NÃO é aresta, e é assim de propósito: a função definer não dispara
// a RLS da tabela que lê — é justamente o instrumento que quebra o ciclo.

import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { join } from 'node:path'

const ROOT = process.cwd()
const MIGRACOES = join(ROOT, 'supabase/migrations')

/** Tabelas com RLS que este grafo observa. Manter curto: são as que participam de política cruzada. */
const TABELAS = [
  'care_links', 'professional_profiles', 'care_invites', 'exams', 'biomarkers', 'clinical_results',
  'patient_documents', 'body_metrics', 'health_events', 'profiles', 'subscriptions',
]

interface Policy { nome: string; tabela: string; corpo: string; arquivo: string }

/** As policies vivas: a ÚLTIMA definição de cada nome vence, e `drop policy` a remove. */
function policiesVivas(): Map<string, Policy> {
  const vivas = new Map<string, Policy>()
  if (!existsSync(MIGRACOES)) return vivas

  for (const arquivo of readdirSync(MIGRACOES).filter(n => n.endsWith('.sql')).sort()) {
    const sql = semComentarios(readFileSync(join(MIGRACOES, arquivo), 'utf8'))

    // `create policy <nome> on <schema.>tabela ... ;`
    const re = /create\s+policy\s+"?(\w+)"?\s+on\s+(?:public\.)?(\w+)([\s\S]*?);/gi
    for (const m of sql.matchAll(re)) {
      vivas.set(m[1], { nome: m[1], tabela: m[2], corpo: m[3], arquivo })
    }
    // Um drop posterior tira a policy do grafo — senão uma definição substituída seria contada duas vezes.
    for (const m of sql.matchAll(/drop\s+policy\s+(?:if\s+exists\s+)?"?(\w+)"?\s+on\s+(?:public\.)?\w+/gi)) {
      vivas.delete(m[1])
    }
    // O `drop` e o `create` do mesmo nome no mesmo arquivo: o create acima já rodou antes deste laço para
    // arquivos anteriores, mas dentro do MESMO arquivo a ordem textual importa — refazemos o create.
    for (const m of sql.matchAll(re)) {
      vivas.set(m[1], { nome: m[1], tabela: m[2], corpo: m[3], arquivo })
    }
  }
  return vivas
}

function semComentarios(src: string): string {
  return src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*--.*$/gm, '')
}

describe('ARCH · CATRACA — nenhuma policy de RLS depende de outra em círculo', () => {
  const vivas = policiesVivas()

  it('o parser encontra policies — senão esta catraca não mede nada', () => {
    expect(vivas.size, 'nenhuma policy encontrada nas migrações: o parser quebrou').toBeGreaterThan(20)
  })

  it('não há ciclo no grafo de referências entre policies', () => {
    // Aresta A → B: alguma policy DE A menciona a tabela B.
    const arestas = new Map<string, Set<string>>()
    const porOnde = new Map<string, string>()

    for (const p of vivas.values()) {
      if (!TABELAS.includes(p.tabela)) continue
      for (const outra of TABELAS) {
        if (outra === p.tabela) continue
        if (!new RegExp(`\\b(?:public\\.)?${outra}\\b`).test(p.corpo)) continue
        if (!arestas.has(p.tabela)) arestas.set(p.tabela, new Set())
        arestas.get(p.tabela)!.add(outra)
        porOnde.set(`${p.tabela}->${outra}`, `${p.nome} (${p.arquivo})`)
      }
    }

    // Busca em profundidade com pilha: o primeiro nó revisitado na pilha fecha o ciclo.
    const ciclos: string[] = []
    const visitado = new Set<string>()
    const pilha: string[] = []

    const andar = (no: string) => {
      if (pilha.includes(no)) {
        const inicio = pilha.indexOf(no)
        const caminho = [...pilha.slice(inicio), no]
        const descrito = caminho.slice(0, -1)
          .map((n, i) => `${n} --[${porOnde.get(`${n}->${caminho[i + 1]}`) ?? '?'}]--> ${caminho[i + 1]}`)
        ciclos.push(descrito.join('\n     '))
        return
      }
      if (visitado.has(no)) return
      visitado.add(no)
      pilha.push(no)
      for (const prox of arestas.get(no) ?? []) andar(prox)
      pilha.pop()
    }

    for (const no of arestas.keys()) andar(no)

    expect(
      ciclos,
      'RECURSÃO DE RLS. O Postgres aborta com 42P17 — e derruba TODA consulta que passe por essas tabelas,\n' +
        'inclusive as que só as tocam por dentro de uma função `security invoker`.\n' +
        'Quebre o ciclo com uma função `security definer` que leia a outra tabela sem disparar a RLS dela.\n\n' +
        ciclos.join('\n\n'),
    ).toEqual([])
  })

  it('CASO CONHECIDO · a policy de `professional_profiles` não menciona `care_links`', () => {
    // O defeito literal de 28/09. Fica nomeado para que o relatório diga o que quebrou, e não só "há um ciclo".
    const p = vivas.get('professional_profiles_paciente_select')
    expect(p, 'a policy sumiu das migrações').toBeDefined()
    expect(
      p!.corpo,
      'voltar a consultar `care_links` aqui recria a recursão que derrubou exames, documentos, medidas e ' +
        'histórico de saúde em produção',
    ).not.toMatch(/\bcare_links\b/)
    expect(p!.corpo, 'a leitura precisa passar pela função definer').toMatch(/profissionais_que_me_acompanham/)
  })
})
