// Condições de Saúde (paridade Web /dashboard/condicoes) — CRUD do estado permanente da pessoa e de familiares.
// Reutiliza `apiClient.conditions` (FRONTEIRA Inc.1). Fluxo manual completo (o scan/voz da Web são captura de
// device — trilha própria). FACTUAL (REG-001): registra o que a pessoa informa, sem interpretação clínica.
import { useCallback, useEffect, useRef, useState } from 'react'
import { ScrollView, View, ActivityIndicator, RefreshControl, Pressable, Alert, Linking, StyleSheet } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { text } from '@sintera/design-system'
import type { ConditionDTO, ConditionScope, ConditionInput } from '@sintera/api-client'
import { Text, Button, Input } from '../../primitives'
import { useTheme } from '../../theme'
import { apiClient } from '../../../infrastructure/apiClient'
import { documentPicker } from '../../../infrastructure/documentPickerAdapter'

export function ConditionsScreen() {
  const t = useTheme()
  const insets = useSafeAreaInsets()
  const [items, setItems] = useState<ConditionDTO[]>([])
  const [phase, setPhase] = useState<'loading' | 'ready' | 'error'>('loading')
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const alive = useRef(true)

  // Formulário inline (criar/editar).
  const [editing, setEditing] = useState<ConditionDTO | null>(null)
  const [open, setOpen] = useState(false)
  const [scope, setScope] = useState<ConditionScope>('propria')
  const [name, setName] = useState('')
  const [relative, setRelative] = useState('')
  const [since, setSince] = useState('')
  const [notes, setNotes] = useState('')
  const [fileUrl, setFileUrl] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)

  const load = useCallback((silent: boolean) => {
    if (silent) setRefreshing(true); else setPhase('loading')
    apiClient.conditions.listConditions()
      .then((cs) => { if (!alive.current) return; setItems(cs); setPhase('ready'); setError(null) })
      .catch((e) => { if (alive.current && !silent) { setError(e instanceof Error ? e.message : 'Não foi possível carregar.'); setPhase('error') } })
      .finally(() => { if (alive.current) setRefreshing(false) })
  }, [])
  useEffect(() => { alive.current = true; load(false); return () => { alive.current = false } }, [load])

  function startNew() { setEditing(null); setScope('propria'); setName(''); setRelative(''); setSince(''); setNotes(''); setFileUrl(null); setOpen(true) }
  function startEdit(c: ConditionDTO) {
    setEditing(c); setScope(c.scope); setName(c.name); setRelative(c.relative ?? ''); setSince(c.since_label ?? ''); setNotes(c.notes ?? ''); setFileUrl(c.file_url); setOpen(true)
  }
  async function pickFile() {
    setUploading(true)
    try {
      const file = await documentPicker.pickDocument()
      if (!file) return
      const { data, error: err } = await apiClient.exams.uploadExam({ uri: file.uri, mimeType: file.mimeType ?? 'application/octet-stream', sizeBytes: file.sizeBytes })
      if (!err && data) setFileUrl(data.url)
    } finally { setUploading(false) }
  }
  async function save() {
    if (!name.trim()) { Alert.alert('Nome obrigatório', 'Informe o nome da condição.'); return }
    setSaving(true)
    try {
      const input: ConditionInput = { id: editing?.id, scope, name, relative, since_label: since, notes, file_url: fileUrl }
      const { error: err } = await apiClient.conditions.saveCondition(input)
      if (err) { Alert.alert('Não foi possível salvar', err.message || 'Tente novamente.'); return }
      setOpen(false); load(true)
    } finally { setSaving(false) }
  }
  function remove(c: ConditionDTO) {
    Alert.alert('Excluir condição', `Excluir "${c.name}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Excluir', style: 'destructive', onPress: async () => {
        const { error: err } = await apiClient.conditions.deleteCondition(c.id)
        if (err) { Alert.alert('Não foi possível excluir', 'Tente novamente.'); return }
        load(true)
      } },
    ])
  }

  if (phase === 'loading') {
    return <View style={[styles.center, { backgroundColor: t.color.surface.app, paddingTop: insets.top }]}><ActivityIndicator color={t.color.identity.primary} /><Text spec={text(t, { role: 'body', tone: 'muted' })}>Carregando…</Text></View>
  }
  if (phase === 'error') {
    return <View style={[styles.center, { backgroundColor: t.color.surface.app, paddingTop: insets.top }]}><Text spec={text(t, { role: 'body' })} style={{ color: t.color.badge.error.text, textAlign: 'center' }}>{error}</Text><Button label="Tentar novamente" variant="secondary" onPress={() => load(false)} /></View>
  }

  const card = { backgroundColor: t.color.surface.base, borderColor: t.color.border.default }
  return (
    <ScrollView style={{ backgroundColor: t.color.surface.app }}
      contentContainerStyle={[styles.content, { paddingTop: styles.content.padding + insets.top, paddingBottom: styles.content.padding + insets.bottom }]}
      keyboardShouldPersistTaps="handled"
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={t.color.identity.primary} />}>
      <View style={styles.headerRow}>
        <Text spec={text(t, { role: 'bodyStrong' })} style={{ fontSize: 22 }}>Condições de Saúde</Text>
        {!open ? <Button label="Adicionar" onPress={startNew} /> : null}
      </View>

      {open ? (
        <View style={[styles.card, card, { gap: 12 }]}>
          <Text spec={text(t, { role: 'bodyStrong' })}>{editing ? 'Editar condição' : 'Nova condição'}</Text>
          <View style={styles.chips}>
            {(['propria', 'familiar'] as ConditionScope[]).map(sc => {
              const on = scope === sc
              return (
                <Pressable key={sc} onPress={() => setScope(sc)} style={[styles.chip, { borderColor: on ? t.color.identity.primary : t.color.border.default, backgroundColor: on ? t.color.badge.info.soft : 'transparent' }]}>
                  <Text spec={text(t, { role: 'caption', tone: on ? 'default' : 'muted' })}>{sc === 'propria' ? 'Minha' : 'De um familiar'}</Text>
                </Pressable>
              )
            })}
          </View>
          <Input value={name} onChangeText={setName} placeholder="Nome da condição (ex.: Hipotireoidismo)" />
          {scope === 'familiar' ? <Input value={relative} onChangeText={setRelative} placeholder="Familiar (ex.: mãe)" /> : null}
          <Input value={since} onChangeText={setSince} placeholder="Desde (ex.: 2019, infância)" />
          <Input value={notes} onChangeText={setNotes} placeholder="Observações…" multiline style={{ minHeight: 70, textAlignVertical: 'top' }} />
          <Button label={fileUrl ? 'Anexo adicionado ✓ (trocar)' : 'Anexar documento (opcional)'} variant="secondary" onPress={pickFile} loading={uploading} loadingLabel="Enviando…" />
          <View style={styles.actions}>
            <Button label="Cancelar" variant="secondary" onPress={() => setOpen(false)} />
            <Button label="Salvar" onPress={save} loading={saving} loadingLabel="Salvando…" />
          </View>
        </View>
      ) : null}

      {/* Agrupado por escopo (paridade Web: "Minhas condições" × "Histórico familiar"), cada seção com vazio próprio. */}
      {(['propria', 'familiar'] as const).map(sc => {
        const group = items.filter(c => c.scope === sc)
        if (open && group.length === 0) return null
        return (
          <View key={sc} style={{ gap: 8 }}>
            <Text spec={text(t, { role: 'label', tone: 'muted' })}>{sc === 'propria' ? 'MINHAS CONDIÇÕES' : 'HISTÓRICO FAMILIAR'}</Text>
            {group.length === 0 ? (
              <Text spec={text(t, { role: 'caption', tone: 'muted' })}>{sc === 'propria' ? 'Nenhuma registrada.' : 'Nenhum registrado.'}</Text>
            ) : group.map(c => (
              <View key={c.id} style={[styles.card, card, { gap: 4 }]}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Text spec={text(t, { role: 'body' })} style={{ flex: 1, paddingRight: 8 }}>{c.name}</Text>
                  <Pressable onPress={() => startEdit(c)}><Text spec={text(t, { role: 'caption' })} style={{ color: t.color.identity.primary }}>Editar</Text></Pressable>
                </View>
                <Text spec={text(t, { role: 'caption', tone: 'muted' })}>
                  {c.scope === 'familiar' ? `Familiar${c.relative ? `: ${c.relative}` : ''}` : 'Minha'}{c.since_label ? ` · desde ${c.since_label}` : ''}
                </Text>
                {c.notes ? <Text spec={text(t, { role: 'caption', tone: 'muted' })}>{c.notes}</Text> : null}
                {c.file_url ? (
                  <Pressable onPress={() => Linking.openURL(c.file_url as string)}>
                    <Text spec={text(t, { role: 'caption' })} style={{ color: t.color.identity.primary }}>Documento anexado →</Text>
                  </Pressable>
                ) : null}
                <Pressable onPress={() => remove(c)} style={{ alignSelf: 'flex-start', marginTop: 4 }}>
                  <Text spec={text(t, { role: 'caption' })} style={{ color: t.color.badge.error.text }}>Excluir</Text>
                </Pressable>
              </View>
            ))}
          </View>
        )
      })}

      <Text spec={text(t, { role: 'caption', tone: 'faint' })}>
        A SINTERA registra o que você informa, de forma factual — não é diagnóstico nem avaliação clínica (RDC 657/2022).
      </Text>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  content: { padding: 20, gap: 14 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 12 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  card: { borderWidth: 1, borderRadius: 16, padding: 16 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8 },
})
