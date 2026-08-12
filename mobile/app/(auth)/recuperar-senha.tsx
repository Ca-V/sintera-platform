import { useState } from 'react'
import { View, Text, TextInput, Pressable, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native'
import { useRouter } from 'expo-router'
import { supabase } from '@/lib/supabase'
import { API_URL } from '@/lib/config'
import { colors, spacing, radius, font } from '@/lib/theme'

// Recuperação de senha — envia o e-mail de redefinição pelo Supabase. O link abre a
// página web /atualizar-senha (fluxo único da plataforma). Completa a jornada de auth.
export default function RecuperarSenhaScreen() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)

  async function onSubmit() {
    if (loading || !email.includes('@')) return
    setLoading(true); setError(null)
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${API_URL}/atualizar-senha`,
    })
    setLoading(false)
    if (error) setError(error.message)
    else setSent(true)
  }

  if (sent) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.ivory, justifyContent: 'center', padding: spacing.xl, gap: spacing.lg }}>
        <Text style={{ fontSize: font.size.xl, fontWeight: font.weight.semibold, color: colors.onyx }}>Verifique seu e-mail</Text>
        <Text style={{ fontSize: font.size.md, color: colors.mauve }}>
          Se houver uma conta com {email.trim()}, enviamos um link para redefinir sua senha.
        </Text>
        <Pressable onPress={() => router.replace('/(auth)/login')} style={primaryBtn}>
          <Text style={primaryBtnText}>Voltar ao login</Text>
        </Pressable>
      </View>
    )
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, backgroundColor: colors.ivory }}>
      <View style={{ flex: 1, justifyContent: 'center', padding: spacing.xl, gap: spacing.lg }}>
        <View style={{ gap: spacing.xs }}>
          <Text style={{ fontSize: font.size.xxl, fontWeight: font.weight.semibold, color: colors.onyx }}>Recuperar senha</Text>
          <Text style={{ fontSize: font.size.md, color: colors.mauve }}>Enviaremos um link de redefinição para seu e-mail.</Text>
        </View>
        <View style={{ gap: spacing.md }}>
          <TextInput value={email} onChangeText={setEmail} placeholder="E-mail" placeholderTextColor={colors.mauve} autoCapitalize="none" keyboardType="email-address" style={inputStyle} />
          {error && <Text style={{ color: colors.red, fontSize: font.size.sm }}>{error}</Text>}
          <Pressable onPress={onSubmit} disabled={loading || !email.includes('@')} style={[primaryBtn, { opacity: loading || !email.includes('@') ? 0.6 : 1 }]}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={primaryBtnText}>Enviar link</Text>}
          </Pressable>
          <Pressable onPress={() => router.replace('/(auth)/login')} hitSlop={8} style={{ alignItems: 'center', paddingVertical: spacing.sm }}>
            <Text style={{ color: colors.petal, fontSize: font.size.sm }}>Voltar ao login</Text>
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
const primaryBtn = { backgroundColor: colors.petal, borderRadius: radius.full, paddingVertical: spacing.md, alignItems: 'center' } as const
const primaryBtnText = { color: '#fff', fontSize: font.size.md, fontWeight: font.weight.semibold } as const
