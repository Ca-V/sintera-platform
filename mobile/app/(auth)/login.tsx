import { useState } from 'react'
import { View, Text, TextInput, Pressable, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native'
import { useRouter } from 'expo-router'
import { useAuth } from '@/lib/auth'
import { colors, spacing, radius, font } from '@/lib/theme'

export default function LoginScreen() {
  const { signIn } = useAuth()
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onSubmit() {
    if (loading || !email.includes('@') || password.length < 6) return
    setLoading(true); setError(null)
    const { error } = await signIn(email.trim(), password)
    setLoading(false)
    if (error) setError(error === 'Invalid login credentials' ? 'E-mail ou senha incorretos.' : error)
    // Sucesso: a guarda de navegação leva ao (app) automaticamente.
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1, backgroundColor: colors.ivory }}
    >
      <View style={{ flex: 1, justifyContent: 'center', padding: spacing.xl, gap: spacing.lg }}>
        <View style={{ gap: spacing.xs }}>
          <Text style={{ fontSize: font.size.xxl, fontWeight: font.weight.semibold, color: colors.onyx }}>
            SINTERA
          </Text>
          <Text style={{ fontSize: font.size.md, color: colors.mauve }}>
            Entre para acessar sua saúde organizada.
          </Text>
        </View>

        <View style={{ gap: spacing.md }}>
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="E-mail"
            placeholderTextColor={colors.mauve}
            autoCapitalize="none"
            keyboardType="email-address"
            style={inputStyle}
          />
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="Senha"
            placeholderTextColor={colors.mauve}
            secureTextEntry
            style={inputStyle}
          />
          {error && <Text style={{ color: colors.red, fontSize: font.size.sm }}>{error}</Text>}
          <Pressable
            onPress={onSubmit}
            disabled={loading}
            style={{
              backgroundColor: colors.petal,
              borderRadius: radius.full,
              paddingVertical: spacing.md,
              alignItems: 'center',
              opacity: loading ? 0.6 : 1,
            }}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={{ color: '#fff', fontSize: font.size.md, fontWeight: font.weight.semibold }}>Entrar</Text>}
          </Pressable>
          <Pressable onPress={() => router.replace('/(auth)/register')} hitSlop={8} style={{ alignItems: 'center', paddingVertical: spacing.sm }}>
            <Text style={{ color: colors.petal, fontSize: font.size.sm }}>Não tem conta? Criar conta</Text>
          </Pressable>
          <Pressable onPress={() => router.replace('/(auth)/recuperar-senha')} hitSlop={8} style={{ alignItems: 'center' }}>
            <Text style={{ color: colors.mauve, fontSize: font.size.sm }}>Esqueci minha senha</Text>
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  )
}

const inputStyle = {
  borderWidth: 1,
  borderColor: colors.border,
  borderRadius: radius.md,
  backgroundColor: colors.cream,
  paddingHorizontal: spacing.md,
  paddingVertical: spacing.md,
  fontSize: font.size.md,
  color: colors.onyx,
} as const
