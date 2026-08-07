// Mapa Mobile de RegistrationDestination (domínio, do core) → destino de navegação (aba + tela). É a contraparte
// do WEB_HREF da Web: a INTENÇÃO/taxonomia vive no core (SSOT único); cada plataforma só mapeia a apresentação.
import type { RegistrationDestination } from '@sintera/core'

export type MobileNavTarget = { tab: string; screen?: string; params?: unknown }

export const REGISTRATION_NAV: Record<RegistrationDestination, MobileNavTarget> = {
  omics:              { tab: 'MinhaSaude', screen: 'OmicsList' },
  medications:        { tab: 'MinhaSaude', screen: 'Medications', params: { supplements: false } },
  supplements:        { tab: 'MinhaSaude', screen: 'Medications', params: { supplements: true } },
  resources:          { tab: 'MinhaSaude', screen: 'Resources' },
  'resources-vision': { tab: 'MinhaSaude', screen: 'Resources' },
  consulta:           { tab: 'Agenda', screen: 'EventForm', params: { prefill: { type: 'consulta' } } },
  conditions:         { tab: 'MinhaSaude', screen: 'Conditions' },
  body:               { tab: 'MinhaSaude', screen: 'Composicao' },
  habits:             { tab: 'MinhaSaude', screen: 'Habits' },
  expenses:           { tab: 'Mais', screen: 'Despesas' },
}
