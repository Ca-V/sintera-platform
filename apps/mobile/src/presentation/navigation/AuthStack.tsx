// Incremento 2 · Etapa 3 — AuthStack como navegador React Navigation (native-stack), uma única tela.
// `headerShown: false` mantém o comportamento idêntico ao Incremento 1 (LoginScreen ocupa a tela toda).
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { LoginScreen } from '../screens/LoginScreen'

export type AuthStackParamList = {
  Login: undefined
}

const Stack = createNativeStackNavigator<AuthStackParamList>()

export function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
    </Stack.Navigator>
  )
}
