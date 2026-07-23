// Primitivo RN — Box. Consome qualquer BoxSpec (recipe do DS) via o adaptador puro toRNBox e monta a View.
// Se a spec tem gradiente, renderiza <LinearGradient>; senão, uma View sólida. Nenhuma decisão visual aqui.
import { View, type ViewProps, type ViewStyle } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import type { BoxSpec } from '@sintera/design-system'
import { toRNBox } from '../../design-system/box'
import { themeMode } from '../theme'

type BoxProps = ViewProps & { spec: BoxSpec }

export function Box({ spec, style, children, ...rest }: BoxProps) {
  const { style: boxStyle, gradient, shadow } = toRNBox(themeMode, spec)
  const base: ViewStyle[] = [boxStyle as ViewStyle, shadow as unknown as ViewStyle, style as ViewStyle]

  if (gradient) {
    return (
      <LinearGradient
        colors={gradient.colors as unknown as readonly [string, string, ...string[]]}
        locations={gradient.locations as unknown as readonly [number, number, ...number[]] | undefined}
        start={gradient.start}
        end={gradient.end}
        style={base}
      >
        {children}
      </LinearGradient>
    )
  }
  return (
    <View style={base} {...rest}>
      {children}
    </View>
  )
}
