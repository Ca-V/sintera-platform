// Contrato dos primitivos RN Switch/Avatar (verificação ESTÁTICA — render de RN não roda neste harness).
// Garante que os primitivos CONSOMEM as recipes do DS (não improvisam estilo) — princípio DS→RN.
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const PRIM = resolve(process.cwd(), 'apps/mobile/src/presentation/primitives')
const read = (f: string) => readFileSync(resolve(PRIM, f), 'utf-8')
/** Remove comentários de linha e de bloco — a análise de "sem regra de domínio" deve olhar o CÓDIGO, não a doc. */
const stripComments = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '')

describe('Primitivos DS→RN — Switch e Avatar consomem as recipes do DS', () => {
  it('Switch consome a recipe `toggle` e usa o Switch nativo do RN (sem cor hardcoded)', () => {
    const src = read('Switch.tsx')
    expect(src).toMatch(/import\s*\{\s*toggle\s*\}\s*from\s*'@sintera\/design-system'/)
    expect(src).toMatch(/RNSwitch/) // usa o Switch nativo (aliased)
    expect(src).toMatch(/spec\.trackOn|spec\.trackOff|spec\.thumb/) // cores vêm da recipe
    expect(src, 'sem cor hex hardcoded no primitivo').not.toMatch(/#[0-9a-fA-F]{3,6}/)
  })

  it('Avatar consome a recipe `avatar` e trata uri (imagem) e fallback (iniciais)', () => {
    const src = read('Avatar.tsx')
    expect(src).toMatch(/import\s*\{\s*avatar\s*\}\s*from\s*'@sintera\/design-system'/)
    expect(src).toMatch(/<Image/) // exibe a imagem quando há uri
    expect(src).toMatch(/initials/) // fallback com iniciais
    expect(src, 'sem cor hex hardcoded no primitivo').not.toMatch(/#[0-9a-fA-F]{3,6}/)
  })

  it('FieldRow consome a recipe `field`, recebe o controle por composição e NÃO carrega regra de domínio', () => {
    const src = read('FieldRow.tsx')
    expect(src).toMatch(/import\s*\{\s*field\s*\}\s*from\s*'@sintera\/design-system'/)
    expect(src).toMatch(/children/) // o controle vem por composição (não conhece Input/Switch)
    expect(src, 'sem cor hex hardcoded no primitivo').not.toMatch(/#[0-9a-fA-F]{3,6}/)
    // Condição da fundadora: infra de DS "burra" — sem validação/máscara/API/formulário/ProfileDTO/domínio.
    // Olha o CÓDIGO (sem comentários): a própria doc menciona "ProfileDTO" para dizer que NÃO o conhece.
    expect(stripComments(src), 'FieldRow não conhece o domínio Perfil').not.toMatch(/ProfileDTO|api-client|@sintera\/validation|updateProfile|getProfile/)
  })

  it('o barrel de primitivos exporta Switch, Avatar e FieldRow', () => {
    const idx = read('index.ts')
    expect(idx).toMatch(/export \{ Switch \}/)
    expect(idx).toMatch(/export \{ Avatar \}/)
    expect(idx).toMatch(/export \{ FieldRow \}/)
  })
})
