// Stack interno da aba "Minha Saúde": menu do grupo (raiz, sem header) + telas de domínio (Condições, …).
// Só navegação — sem regra de negócio.
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { MinhaSaudeMenuScreen } from '../screens/minhasaude/MinhaSaudeMenuScreen'
import { ConditionsScreen } from '../screens/minhasaude/ConditionsScreen'
import { HabitsScreen } from '../screens/minhasaude/HabitsScreen'
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
    </Stack.Navigator>
  )
}
