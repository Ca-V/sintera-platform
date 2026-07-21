// @sintera/design-system — TEMPLATES (Passo 3B · Etapa 5).
// Um template é a COMPOSIÇÃO (headless) de recipes numa página. Define as decisões de layout compartilhadas
// (fundo, largura de conteúdo, respiro, ritmo entre seções e a ordem semântica das regiões). O arranjo concreto
// fica no adaptador de plataforma, que compõe as recipes de domínio nas regiões. Nenhuma decisão de design no adaptador.
import type { SinteraTheme } from '../theme'
import { contentMaxWidth } from '../composition'

export type TemplateKind =
  | 'dashboard' | 'timeline' | 'examResult' | 'longitudinal' | 'agenda' | 'profile' | 'settings'

export interface TemplateLayout {
  background: string
  maxWidth: number   // largura máxima do conteúdo (web); no mobile o contêiner ocupa 100%
  paddingX: number
  paddingY: number
  sectionGap: number
  regions: string[]  // ordem semântica das regiões — cada uma preenchida por recipes
}

const REGIONS: Record<TemplateKind, string[]> = {
  dashboard: ['header', 'indicators', 'timelinePreview', 'biomarkers'],
  timeline: ['header', 'filters', 'timeline'],
  examResult: ['header', 'documentCard', 'laboratoryTable'],
  longitudinal: ['header', 'longitudinalChart', 'biomarkers'],
  agenda: ['header', 'upcoming', 'timeline'],
  profile: ['header', 'identity', 'connections'],
  settings: ['header', 'preferences', 'notifications'],
}

export function template(t: SinteraTheme, kind: TemplateKind): TemplateLayout {
  return {
    background: t.color.surface.app,
    maxWidth: contentMaxWidth,
    paddingX: t.spacing.page,
    paddingY: t.spacing.section,
    sectionGap: t.spacing.section,
    regions: REGIONS[kind],
  }
}

export const templateKinds = Object.keys(REGIONS) as TemplateKind[]
