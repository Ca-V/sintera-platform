// ARCH · ANEXO-001 — ENTRADA DOCUMENTAL COM FONTE ÚNICA.
//
// PRINCÍPIO (fundadora, 25/08/2026 — PERMANENTE): toda entrada de documento na plataforma segue o MESMO padrão,
// em 100% dos pontos que oferecem anexo, Web e Mobile:
//   1. mais páginas / mais arquivos, tipos mistos, e inclusão POSTERIOR (N documentos → 1 registro);
//   2. TODOS os métodos de entrada declarados em ATTACHMENT_ENTRY_METHODS — a tela não escolhe quais oferece;
//   3. leitura assistida com autopreenchimento para REVISÃO humana (transcreve fatos, não interpreta — RDC 657);
//   4. FONTE ÚNICA: um componente compartilhado que É o padrão; nenhuma tela reimplementa.
//
// POR QUE ESTE TESTE EXISTE, e não um documento: em 25/08 a política ANEXO-001 já estava escrita no core e
// tinha ZERO consumidores na aplicação — só o próprio teste dela. Cada tela havia inventado um subconjunto
// diferente (Exames tinha arrastar; Ômicas tinha câmera; Medicamentos/Recursos/Hábitos/Condições tinham voz;
// Receitas e atestados tinha só seleção de arquivo). Nenhuma implementava o conjunto completo.
//
// A lição: declarar o padrão não faz ninguém segui-lo. Pedir disciplina também não — a tela seguinte reinventa
// por omissão, não por discordância. O que funciona é tornar a divergência VISÍVEL e crescente-proibida.
//
// COMO ESTA GUARDA FUNCIONA — catraca: a lista abaixo é a dívida MEDIDA hoje. O teste passa com ela, falha se
// ela CRESCER. Cada tela migrada para o componente único sai da lista e não pode voltar. Quando a lista
// esvaziar, a regra passa a ser simplesmente "nenhum input de arquivo fora do componente".
//
// ─────────────────────────────────────────────────────────────────────────────
// ACHADO DE 27/08 — A LISTA NÃO É "TELAS PARA MIGRAR". LEIA ANTES DE MIGRAR QUALQUER UMA.
//
// Ao tentar zerar esta dívida, descobri que a plataforma tem DOIS componentes de captura, cada um se
// declarando o único, e que eles NÃO são equivalentes:
//
//   • `AnexoDocumento` (25/08)       → N ARQUIVOS separados. "Este componente É o padrão."
//   • `DocumentBundleCapture` (antes) → 1 DOCUMENTO de N PÁGINAS: junta imagens num PDF, com reordenação
//                                        antes do OCR. "Uma implementação, reutilizada em todo ponto."
//
// São capacidades DIFERENTES, e o princípio da fundadora pedia as duas ("adicionar mais páginas" E "vários
// arquivos"). Migrar Exames, CreateRecordMenu ou CaptureCenter para o `AnexoDocumento` DESTRUIRIA a junção de
// páginas — seria regressão, não convergência.
//
// Além disso, dois itens da lista (AgendarModal, habitos) têm modelo de dados de UMA url
// (`health_events.attachment_url`, `life_habits.plan_url`). Honrar "vários arquivos" ali exige movê-los para o
// domínio Documentos com vínculo — mudança arquitetural, não troca de componente. No caso do AgendarModal
// isso toca o caminho fiscal (Despesas, IR), com 25 referências a `attachment_url`.
//
// PORTANTO esta lista mistura três coisas distintas, e tratá-la como fila de migração produziria regressão:
//   (a) pontos que já entregam múltiplos, por OUTRO componente — Exames, CreateRecordMenu, CaptureCenter
//   (b) pontos cujo modelo guarda UMA url — AgendarModal, habitos
//   (c) pontos que fazem LEITURA para extrair dados, não anexo — medicamentos, recursos
//
// A decisão que falta é de arquitetura e é da fundadora: convergir os dois componentes em um que faça as duas
// coisas. Enquanto isso não se decide, esta catraca segue fazendo o que sabe fazer — impedir que a dívida
// cresça. Ela NÃO deve ser zerada tela a tela.
// ─────────────────────────────────────────────────────────────────────────────
import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { ATTACHMENT_ENTRY_METHODS, entryMethodsFor } from '@sintera/core'

const ROOT = process.cwd()

/**
 * DÍVIDA MEDIDA em 25/08/2026 — pontos que capturam anexo por conta própria. Esta lista só pode ENCOLHER.
 *
 * Eram ONZE em 25/08. Receitas e atestados JÁ MIGROU para o componente e saiu — restam dez.
 *
 * A contagem original que eu fiz à mão dizia SEIS: o grep olhava só `page.tsx` de primeiro nível e perdia as
 * rotas aninhadas e os componentes. A guarda varre a árvore inteira — é por isso que ela existe.
 */
const DIVIDA_ENTRADA_PROPRIA: readonly string[] = [
  'src/app/dashboard/exams/page.tsx',
  'src/app/dashboard/exams/[id]/page.tsx',
  'src/app/dashboard/habitos/page.tsx',
  'src/app/dashboard/medicamentos/page.tsx',
  'src/app/dashboard/omics/page.tsx',
  'src/app/dashboard/omics/[id]/page.tsx',
  'src/app/dashboard/recursos/page.tsx',
  'src/components/AgendarModal.tsx',
  'src/components/ui/CreateRecordMenu.tsx',
  'src/lib/capture/intake/CaptureCenter.tsx',
]

function arquivosTsx(dir: string, acc: string[] = []): string[] {
  for (const nome of readdirSync(dir)) {
    if (nome === 'node_modules' || nome === '.next' || nome.startsWith('.')) continue
    const caminho = join(dir, nome)
    if (statSync(caminho).isDirectory()) arquivosTsx(caminho, acc)
    else if (nome.endsWith('.tsx')) acc.push(caminho)
  }
  return acc
}

/**
 * O COMPONENTE COMPARTILHADO — o único lugar da Web onde um seletor de arquivo pode existir.
 * Não é exceção à regra: é a regra. Toda outra ocorrência é uma tela reimplementando o padrão.
 */
const COMPONENTE_UNICO = 'src/components/ui/AnexoDocumento.tsx'

/** Arquivos que abrem seletor de arquivo por conta própria, em vez de usar o componente compartilhado. */
function capturamPorContaPropria(): string[] {
  const base = join(ROOT, 'src')
  return arquivosTsx(base)
    .filter(f => /type="file"/.test(readFileSync(f, 'utf8')))
    .map(f => relative(ROOT, f).split('\\').join('/'))
    .filter(f => f !== COMPONENTE_UNICO)
    .sort()
}

describe('ANEXO-001 · a política declara o padrão', () => {
  it('declara os seis métodos de entrada — a tela não inventa os seus', () => {
    const declarados = ATTACHMENT_ENTRY_METHODS.map(m => m.method).sort()
    expect(declarados).toEqual(
      ['camera', 'drag_drop', 'file_select', 'multiple_files', 'multiple_images', 'voice'].sort(),
    )
  })

  it('a plataforma resolve o que vale por dispositivo — não a tela', () => {
    // Arrastar não existe no celular; câmera não existe na Web. Isso é fato do DISPOSITIVO, e por isso
    // mora na política — se cada tela decidisse, cada uma decidiria diferente.
    expect(entryMethodsFor('web')).toContain('drag_drop')
    expect(entryMethodsFor('web')).not.toContain('camera')
    expect(entryMethodsFor('mobile')).toContain('camera')
    expect(entryMethodsFor('mobile')).not.toContain('drag_drop')
    // Voz vale nos dois — é entrada de CONTEÚDO, não de arquivo.
    expect(entryMethodsFor('web')).toContain('voice')
    expect(entryMethodsFor('mobile')).toContain('voice')
  })
})

describe('ANEXO-001 · catraca da fonte única', () => {
  it('nenhuma tela NOVA captura anexo por conta própria', () => {
    const atuais = capturamPorContaPropria()
    const novas = atuais.filter(f => !DIVIDA_ENTRADA_PROPRIA.includes(f))

    expect(
      novas,
      `\nEntrada de documento fora do componente compartilhado (ANEXO-001):\n` +
        novas.map(f => `  ${f}`).join('\n') +
        `\n\nToda entrada de documento vem de FONTE ÚNICA — use o componente compartilhado, que já entrega\n` +
        `múltiplos arquivos, inclusão posterior, todos os métodos do dispositivo e leitura assistida.\n` +
        `Um <input type="file"> solto entrega menos do que a plataforma promete, e diverge em silêncio.\n`,
    ).toEqual([])
  })

  it('a dívida registrada só encolhe — telas migradas não voltam', () => {
    const atuais = capturamPorContaPropria()
    const jaMigradas = DIVIDA_ENTRADA_PROPRIA.filter(f => !atuais.includes(f))
    // Este teste não falha quando algo migra: ele documenta o progresso e trava a volta.
    // Se uma tela migrada reintroduzir captura própria, ela reaparece em `atuais` e o teste acima acusa.
    expect(jaMigradas.every(f => !atuais.includes(f))).toBe(true)
  })
})
