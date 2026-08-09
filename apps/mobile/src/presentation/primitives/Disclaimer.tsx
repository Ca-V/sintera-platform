// Aviso regulatório (RDC 657) — primitivo ÚNICO. O texto vem SEMPRE do core (DISCLAIMERS, PS-3); as telas param
// de redigir o próprio aviso à mão. Paridade com o <Disclaimer> Web: mesma copy canônica, uma variante por
// contexto factual. Sem regra de negócio (DS-003).
import { text } from '@sintera/design-system'
import { DISCLAIMERS, type DisclaimerVariant } from '@sintera/core'
import { Text } from './Text'
import { useTheme } from '../theme'

export function Disclaimer({ variant = 'geral' }: { variant?: DisclaimerVariant }) {
  const t = useTheme()
  return <Text spec={text(t, { role: 'caption', tone: 'faint' })}>{DISCLAIMERS[variant]}</Text>
}
