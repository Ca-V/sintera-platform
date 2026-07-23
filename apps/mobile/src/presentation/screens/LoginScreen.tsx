// Mobile — Tela de login (Incremento 1). Identidade DS-002: painel de assinatura aqua (gradient 'signature'),
// wordmark SINTERA, campos e botão primário (gradient 'action'). Espelha a 1ª tela de login da Web.
import { useState } from 'react'
import { View, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { heading, text } from '@sintera/design-system'
import { rnGradient } from '../../design-system/gradient'
import { Text, Input, Button } from '../primitives'
import { useAuth } from '../../state/AuthProvider'
import { useTheme } from '../theme'

export function LoginScreen() {
  const t = useTheme()
  const { signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function onSubmit() {
    setError(null)
    setLoading(true)
    const { error } = await signIn(email.trim(), password)
    setLoading(false)
    if (error) setError('Credenciais inválidas. Verifique e tente novamente.')
    // Sucesso: onAuthStateChange atualiza a sessão e o App troca para a Home.
  }

  const sig = rnGradient('signature')
  const wordmark = { ...heading(t, { level: 'display' }), color: '#FFFFFF' }

  return (
    <View style={[styles.root, { backgroundColor: t.color.surface.app }]}>
      {/* Painel de assinatura aqua (identidade da marca) */}
      <LinearGradient
        colors={sig.colors as unknown as readonly [string, string, ...string[]]}
        locations={sig.locations as unknown as readonly [number, number, ...number[]] | undefined}
        start={sig.start}
        end={sig.end}
        style={styles.panel}
      >
        <Text spec={wordmark} style={styles.wordmark}>SINTERA</Text>
      </LinearGradient>

      {/* Formulário */}
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.form}>
        <Text spec={heading(t, { level: 'section' })}>Entrar</Text>
        <View style={{ height: 18 }} />
        <Input
          placeholder="E-mail"
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
          error={!!error}
        />
        <View style={{ height: 12 }} />
        <Input
          placeholder="Senha"
          secureTextEntry
          autoComplete="password"
          value={password}
          onChangeText={setPassword}
          error={!!error}
        />
        {error ? (
          <>
            <View style={{ height: 10 }} />
            <Text spec={{ ...text(t, { role: 'bodySmall' }), color: t.color.badge.error.text }}>{error}</Text>
          </>
        ) : null}
        <View style={{ height: 22 }} />
        <Button label="Entrar" onPress={onSubmit} loading={loading} disabled={!email || !password} />
      </KeyboardAvoidingView>
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  panel: { height: '38%', alignItems: 'center', justifyContent: 'center' },
  wordmark: { letterSpacing: 6 },
  form: { flex: 1, paddingHorizontal: 28, paddingTop: 32 },
})
