// Tela de Perfil — SPEC CANÔNICA ÚNICA Web+Mobile (paridade total). Ordem fixa das seções: cabeçalho → avatar →
// nome → e-mail → membro desde → estatísticas → formulário de edição (nome·telefone·faixa etária·objetivos) →
// informações da conta (plano·conta criada) → link Configurações. COMPOSIÇÃO de primitivos do DS-002 + o hook
// `useProfile` (nenhum acesso a rede aqui; fronteira do Inc.1). Edição por formulário + Salvar, validações
// compartilhadas (@sintera/validation). Estados: carga → erro-de-carga → form (salvar pessimista + feedback).
import { ScrollView, View, ActivityIndicator, Pressable, StyleSheet } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import { text, heading } from '@sintera/design-system'
import { monthLabel, dialSelectOptions } from '@sintera/core'
import { AGE_RANGE_OPTIONS } from '@sintera/validation'
import { Avatar, Button, FieldRow, Input, Select, Text } from '../../primitives'
import { useTheme } from '../../theme'
import { useAuth } from '../../../state/AuthProvider'
import { useProfile } from './useProfile'

// Opções do seletor de faixa etária (SSOT em @sintera/validation) + opção de limpar.
const AGE_RANGE_SELECT = [{ id: '', label: 'Não informar' }, ...AGE_RANGE_OPTIONS.map(o => ({ id: o, label: o }))]

// Códigos de país (SSOT em @sintera/core). Passa de 8 opções → o Select abre com busca.
const COUNTRY_SELECT = dialSelectOptions()   // mesma lista e mesmos rótulos da Configurações

/** Dias desde a criação da conta (mín. 1). Cálculo de exibição — mesma fórmula da Web. */
function daysSince(iso: string | null): number {
  if (!iso) return 0
  return Math.max(1, Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000))
}

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
  const displayName = p.name || data?.name || 'Usuária'
  const memberSince = p.stats?.memberSince ?? null

  const STAT_CARDS = [
    { value: p.stats?.totalExams ?? 0, label: 'Exames' },
    { value: p.stats?.totalBiomarkers ?? 0, label: 'Biomarcadores' },
    { value: daysSince(memberSince), label: 'Dias na SINTERA' },
  ]

  return (
    <ScrollView
      style={{ backgroundColor: t.color.surface.app }}
      contentContainerStyle={[
        styles.content,
        { paddingTop: styles.content.padding + insets.top, paddingBottom: styles.content.padding + insets.bottom },
      ]}
      keyboardShouldPersistTaps="handled"
    >
      {/* 1. Cabeçalho */}
      <Text spec={heading(t, { level: 'page' })}>Meu Perfil</Text>
      <Text spec={text(t, { role: 'bodySmall', tone: 'muted' })}>Seus dados na SINTERA</Text>

      {/* 2–5. Avatar · Nome · E-mail · Membro desde */}
      <View style={[styles.card, styles.identity, { backgroundColor: t.color.surface.base, borderColor: t.color.border.default }]}>
        <Avatar uri={data?.avatar_url} name={displayName} size="lg" />
        <View style={{ flex: 1, gap: 2 }}>
          <Text spec={text(t, { role: 'bodyStrong' })} numberOfLines={2}>{displayName}</Text>
          {email ? <Text spec={text(t, { role: 'bodySmall', tone: 'muted' })} numberOfLines={1}>{email}</Text> : null}
          {memberSince ? (
            <Text spec={text(t, { role: 'caption', tone: 'faint' })}>Membro desde {monthLabel(memberSince)}</Text>
          ) : null}
        </View>
      </View>

      {/* 6. Estatísticas */}
      <View style={styles.statsRow}>
        {STAT_CARDS.map((s) => (
          <View key={s.label} style={[styles.card, styles.statCard, { backgroundColor: t.color.surface.base, borderColor: t.color.border.default }]}>
            <Text spec={text(t, { role: 'bodyStrong' })} style={{ fontSize: 20 }}>{s.value}</Text>
            <Text spec={text(t, { role: 'caption', tone: 'muted' })} style={{ textAlign: 'center' }}>{s.label}</Text>
          </View>
        ))}
      </View>

      {/* 7. Formulário de edição */}
      <Text spec={text(t, { role: 'label', tone: 'muted' })}>EDITAR PERFIL</Text>

      <FieldRow label="Nome" errorText={p.fieldErrors.name}>
        <Input value={p.name} onChangeText={p.setName} placeholder="Seu nome" error={!!p.fieldErrors.name} autoCapitalize="words" editable={!saving} />
      </FieldRow>

      {/* País + número. O DDI NUNCA é adivinhado: vem da escolha explícita, e é o
          que o envio de WhatsApp usa. Ver @sintera/core/domain/profile/phone. */}
      <FieldRow label="Telefone" helperText="País e número com DDD" errorText={p.fieldErrors.phone}>
        <View style={styles.phoneRow}>
          <View style={{ flex: 1.1 }}>
            <Select
              options={COUNTRY_SELECT}
              value={p.phoneIso}
              onChange={p.setPhoneIso}
              placeholder="País"
              title="Código de país"
              searchable
            />
          </View>
          <View style={{ flex: 1.4 }}>
            <Input value={p.phone} onChangeText={p.setPhone} placeholder="(00) 00000-0000" keyboardType="phone-pad" error={!!p.fieldErrors.phone} editable={!saving} />
          </View>
        </View>
      </FieldRow>

      <FieldRow label="Faixa etária" errorText={p.fieldErrors.age_range}>
        <Select options={AGE_RANGE_SELECT} value={p.ageRange} onChange={p.setAgeRange} placeholder="Selecione a faixa" title="Faixa etária" />
      </FieldRow>

      <FieldRow label="Objetivos" helperText="Separe por vírgula" errorText={p.fieldErrors.goals}>
        <Input value={p.goalsText} onChangeText={p.setGoals} placeholder="Ex.: Sono, Energia, Longevidade" error={!!p.fieldErrors.goals} editable={!saving} />
      </FieldRow>

      <Button label="Salvar" onPress={p.save} loading={saving} loadingLabel="Salvando…" />

      {p.phase === 'saved' ? (
        <Text spec={text(t, { role: 'bodySmall' })} style={{ color: t.color.badge.success.text, textAlign: 'center' }}>Perfil salvo ✓</Text>
      ) : null}
      {p.phase === 'saveError' ? (
        <Text spec={text(t, { role: 'bodySmall' })} style={{ color: t.color.badge.error.text, textAlign: 'center' }}>
          {p.error ?? 'Não foi possível salvar. Tente novamente.'}
        </Text>
      ) : null}

      {/* 8. Informações da conta */}
      <View style={{ gap: 8, marginTop: 4 }}>
        <Text spec={text(t, { role: 'label', tone: 'muted' })}>INFORMAÇÕES DA CONTA</Text>
        <View style={styles.statsRow}>
          <View style={[styles.card, styles.infoCard, { backgroundColor: t.color.surface.base, borderColor: t.color.border.default }]}>
            <Text spec={text(t, { role: 'caption', tone: 'faint' })}>Plano</Text>
            <Text spec={text(t, { role: 'body' })}>Gratuito</Text>
          </View>
          <View style={[styles.card, styles.infoCard, { backgroundColor: t.color.surface.base, borderColor: t.color.border.default }]}>
            <Text spec={text(t, { role: 'caption', tone: 'faint' })}>Conta criada</Text>
            <Text spec={text(t, { role: 'body' })}>{memberSince ? monthLabel(memberSince) : '—'}</Text>
          </View>
        </View>
      </View>

      {/* 9. Link Configurações da conta */}
      <Pressable onPress={() => nav.navigate('Configuracoes')} style={{ paddingVertical: 4, gap: 2 }}>
        <Text spec={text(t, { role: 'bodySmall' })} style={{ color: t.color.identity.primary }}>Configurações da conta →</Text>
        <Text spec={text(t, { role: 'caption', tone: 'muted' })}>Alterar senha, privacidade, excluir conta</Text>
      </Pressable>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  content: { padding: 24, gap: 16 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 12 },
  card: { borderWidth: 1, borderRadius: 16, padding: 16 },
  identity: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  statsRow: { flexDirection: 'row', gap: 12 },
  statCard: { flex: 1, alignItems: 'center', gap: 4, paddingVertical: 16 },
  infoCard: { flex: 1, gap: 4 },
  phoneRow: { flexDirection: 'row', gap: 8, alignItems: 'flex-start' },
})
