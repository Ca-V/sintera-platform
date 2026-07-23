// Mobile — acesso ao tema do DS (SSOT). Incremento 1: modo claro (dark = incremento futuro).
import { getTheme, type Theme } from '@sintera/design-system'

export const themeMode: Theme = 'light'
export function useTheme() {
  return getTheme(themeMode)
}
