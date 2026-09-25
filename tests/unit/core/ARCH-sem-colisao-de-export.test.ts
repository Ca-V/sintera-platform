// ARCH — dois módulos do core não podem exportar o mesmo nome.
//
// POR QUE ESTE TESTE EXISTE. Aconteceu duas vezes em dois dias, e as duas passaram em silêncio:
//
//   · `ESCOPO_PADRAO` era o perfil de assinatura ('pessoal') no billing e a lista de módulos do vínculo no
//     CARE-003. Quem importava recebia uma string onde esperava array.
//   · `respostaPermitida` e `motivoRespostaInvalida` eram o convite e a proposta de documento. A máquina de
//     estados de um respondia pela do outro.
//
// O índice do core usa `export *`. Quando dois módulos exportam o mesmo nome, o TypeScript NÃO acusa: o
// último vence, silenciosamente. Nos dois casos só um teste revelou — e num caso o sintoma foi uma catraca de
// segurança testando a máquina de estados errada, que é o pior lugar possível para um engano assim.
//
// Este teste lê os `export *` do índice, coleta o que cada módulo exporta, e falha quando um nome aparece em
// dois arquivos.

import { describe, it, expect } from 'vitest'
import { readFileSync, existsSync } from 'node:fs'
import { join, dirname, resolve } from 'node:path'

const INDICE = join(process.cwd(), 'packages', 'core', 'src', 'index.ts')

/** Nomes exportados por um arquivo: `export function|const|class|type|interface|enum X`. */
function exportadosDe(arquivo: string): string[] {
  const src = readFileSync(arquivo, 'utf8')
  const nomes: string[] = []
  const re = /^export\s+(?:declare\s+)?(?:async\s+)?(?:function|const|let|class|abstract\s+class|type|interface|enum)\s+([A-Za-z_$][\w$]*)/gm
  let m: RegExpExecArray | null
  while ((m = re.exec(src))) nomes.push(m[1])
  return nomes
}

describe('core · nenhum nome exportado colide entre módulos', () => {
  it('cada nome público vem de um arquivo só', () => {
    const indice = readFileSync(INDICE, 'utf8')
    const base = dirname(INDICE)

    const dono = new Map<string, string>()
    const colisoes: string[] = []

    for (const m of indice.matchAll(/^export\s+\*\s+from\s+['"](\.[^'"]+)['"]/gm)) {
      const rel = m[1]
      const caminho = ['.ts', '/index.ts'].map(ext => resolve(base, rel + ext)).find(existsSync)
      if (!caminho) continue
      for (const nome of exportadosDe(caminho)) {
        const anterior = dono.get(nome)
        if (anterior && anterior !== caminho) {
          colisoes.push(`${nome}: ${rel} e ${anterior.split(/[\\/]/).slice(-2).join('/')}`)
        } else {
          dono.set(nome, caminho)
        }
      }
    }

    expect(
      colisoes,
      `Dois módulos do core exportam o mesmo nome. Com \`export *\` o último vence em silêncio — ` +
      `renomeie um deles para algo específico do domínio. Colisões: ${colisoes.join(' · ')}`,
    ).toEqual([])
  })

  it('o teste enxerga o índice de verdade — senão passaria vazio e não protegeria nada', () => {
    const indice = readFileSync(INDICE, 'utf8')
    const reexports = [...indice.matchAll(/^export\s+\*\s+from\s+['"](\.[^'"]+)['"]/gm)]
    expect(reexports.length, 'nenhum `export *` encontrado no índice do core').toBeGreaterThan(20)
  })
})
