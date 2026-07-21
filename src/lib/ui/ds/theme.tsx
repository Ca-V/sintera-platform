'use client'
// Adaptador Web — provedor de tema do DS-002. Fornece o SinteraTheme (papéis) via contexto.
// O app hoje é light-only; o modo já é parametrizável para quando o dark entrar.
import { createContext, useContext, type ReactNode } from 'react'
import { getTheme, type SinteraTheme, type Theme } from '@sintera/design-system'

const DsContext = createContext<SinteraTheme>(getTheme('light'))

export function DsThemeProvider({ mode = 'light', children }: { mode?: Theme; children: ReactNode }) {
  return <DsContext.Provider value={getTheme(mode)}>{children}</DsContext.Provider>
}

export function useDs(): SinteraTheme {
  return useContext(DsContext)
}
