// Lista de biomarcadores organizados por categoria — consome GET /api/biomarkers/organized
// (mesmo objeto canônico da Web). `examId` opcional: sem ele agrega a pessoa toda (scope=user);
// com ele organiza um exame (scope=exam). Sem juízo clínico: categorias + faixa aritmética.
import { useCallback, useEffect, useState } from 'react'
import { View, Text, SectionList, RefreshControl } from 'react-native'
import { Card, Loading } from './ui'
import { api, ApiError } from '@/lib/api'
import { colors, spacing, radius, font } from '@/lib/theme'

type RangeStatus = 'below' | 'above' | 'within' | 'no_reference' | 'non_numeric'
interface Biomarker {
  id: string
  name: string
  displayName: string | null
  value: number | null
  valueText: string | null
  unit: string | null
  rangeStatus: RangeStatus
}
interface Organized {
  byCategory: Record<string, Biomarker[]>
  counts: { total: number; categories: number; outOfRange: number }
}

const CATEGORY_LABEL: Record<string, string> = {
  hematologia_vermelha: 'Série vermelha',
  hematologia_branca_plaquetas: 'Série branca e plaquetas',
  coagulacao: 'Coagulação',
  metabolismo_ferro: 'Metabolismo do ferro',
  metabolismo_glicose: 'Metabolismo da glicose',
  funcao_tireoidiana: 'Função tireoidiana',
  inflamacao_imunologia: 'Inflamação e imunologia',
  funcao_hepatica_proteinas: 'Função hepática e proteínas',
  funcao_renal_eletrolitos: 'Função renal e eletrólitos',
  urina_24h: 'Urina 24h',
  vitaminas_minerais: 'Vitaminas e minerais',
  hormonios_sexuais_reprodutivo: 'Hormônios e reprodutivo',
  cardiometabolico: 'Cardiometabólico',
  urinalise_eas: 'Urinálise (EAS)',
}
const STATUS_COLOR: Record<RangeStatus, string> = {
  below: colors.gold, above: colors.red, within: colors.sage,
  no_reference: colors.border, non_numeric: colors.border,
}

function valueLabel(b: Biomarker): string {
  const v = b.valueText ?? (b.value != null ? String(b.value) : '—')
  return b.unit ? `${v} ${b.unit}` : v
}

export function BiomarkerList({ examId, emptyText }: { examId?: string; emptyText?: string }) {
  const [sections, setSections] = useState<{ title: string; data: Biomarker[] }[]>([])
  const [counts, setCounts] = useState<Organized['counts'] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setError(null)
    try {
      const qs = examId ? `?examId=${encodeURIComponent(examId)}` : ''
      const data = await api.get<Organized>(`/api/biomarkers/organized${qs}`)
      const secs = Object.entries(data.byCategory ?? {})
        .filter(([, list]) => list.length > 0)
        .map(([cat, list]) => ({ title: CATEGORY_LABEL[cat] ?? cat, data: list }))
      setSections(secs)
      setCounts(data.counts ?? null)
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Não foi possível carregar os indicadores.')
    } finally {
      setLoading(false)
    }
  }, [examId])

  useEffect(() => { load() }, [load])

  return (
    <SectionList
      sections={sections}
      keyExtractor={(b) => b.id}
      contentContainerStyle={{ padding: spacing.xl, paddingTop: spacing.sm, paddingBottom: spacing.xxl }}
      refreshControl={<RefreshControl refreshing={loading && sections.length > 0} onRefresh={load} tintColor={colors.petal} />}
      ListHeaderComponent={
        counts ? (
          <Text style={{ color: colors.mauve, fontSize: font.size.sm, marginBottom: spacing.md }}>
            {counts.total} indicadores · {counts.outOfRange} fora da faixa impressa
          </Text>
        ) : null
      }
      ListEmptyComponent={
        loading ? <Loading /> : (
          <Text style={{ color: colors.mauve, fontSize: font.size.sm }}>
            {error ?? emptyText ?? 'Envie um exame para ver seus indicadores.'}
          </Text>
        )
      }
      renderSectionHeader={({ section }) => (
        <Text style={{ fontSize: font.size.xs, color: colors.mauve, textTransform: 'uppercase', letterSpacing: 1, marginTop: spacing.lg, marginBottom: spacing.xs }}>
          {section.title}
        </Text>
      )}
      renderItem={({ item }) => (
        <Card style={{ marginBottom: spacing.xs, paddingVertical: spacing.md }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
            <View style={{ width: 8, height: 8, borderRadius: radius.full, backgroundColor: STATUS_COLOR[item.rangeStatus] }} />
            <Text style={{ flex: 1, fontSize: font.size.md, color: colors.onyx }}>{item.displayName ?? item.name}</Text>
            <Text style={{ fontSize: font.size.sm, fontWeight: font.weight.medium, color: colors.onyx }}>{valueLabel(item)}</Text>
          </View>
        </Card>
      )}
    />
  )
}
