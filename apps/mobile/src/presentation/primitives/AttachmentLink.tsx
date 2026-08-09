// AttachmentLink (R-ATTACH) — afordância ÚNICA para ABRIR um documento anexado (laudo/PDF/nota). Paridade com o
// AttachmentLink Web: mesmo comportamento e rótulos; só a apresentação adapta (aqui, botão nativo + Linking). Sem
// URL, mostra o estado ausente (o chamador não precisa duplicar essa lógica). Sem regra de negócio (DS-003).
import { Linking } from 'react-native'
import { text } from '@sintera/design-system'
import { Button } from './Button'
import { Text } from './Text'
import { useTheme } from '../theme'

type Props = {
  url: string | null | undefined
  label?: string
  absentLabel?: string
}

export function AttachmentLink({
  url,
  label = 'Abrir documento original',
  absentLabel = 'Documento original não disponível.',
}: Props) {
  const t = useTheme()
  if (!url) return <Text spec={text(t, { role: 'bodySmall', tone: 'muted' })}>{absentLabel}</Text>
  return <Button label={label} onPress={() => Linking.openURL(url)} />
}
