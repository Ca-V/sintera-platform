import { useCallback, useEffect, useState } from 'react'
import { View, Text, Switch, Alert } from 'react-native'
import * as FileSystem from 'expo-file-system'
import * as Sharing from 'expo-sharing'
import { Screen, Card, Button, Field, Loading } from '@/components/ui'
import { useAuth } from '@/lib/auth'
import { api, ApiError } from '@/lib/api'
import { API_URL } from '@/lib/config'
import { supabase } from '@/lib/supabase'
import { colors, spacing, font } from '@/lib/theme'

interface Profile {
  name: string | null
  phone: string | null
  pref_daily_reminder: boolean
  pref_phase_alerts: boolean
  pref_email_insights: boolean
  pref_whatsapp_reminder: boolean
}

const TOGGLES: { key: keyof Profile; label: string; desc: string }[] = [
  { key: 'pref_daily_reminder', label: 'Lembretes diários', desc: 'Avisos dos eventos da sua agenda' },
  { key: 'pref_phase_alerts', label: 'Alertas de fase', desc: 'Sinais do seu ciclo' },
  { key: 'pref_email_insights', label: 'Resumos por e-mail', desc: 'Novidades e organização dos seus dados' },
]

export default function ProfileScreen() {
  const { user, signOut } = useAuth()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [waOptIn, setWaOptIn] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [savedAt, setSavedAt] = useState(false)

  const load = useCallback(async () => {
    try {
      const p = await api.get<Profile>('/api/profile')
      setProfile(p)
      setName(p.name ?? '')
      setPhone(p.phone ?? '')
      setWaOptIn(p.pref_whatsapp_reminder === true)
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Não foi possível carregar o perfil.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  async function patch(body: Record<string, unknown>) {
    setSaving(true)
    setError(null)
    setSavedAt(false)
    try {
      const p = await api.patch<Profile>('/api/profile', body)
      setProfile(p)
      setSavedAt(true)
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Não foi possível salvar.')
    } finally {
      setSaving(false)
    }
  }

  function toggle(key: keyof Profile, value: boolean) {
    setProfile((p) => (p ? { ...p, [key]: value } : p))
    patch({ [key]: value })
  }

  const [privacyBusy, setPrivacyBusy] = useState(false)

  // Portabilidade (LGPD): baixa o JSON do titular e abre o compartilhamento nativo para
  // salvar/enviar o arquivo. Usa o token da sessão no header (mesma rota da Web, Bearer).
  async function exportData() {
    setPrivacyBusy(true)
    try {
      const { data } = await supabase.auth.getSession()
      const token = data.session?.access_token
      const res = await fetch(`${API_URL}/api/account/export`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      if (!res.ok) throw new Error(`Falha (${res.status})`)
      const json = await res.text()
      const uri = `${FileSystem.cacheDirectory}sintera-meus-dados.json`
      await FileSystem.writeAsStringAsync(uri, json)
      if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(uri, { mimeType: 'application/json' })
      else Alert.alert('Exportado', 'Seus dados foram exportados.')
    } catch (e) {
      Alert.alert('Erro', e instanceof Error ? e.message : 'Não foi possível exportar seus dados.')
    } finally {
      setPrivacyBusy(false)
    }
  }

  // Direito de exclusão (LGPD): apaga a conta e todos os dados/arquivos (rota faz a
  // exclusão recursiva no storage) e encerra a sessão.
  function deleteAccount() {
    Alert.alert(
      'Excluir conta',
      'Esta ação é permanente. Todos os seus dados e arquivos serão apagados. Deseja continuar?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir conta', style: 'destructive',
          onPress: async () => {
            setPrivacyBusy(true)
            try {
              await api.del('/api/account')
              await signOut()
            } catch (e) {
              Alert.alert('Erro', e instanceof ApiError ? e.message : 'Não foi possível excluir a conta.')
              setPrivacyBusy(false)
            }
          },
        },
      ],
    )
  }

  if (loading) return <Screen title="Perfil" back><Loading /></Screen>

  return (
    <Screen title="Perfil" back>
      <Card>
        <Text style={{ fontSize: font.size.xs, color: colors.mauve, textTransform: 'uppercase' }}>E-mail</Text>
        <Text style={{ fontSize: font.size.md, color: colors.onyx, marginTop: 2 }}>{user?.email ?? '—'}</Text>
      </Card>

      <Card>
        <View style={{ gap: spacing.md }}>
          <Field label="Nome" value={name} onChangeText={setName} placeholder="Como quer ser chamada" />
          <Button label="Salvar nome" onPress={() => patch({ name: name.trim() || null })} loading={saving} />
        </View>
      </Card>

      <Text style={{ fontSize: font.size.xs, color: colors.mauve, textTransform: 'uppercase', letterSpacing: 1, marginTop: spacing.sm }}>
        Notificações
      </Text>
      <Card>
        <View style={{ gap: spacing.md }}>
          {TOGGLES.map((t, i) => (
            <View key={t.key} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingTop: i ? spacing.md : 0, borderTopWidth: i ? 1 : 0, borderTopColor: colors.border }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: font.size.md, color: colors.onyx }}>{t.label}</Text>
                <Text style={{ fontSize: font.size.sm, color: colors.mauve, marginTop: 2 }}>{t.desc}</Text>
              </View>
              <Switch
                value={!!profile?.[t.key]}
                onValueChange={(v) => toggle(t.key, v)}
                trackColor={{ true: colors.petal, false: colors.border }}
              />
            </View>
          ))}
        </View>
      </Card>

      <Text style={{ fontSize: font.size.xs, color: colors.mauve, textTransform: 'uppercase', letterSpacing: 1, marginTop: spacing.sm }}>
        Lembretes por WhatsApp
      </Text>
      <Card>
        <View style={{ gap: spacing.md }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: font.size.md, color: colors.onyx }}>Receber por WhatsApp</Text>
              <Text style={{ fontSize: font.size.sm, color: colors.mauve, marginTop: 2 }}>Além do e-mail, no número abaixo</Text>
            </View>
            <Switch value={waOptIn} onValueChange={setWaOptIn} trackColor={{ true: colors.petal, false: colors.border }} />
          </View>
          <Field label="Telefone (WhatsApp)" value={phone} onChangeText={setPhone} placeholder="+55 11 90000-0000" keyboardType="phone-pad" />
          <Button
            label="Salvar WhatsApp"
            onPress={() => patch({ phone: phone.trim() || null, pref_whatsapp_reminder: waOptIn })}
            loading={saving}
            disabled={waOptIn && !phone.trim()}
          />
        </View>
      </Card>

      {error && <Text style={{ color: colors.red, fontSize: font.size.sm }}>{error}</Text>}
      {savedAt && !error && <Text style={{ color: colors.sage, fontSize: font.size.sm }}>Preferências salvas.</Text>}

      <Text style={{ fontSize: font.size.xs, color: colors.mauve, textTransform: 'uppercase', letterSpacing: 1, marginTop: spacing.sm }}>
        Privacidade
      </Text>
      <Card>
        <View style={{ gap: spacing.md }}>
          <Button label="Exportar meus dados" variant="ghost" onPress={exportData} loading={privacyBusy} />
          <View style={{ height: 1, backgroundColor: colors.border }} />
          <Text style={{ fontSize: font.size.xs, color: colors.mauve }}>
            A exclusão da conta é permanente e apaga todos os seus dados e arquivos.
          </Text>
          <Button label="Excluir minha conta" variant="ghost" onPress={deleteAccount} disabled={privacyBusy} />
        </View>
      </Card>

      <View style={{ marginTop: spacing.sm }}>
        <Button label="Sair" variant="ghost" onPress={signOut} />
      </View>
    </Screen>
  )
}
