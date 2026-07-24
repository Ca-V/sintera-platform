// Incremento 2 · Etapa 2 — AuthStack (ramo NÃO autenticado do gate). Contém apenas a LoginScreen.
// Nesta etapa é um componente simples; a conversão para um navegador React Navigation é a Etapa 3.
// Objetivo da Etapa 2: migrar o gate para AuthStack | AppNavigator SEM alterar comportamento.
import { LoginScreen } from '../screens/LoginScreen'

export function AuthStack() {
  return <LoginScreen />
}
