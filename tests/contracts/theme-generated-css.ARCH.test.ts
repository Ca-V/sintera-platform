// ARCH — DRIFT-GUARD do artefato gerado `src/app/theme.generated.css`.
// O arquivo é GERADO a partir dos tokens do DS (src/lib/ui/ds/generateThemeCss.ts). Este contrato garante que
// o arquivo COMMITADO está em sincronia com os tokens — se alguém editar o CSS à mão ou mudar um token sem
// regenerar, a suíte falha. Regenerar: `WRITE_GENERATED=1 vitest run tests/contracts/theme-generated-css.ARCH.test.ts`.
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, it, expect } from 'vitest'
import { generateThemeCss } from '../../src/lib/ui/ds/generateThemeCss'

const OUT = fileURLToPath(new URL('../../src/app/theme.generated.css', import.meta.url))

describe('ARCH · artefato gerado — theme.generated.css em sincronia com o DS', () => {
  const expected = generateThemeCss()

  // Modo geração: WRITE_GENERATED=1 reescreve o arquivo (parte do pipeline de geração).
  if (process.env.WRITE_GENERATED) {
    it('(re)gera o arquivo', () => {
      writeFileSync(OUT, expected, 'utf8')
      expect(readFileSync(OUT, 'utf8')).toBe(expected)
    })
    return
  }

  it('o arquivo commitado está sincronizado com os tokens do DS', () => {
    const actual = readFileSync(OUT, 'utf8')
    expect(actual, 'theme.generated.css desatualizado — rode WRITE_GENERATED=1 para regenerar').toBe(expected)
  })

  it('tem cabeçalho de "arquivo gerado" e não deve ser editado à mão', () => {
    expect(expected).toContain('ARQUIVO GERADO AUTOMATICAMENTE')
    expect(expected).toContain('@theme {')
    expect(expected).toContain('--color-petal:')
    expect(expected).toContain('--gradient-signature:')
    expect(expected).toContain('--shadow-card:')
  })
})
