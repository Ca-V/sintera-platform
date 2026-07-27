// Primitivo RN — Avatar. Consome a recipe `avatar` do DS (que já existia). Exibe a IMAGEM (uri) ou, na
// ausência, um fallback com as INICIAIS do nome, em um círculo (tamanho/raio/cores por papel do DS).
import { Image, View, Text as RNText, StyleSheet } from 'react-native'
import { avatar } from '@sintera/design-system'
import { toRNTextStyle } from '../../design-system/typography'
import { useTheme } from '../theme'

type AvatarProps = {
  uri?: string | null
  name?: string | null
  size?: 'sm' | 'md' | 'lg'
}

/** Iniciais a partir do nome (primeira + última palavra). Vazio se não houver nome. */
function initials(name?: string | null): string {
  if (!name) return ''
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return ''
  const first = parts[0][0] ?? ''
  const last = parts.length > 1 ? parts[parts.length - 1][0] : ''
  return (first + last).toUpperCase()
}

export function Avatar({ uri, name, size = 'md' }: AvatarProps) {
  const t = useTheme()
  const spec = avatar(t, { size })
  const circle = {
    width: spec.size,
    height: spec.size,
    borderRadius: spec.radius,
    backgroundColor: spec.backgroundColor,
  }

  if (uri) {
    return <Image source={{ uri }} style={circle} accessibilityIgnoresInvertColors />
  }

  const labelStyle = toRNTextStyle(spec.label)
  return (
    <View style={[circle, styles.center]}>
      <RNText style={{ fontFamily: labelStyle.fontFamily, fontSize: labelStyle.fontSize, fontWeight: labelStyle.fontWeight, color: spec.color }}>
        {initials(name)}
      </RNText>
    </View>
  )
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center' },
})
