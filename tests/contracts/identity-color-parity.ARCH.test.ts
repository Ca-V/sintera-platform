// ARCH — PARIDADE DE IDENTIDADE CROMÁTICA: Web ⇄ Design System (SSOT única web+mobile).
// Diretriz da fundadora (2026-07-21): identidade de cor ÚNICA, equilibrada e homogênea entre Web e Mobile;
// NENHUMA plataforma define o Design System — o DS é a fonte da verdade. O Mobile já consome os tokens do DS
// (getTheme). A Web, por limitação do Tailwind v4 (@theme é CSS, não importa TS), declara as variáveis em
// globals.css. Este contrato PRENDE essas variáveis aos tokens do DS: se divergirem, falha. Assim toda mudança
// de cor nasce no DS (packages/design-system) e se propaga homogênea — a Web nunca vira dono paralelo da cor.
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, it, expect } from 'vitest'
import { primary, neutral, feedback } from '../../packages/design-system/src'

// Mapa: variável --color-* do globals.css → token CANÔNICO do DS (modo light, o tema da Web hoje).
// Cada entrada afirma "esta cor da Web É este papel/degrau do DS", não um hex solto.
const WEB_TO_DS: Record<string, string> = {
  // Rampa primária A·E
  'lagoa':       primary.light[500], // âncora / identidade
  'petal':       primary.light[700], // ação (AA c/ branco)
  'petal-dark':  primary.light[800],
  'panel':       primary.light[800],
  'deep':        primary.light[900],
  'petal-light': primary.light[100],
  'blush':       primary.light[100],
  'mist':        primary.light[100],
  // Neutros quentes (Almond Blossom)
  'cream':       neutral.light.bg,
  'surface':     neutral.light.surface,
  'ivory':       neutral.light.surfaceAlt,
  'warm':        neutral.light.surfaceAlt,
  'onyx':        neutral.light.ink,
  'mauve':       neutral.light.muted,
  'border':      neutral.light.line,
  // Semânticas com família própria
  'sage':          feedback.light.success.fill,
  'sage-light':    feedback.light.success.soft,
  'gold':          feedback.light.attention.fill,
  'lavender':      feedback.light.error.fill,
  'lavender-light':feedback.light.error.soft,
}

function readThemeColors(): Record<string, string> {
  const css = readFileSync(fileURLToPath(new URL('../../src/app/globals.css', import.meta.url)), 'utf8')
  const out: Record<string, string> = {}
  // Captura apenas as declarações `--color-NAME: #HEX;` (bloco @theme).
  const re = /--color-([a-z0-9-]+):\s*(#[0-9a-fA-F]{6})\b/g
  let m: RegExpExecArray | null
  while ((m = re.exec(css)) !== null) out[m[1]] = m[2].toUpperCase()
  return out
}

describe('ARCH · identidade cromática — Web ⇄ Design System (SSOT)', () => {
  const webColors = readThemeColors()

  it('todas as variáveis institucionais da Web coincidem com o token do DS', () => {
    const mismatches: string[] = []
    for (const [webVar, dsHex] of Object.entries(WEB_TO_DS)) {
      const webHex = webColors[webVar]
      if (!webHex) { mismatches.push(`--color-${webVar} ausente no globals.css`); continue }
      if (webHex !== dsHex.toUpperCase()) mismatches.push(`--color-${webVar}=${webHex} ≠ DS ${dsHex.toUpperCase()}`)
    }
    expect(mismatches, mismatches.join(' · ')).toEqual([])
  })

  it('a âncora A·E (#579DA8) e a ação (#3D6C7B) são as mesmas em Web e DS', () => {
    expect(webColors['lagoa']).toBe(primary.light[500].toUpperCase())
    expect(webColors['petal']).toBe(primary.light[700].toUpperCase())
  })
})
