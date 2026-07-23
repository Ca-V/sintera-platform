// Primitivo RN — Button. A recipe `button` do DS decide (gradiente 'action' no primário); o primitivo só monta.
import { Pressable } from 'react-native'
import { button } from '@sintera/design-system'
import { Box } from './Box'
import { Text } from './Text'
import { useTheme } from '../theme'

type ButtonProps = {
  label: string
  onPress?: () => void
  variant?: 'primary' | 'secondary' | 'ghost'
  loading?: boolean
  loadingLabel?: string
  disabled?: boolean
}

export function Button({ label, onPress, variant = 'primary', loading = false, loadingLabel = 'Entrando…', disabled = false }: ButtonProps) {
  const t = useTheme()
  const inactive = disabled || loading
  const spec = button(t, { variant, state: inactive ? 'disabled' : 'default' })
  return (
    <Pressable onPress={onPress} disabled={inactive} accessibilityRole="button" accessibilityState={{ disabled: inactive, busy: loading }}>
      <Box spec={spec.container} style={{ alignItems: 'center', justifyContent: 'center' }}>
        <Text spec={spec.label}>{loading ? loadingLabel : label}</Text>
      </Box>
    </Pressable>
  )
}
