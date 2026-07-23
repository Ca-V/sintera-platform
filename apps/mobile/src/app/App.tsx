// Raiz do app (Incremento 1 — Autenticação). Responsabilidades:
//   1) Carrega as fontes da marca (Fraunces · Hanken Grotesk) via @expo-google-fonts.
//   2) Provê o estado de autenticação (AuthProvider) — restauração de sessão do SecureStore.
//   3) Gate: enquanto fontes/sessão carregam → Loading; depois → Login | Home conforme a sessão.
// Os nomes das famílias abaixo casam com o que o adaptador DS→RN gera (resolveRNFontFamily),
// ex.: `Fraunces_600SemiBold`, `HankenGrotesk_400Regular`.
import { useFonts, Fraunces_600SemiBold } from '@expo-google-fonts/fraunces'
import { HankenGrotesk_400Regular, HankenGrotesk_600SemiBold } from '@expo-google-fonts/hanken-grotesk'
import { StatusBar } from 'expo-status-bar'
import { ActivityIndicator, View } from 'react-native'
import { AuthProvider, useAuth } from '../state/AuthProvider'
import { LoginScreen } from '../presentation/screens/LoginScreen'
import { HomePlaceholder } from '../presentation/screens/HomePlaceholder'
import { useTheme } from '../presentation/theme'

/** Escolhe a tela conforme o estado de sessão. Mostra Loading enquanto a sessão é restaurada. */
function Gate() {
  const { session, loading } = useAuth()
  const t = useTheme()
  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: t.color.surface.app }}>
        <ActivityIndicator color={t.color.identity.primary} />
      </View>
    )
  }
  return session ? <HomePlaceholder /> : <LoginScreen />
}

export function App() {
  const [fontsLoaded] = useFonts({
    Fraunces_600SemiBold,
    HankenGrotesk_400Regular,
    HankenGrotesk_600SemiBold,
  })

  // Sem as fontes da marca, o texto renderiza na fonte do sistema — segura até carregarem.
  if (!fontsLoaded) return null

  return (
    <AuthProvider>
      <StatusBar style="light" />
      <Gate />
    </AuthProvider>
  )
}
