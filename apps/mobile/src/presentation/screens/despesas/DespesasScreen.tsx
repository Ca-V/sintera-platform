// Despesas (FB-008 — paridade Web /dashboard/gastos). PROJEÇÃO dos fatos com valor (eventos financeiros +
// exames-com-valor), agrupada por ano com total. Cada lançamento leva ao anexo fiscal e pode ser removido
// (evento → exclui; exame → limpa o valor, mantém o exame). Não cria registros próprios.
import { useState } from 'react'
import { ScrollView, View, ActivityIndicator, RefreshControl, Pressable, Linking, Alert, StyleSheet } from 'react-native'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { text } from '@sintera/design-system'
import { type HealthEvent, typeLabel, formatDateLongBR, expensesTotalCents, expenseDocLabel } from '@sintera/core'
import { Text, Button } from '../../primitives'
import { useTheme } from '../../theme'
import type { MaisStackParamList } from '../../navigation/types'
import { useDespesas } from './useDespesas'

type Props = NativeStackScreenProps<MaisStackParamList, 'Despesas'>

function fmtBRL(cents: number): string {
  return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export function DespesasScreen({ navigation }: Props) {
  const t = useTheme()
  const insets = useSafeAreaInsets()
  const d = useDespesas()
  const [view, setView] = useState<'data' | 'tipo'>('data')

  // Agrupa por tipo (mesma projeção, outra visão — paridade "Por tipo" da Web).
  const byType = (() => {
    const map = new Map<string, HealthEvent[]>()
    for (const e of d.items) { const k = typeLabel(e.type); const arr = map.get(k) ?? []; arr.push(e); map.set(k, arr) }
    return [...map.entries()].sort((a, b) => expensesTotalCents(b[1]) - expensesTotalCents(a[1])).map(([key, items]) => ({ key, items }))
  })()

  const parentNav = () => navigation.getParent() as { navigate: (n: string, p: unknown) => void } | undefined
  // Editar um lançamento de EVENTO (não-exame) → formulário de evento (na aba Agenda).
  const editEvent = (item: HealthEvent) => {
    if (item.id.startsWith('exam:')) return
    parentNav()?.navigate('Agenda', { screen: 'EventForm', params: { event: item } })
  }
  // Adicionar despesa (guia, paridade Web): a despesa é ATRIBUTO de um fato — cria-se pelo fato (evento com valor
  // ou medicamento). Despesa avulsa = novo evento com valor.
  const addExpense = () => Alert.alert('Adicionar despesa', 'A despesa é registrada no fato a que pertence.', [
    { text: 'Novo evento com valor', onPress: () => parentNav()?.navigate('Agenda', { screen: 'EventForm', params: {} }) },
    { text: 'Novo medicamento', onPress: () => parentNav()?.navigate('MinhaSaude', { screen: 'Medications' }) },
    { text: 'Cancelar', style: 'cancel' },
  ])

  if (d.phase === 'loading') {
    return (
      <View style={[styles.center, { backgroundColor: t.color.surface.app, paddingTop: insets.top }]}>
        <ActivityIndicator color={t.color.identity.primary} />
        <Text spec={text(t, { role: 'body', tone: 'muted' })}>Carregando as despesas…</Text>
      </View>
    )
  }
  if (d.phase === 'error') {
    return (
      <View style={[styles.center, { backgroundColor: t.color.surface.app, paddingTop: insets.top }]}>
        <Text spec={text(t, { role: 'body' })} style={{ color: t.color.badge.error.text, textAlign: 'center' }}>{d.error}</Text>
        <Button label="Tentar novamente" variant="secondary" onPress={d.retry} />
      </View>
    )
  }

  const confirmRemove = (item: HealthEvent) => {
    const isExam = item.id.startsWith('exam:')
    Alert.alert(isExam ? 'Remover valor' : 'Excluir despesa',
      isExam ? `Remover o valor pago de "${item.title}"? O exame é mantido; só o registro financeiro sai das Despesas.`
             : `Excluir "${item.title}" das suas despesas?`,
      [{ text: 'Cancelar', style: 'cancel' }, { text: isExam ? 'Remover valor' : 'Excluir', style: 'destructive', onPress: () => d.remove(item) }])
  }

  return (
    <ScrollView style={{ backgroundColor: t.color.surface.app }}
      contentContainerStyle={[styles.content, { paddingTop: styles.content.padding + insets.top, paddingBottom: styles.content.padding + insets.bottom }]}
      refreshControl={<RefreshControl refreshing={d.refreshing} onRefresh={d.refresh} tintColor={t.color.identity.primary} />}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <Text spec={text(t, { role: 'bodyStrong' })} style={{ fontSize: 22 }}>Despesas</Text>
        <Button label="Adicionar despesa" onPress={addExpense} />
      </View>
      <View style={[styles.totalCard, { backgroundColor: t.color.badge.info.soft, borderColor: t.color.border.default }]}>
        <Text spec={text(t, { role: 'label', tone: 'muted' })}>TOTAL</Text>
        <Text spec={text(t, { role: 'bodyStrong' })} style={{ fontSize: 24 }}>{fmtBRL(d.totalCents)}</Text>
      </View>

      {d.items.length > 0 ? (
        <View style={styles.toggle}>
          {(['data', 'tipo'] as const).map(v => {
            const on = view === v
            return (
              <Pressable key={v} onPress={() => setView(v)} style={[styles.toggleBtn, { borderColor: on ? t.color.identity.primary : t.color.border.default, backgroundColor: on ? t.color.badge.info.soft : 'transparent' }]}>
                <Text spec={text(t, { role: 'caption', tone: on ? 'default' : 'muted' })}>{v === 'data' ? 'Por data' : 'Por tipo'}</Text>
              </Pressable>
            )
          })}
        </View>
      ) : null}

      {d.items.length === 0 ? (
        <View style={[styles.card, { backgroundColor: t.color.surface.base, borderColor: t.color.border.default }]}>
          <Text spec={text(t, { role: 'body', tone: 'muted' })} style={{ textAlign: 'center' }}>
            Nenhuma despesa registrada. Valores aparecem aqui ao registrar o valor pago em um exame ou evento.
          </Text>
        </View>
      ) : null}

      {(view === 'data' ? d.byYear : byType).map(g => (
        <View key={g.key} style={{ gap: 8 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <Text spec={text(t, { role: 'label', tone: 'muted' })}>{g.key}</Text>
            <Text spec={text(t, { role: 'caption', tone: 'muted' })}>{fmtBRL(expensesTotalCents(g.items))}</Text>
          </View>
          {g.items.map(e => (
            <View key={e.id} style={[styles.row, { backgroundColor: t.color.surface.base, borderColor: t.color.border.default }]}>
              <View style={{ flex: 1, paddingRight: 8, gap: 2 }}>
                <Text spec={text(t, { role: 'body' })}>{e.title}</Text>
                <Text spec={text(t, { role: 'caption', tone: 'muted' })}>{typeLabel(e.type)} · {formatDateLongBR(e.date)}</Text>
                {e.attachmentUrl ? (
                  <Pressable onPress={() => Linking.openURL(e.attachmentUrl as string)}>
                    <Text spec={text(t, { role: 'caption' })} style={{ color: t.color.identity.primary }}>{expenseDocLabel(e.expenseDocType) ?? 'Documento'} →</Text>
                  </Pressable>
                ) : null}
              </View>
              <View style={{ alignItems: 'flex-end', gap: 4 }}>
                <Text spec={text(t, { role: 'bodyStrong' })}>{fmtBRL(e.amountCents ?? 0)}</Text>
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  {!e.id.startsWith('exam:') ? (
                    <>
                      <Pressable onPress={() => editEvent(e)}><Text spec={text(t, { role: 'caption' })} style={{ color: t.color.identity.primary }}>Editar</Text></Pressable>
                      <Pressable onPress={() => d.reopen(e)}><Text spec={text(t, { role: 'caption', tone: 'muted' })}>Reabrir</Text></Pressable>
                    </>
                  ) : null}
                  <Pressable onPress={() => confirmRemove(e)}><Text spec={text(t, { role: 'caption' })} style={{ color: t.color.badge.error.text }}>Remover</Text></Pressable>
                </View>
              </View>
            </View>
          ))}
        </View>
      ))}

      <Text spec={text(t, { role: 'caption', tone: 'faint' })}>
        Despesas é uma projeção dos fatos com valor (exames e eventos) — cada fato aparece uma vez. Não substitui documento fiscal oficial.
      </Text>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  content: { padding: 20, gap: 16 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 12 },
  card: { borderWidth: 1, borderRadius: 16, padding: 16 },
  totalCard: { borderWidth: 1, borderRadius: 16, padding: 16, gap: 2 },
  toggle: { flexDirection: 'row', gap: 8 },
  toggleBtn: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 6 },
  row: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', borderWidth: 1, borderRadius: 14, padding: 14 },
})
