// Stack interno da aba "Mais" (Inc.4). Segue o padrão do AppNavigator (cada tab é um native-stack próprio),
// mas com DUAS telas: o menu (raiz, sem header — visual das outras abas) e o Perfil (detalhe empilhável, com
// header nativo temático que provê o "voltar"). É só navegação — sem regra de negócio.
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { MaisMenuScreen } from '../screens/mais/MaisMenuScreen'
import { ProfileScreen } from '../screens/profile/ProfileScreen'
import { DespesasScreen } from '../screens/despesas/DespesasScreen'
import { useTheme } from '../theme'
import type { MaisStackParamList } from './types'

const Stack = createNativeStackNavigator<MaisStackParamList>()

export function MaisStack() {
  const t = useTheme()
  return (
    <Stack.Navigator>
      <Stack.Screen name="MaisMenu" component={MaisMenuScreen} options={{ headerShown: false }} />
      <Stack.Screen
        name="Perfil"
        component={ProfileScreen}
        options={{
          headerShown: true,
          title: 'Perfil',
          headerStyle: { backgroundColor: t.color.surface.app },
          headerTintColor: t.color.text.default,
          headerTitleStyle: { fontFamily: 'HankenGrotesk_600SemiBold' },
          headerShadowVisible: false,
        }}
      />
      <Stack.Screen
        name="Despesas"
        component={DespesasScreen}
        options={{
          headerShown: true,
          title: 'Despesas',
          headerStyle: { backgroundColor: t.color.surface.app },
          headerTintColor: t.color.text.default,
          headerTitleStyle: { fontFamily: 'HankenGrotesk_600SemiBold' },
          headerShadowVisible: false,
        }}
      />
    </Stack.Navigator>
  )
}
