// Stack interno da aba "Minha Saúde": menu do grupo (raiz) + Dados de Saúde (Condições, Medicamentos, …) +
// Histórico de Saúde (Timeline) + Composição Corporal + Monitoramento — que passaram a viver aqui na
// arquitetura de 5 abas (MOBILE-036). Só navegação — sem regra de negócio.
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { MinhaSaudeMenuScreen } from '../screens/minhasaude/MinhaSaudeMenuScreen'
import { ConditionsScreen } from '../screens/minhasaude/ConditionsScreen'
import { HabitsScreen } from '../screens/minhasaude/HabitsScreen'
import { ResourcesScreen } from '../screens/minhasaude/ResourcesScreen'
import { MedicationsScreen } from '../screens/minhasaude/MedicationsScreen'
import { CicloScreen } from '../screens/minhasaude/CicloScreen'
import { TimelineScreen } from '../screens/agenda/TimelineScreen'
import { ComposicaoScreen } from '../screens/composicao/ComposicaoScreen'
import { MonitoramentoScreen } from '../screens/monitoramento/MonitoramentoScreen'
import { useTheme } from '../theme'
import type { MinhaSaudeStackParamList } from './types'

const Stack = createNativeStackNavigator<MinhaSaudeStackParamList>()

export function MinhaSaudeStack() {
  const t = useTheme()
  const detail = {
    headerShown: true,
    headerStyle: { backgroundColor: t.color.surface.app },
    headerTintColor: t.color.text.default,
    headerTitleStyle: { fontFamily: 'HankenGrotesk_600SemiBold' },
    headerShadowVisible: false,
  } as const
  return (
    <Stack.Navigator>
      <Stack.Screen name="MinhaSaudeMenu" component={MinhaSaudeMenuScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Conditions" component={ConditionsScreen} options={{ ...detail, title: 'Condições de Saúde' }} />
      <Stack.Screen name="Habits" component={HabitsScreen} options={{ ...detail, title: 'Hábitos' }} />
      <Stack.Screen name="Resources" component={ResourcesScreen} options={{ ...detail, title: 'Recursos de Saúde' }} />
      <Stack.Screen name="Medications" component={MedicationsScreen} options={{ ...detail, title: 'Medicamentos' }} />
      <Stack.Screen name="Ciclo" component={CicloScreen} options={{ ...detail, title: 'Ciclo e Contracepção' }} />
      <Stack.Screen name="Timeline" component={TimelineScreen} options={{ ...detail, title: 'Histórico de Saúde' }} />
      <Stack.Screen name="Composicao" component={ComposicaoScreen} options={{ ...detail, title: 'Composição Corporal' }} />
      <Stack.Screen name="Monitoramento" component={MonitoramentoScreen} options={{ ...detail, title: 'Monitoramento' }} />
    </Stack.Navigator>
  )
}
