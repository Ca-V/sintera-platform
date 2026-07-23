// Primitivo RN — Input. A recipe `input` do DS decide caixa/foco/erro; o primitivo aplica no TextInput.
import { useState } from 'react'
import { TextInput, type TextInputProps, type TextStyle } from 'react-native'
import { input } from '@sintera/design-system'
import { toRNBox, toRNText } from '../../design-system/box'
import { themeMode, useTheme } from '../theme'

type Props = TextInputProps & { error?: boolean }

export function Input({ error = false, style, onFocus, onBlur, ...rest }: Props) {
  const t = useTheme()
  const [focused, setFocused] = useState(false)
  const spec = input(t, { state: error ? 'error' : focused ? 'focus' : 'default' })
  const box = toRNBox(themeMode, spec.container)
  const text = toRNText(spec.text)
  const textStyle: TextStyle = { color: text.color, fontFamily: text.fontFamily, fontSize: text.fontSize }
  return (
    <TextInput
      placeholderTextColor={spec.placeholderColor}
      onFocus={(e) => { setFocused(true); onFocus?.(e) }}
      onBlur={(e) => { setFocused(false); onBlur?.(e) }}
      style={[box.style as TextStyle, textStyle, style]}
      {...rest}
    />
  )
}
