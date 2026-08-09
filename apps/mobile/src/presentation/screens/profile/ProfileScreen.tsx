// Tela de Perfil (Incremento 4). COMPOSIÇÃO de primitivos do DS-002 + o hook `useProfile` — sem regra de
// domínio nem acesso a rede aqui (tudo via `useProfile`→`apiClient`; fronteira do Inc.1). Escopo congelado
// (MOBILE-016/019): EDITÁVEL = nome + telefone; faixa etária/objetivos/avatar = EXIBIÇÃO; preferências de
// notificação = deferidas (Central). Estados: carga → erro-de-carga → form (com salvar pessimista + feedback).
import { ScrollView, View, ActivityIndicator, Pressable, StyleSheet } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import { text, heading } from '@sintera/design-system'
import { Avatar, Button, FieldRow, Input, Text } from '../../primitives'
import { useTheme } from '../../theme'
import { useAuth } from '../../../state/AuthProvider'
import { useProfile } from './useProfile'

export function ProfileScreen() {
  const t = useTheme()
  const insets = useSafeAreaInsets()
  const { session } = useAuth()
  const p = useProfile()
  const nav = useNavigation() as { navigate: (n: string) => void }

  const email = session?.user?.email ?? null

  // Carga inicial.
  if (p.phase === 'idle' || p.phase === 'loading') {
    return (
      <View style={[styles.center, { backgroundColor: t.color.surface.app, paddingTop: insets.top }]}>
        <ActivityIndicator color={t.color.identity.primary} />
        <Text spec={text(t, { role: 'body', tone: 'muted' })}>Carregando seu perfil…</Text>
      </View>
    )
  }

  // Erro de carga → mensagem + tentar novamente.
  if (p.phase === 'loadError') {
    return (
      <View style={[styles.center, { backgroundColor: t.color.surface.app, paddingTop: insets.top }]}>
        <Text spec={text(t, { role: 'body' })} style={{ color: t.color.badge.error.text, textAlign: 'center' }}>
          {p.error ?? 'Não foi possível carregar seu perfil.'}
        </Text>
        <Button label="Tentar novamente" variant="secondary" onPress={p.retry} />
      </View>
    )
  }

  const saving = p.phase === 'saving'
  const data = p.state.data

  return (
    <ScrollView
      style={{ backgroundColor: t.color.surface.app }}
      contentContainerStyle={[
        styles.content,
        { paddingTop: styles.content.padding + insets.top, paddingBottom: styles.content.padding + insets.bottom },
      ]}
      keyboardShouldPersistTaps="handled"
    >
      <Text spec={heading(t, { level: 'page' })}>Meu Perfil</Text>
      <Text spec={text(t, { role: 'bodySmall', tone: 'muted' })}>Seus dados na SINTERA.</Text>

      <View style={styles.header}>
        <Avatar uri={data?.avatar_url} name={p.name || data?.name} size="lg" />
      </View>

      {email ? (
        <FieldRow label="E-mail (conta)">
          <Text spec={text(t, { role: 'body', tone: 'muted' })}>{email}</Text>
        </FieldRow>
      ) : null}

      <FieldRow label="Nome" errorText={p.fieldErrors.name}>
        <Input
          value={p.name}
          onChangeText={p.setName}
          placeholder="Seu nome"
          error={!!p.fieldErrors.name}
          autoCapitalize="words"
          editable={!saving}
        />
      </FieldRow>

      <FieldRow label="Telefone" helperText="Com DDD" errorText={p.fieldErrors.phone}>
        <Input
          value={p.phone}
          onChangeText={p.setPhone}
          placeholder="(00) 00000-0000"
          keyboardType="phone-pad"
          error={!!p.fieldErrors.phone}
          editable={!saving}
        />
      </FieldRow>

      {/* Exibição-apenas no Inc.4 (edição = incrementos próprios). */}
      {data?.age_range ? (
        <FieldRow label="Faixa etária">
          <Text spec={text(t, { role: 'body' })}>{data.age_range}</Text>
        </FieldRow>
      ) : null}
      {data?.goals && data.goals.length > 0 ? (
        <FieldRow label="Objetivos">
          <Text spec={text(t, { role: 'body' })}>{data.goals.join(', ')}</Text>
        </FieldRow>
      ) : null}

      <Button label="Salvar" onPress={p.save} loading={saving} loadingLabel="Salvando…" />

      <Pressable onPress={() => nav.navigate('Configuracoes')} style={{ paddingVertical: 4 }}>
        <Text spec={text(t, { role: 'bodySmall' })} style={{ color: t.color.identity.primary }}>Configurações da conta →</Text>
      </Pressable>

      {p.phase === 'saved' ? (
        <Text
          spec={text(t, { role: 'bodySmall' })}
          style={{ color: t.color.badge.success.text, textAlign: 'center' }}
        >
          Perfil salvo ✓
        </Text>
      ) : null}
      {p.phase === 'saveError' ? (
        <Text
          spec={text(t, { role: 'bodySmall' })}
          style={{ color: t.color.badge.error.text, textAlign: 'center' }}
        >
          {p.error ?? 'Não foi possível salvar. Tente novamente.'}
        </Text>
      ) : null}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  content: { padding: 24, gap: 16 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 12 },
  header: { alignItems: 'center', marginBottom: 4 },
})
