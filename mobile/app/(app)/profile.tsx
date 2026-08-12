import { useCallback, useEffect, useState } from 'react'
import { View, Text, Switch } from 'react-native'
import { Screen, Card, Button, Field, Loading } from '@/components/ui'
import { useAuth } from '@/lib/auth'
import { api, ApiError } from '@/lib/api'
import { colors, spacing, font } from '@/lib/theme'

interface Profile {
  name: string | null
  pref_daily_reminder: boolean
  pref_phase_alerts: boolean
  pref_email_insights: boolean
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
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [savedAt, setSavedAt] = useState(false)

  const load = useCallback(async () => {
    try {
      const p = await api.get<Profile>('/api/profile')
      setProfile(p)
      setName(p.name ?? '')
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

      {error && <Text style={{ color: colors.red, fontSize: font.size.sm }}>{error}</Text>}
      {savedAt && !error && <Text style={{ color: colors.sage, fontSize: font.size.sm }}>Preferências salvas.</Text>}

      <View style={{ marginTop: spacing.sm }}>
        <Button label="Sair" variant="ghost" onPress={signOut} />
      </View>
    </Screen>
  )
}
