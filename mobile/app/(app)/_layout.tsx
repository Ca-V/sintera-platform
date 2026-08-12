import { Stack } from 'expo-router'
import { colors } from '@/lib/theme'

// Navegação por pilha: a Home é um hub que empurra cada módulo. Evita estourar a
// barra de abas (são ~15 módulos) e casa com o cabeçalho "‹ voltar" do componente Screen.
export default function AppLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.ivory },
        animation: 'slide_from_right',
      }}
    />
  )
}
