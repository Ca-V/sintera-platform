import { useState } from 'react'
import { View, Text, TextInput, Pressable, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native'
import { useRouter } from 'expo-router'
import { useAuth } from '@/lib/auth'
import { colors, spacing, radius, font } from '@/lib/theme'

// Cadastro. Reusa o signUp do contexto (que grava o perfil quando a confirmação de
// e-mail está desligada, ou orienta a confirmar quando ligada). A guarda de navegação
// leva ao (app) automaticamente quando a sessão nasce.
export default function RegisterScreen() {
  const { signUp } = useAuth()
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [confirmSent, setConfirmSent] = useState(false)

  const canSubmit = name.trim().length >= 2 && email.includes('@') && password.length >= 6

  async function onSubmit() {
    if (loading || !canSubmit) return
    setLoading(true); setError(null)
    const { error, needsConfirmation } = await signUp(email.trim(), password, name.trim())
    setLoading(false)
    if (error) { setError(error); return }
    if (needsConfirmation) setConfirmSent(true)
    // Se a sessão nasceu, a guarda navega para o (app).
  }

  if (confirmSent) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.ivory, justifyContent: 'center', padding: spacing.xl, gap: spacing.lg }}>
        <Text style={{ fontSize: font.size.xl, fontWeight: font.weight.semibold, color: colors.onyx }}>Confirme seu e-mail</Text>
        <Text style={{ fontSize: font.size.md, color: colors.mauve }}>
          Enviamos um link de confirmação para {email.trim()}. Abra-o para ativar sua conta e depois faça login.
        </Text>
        <Pressable onPress={() => router.replace('/(auth)/login')} style={primaryBtn}>
          <Text style={primaryBtnText}>Ir para o login</Text>
        </Pressable>
      </View>
    )
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, backgroundColor: colors.ivory }}>
      <View style={{ flex: 1, justifyContent: 'center', padding: spacing.xl, gap: spacing.lg }}>
        <View style={{ gap: spacing.xs }}>
          <Text style={{ fontSize: font.size.xxl, fontWeight: font.weight.semibold, color: colors.onyx }}>Criar conta</Text>
          <Text style={{ fontSize: font.size.md, color: colors.mauve }}>Sua saúde organizada, no seu bolso.</Text>
        </View>

        <View style={{ gap: spacing.md }}>
          <TextInput value={name} onChangeText={setName} placeholder="Nome" placeholderTextColor={colors.mauve} style={inputStyle} />
          <TextInput value={email} onChangeText={setEmail} placeholder="E-mail" placeholderTextColor={colors.mauve} autoCapitalize="none" keyboardType="email-address" style={inputStyle} />
          <TextInput value={password} onChangeText={setPassword} placeholder="Senha (mín. 6 caracteres)" placeholderTextColor={colors.mauve} secureTextEntry style={inputStyle} />
          {error && <Text style={{ color: colors.red, fontSize: font.size.sm }}>{error}</Text>}
          <Pressable onPress={onSubmit} disabled={loading || !canSubmit} style={[primaryBtn, { opacity: loading || !canSubmit ? 0.6 : 1 }]}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={primaryBtnText}>Criar conta</Text>}
          </Pressable>
          <Pressable onPress={() => router.replace('/(auth)/login')} hitSlop={8} style={{ alignItems: 'center', paddingVertical: spacing.sm }}>
            <Text style={{ color: colors.petal, fontSize: font.size.sm }}>Já tenho conta · Entrar</Text>
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  )
}

const inputStyle = {
  borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, backgroundColor: colors.cream,
  paddingHorizontal: spacing.md, paddingVertical: spacing.md, fontSize: font.size.md, color: colors.onyx,
} as const
const primaryBtn = {
  backgroundColor: colors.petal, borderRadius: radius.full, paddingVertical: spacing.md, alignItems: 'center',
} as const
const primaryBtnText = { color: '#fff', fontSize: font.size.md, fontWeight: font.weight.semibold } as const
