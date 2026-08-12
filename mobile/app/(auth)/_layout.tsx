import { Stack } from 'expo-router'
import { colors } from '@/lib/theme'

// Pilha das telas de autenticação (login ↔ cadastro), sem cabeçalho.
export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.ivory },
        animation: 'fade',
      }}
    />
  )
}
