// Incremento 2 · Etapa 3 — AppNavigator como navegador React Navigation (native-stack), uma única tela.
// `headerShown: false` mantém o comportamento idêntico ao Incremento 1 (Home ocupa a tela toda).
// Bottom Tabs (Etapa 4) e stacks internos por tab (Etapa 5) entram nas próximas etapas.
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { HomePlaceholder } from '../screens/HomePlaceholder'

export type AppStackParamList = {
  Home: undefined
}

const Stack = createNativeStackNavigator<AppStackParamList>()

export function AppNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Home" component={HomePlaceholder} />
    </Stack.Navigator>
  )
}
