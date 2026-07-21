// CODE GENERATOR (Web) — produz o CSS de identidade a partir dos tokens do Design System.
// Cadeia: packages/design-system → tokens → theme → [ESTE gerador] → src/app/theme.generated.css → globals.css (@import).
//
// REGRA ARQUITETURAL (fundadora 2026-07-21): `theme.generated.css` é ARTEFATO DE BUILD, não fonte de verdade.
// Não editar à mão; regenerar quando os tokens mudarem. A identidade vive SÓ no DS; a Web apenas TRADUZ.
// Se mudar a identidade exigir editar o globals.css, a arquitetura está errada — a alteração ocorre no DS.
//
// Cobertura: cores · gradientes · sombras · radius · spacing · tipografia · z-index · durations · easings
// (pipeline ÚNICO de geração, mesmo que nem todo token seja consumido de imediato). O Mobile consome os MESMOS
// tokens diretamente (getTheme), sem passar por este CSS.
import {
  primary, neutral, feedback,
  gradient, shadow,
  radius, radiusScale, border, space, spacing, padding,
  zIndex, duration, easing,
  fontFamily, fontSize, fontWeight, lineHeight, letterSpacing, fontFeature,
} from '@sintera/design-system'
import { toCSSGradient, toCSSBoxShadow } from './css'

const kebab = (s: string) => s.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()
const line = (name: string, value: string | number) => `  --${name}: ${value};`

// Mapa das variáveis de COR da Web → token do DS (modo light). Nomes preservados (as utilitárias Tailwind dependem deles).
const COLOR_VARS: Record<string, string> = {
  'petal': primary.light[700], 'petal-light': primary.light[100], 'petal-dark': primary.light[800],
  'blush': primary.light[100], 'mist': primary.light[100], 'lagoa': primary.light[500],
  'deep': primary.light[900], 'panel': primary.light[800],
  'cream': neutral.light.bg, 'surface': neutral.light.surface, 'ivory': neutral.light.surfaceAlt,
  'warm': neutral.light.surfaceAlt, 'onyx': neutral.light.ink, 'mauve': neutral.light.muted,
  'border': neutral.light.line, 'brown': neutral.light.detail,
  'sage': feedback.light.success.fill, 'sage-light': feedback.light.success.soft,
  'gold': feedback.light.attention.fill,
  'lavender': feedback.light.error.fill, 'lavender-light': feedback.light.error.soft,
}

// Classes utilitárias de gradiente (nomes históricos preservados p/ consumo dos componentes) → token do DS.
const GRADIENT_CLASSES: Record<string, keyof typeof gradient> = {
  'gradient-sintera': 'action', 'gradient-aqua': 'brand', 'gradient-sintera-soft': 'surfaceSoft',
  'gradient-subtle': 'surface', 'gradient-dark': 'dark', 'gradient-hero': 'hero',
  'gradient-card-dark': 'cardDark', 'gradient-energy': 'energy', 'gradient-sleep': 'sleep',
  'gradient-cycle': 'cycle', 'gradient-hydration': 'hydration',
}

/** Gera o conteúdo completo de `src/app/theme.generated.css`. Determinístico (mesmos tokens → mesmo arquivo). */
export function generateThemeCss(): string {
  const header = [
    '/* ============================================================================',
    ' * ARQUIVO GERADO AUTOMATICAMENTE — NÃO EDITAR À MÃO.',
    ' * Fonte: packages/design-system (tokens) → src/lib/ui/ds/generateThemeCss.ts.',
    ' * Regenerar: WRITE_GENERATED=1 vitest run tests/contracts/theme-generated-css.ARCH.test.ts',
    ' * A identidade vive no Design System; este CSS é apenas a TRADUÇÃO para a Web.',
    ' * ==========================================================================*/',
  ].join('\n')

  // @theme — cores (o Tailwind gera as utilitárias bg-*/text-*/border-* a partir daqui).
  const themeColors = ['@theme {', ...Object.entries(COLOR_VARS).map(([n, v]) => line(`color-${n}`, v)), '}'].join('\n')

  // :root — todos os demais tokens como custom properties (consumo direto/inline).
  const gradientVars = Object.keys(gradient).map((g) => line(`gradient-${kebab(g)}`, toCSSGradient(gradient[g as keyof typeof gradient])))
  const shadowVars = (Object.keys(shadow.light) as (keyof typeof shadow.light)[]).map((r) => line(`shadow-${kebab(r)}`, toCSSBoxShadow(shadow.light[r])))
  const radiusVars = [
    ...Object.entries(radius).map(([n, v]) => line(`radius-${kebab(n)}`, `${v}px`)),
    ...Object.entries(radiusScale).map(([n, v]) => line(`radius-scale-${n}`, `${v}px`)),
    line('border-hairline', `${border.hairline}px`), line('border-strong', `${border.strong}px`),
  ]
  const spaceVars = [
    ...Object.entries(space).map(([n, v]) => line(`space-${n}`, `${v}px`)),
    ...Object.entries(spacing).map(([n, v]) => line(`space-${kebab(n)}`, `${v}px`)),
    ...Object.entries(padding).map(([n, v]) => line(`padding-${kebab(n)}`, `${v}px`)),
  ]
  const typographyVars = [
    ...Object.entries(fontFamily).map(([n, v]) => line(`font-family-${n}`, v)),
    ...Object.entries(fontSize).map(([n, v]) => line(`font-size-${n}`, `${v}px`)),
    ...Object.entries(fontWeight).map(([n, v]) => line(`font-weight-${n}`, v)),
    ...Object.entries(lineHeight).map(([n, v]) => line(`line-height-${n}`, v)),
    ...Object.entries(letterSpacing).map(([n, v]) => line(`letter-spacing-${n}`, v)),
    line('font-feature-tabular', fontFeature.tabularNumbers),
  ]
  const zVars = Object.entries(zIndex).map(([n, v]) => line(`z-${n}`, v))
  const durationVars = Object.entries(duration).map(([n, v]) => line(`duration-${n}`, `${v}ms`))
  const easingVars = Object.entries(easing).map(([n, v]) => line(`ease-${kebab(n)}`, v))

  const root = [
    ':root {',
    '  /* gradientes */', ...gradientVars,
    '  /* sombras */', ...shadowVars,
    '  /* radius / borda */', ...radiusVars,
    '  /* espaçamento */', ...spaceVars,
    '  /* tipografia */', ...typographyVars,
    '  /* z-index */', ...zVars,
    '  /* durations */', ...durationVars,
    '  /* easings */', ...easingVars,
    '}',
  ].join('\n')

  // Classes utilitárias de gradiente (background) — nomes preservados.
  const gradientClasses = Object.entries(GRADIENT_CLASSES)
    .map(([cls, tok]) => `.${cls} { background: var(--gradient-${kebab(tok as string)}); }`)
    .join('\n')

  // Classe do CARTÃO (superfície premium) — o container base do DS-002 na Web. Em @layer components para que
  // utilitárias de override (bg-*/border-*) SEMPRE vençam (tints de destaque). Consome os tokens do DS.
  const cardClass = [
    '@layer components {',
    '  .ds-card {',
    '    background: var(--color-surface);',
    '    border: 1px solid color-mix(in srgb, var(--color-onyx) 5%, transparent);',
    '    border-radius: var(--radius-card);',
    '    box-shadow: var(--shadow-card);',
    '    transition: box-shadow 0.3s ease, transform 0.3s ease;',
    '  }',
    '  .ds-card:hover { box-shadow: var(--shadow-card-hover); transform: translateY(-1px); }',
    '}',
  ].join('\n')

  return [header, '', themeColors, '', root, '', '/* Utilitárias de gradiente (nomes históricos) */', gradientClasses, '', cardClass, ''].join('\n')
}
