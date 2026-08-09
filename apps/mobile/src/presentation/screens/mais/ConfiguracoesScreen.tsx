// Configurações (paridade Web /dashboard/configuracoes) — conta (e-mail/senha/WhatsApp) + Central de
// Notificações (NOTIF-001: canal por categoria) + obrigatórias. Reutiliza apiClient.auth/profile/settings +
// taxonomia do @sintera/core. Exportar/Excluir conta ficam para quando as rotas aceitarem Bearer (ADR-020).
import { useCallback, useEffect, useRef, useState } from 'react'
import { ScrollView, View, ActivityIndicator, Pressable, Share, Alert, Linking, StyleSheet } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { text } from '@sintera/design-system'
import {
  NOTIFICATION_CATEGORIES, DEFAULT_CHANNEL, MANDATORY_NOTIFICATIONS, recommendedChannels,
  type NotificationChannel,
} from '@sintera/core'
import { Text, Button, Input } from '../../primitives'
import { useTheme } from '../../theme'
import { useAuth } from '../../../state/AuthProvider'
import { apiClient } from '../../../infrastructure/apiClient'

const WEB_URL = process.env.EXPO_PUBLIC_WEB_URL
const CHANNELS: { id: NotificationChannel; label: string }[] = [
  { id: 'email', label: 'E-mail' }, { id: 'whatsapp', label: 'WhatsApp' }, { id: 'both', label: 'Ambos' }, { id: 'none', label: 'Nenhum' },
]
const DDI_OPTS = ['+55', '+351', '+1', '+44', '+34', '+49', '+33', '+39', '+54', '+61']

export function ConfiguracoesScreen() {
  const t = useTheme()
  const insets = useSafeAreaInsets()
  const { session, signOut } = useAuth()
  const accountEmail = session?.user?.email ?? ''
  const [exportBusy, setExportBusy] = useState(false)
  const [deleteText, setDeleteText] = useState('')
  const [deleteBusy, setDeleteBusy] = useState(false)

  const [phase, setPhase] = useState<'loading' | 'ready'>('loading')
  const alive = useRef(true)

  const [email, setEmail] = useState(accountEmail)
  const [emailBusy, setEmailBusy] = useState(false)
  const [emailMsg, setEmailMsg] = useState<string | null>(null)
  const [pwBusy, setPwBusy] = useState(false)
  const [pwMsg, setPwMsg] = useState<string | null>(null)
  const [ddi, setDdi] = useState('+55')
  const [phone, setPhone] = useState('')
  const [waBusy, setWaBusy] = useState(false)
  const [waMsg, setWaMsg] = useState<string | null>(null)
  const [prefs, setPrefs] = useState<Record<string, NotificationChannel>>({})
  const [prefsBusy, setPrefsBusy] = useState(false)
  const [prefsMsg, setPrefsMsg] = useState<string | null>(null)

  const load = useCallback(() => {
    Promise.all([apiClient.profile.getProfile(), apiClient.settings.listNotificationPrefs()])
      .then(([pr, rows]) => {
        if (!alive.current) return
        const raw = (pr?.phone ?? '').trim(); const m = raw.match(/^(\+\d{1,3})\s*(.*)$/)
        if (m) { setDdi(m[1]); setPhone(m[2].trim()) } else setPhone(raw)
        const next: Record<string, NotificationChannel> = {}
        for (const c of NOTIFICATION_CATEGORIES) next[c.key] = DEFAULT_CHANNEL
        for (const r of rows) next[r.category] = r.channel
        setPrefs(next); setPhase('ready')
      })
      .catch(() => { if (alive.current) setPhase('ready') })
  }, [])
  useEffect(() => { alive.current = true; setEmail(accountEmail); load(); return () => { alive.current = false } }, [load, accountEmail])

  async function saveEmail() {
    const next = email.trim()
    if (!next || next === accountEmail) return
    setEmailBusy(true); setEmailMsg(null)
    const { error } = await apiClient.auth.updateEmail(next)
    setEmailBusy(false)
    setEmailMsg(error ? (error.message || 'Não foi possível alterar.') : 'Enviamos um link de confirmação ao novo e-mail.')
  }
  async function resetPassword() {
    setPwBusy(true); setPwMsg(null)
    const { error } = await apiClient.auth.sendPasswordReset()
    setPwBusy(false)
    setPwMsg(error ? 'Não foi possível enviar o e-mail.' : 'Enviamos um link de redefinição ao seu e-mail.')
  }
  async function saveWhatsApp() {
    setWaBusy(true); setWaMsg(null)
    const full = phone.trim() ? `${ddi} ${phone.trim()}` : null
    const { error } = await apiClient.profile.updateProfile({ phone: full })
    setWaBusy(false)
    setWaMsg(error ? 'Não foi possível salvar.' : 'Contato salvo.')
  }
  async function savePrefs() {
    setPrefsBusy(true); setPrefsMsg(null)
    const { error } = await apiClient.settings.saveNotificationPrefs(NOTIFICATION_CATEGORIES.map(c => ({ category: c.key, channel: prefs[c.key] ?? DEFAULT_CHANNEL })))
    setPrefsBusy(false)
    setPrefsMsg(error ? 'Não foi possível salvar.' : 'Preferências salvas.')
  }
  function restoreRecommended() { setPrefs(recommendedChannels()) }
  async function doExport() {
    setExportBusy(true)
    try {
      const { data, error } = await apiClient.settings.exportAccountData()
      if (error || !data) { Alert.alert('Não foi possível exportar', error?.message ?? 'Tente novamente.'); return }
      await Share.share({ message: JSON.stringify(data, null, 2) })
    } finally { setExportBusy(false) }
  }
  function confirmDelete() {
    if (deleteText.trim().toUpperCase() !== 'EXCLUIR') { Alert.alert('Confirmação', 'Digite EXCLUIR para confirmar.'); return }
    Alert.alert('Excluir conta', 'Isto apaga permanentemente sua conta e TODOS os seus dados. Esta ação é irreversível.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Excluir tudo', style: 'destructive', onPress: async () => {
        setDeleteBusy(true)
        const { error } = await apiClient.settings.deleteAccount()
        setDeleteBusy(false)
        if (error) { Alert.alert('Não foi possível excluir', error.message || 'Tente novamente.'); return }
        await signOut()
      } },
    ])
  }

  if (phase === 'loading') {
    return <View style={[styles.center, { backgroundColor: t.color.surface.app, paddingTop: insets.top }]}><ActivityIndicator color={t.color.identity.primary} /></View>
  }

  const card = { backgroundColor: t.color.surface.base, borderColor: t.color.border.default }

  return (
    <ScrollView style={{ backgroundColor: t.color.surface.app }}
      contentContainerStyle={[styles.content, { paddingTop: styles.content.padding + insets.top, paddingBottom: styles.content.padding + insets.bottom }]}
      keyboardShouldPersistTaps="handled">

      {/* E-mail da conta */}
      <View style={[styles.card, card, { gap: 8 }]}>
        <Text spec={text(t, { role: 'bodyStrong' })}>E-mail da conta</Text>
        <Input value={email} onChangeText={setEmail} placeholder="voce@email.com" keyboardType="email-address" autoCapitalize="none" />
        <Text spec={text(t, { role: 'caption', tone: 'faint' })}>Alterá-lo pede confirmação por link no novo endereço.</Text>
        <Button label="Salvar e-mail" variant="secondary" onPress={saveEmail} loading={emailBusy} loadingLabel="Salvando…" />
        {emailMsg ? <Text spec={text(t, { role: 'caption', tone: 'muted' })}>{emailMsg}</Text> : null}
      </View>

      {/* Senha */}
      <View style={[styles.card, card, { gap: 8 }]}>
        <Text spec={text(t, { role: 'bodyStrong' })}>Senha</Text>
        <Text spec={text(t, { role: 'caption', tone: 'muted' })}>Enviamos um link seguro para você redefinir a senha.</Text>
        <Button label="Enviar link de redefinição" variant="secondary" onPress={resetPassword} loading={pwBusy} loadingLabel="Enviando…" />
        {pwMsg ? <Text spec={text(t, { role: 'caption', tone: 'muted' })}>{pwMsg}</Text> : null}
      </View>

      {/* WhatsApp */}
      <View style={[styles.card, card, { gap: 8 }]}>
        <Text spec={text(t, { role: 'bodyStrong' })}>Contato — WhatsApp</Text>
        <View style={styles.chips}>
          {DDI_OPTS.map(d => {
            const on = ddi === d
            return <Pressable key={d} onPress={() => setDdi(d)} style={[styles.chip, { borderColor: on ? t.color.identity.primary : t.color.border.default, backgroundColor: on ? t.color.badge.info.soft : 'transparent' }]}><Text spec={text(t, { role: 'caption', tone: on ? 'default' : 'muted' })}>{d}</Text></Pressable>
          })}
        </View>
        <Input value={phone} onChangeText={setPhone} placeholder="número (sem DDI)" keyboardType="phone-pad" />
        <Text spec={text(t, { role: 'caption', tone: 'faint' })}>O canal de cada aviso é definido abaixo, por categoria.</Text>
        <Button label="Salvar contato" variant="secondary" onPress={saveWhatsApp} loading={waBusy} loadingLabel="Salvando…" />
        {waMsg ? <Text spec={text(t, { role: 'caption', tone: 'muted' })}>{waMsg}</Text> : null}
      </View>

      {/* Central de Notificações */}
      <View style={[styles.card, card, { gap: 12 }]}>
        <Text spec={text(t, { role: 'bodyStrong' })}>Central de Notificações</Text>
        <Text spec={text(t, { role: 'caption', tone: 'muted' })}>Escolha o canal de cada categoria de aviso.</Text>
        {/* Agrupado pelas SEÇÕES da Sidebar (FB-017): a Central espelha a navegação. */}
        {[...new Set(NOTIFICATION_CATEGORIES.map(c => c.section))].map(section => (
          <View key={section} style={{ gap: 8 }}>
            <Text spec={text(t, { role: 'label', tone: 'muted' })}>{section.toUpperCase()}</Text>
            {NOTIFICATION_CATEGORIES.filter(c => c.section === section).map(cat => (
              <View key={cat.key} style={{ gap: 4 }}>
                <Text spec={text(t, { role: 'body' })}>{cat.label}</Text>
                <View style={styles.chips}>
                  {CHANNELS.map(ch => {
                    const on = (prefs[cat.key] ?? DEFAULT_CHANNEL) === ch.id
                    return <Pressable key={ch.id} onPress={() => setPrefs(p => ({ ...p, [cat.key]: ch.id }))} style={[styles.chip, { borderColor: on ? t.color.identity.primary : t.color.border.default, backgroundColor: on ? t.color.badge.info.soft : 'transparent' }]}><Text spec={text(t, { role: 'caption', tone: on ? 'default' : 'muted' })}>{ch.label}</Text></Pressable>
                  })}
                </View>
              </View>
            ))}
          </View>
        ))}
        <View style={styles.actions}>
          <Button label="Restaurar recomendadas" variant="secondary" onPress={restoreRecommended} />
          <Button label="Salvar preferências" onPress={savePrefs} loading={prefsBusy} loadingLabel="Salvando…" />
        </View>
        {prefsMsg ? <Text spec={text(t, { role: 'caption', tone: 'muted' })}>{prefsMsg}</Text> : null}
      </View>

      {/* Obrigatórias */}
      <View style={[styles.card, card, { gap: 4 }]}>
        <Text spec={text(t, { role: 'bodyStrong' })}>Sempre enviadas</Text>
        <Text spec={text(t, { role: 'caption', tone: 'faint' })}>Avisos essenciais de conta e segurança — por e-mail, sem opção de desativar.</Text>
        {MANDATORY_NOTIFICATIONS.map(n => <Text key={n.key} spec={text(t, { role: 'caption', tone: 'muted' })}>• {n.label}</Text>)}
      </View>

      {/* Seus dados */}
      <View style={[styles.card, card, { gap: 8 }]}>
        <Text spec={text(t, { role: 'bodyStrong' })}>Seus dados</Text>
        <Text spec={text(t, { role: 'caption', tone: 'muted' })}>Baixe uma cópia de todos os seus dados (LGPD).</Text>
        <Button label="Exportar meus dados" variant="secondary" onPress={doExport} loading={exportBusy} loadingLabel="Preparando…" />
      </View>

      {/* Legal e privacidade (LGPD/COMPLIANCE-001) */}
      <View style={[styles.card, card, { gap: 4 }]}>
        <Text spec={text(t, { role: 'bodyStrong' })}>Legal e privacidade</Text>
        {[{ label: 'Seus direitos (LGPD)', path: '/lgpd' }, { label: 'Política de Privacidade', path: '/privacidade' }, { label: 'Termos de Uso', path: '/termos' }].map(l => (
          <Pressable key={l.path} onPress={() => WEB_URL ? Linking.openURL(`${WEB_URL}${l.path}`) : Alert.alert('Indisponível', 'Abra em sintera.app.')} style={styles.linkRow}>
            <Text spec={text(t, { role: 'body' })}>{l.label}</Text>
            <Text spec={text(t, { role: 'caption' })} style={{ color: t.color.identity.primary }}>Abrir ›</Text>
          </Pressable>
        ))}
        <Text spec={text(t, { role: 'caption', tone: 'faint' })}>Seus dados são armazenados de forma segura e nunca compartilhados com terceiros. Você pode excluir sua conta e todos os dados a qualquer momento.</Text>
      </View>

      {/* Sair da conta (controle próprio, como na Web) */}
      <Button label="Sair da conta" variant="secondary" onPress={() => Alert.alert('Sair da conta', 'Deseja sair? Você precisará entrar novamente.', [{ text: 'Cancelar', style: 'cancel' }, { text: 'Sair', onPress: () => { void signOut() } }])} />

      {/* Zona sensível */}
      <View style={[styles.card, { backgroundColor: t.color.badge.error.soft, borderColor: t.color.badge.error.text, gap: 8 }]}>
        <Text spec={text(t, { role: 'bodyStrong' })} style={{ color: t.color.badge.error.text }}>Excluir conta</Text>
        <Text spec={text(t, { role: 'caption', tone: 'muted' })}>Apaga permanentemente sua conta e TODOS os dados. Irreversível. Digite EXCLUIR para confirmar.</Text>
        <Input value={deleteText} onChangeText={setDeleteText} placeholder="EXCLUIR" autoCapitalize="characters" />
        <Button label="Excluir minha conta" variant="secondary" onPress={confirmDelete} loading={deleteBusy} loadingLabel="Excluindo…" />
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  content: { padding: 20, gap: 14 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  card: { borderWidth: 1, borderRadius: 16, padding: 16 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, flexWrap: 'wrap' },
  linkRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 },
})
