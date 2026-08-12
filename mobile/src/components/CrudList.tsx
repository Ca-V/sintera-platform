// CRUD genérico de recurso de lista (Mobile). Casa com `useResource` + `ui`.
// Cada tela de módulo declara só: título, endpoint/listKey/editMethod, os campos do
// formulário e como renderizar um item. A mecânica (carregar, criar, editar, remover,
// estados de loading/saving/erro, confirmação de exclusão) mora aqui — espelha a
// divisão da Web (hook possui o recurso; a tela declara o formulário e a linha).
import { useState } from 'react'
import { View, Text, Pressable, Alert, FlatList, RefreshControl } from 'react-native'
import { Screen, Card, Button, Field, Loading } from './ui'
import { useResource } from '@/lib/useResource'
import { colors, spacing, radius, font } from '@/lib/theme'

export interface FieldDef {
  key: string
  label: string
  placeholder?: string
  keyboardType?: 'default' | 'numeric' | 'email-address'
  multiline?: boolean
  /** Opções fixas (vira seletor de chips). */
  options?: { value: string; label: string }[]
}

export interface CrudConfig<T> {
  title: string
  endpoint: string
  listKey: string
  editMethod?: 'PATCH' | 'POST'
  fields: FieldDef[]
  /** id do item. */
  idOf: (item: T) => string
  /** Preenche o formulário ao editar. */
  toForm: (item: T) => Record<string, string>
  /** Título/subtítulo da linha. */
  renderItem: (item: T) => { title: string; subtitle?: string }
  /** Rótulo do botão de criar. Default: "Adicionar". */
  addLabel?: string
  emptyText?: string
  /** Recurso só de criação (a rota não expõe edição, ex.: sinais-vitais). Toque na
   *  linha não abre edição — evita criar duplicata. */
  noEdit?: boolean
  /** Conteúdo extra no topo (ex.: botão de escanear por foto). Recebe `reload` para
   *  atualizar a lista após uma escrita fora do formulário padrão. */
  headerExtra?: (reload: () => Promise<void>) => React.ReactNode
}

type FormState = Record<string, string>

function initialForm(fields: FieldDef[]): FormState {
  const f: FormState = {}
  for (const field of fields) f[field.key] = field.options?.[0]?.value ?? ''
  return f
}

export function CrudList<T>({ config }: { config: CrudConfig<T> }) {
  const { items, loading, saving, busyId, error, reload, save, remove } =
    useResource<T>({ endpoint: config.endpoint, listKey: config.listKey, editMethod: config.editMethod })
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>(() => initialForm(config.fields))

  function openCreate() {
    setEditingId(null)
    setForm(initialForm(config.fields))
    setShowForm(true)
  }
  function openEdit(item: T) {
    setEditingId(config.idOf(item))
    setForm({ ...initialForm(config.fields), ...config.toForm(item) })
    setShowForm(true)
  }
  async function submit() {
    const ok = await save(form, editingId)
    if (ok) { setShowForm(false); setEditingId(null) }
  }
  function confirmRemove(item: T) {
    const id = config.idOf(item)
    Alert.alert('Remover', 'Deseja remover este item?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Remover', style: 'destructive', onPress: () => remove(id) },
    ])
  }
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }))

  return (
    <Screen title={config.title} back scroll={false}>
      <FlatList
        data={items}
        keyExtractor={(item) => config.idOf(item)}
        contentContainerStyle={{ padding: spacing.xl, paddingTop: spacing.sm, gap: spacing.sm, paddingBottom: spacing.xxl }}
        refreshControl={<RefreshControl refreshing={loading && items.length > 0} onRefresh={reload} tintColor={colors.petal} />}
        ListHeaderComponent={
          <View style={{ gap: spacing.md, marginBottom: spacing.sm }}>
            {!showForm && config.headerExtra ? config.headerExtra(reload) : null}
            {showForm ? (
              <Card>
                <View style={{ gap: spacing.md }}>
                  {config.fields.map((f) =>
                    f.options ? (
                      <View key={f.key} style={{ gap: spacing.xs }}>
                        <Text style={{ fontSize: font.size.xs, color: colors.mauve, textTransform: 'uppercase' }}>{f.label}</Text>
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs }}>
                          {f.options.map((o) => {
                            const active = form[f.key] === o.value
                            return (
                              <Pressable
                                key={o.value}
                                onPress={() => set(f.key, o.value)}
                                style={{
                                  paddingHorizontal: spacing.md, paddingVertical: spacing.xs,
                                  borderRadius: radius.full, borderWidth: 1,
                                  borderColor: active ? colors.petal : colors.border,
                                  backgroundColor: active ? colors.petal : 'transparent',
                                }}
                              >
                                <Text style={{ color: active ? '#fff' : colors.onyx, fontSize: font.size.sm }}>{o.label}</Text>
                              </Pressable>
                            )
                          })}
                        </View>
                      </View>
                    ) : (
                      <Field
                        key={f.key}
                        label={f.label}
                        value={form[f.key]}
                        onChangeText={(v) => set(f.key, v)}
                        placeholder={f.placeholder}
                        keyboardType={f.keyboardType}
                        multiline={f.multiline}
                      />
                    )
                  )}
                  {error && <Text style={{ color: colors.red, fontSize: font.size.sm }}>{error}</Text>}
                  <View style={{ flexDirection: 'row', gap: spacing.sm }}>
                    <View style={{ flex: 1 }}>
                      <Button label={editingId ? 'Salvar' : 'Adicionar'} onPress={submit} loading={saving} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Button label="Cancelar" variant="ghost" onPress={() => { setShowForm(false); setEditingId(null) }} />
                    </View>
                  </View>
                </View>
              </Card>
            ) : (
              <Button label={config.addLabel ?? 'Adicionar'} onPress={openCreate} />
            )}
          </View>
        }
        ListEmptyComponent={
          loading ? <Loading /> : (
            <Text style={{ color: colors.mauve, fontSize: font.size.sm }}>
              {error ?? config.emptyText ?? 'Nada por aqui ainda.'}
            </Text>
          )
        }
        renderItem={({ item }) => {
          const row = config.renderItem(item)
          const id = config.idOf(item)
          return (
            <Pressable onPress={() => { if (!config.noEdit) openEdit(item) }} disabled={config.noEdit}>
              <Card>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: font.size.md, fontWeight: font.weight.medium, color: colors.onyx }}>{row.title}</Text>
                    {row.subtitle ? <Text style={{ fontSize: font.size.sm, color: colors.mauve, marginTop: 2 }}>{row.subtitle}</Text> : null}
                  </View>
                  <Pressable onPress={() => confirmRemove(item)} hitSlop={10} disabled={busyId === id}>
                    <Text style={{ color: colors.red, fontSize: font.size.sm, opacity: busyId === id ? 0.4 : 1 }}>Remover</Text>
                  </Pressable>
                </View>
              </Card>
            </Pressable>
          )
        }}
      />
    </Screen>
  )
}
