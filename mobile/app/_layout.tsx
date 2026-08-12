import { Slot, useRouter, useSegments } from 'expo-router'
import { useEffect } from 'react'
import { View, ActivityIndicator } from 'react-native'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
import { AuthProvider, useAuth } from '@/lib/auth'
import { registerPushToken } from '@/lib/push'
import { colors } from '@/lib/theme'

// Guarda de navegação: sem sessão → (auth); com sessão → (app).
function Guard() {
  const { session, loading } = useAuth()
  const segments = useSegments()
  const router = useRouter()

  useEffect(() => {
    if (loading) return
    const inAuth = segments[0] === '(auth)'
    if (!session && !inAuth) router.replace('/(auth)/login')
    else if (session && inAuth) router.replace('/(app)')
  }, [session, loading, segments, router])

  // Com sessão, registra o push token (best-effort; no-op sem device/EAS).
  useEffect(() => { if (session) registerPushToken() }, [session])

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.ivory }}>
        <ActivityIndicator color={colors.petal} />
      </View>
    )
  }
  return <Slot />
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <AuthProvider>
        <Guard />
      </AuthProvider>
    </SafeAreaProvider>
  )
}
