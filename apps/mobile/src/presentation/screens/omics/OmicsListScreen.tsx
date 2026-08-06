// Exames de Ômica — lista de painéis + criação (paridade Web /dashboard/omics). A SINTERA armazena, organiza,
// versiona e compara dados ômicos — NÃO interpreta (RDC 657/2022). Leituras via ponte /api/omics (api-client);
// criação direta (RLS dono). O upload de laudo com transcrição por IA é captura de device + edge (na Web);
// aqui cria-se o painel e adicionam-se resultados manualmente (ou importados na Web).
import { useCallback, useEffect, useRef, useState } from 'react'
import { ScrollView, View, ActivityIndicator, RefreshControl, Pressable, Alert, StyleSheet } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import { text } from '@sintera/design-system'
import type { OmicsPanel } from '@sintera/api-client'
import { DOMAINS, DOMAIN_LABEL, fmtOmicsDate, type OmicsDomain } from '@sintera/core'
import { Text, Button, Input } from '../../primitives'
import { useTheme } from '../../theme'
import { apiClient } from '../../../infrastructure/apiClient'
import type { ExamesStackParamList } from '../../navigation/types'

type Props = NativeStackScreenProps<ExamesStackParamList, 'OmicsList'>

export function OmicsListScreen({ navigation }: Props) {
  const t = useTheme()
  const insets = useSafeAreaInsets()
  const [panels, setPanels] = useState<OmicsPanel[]>([])
  const [phase, setPhase] = useState<'loading' | 'ready' | 'error'>('loading')
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const alive = useRef(true)

  const [open, setOpen] = useState(false)
  const [domain, setDomain] = useState<OmicsDomain>('metabolomics')
  const [lab, setLab] = useState('')
  const [tech, setTech] = useState('')
  const [date, setDate] = useState('')
  const [saving, setSaving] = useState(false)

  const load = useCallback((silent: boolean) => {
    if (silent) setRefreshing(true); else setPhase('loading')
    apiClient.omics.listPanels()
      .then((ps) => { if (!alive.current) return; setPanels(ps); setPhase('ready'); setError(null) })
      .catch((e) => { if (alive.current && !silent) { setError(e instanceof Error ? e.message : 'Não foi possível carregar.'); setPhase('error') } })
      .finally(() => { if (alive.current) setRefreshing(false) })
  }, [])
  useEffect(() => { alive.current = true; load(false); return () => { alive.current = false } }, [load])
  useEffect(() => navigation.addListener('focus', () => load(true)), [navigation, load])

  async function create() {
    setSaving(true)
    try {
      const { data, error: err } = await apiClient.omics.createPanel({ domain, laboratory: lab, technology: tech, collectedOn: date || null })
      if (err || !data) { Alert.alert('Não foi possível criar', err?.message ?? 'Tente novamente.'); return }
      setOpen(false); setLab(''); setTech(''); setDate('')
      navigation.navigate('OmicsPanel', { id: data.id, domain })
    } finally { setSaving(false) }
  }

  if (phase === 'loading') {
    return <View style={[styles.center, { backgroundColor: t.color.surface.app, paddingTop: insets.top }]}><ActivityIndicator color={t.color.identity.primary} /></View>
  }
  if (phase === 'error') {
    return <View style={[styles.center, { backgroundColor: t.color.surface.app, paddingTop: insets.top }]}><Text spec={text(t, { role: 'body' })} style={{ color: t.color.badge.error.text, textAlign: 'center' }}>{error}</Text><Button label="Tentar novamente" variant="secondary" onPress={() => load(false)} /></View>
  }

  const card = { backgroundColor: t.color.surface.base, borderColor: t.color.border.default }

  return (
    <ScrollView style={{ backgroundColor: t.color.surface.app }}
      contentContainerStyle={[styles.content, { paddingBottom: styles.content.padding + insets.bottom }]}
      keyboardShouldPersistTaps="handled"
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={t.color.identity.primary} />}>
      <Text spec={text(t, { role: 'caption', tone: 'muted' })}>Metabolômica, proteômica, microbioma e outros. A SINTERA organiza, versiona e compara seus dados — sem interpretação clínica. Crie um exame e adicione resultados (ou importe na Web).</Text>
      {!open ? <Button label="Adicionar exame" onPress={() => setOpen(true)} /> : null}

      {open ? (
        <View style={[styles.card, card, { gap: 12 }]}>
          <Text spec={text(t, { role: 'bodyStrong' })}>Novo exame de ômica</Text>
          <View style={styles.chips}>
            {DOMAINS.map(d => {
              const on = domain === d
              return <Pressable key={d} onPress={() => setDomain(d)} style={[styles.chip, { borderColor: on ? t.color.identity.primary : t.color.border.default, backgroundColor: on ? t.color.badge.info.soft : 'transparent' }]}><Text spec={text(t, { role: 'caption', tone: on ? 'default' : 'muted' })}>{DOMAIN_LABEL[d]}</Text></Pressable>
            })}
          </View>
          <Input value={date} onChangeText={setDate} placeholder="Data do exame (AAAA-MM-DD)" />
          <Input value={lab} onChangeText={setLab} placeholder="Laboratório (opcional)" />
          <Input value={tech} onChangeText={setTech} placeholder="Tecnologia (ex.: LC-MS/MS)" />
          <View style={styles.actions}>
            <Button label="Cancelar" variant="secondary" onPress={() => setOpen(false)} />
            <Button label="Criar exame" onPress={create} loading={saving} loadingLabel="Criando…" />
          </View>
        </View>
      ) : null}

      {panels.length === 0 && !open ? (
        <View style={[styles.card, card]}><Text spec={text(t, { role: 'body', tone: 'muted' })} style={{ textAlign: 'center' }}>Nenhum exame de ômica ainda.</Text></View>
      ) : null}

      {panels.map(p => (
        <Pressable key={p.id} onPress={() => navigation.navigate('OmicsPanel', { id: p.id, domain: p.domain })} style={[styles.card, card, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}>
          <View style={{ flex: 1 }}>
            <Text spec={text(t, { role: 'bodyStrong' })}>{DOMAIN_LABEL[p.domain as OmicsDomain] ?? p.domain}</Text>
            <Text spec={text(t, { role: 'caption', tone: 'muted' })}>{[fmtOmicsDate(p.collected_on ?? p.created_at), p.laboratory, p.technology].filter(Boolean).join(' · ')}{p.total_features ? ` · ${p.total_features} marcadores` : ''}</Text>
          </View>
          <Text spec={text(t, { role: 'body', tone: 'muted' })}>›</Text>
        </Pressable>
      ))}

      <Text spec={text(t, { role: 'caption', tone: 'faint' })}>Compilação factual de resultados — não é laudo, diagnóstico nem parecer.</Text>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  content: { padding: 20, gap: 14 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 12 },
  card: { borderWidth: 1, borderRadius: 16, padding: 16, gap: 2 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8 },
})
