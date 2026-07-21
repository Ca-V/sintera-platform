// @sintera/design-system — MONTAGEM DE TEMA (Passo 3B · Etapa 1 · Subitem 6/7)
// Camada semântica de ALTO NÍVEL: compõe todos os papéis em um único objeto por modo (light/dark).
// É o que um ThemeProvider (Web) ou o contexto de tema (Mobile) consome. SSOT única, Web = Mobile.
import { roles, type ColorRoles, type Theme } from './tokens/color'
import { typeRole, measure, type TypeRoles } from './tokens/typography'
import { spacing, padding, density } from './tokens/spacing'
import { radius, border, opacity, elevation, type Shadow, type ElevationLevel } from './tokens/elevation'
import { motion } from './tokens/motion'
import { breakpoint, grid, zIndex } from './tokens/layout'

export interface SinteraTheme {
  mode: Theme
  color: ColorRoles
  elevation: Record<ElevationLevel, Shadow>
  typography: TypeRoles
  measure: typeof measure
  spacing: typeof spacing
  padding: typeof padding
  density: typeof density
  radius: typeof radius
  border: typeof border
  opacity: typeof opacity
  motion: typeof motion
  layout: { breakpoint: typeof breakpoint; grid: typeof grid; zIndex: typeof zIndex }
}

function build(mode: Theme): SinteraTheme {
  return {
    mode,
    color: roles[mode],
    elevation: elevation[mode],
    typography: typeRole,
    measure,
    spacing,
    padding,
    density,
    radius,
    border,
    opacity,
    motion,
    layout: { breakpoint, grid, zIndex },
  }
}

export const themes: Record<Theme, SinteraTheme> = { light: build('light'), dark: build('dark') }

/** Retorna o tema montado para o modo. Ponto único de consumo pelos componentes. */
export function getTheme(mode: Theme): SinteraTheme {
  return themes[mode]
}
