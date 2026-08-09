// AttachmentLink (R-ATTACH) — afordância ÚNICA para ABRIR um documento anexado (laudo/PDF/nota). Paridade com o
// AttachmentLink Web: mesmo comportamento e rótulos; só a apresentação adapta. Duas formas (como na Web):
//  • 'primary'  → botão nativo (ex.: "Abrir documento original"); sem URL mostra o estado ausente;
//  • 'inline'   → link de texto discreto ("{label} →") para chips de anexo em listas; sem URL não renderiza nada.
// Sem regra de negócio (DS-003).
import { Linking, Pressable } from 'react-native'
import { text } from '@sintera/design-system'
import { Button } from './Button'
import { Text } from './Text'
import { useTheme } from '../theme'

type Props = {
  url: string | null | undefined
  label?: string
  absentLabel?: string
  variant?: 'primary' | 'inline'
}

export function AttachmentLink({
  url,
  label,
  absentLabel = 'Documento original não disponível.',
  variant = 'primary',
}: Props) {
  const t = useTheme()

  if (variant === 'inline') {
    if (!url) return null
    return (
      <Pressable onPress={() => Linking.openURL(url)}>
        <Text spec={text(t, { role: 'caption' })} style={{ color: t.color.identity.primary }}>{label ?? 'Documento'} →</Text>
      </Pressable>
    )
  }

  if (!url) return <Text spec={text(t, { role: 'bodySmall', tone: 'muted' })}>{absentLabel}</Text>
  return <Button label={label ?? 'Abrir documento original'} onPress={() => Linking.openURL(url)} />
}
