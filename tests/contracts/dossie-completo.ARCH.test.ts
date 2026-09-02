// CATRACA — O QUE ELA SELECIONA É O QUE O PROFISSIONAL RECEBE.
//
// ─────────────────────────────────────────────────────────────────────────────────────────────────────────
// REGRA DA FUNDADORA (02/09/2026), e ela é PERMANENTE:
//
//   "É fundamental e obrigatório que sempre que entrar uma nova categoria ou função na plataforma, ou então
//    em alteração em alguma, que você faça um levantamento de tudo o que essa nova alteração ou adição está
//    vinculado na plataforma — e faça as devidas alterações em toda a plataforma."
//
// Esta catraca é esse levantamento, feito por máquina, para uma superfície específica: o DOSSIÊ.
//
// ─────────────────────────────────────────────────────────────────────────────────────────────────────────
// O QUE ELA PEGOU NA PRIMEIRA EXECUÇÃO (01–02/09/2026)
//
// O dossiê é o carro-chefe da plataforma, e tem TRÊS implementações independentes:
//   · `@sintera/core` (assembleReport) — consumida pelo aplicativo
//   · `/dashboard/relatorio` — a tela da Web, própria
//   · `/r/[token]` — o que o PROFISSIONAL abre pelo link, também própria
//
// Estavam faltando:
//   · `documentos` (receitas e atestados) — ausente nas TRÊS. O medicamento aparecia porque ela o cadastrou;
//     a receita que o prescreveu, não. O atestado não aparecia em lugar nenhum.
//   · `histexames` (evolução dos indicadores) — ausente no link compartilhado, que é onde mais serve.
//   · `registros` (histórico de saúde) — ausente no link; consultas JÁ REALIZADAS chegavam ao profissional
//     rotuladas como "Agenda", isto é, como compromisso futuro.
//
// Em todos os casos a seção existia para ela MARCAR na tela de seleção. Ela marcava, compartilhava, e o
// profissional recebia menos do que ela pensava ter enviado — sem aviso nenhum.
// ─────────────────────────────────────────────────────────────────────────────────────────────────────────
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { resolve } from 'path'
import { REPORT_SECTIONS, REPORT_GROUPS, defaultSections } from '@sintera/core'

const raiz = resolve(__dirname, '../..')
const ler = (p: string) => readFileSync(resolve(raiz, p), 'utf8')

/** Seções cobertas por outro bloco, com o motivo — e o motivo é conferível lendo o arquivo. */
const COBERTAS_POR_OUTRO_BLOCO: Record<string, { arquivo: string; dentroDe: string }> = {
  // Medicamentos e suplementos saem da MESMA tabela (`medications.kind`) e são renderizados pelo mesmo bloco,
  // que verifica as duas chaves explicitamente.
  suplementos: { arquivo: 'src/app/r/[token]/page.tsx', dentroDe: "allowed.includes('suplementos')" },
}

describe('o dossiê entrega tudo o que a pessoa pode selecionar', () => {
  it('a tela da Web renderiza TODAS as seções selecionáveis', () => {
    const web = ler('src/app/dashboard/relatorio/page.tsx')
    const ausentes = REPORT_SECTIONS.filter(s => !web.includes(`sections.${s}`))
    expect(ausentes, `sem render na Web: ${ausentes.join(', ')}`).toEqual([])
  })

  it('O LINK COMPARTILHADO renderiza TODAS — é o que o profissional realmente lê', () => {
    // A superfície mais importante e a que estava mais atrás: três seções faltavam aqui.
    const share = ler('src/app/r/[token]/page.tsx')
    const ausentes = REPORT_SECTIONS.filter(s => {
      if (share.includes(`show('${s}')`)) return false
      const alt = COBERTAS_POR_OUTRO_BLOCO[s]
      return !(alt && share.includes(alt.dentroDe))
    })
    expect(ausentes, `sem render no link compartilhado: ${ausentes.join(', ')}`).toEqual([])
  })

  it('o núcleo produz uma linha para CADA seção — nenhuma fica sem projeção', () => {
    const core = ler('packages/core/src/domain/report/assemble.ts')
    const bloco = core.slice(core.indexOf('const sectionLines'), core.indexOf('const groups: ReportGroupOut[]'))
    const ausentes = REPORT_SECTIONS.filter(s => !new RegExp(`^\\s{4}${s}:`, 'm').test(bloco))
    expect(ausentes, `sem linha no núcleo: ${ausentes.join(', ')}`).toEqual([])
  })

  it('o aplicativo ALIMENTA o núcleo com todos os domínios que o modelo exige', () => {
    // Uma seção existir no núcleo e a tela não carregar o dado é "escrito e nunca ligado" — o defeito que
    // deixou `documentos` fora do dossiê enquanto a seção já existia.
    const tela = ler('apps/mobile/src/presentation/screens/relatorio/RelatorioScreen.tsx')
    const core = ler('packages/core/src/domain/report/assemble.ts')
    const campos = [...core.slice(core.indexOf('export interface ReportData'), core.indexOf('// ── Seleção'))
      .matchAll(/^\s{2}([a-zA-Z]+)[?]?:/gm)].map(m => m[1])
    // Aceita as DUAS formas de alimentar: `campo: valor` e o atalho do JavaScript, `campo,`. Exigir só a
    // primeira acusaria `events`, `eyewear` e `heightCm`, que são passados por atalho e estão corretos.
    const ausentes = campos.filter(c => !new RegExp(`\\b${c}\\s*[,:]`).test(tela))
    expect(ausentes, `ReportData sem alimentação no aplicativo: ${ausentes.join(', ')}`).toEqual([])
  })
})

describe('a seleção não perde seção pelo caminho', () => {
  it('toda seção declarada aparece na ÁRVORE que a pessoa marca', () => {
    // Uma seção fora de REPORT_GROUPS existe no modelo e é invisível na tela de seleção: ela nunca poderia
    // ser marcada, e o dado nunca chegaria ao profissional.
    const nosGrupos = REPORT_GROUPS.flatMap(g => g.items.map(i => i.key))
    const ausentes = REPORT_SECTIONS.filter(s => !nosGrupos.includes(s))
    expect(ausentes, `fora da árvore de seleção: ${ausentes.join(', ')}`).toEqual([])
  })

  it('o padrão marca TODAS — quem não escolhe nada leva o dossiê inteiro', () => {
    const padrao = defaultSections()
    for (const s of REPORT_SECTIONS) expect(padrao[s], s).toBe(true)
  })

  it('PERFIL SALVO ANTES de uma seção nova não a esconde para sempre', () => {
    // ARMADILHA REAL: `report_templates.selection` guarda o objeto de seleção da ÉPOCA em que foi salvo. Um
    // perfil salvo antes de `documentos` existir não tem essa chave. Se a aplicação SUBSTITUÍSSE o estado,
    // `sections.documentos` viria `undefined` — falso — para sempre, e a pessoa nunca entenderia por quê.
    //
    // A proteção é aplicar o perfil MESCLANDO sobre o estado atual, que parte de `defaultSections()` (tudo
    // marcado). Aqui se verifica o CÓDIGO das duas pontas, não uma simulação — simular provaria só que a
    // minha aritmética está certa.
    const aplicaMesclando = /setSections\(s => \(\{ \.\.\.s, \.\.\./
    for (const arq of [
      'src/app/dashboard/relatorio/page.tsx',
      'apps/mobile/src/presentation/screens/relatorio/RelatorioScreen.tsx',
    ]) {
      expect(aplicaMesclando.test(ler(arq)), `${arq} precisa MESCLAR o perfil salvo sobre o padrão`).toBe(true)
    }
    // E o padrão precisa marcar a seção nova, senão a mescla não adianta.
    expect(defaultSections().documentos).toBe(true)
  })
})
