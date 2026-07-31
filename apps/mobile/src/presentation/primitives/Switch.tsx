// Primitivo RN — Switch (controle liga/desliga). A recipe `toggle` do DS decide as cores/opacidade; o
// primitivo aplica no Switch nativo do RN (idiomático + acessível). `Switch` do RN é importado como RNSwitch.
import { Switch as RNSwitch } from 'react-native'
import { toggle } from '@sintera/design-system'
import { useTheme } from '../theme'

type SwitchProps = {
  value: boolean
  onValueChange: (value: boolean) => void
  disabled?: boolean
}

export function Switch({ value, onValueChange, disabled = false }: SwitchProps) {
  const t = useTheme()
  const spec = toggle(t, { disabled })
  return (
    <RNSwitch
      value={value}
      onValueChange={onValueChange}
      disabled={disabled}
      trackColor={{ false: spec.trackOff, true: spec.trackOn }}
      thumbColor={spec.thumb}
      style={{ opacity: spec.opacity }}
      accessibilityRole="switch"
    />
  )
}
