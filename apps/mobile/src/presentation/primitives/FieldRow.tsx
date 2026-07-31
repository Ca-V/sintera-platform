// Primitivo RN — FieldRow (linha de formulário). INFRA de DS: orquestra rótulo (Text) + o CONTROLE recebido
// por composição (Input, Switch, ou qualquer outro — via `children`) + texto de ajuda/erro, com espaçamento e
// estados visuais derivados da recipe `field`. Deliberadamente "burro": NÃO conhece validação, máscara, API,
// formulário, ProfileDTO nem regra de domínio. Reutilizável em qualquer tela (Perfil, Configurações, Contatos…).
//
// Uso:
//   <FieldRow label="Nome" required helperText="Como devemos te chamar" errorText={erro}>
//     <Input value={nome} onChangeText={setNome} error={!!erro} />
//   </FieldRow>
//
// Acessibilidade: o rótulo recebe um `nativeID` e o controle é associado a ele via `accessibilityLabelledBy`
// (padrão RN, onde a plataforma suporta). A mensagem de erro usa `accessibilityLiveRegion="polite"` (anúncio).
import { useId, isValidElement, cloneElement, type ReactNode, type ReactElement } from 'react'
import { View } from 'react-native'
import { field } from '@sintera/design-system'
import { useTheme } from '../theme'
import { Text } from './Text'

type FieldRowProps = {
  /** Rótulo visível do campo. */
  label: string
  /** Marca o campo como obrigatório (exibe "*"); ausência = opcional. */
  required?: boolean
  /** Texto de ajuda discreto (exibido quando não há erro). */
  helperText?: string
  /** Mensagem de erro (quando presente, substitui a ajuda). */
  errorText?: string | null
  /** Esmaece o conjunto (o controle trata o próprio estado desabilitado). */
  disabled?: boolean
  /** O CONTROLE do campo (Input, Switch, …) — o FieldRow não o conhece. */
  children: ReactNode
}

export function FieldRow({ label, required = false, helperText, errorText, disabled = false, children }: FieldRowProps) {
  const t = useTheme()
  const spec = field(t, { disabled })
  const labelId = useId()

  // Associa rótulo↔controle onde o RN suporta (nativeID + accessibilityLabelledBy). Presentational — sem domínio.
  const control = isValidElement(children)
    ? cloneElement(children as ReactElement<{ accessibilityLabelledBy?: string }>, { accessibilityLabelledBy: labelId })
    : children

  const aux = errorText
    ? { spec: spec.error, value: errorText, live: 'polite' as const }
    : helperText
      ? { spec: spec.helper, value: helperText, live: 'none' as const }
      : null

  return (
    <View style={{ opacity: spec.opacity, gap: spec.gap }}>
      <Text spec={spec.label} nativeID={labelId}>
        {label}
        {required ? <Text spec={{ style: spec.label.style, color: spec.requiredMark.color }}> *</Text> : null}
      </Text>
      {control}
      {aux ? <Text spec={aux.spec} accessibilityLiveRegion={aux.live}>{aux.value}</Text> : null}
    </View>
  )
}
