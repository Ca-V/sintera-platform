// Stack interno da aba "Rede de Cuidado" (entidade permanente — CARE-002 futura). Hoje: menu do módulo +
// Relatórios. Espaço pronto para Profissionais/Familiares/Compartilhamentos sem mudar a arquitetura. Só navegação.
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { RedeCuidadoMenuScreen } from '../screens/rede/RedeCuidadoMenuScreen'
import { RelatorioScreen } from '../screens/relatorio/RelatorioScreen'
import { useTheme } from '../theme'
import type { RedeCuidadoStackParamList } from './types'

const Stack = createNativeStackNavigator<RedeCuidadoStackParamList>()

export function RedeCuidadoStack() {
  const t = useTheme()
  return (
    <Stack.Navigator>
      <Stack.Screen name="RedeMenu" component={RedeCuidadoMenuScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Relatorio" component={RelatorioScreen}
        options={{ headerShown: true, title: 'Relatório', headerStyle: { backgroundColor: t.color.surface.app }, headerTintColor: t.color.text.default, headerTitleStyle: { fontFamily: 'HankenGrotesk_600SemiBold' }, headerShadowVisible: false }} />
    </Stack.Navigator>
  )
}
