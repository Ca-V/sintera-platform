// Primitivo RN — Text. Consome um TextSpec (recipe do DS) via o adaptador puro toRNText.
import { Text as RNText, type TextProps, type TextStyle } from 'react-native'
import type { TextSpec } from '@sintera/design-system'
import { toRNText } from '../../design-system/box'

type Props = TextProps & { spec: TextSpec }

export function Text({ spec, style, ...rest }: Props) {
  return <RNText style={[toRNText(spec) as TextStyle, style]} {...rest} />
}
