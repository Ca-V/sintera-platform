// ARCH · toda coluna que o cliente pede a uma VISÃO existe naquela visão.
//
// ============================================================================================
// O DEFEITO QUE ISTO IMPEDE (homologação da fundadora, 27/09/2026, 15:29)
// ============================================================================================
// A tela Profissionais mostrou "Erro desconhecido" e a lista vazia. Os convites não tinham sumido — a leitura
// inteira estourava.
//
// A migração 163 adicionou `entrega_detalhe` à TABELA `care_invites` e recriou a visão
// `care_invites_do_remetente` SEM essa coluna. Uma hora depois o cliente passou a pedi-la no select. O
// PostgREST não devolve "o resto sem essa coluna": ele **recusa a consulta toda**. Um campo a mais no select
// apagou a tela inteira.
//
// POR QUE NENHUM TESTE PEGOU. Havia 2.268 testes e nenhum consultava a relação real. Os testes de domínio
// recebem objetos montados à mão, que naturalmente têm todos os campos — eles nunca poderiam discordar do
// banco, porque nunca falam com ele.
//
// ============================================================================================
// O QUE ESTA CATRACA FAZ
// ============================================================================================
// Lê a última definição de cada visão nas migrações, lê os selects do cliente, e compara. É estática — não
// precisa de banco, roda na CI — e teria pegado o defeito no momento em que ele foi escrito.
//
// LIMITE DECLARADO: cobre VISÕES, não tabelas. Para tabela, a coluna nasce com o `alter table` e a catraca de
// drift de migração já acusa divergência entre repositório e banco. A visão é o caso traiçoeiro justamente
// porque ela precisa ser REESCRITA para ganhar a coluna, e nada obriga isso.
import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs'
import { join } from 'node:path'

const ROOT = process.cwd()
const MIGRACOES = join(ROOT, 'supabase/migrations')
const CLIENTES = ['packages/api-client/src', 'src/lib', 'src/app', 'apps/mobile/src']

// ------------------------------------------------------------------------------------------------------
// 1. As visões, como as migrações as deixaram
// ------------------------------------------------------------------------------------------------------

/** `create [or replace] view public.nome ... as select a, b, c from ...` — a ÚLTIMA definição vence. */
function visoesDasMigracoes(): Map<string, Set<string>> {
  const visoes = new Map<string, Set<string>>()
  if (!existsSync(MIGRACOES)) return visoes

  // Ordem alfabética = ordem cronológica: as migrações são nomeadas por timestamp.
  for (const arquivo of readdirSync(MIGRACOES).filter(n => n.endsWith('.sql')).sort()) {
    const sql = readFileSync(join(MIGRACOES, arquivo), 'utf8')
    const re = /create\s+(?:or\s+replace\s+)?view\s+(?:public\.)?(\w+)\b([\s\S]*?)\bfrom\b/gi
    for (const m of sql.matchAll(re)) {
      const nome = m[1]
      // O corpo entre o nome e o FROM: pode ter `with (security_invoker = true)` antes do `as select`.
      const corpo = m[2]
      const sel = /\bas\s+(?:\([\s\S]*?\)\s*)?select\b([\s\S]*)$/i.exec(corpo)
        ?? /\bselect\b([\s\S]*)$/i.exec(corpo)
      if (!sel) continue
      const colunas = colunasDaLista(sel[1])
      // `select *` não dá para comparar estaticamente — a visão herda o que a tabela tiver.
      if (colunas === null) { visoes.delete(nome); continue }
      visoes.set(nome, colunas)
    }
  }
  return visoes
}

/** Quebra `a, b as c, d` em nomes. `null` quando há `*` — aí não há o que comparar. */
function colunasDaLista(lista: string): Set<string> | null {
  const fora = new Set<string>()
  for (const bruto of lista.split(',')) {
    const t = bruto.replace(/--.*$/gm, '').trim()
    if (!t) continue
    if (t === '*' || t.endsWith('.*')) return null
    // `x as y` expõe `y`; `tabela.x` expõe `x`.
    const apelido = /\bas\s+(\w+)\s*$/i.exec(t)
    const nome = apelido ? apelido[1] : (t.split('.').pop() ?? t)
    if (/^\w+$/.test(nome)) fora.add(nome.toLowerCase())
  }
  return fora
}

// ------------------------------------------------------------------------------------------------------
// 2. O que o cliente pede
// ------------------------------------------------------------------------------------------------------

interface Pedido { arquivo: string; relacao: string; colunas: string[] }

function varrer(dir: string, out: string[] = []): string[] {
  if (!existsSync(dir)) return out
  for (const n of readdirSync(dir)) {
    const p = join(dir, n)
    if (statSync(p).isDirectory()) varrer(p, out)
    else if (/\.(ts|tsx)$/.test(n) && !/\.test\.tsx?$/.test(n)) out.push(p)
  }
  return out
}

function pedidosDoCliente(): Pedido[] {
  const pedidos: Pedido[] = []
  for (const base of CLIENTES) {
    for (const arquivo of varrer(join(ROOT, base))) {
      const src = readFileSync(arquivo, 'utf8')
      // `.from('relacao')` seguido, em até ~200 caracteres, de `.select('colunas')`.
      const re = /\.from\(\s*['"`](\w+)['"`]\s*\)[\s\S]{0,200}?\.select\(\s*['"`]([^'"`]*)['"`]/g
      for (const m of src.matchAll(re)) {
        pedidos.push({
          arquivo: arquivo.slice(ROOT.length + 1).replace(/\\/g, '/'),
          relacao: m[1],
          colunas: colunasDoSelect(m[2]),
        })
      }
    }
  }
  return pedidos
}

/**
 * Quebra o select do PostgREST. Ignora recursos embutidos — `professional_profiles(nome, profissao)` é um
 * JOIN, não uma coluna desta relação, e o PostgREST o resolve pela chave estrangeira.
 */
function colunasDoSelect(sel: string): string[] {
  const fora: string[] = []
  let nivel = 0, atual = ''
  for (const ch of sel) {
    if (ch === '(') nivel++
    if (ch === ')') nivel--
    if (ch === ',' && nivel === 0) { fora.push(atual); atual = '' } else atual += ch
  }
  fora.push(atual)
  return fora
    .map(t => t.trim())
    .filter(t => t && t !== '*' && !t.includes('('))       // embutido: não é coluna daqui
    .map(t => (t.includes(':') ? t.split(':').pop()! : t)) // `apelido:coluna`
    .map(t => t.trim().toLowerCase())
    .filter(t => /^\w+$/.test(t))
}

// ------------------------------------------------------------------------------------------------------
// 3. A catraca
// ------------------------------------------------------------------------------------------------------

describe('ARCH · a visão cobre o select do cliente', () => {
  const visoes = visoesDasMigracoes()
  const pedidos = pedidosDoCliente()

  it('as migrações definem visões e o cliente as consulta — senão esta catraca não está medindo nada', () => {
    expect(visoes.size, 'nenhuma visão encontrada nas migrações: o parser quebrou').toBeGreaterThan(0)
    expect(pedidos.length, 'nenhum `.from().select()` encontrado: o parser quebrou').toBeGreaterThan(0)
  })

  it('nenhum select pede coluna que a visão não expõe', () => {
    const faltando: string[] = []
    for (const p of pedidos) {
      const colunasDaVisao = visoes.get(p.relacao)
      if (!colunasDaVisao) continue // tabela, ou visão com `select *` — fora do alcance declarado
      for (const c of p.colunas) {
        if (!colunasDaVisao.has(c)) {
          faltando.push(
            `${p.arquivo}: pede "${c}" de \`${p.relacao}\`, que expõe [${[...colunasDaVisao].join(', ')}]`,
          )
        }
      }
    }
    expect(
      faltando,
      'O PostgREST recusa o SELECT INTEIRO quando falta uma coluna — a tela some, não degrada.\n' +
        'Acrescente a coluna à visão numa migração nova (`create or replace view`), não só à tabela.\n\n' +
        faltando.join('\n'),
    ).toEqual([])
  })

  it('CASO CONHECIDO · `care_invites_do_remetente` expõe `entrega_detalhe`', () => {
    // O defeito literal de 27/09. Fica nomeado para que, se alguém reescrever a visão sem esta coluna, o
    // relatório diga o que quebrou e por quê — e não só "lista vazia".
    const v = visoes.get('care_invites_do_remetente')
    expect(v, 'a visão sumiu das migrações').toBeDefined()
    expect([...v!]).toContain('entrega_detalhe')
  })

  it('CASO CONHECIDO · `care_invites_do_remetente` continua SEM `token` e SEM `para_user_id`', () => {
    // CARE-003 §3.1. A catraca acima empurra colunas PARA DENTRO da visão; esta impede que o empurrão passe
    // do ponto e exponha o que a visão existe para esconder.
    const v = visoes.get('care_invites_do_remetente')!
    expect([...v], 'o token dá acesso ao aceite do convite').not.toContain('token')
    expect([...v], 'saber se a pessoa criou conta transforma o silêncio dela em cobrança')
      .not.toContain('para_user_id')
  })
})
