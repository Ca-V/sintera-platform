// ARCH · AÇÕES OBRIGATÓRIAS DO CARTÃO — quem pode apagar, pode corrigir.
//
// PEDIDO DA FUNDADORA (25/08): "pelo menos as opções de editar e excluir são obrigatórias". O contrato existe
// em `packages/core/src/domain/documents/cardActions.ts` desde então — com `hasRequiredActions` escrito para
// guardá-lo. E ficou sem consumidor: a auditoria de capacidades órfãs listava justamente essa função.
//
// O QUE ACONTECEU POR NÃO TER CATRACA (homologação de 27/08): "com pressão arterial e outros, não está dando a
// opção de editar". Estava certo. Eu tinha ligado Editar no cartão de ATIVIDADE e deixado o de SINAL VITAL só
// com Remover — nas duas pontas. E, ao procurar, o mesmo buraco estava em Documentos e em Despesas da Web,
// enquanto o aplicativo já editava os dois. Ninguém decidiu nada disso; cada tela nasceu sozinha.
//
// POR QUE IMPORTA, e não é detalhe de interface: sem editar, corrigir um dígito vira apagar e digitar de novo.
// A pessoa perde a hora da medição, a origem (manual? aparelho?), a observação e o vínculo com o documento que
// deu origem ao registro. Num diário de pressão, é exatamente o dado que o médico pediu para acompanhar.
//
// O QUE ESTA GUARDA FAZ: procura telas que oferecem REMOVER/EXCLUIR sem oferecer EDITAR. A lista de exceções
// abaixo é curta e cada uma diz POR QUE não se edita ali — é isso que a torna revisável, em vez de um depósito
// de silêncios.
import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs'
import { join, relative } from 'node:path'
import { DOCUMENT_BASE_ACTIONS, documentCardActions, hasRequiredActions } from '@sintera/core'

const ROOT = process.cwd()
const TELAS = ['src/app/dashboard', 'src/components', 'apps/mobile/src/presentation']

/**
 * Onde remover existe sem editar POR NATUREZA — e o motivo.
 *
 * O critério: o que se remove ali não é um REGISTRO da pessoa, é um item de trabalho em andamento (um anexo
 * ainda não salvo, uma linha escolhida para um relatório) ou um vínculo que não tem conteúdo para corrigir.
 * Nesses casos "editar" não teria o que editar.
 */
const SEM_EDICAO: Record<string, string> = {
  'src/components/ui/AnexoDocumento.tsx':
    'lista de páginas AINDA NÃO SALVAS; remover tira da lista, e não há fato registrado para corrigir',
  'src/components/ui/DocumentBundleCapture.tsx':
    'idem — páginas em preparo, antes de existir documento',
  'apps/mobile/src/presentation/primitives/AnexoDocumento.tsx':
    'contraparte no aplicativo da mesma lista em preparo',
  'src/components/ui/CreateRecordMenu.tsx':
    'menu de criação; não exibe cartão de registro nenhum',
  'src/app/dashboard/relatorio/page.tsx':
    'remover = tirar um item da SELEÇÃO do relatório; o registro em si se edita na tela dele',
  'apps/mobile/src/presentation/screens/relatorio/RelatorioScreen.tsx':
    'contraparte no aplicativo da mesma seleção',
  'src/app/dashboard/configuracoes/page.tsx':
    'remover = desfazer um vínculo/contato de notificação; corrige-se substituindo, não editando',
  'apps/mobile/src/presentation/screens/mais/ConfiguracoesScreen.tsx':
    'contraparte no aplicativo',
  'src/app/dashboard/omics/[id]/page.tsx':
    'resultados ômicos são IMPORTADOS do painel; corrigi-los à mão quebraria a rastreabilidade até o laudo',
  'apps/mobile/src/presentation/screens/omics/OmicsPanelScreen.tsx':
    'contraparte no aplicativo',
}

function varrer(dir: string, out: string[] = []): string[] {
  if (!existsSync(dir)) return out
  for (const n of readdirSync(dir)) {
    if (n === 'node_modules' || n === '.next' || n.startsWith('.')) continue
    const p = join(dir, n)
    if (statSync(p).isDirectory()) varrer(p, out)
    else if (/\.tsx$/.test(n) && !/\.test\.tsx$/.test(n)) out.push(p)
  }
  return out
}
const rel = (p: string) => relative(ROOT, p).split('\\').join('/')

const REMOVE = /\b(Remover|Excluir|removeAction|deleteAction)\b/
// A edição aparece de mais de uma forma: botão rotulado, handler, ou renomeação em linha (a lista de Exames da
// Web usa `editingNameId`, sem a palavra "Editar" em lugar nenhum). O ícone de lápis conta como sinal na Web.
const EDITA = /\b(Editar|editAction|startEdit\w*|setEdit\w*|setEditando)\b|<Pencil\b/

describe('ARCH · quem pode apagar, pode corrigir', () => {
  it('nenhuma tela oferece remover sem oferecer editar', () => {
    const infratores = TELAS
      .flatMap(d => varrer(join(ROOT, d)))
      .filter(f => {
        const corpo = readFileSync(f, 'utf8')
        return REMOVE.test(corpo) && !EDITA.test(corpo) && !(rel(f) in SEM_EDICAO)
      })
      .map(rel)

    expect(
      infratores,
      '\nTela que deixa apagar mas não deixa corrigir:\n  ' + infratores.join('\n  ') +
        '\n\nSem editar, corrigir um dígito vira apagar e digitar de novo — e a pessoa perde hora, origem,\n' +
        'observação e vínculo no caminho. Ligue a edição (o cliente quase sempre já sabe fazer: `saveBodyMetric`\n' +
        'e `updateDocument` aceitavam correção e não tinham consumidor).\n' +
        'Se ali não se edita POR NATUREZA, declare em SEM_EDICAO com o motivo — em uma frase que outra pessoa\n' +
        'possa contestar.\n',
    ).toEqual([])
  })

  it('as exceções declaradas ainda existem — nenhuma sobra apontando para arquivo apagado', () => {
    const fantasmas = Object.keys(SEM_EDICAO).filter(p => !existsSync(join(ROOT, p)))
    expect(fantasmas, `\nExceção apontando para arquivo inexistente:\n  ${fantasmas.join('\n  ')}\n`).toEqual([])
  })

  it('nenhuma exceção é DESNECESSÁRIA — a tela que já edita não precisa ser perdoada', () => {
    // Exceção que não é mais precisa vira afirmação falsa dentro do código: diz "aqui não se edita" sobre uma
    // tela que edita. Escrevi uma delas neste mesmo arquivo — declarei a lista de Exames do aplicativo como
    // divergência pendente, e ela já renomeava exame desde antes. Esta guarda impede a próxima.
    const desnecessarias = Object.keys(SEM_EDICAO).filter(p => {
      const caminho = join(ROOT, p)
      if (!existsSync(caminho)) return false
      const corpo = readFileSync(caminho, 'utf8')
      return !REMOVE.test(corpo) || EDITA.test(corpo)
    })

    expect(
      desnecessarias,
      '\nExceção que não é mais necessária (a tela edita, ou não remove nada):\n  ' +
        desnecessarias.join('\n  ') +
        '\n\nApague a entrada de SEM_EDICAO. Uma exceção a mais é uma afirmação falsa a mais.\n',
    ).toEqual([])
  })

  it('o contrato do core continua exigindo ver · editar · excluir', () => {
    // `hasRequiredActions` era capacidade órfã: escrita, nunca chamada. Aqui ela passa a guardar o que promete.
    expect(hasRequiredActions(DOCUMENT_BASE_ACTIONS)).toBe(true)
    for (const cat of ['exame', 'pedido', 'receita', 'atestado', 'relatorio', 'encaminhamento', 'outro'] as const) {
      expect(hasRequiredActions(documentCardActions(cat)), `categoria ${cat} sem as três obrigatórias`).toBe(true)
    }
  })
})
