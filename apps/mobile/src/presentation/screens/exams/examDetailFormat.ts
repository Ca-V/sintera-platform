// Helpers de APRESENTAÇÃO do detalhe do exame (mobile) — mapeiam a situação semântica (core) para cores do DS
// e formatam textos. Sem regra de negócio (isso vive no @sintera/core). Cada plataforma escolhe suas cores.
import type { SinteraTheme } from '@sintera/design-system'
import type { BiomarkerStatus } from '@sintera/core'

/** Cor do texto de status do resultado — mesma semântica da Web (acima→atenção, abaixo→info, dentro→sucesso). */
export function statusColor(t: SinteraTheme, s: BiomarkerStatus): string {
  switch (s) {
    case 'above':  return t.color.badge.attention.text
    case 'below':  return t.color.badge.info.text
    case 'within': return t.color.badge.success.text
    case 'failed': return t.color.badge.error.text
    default:       return t.color.text.muted
  }
}

/** Fundo suave para o chip de status (quando fora da faixa). null = sem realce. */
export function statusSoft(t: SinteraTheme, s: BiomarkerStatus): string | null {
  switch (s) {
    case 'above':  return t.color.badge.attention.soft
    case 'below':  return t.color.badge.info.soft
    case 'within': return t.color.badge.success.soft
    default:       return null
  }
}
