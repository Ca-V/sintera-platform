import { useCallback, useState } from 'react'
import { View, Text, ScrollView, Pressable, RefreshControl } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter, useFocusEffect, type Href } from 'expo-router'
import { useAuth } from '@/lib/auth'
import { api } from '@/lib/api'
import { colors, spacing, radius, font } from '@/lib/theme'

// Home com dados (espelha o dashboard Web): saudação, próximo evento e resumo (exames +
// biomarcadores), seguidos dos atalhos de módulo. Consome as rotas /api via Bearer.
type Link = { label: string; desc: string; route: Href }

const SECTIONS: { title: string; items: Link[] }[] = [
  {
    title: 'Jornada',
    items: [
      { label: 'Agenda', desc: 'Próximos eventos', route: '/(app)/agenda' },
      { label: 'Histórico', desc: 'Eventos passados', route: '/(app)/timeline' },
      { label: 'Gastos', desc: 'Despesas de saúde', route: '/(app)/gastos' },
    ],
  },
  {
    title: 'Saúde',
    items: [
      { label: 'Exames', desc: 'Laudos e extração de dados', route: '/(app)/exams' },
      { label: 'Indicadores', desc: 'Biomarcadores dos exames', route: '/(app)/saude' },
      { label: 'Ômica', desc: 'Metaboloma, proteoma, microbioma…', route: '/(app)/omica' },
      { label: 'Condições', desc: 'Próprias e familiares', route: '/(app)/condicoes' },
      { label: 'Sinais vitais', desc: 'Pressão, glicemia, saturação…', route: '/(app)/sinais-vitais' },
      { label: 'Medidas', desc: 'Peso, composição corporal', route: '/(app)/medidas' },
      { label: 'Ciclo', desc: 'Menstruação e contracepção', route: '/(app)/ciclo' },
      { label: 'Medicamentos', desc: 'Uso e recompra', route: '/(app)/medicamentos' },
      { label: 'Recursos', desc: 'Dispositivos e órteses', route: '/(app)/recursos' },
      { label: 'Hábitos', desc: 'Rotina e estilo de vida', route: '/(app)/habitos' },
    ],
  },
  {
    title: 'Compartilhar',
    items: [
      { label: 'Relatório', desc: 'Link seguro para profissionais', route: '/(app)/relatorio' },
    ],
  },
  {
    title: 'Conta',
    items: [
      { label: 'Perfil', desc: 'Seus dados e sessão', route: '/(app)/profile' },
    ],
  },
]

interface NextEvent { title: string; date: string; time: string | null }
interface Summary { exams: number; processed: number; biomarkers: number; nextEvent: NextEvent | null }

function greeting(): string {
  const h = new Date().getHours()
  return h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite'
}
function eventDateLabel(e: NextEvent): string {
  const d = new Date(`${e.date}T00:00:00`).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
  return e.time ? `${d} · ${e.time.slice(0, 5)}` : d
}

export default function Home() {
  const { user } = useAuth()
  const router = useRouter()
  const name = user?.email?.split('@')[0] ?? 'por aqui'
  const [summary, setSummary] = useState<Summary | null>(null)

  const load = useCallback(async () => {
    // Cada fonte é tolerante a falha — a home nunca quebra por um endpoint indisponível.
    const [exams, upcoming, organized] = await Promise.all([
      api.get<{ exams: { status: string }[] }>('/api/exams').catch(() => ({ exams: [] })),
      api.get<{ events: NextEvent[] }>('/api/agenda?view=upcoming').catch(() => ({ events: [] })),
      api.get<{ counts?: { total: number } }>('/api/biomarkers/organized').catch(() => ({ counts: { total: 0 } })),
    ])
    const list = exams.exams ?? []
    setSummary({
      exams: list.length,
      processed: list.filter((e) => e.status === 'processed').length,
      biomarkers: organized.counts?.total ?? 0,
      nextEvent: upcoming.events?.[0] ?? null,
    })
  }, [])

  useFocusEffect(useCallback(() => { load() }, [load]))

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.ivory }} edges={['top']}>
      <ScrollView
        contentContainerStyle={{ padding: spacing.xl, gap: spacing.xl, paddingBottom: spacing.xxl }}
        refreshControl={<RefreshControl refreshing={false} onRefresh={load} tintColor={colors.petal} />}
      >
        <View style={{ gap: spacing.xs }}>
          <Text style={{ fontSize: font.size.xxl, fontWeight: font.weight.semibold, color: colors.onyx }}>
            {greeting()}, {name} 👋
          </Text>
          <Text style={{ fontSize: font.size.md, color: colors.mauve }}>
            Sua saúde organizada, no seu bolso.
          </Text>
        </View>

        {/* Próximo evento */}
        <Pressable onPress={() => router.push('/(app)/agenda')}>
          <View style={{ backgroundColor: colors.blush, borderRadius: radius.lg, padding: spacing.lg, borderWidth: 1, borderColor: colors.border }}>
            <Text style={{ fontSize: font.size.xs, color: colors.petal, textTransform: 'uppercase', letterSpacing: 1 }}>Próximo evento</Text>
            {summary?.nextEvent ? (
              <>
                <Text style={{ fontSize: font.size.md, fontWeight: font.weight.medium, color: colors.onyx, marginTop: spacing.xs }}>
                  {summary.nextEvent.title}
                </Text>
                <Text style={{ fontSize: font.size.sm, color: colors.mauve, marginTop: 2 }}>{eventDateLabel(summary.nextEvent)}</Text>
              </>
            ) : (
              <Text style={{ fontSize: font.size.sm, color: colors.mauve, marginTop: spacing.xs }}>
                {summary ? 'Nenhum evento agendado.' : 'Carregando…'}
              </Text>
            )}
          </View>
        </Pressable>

        {/* Resumo */}
        <View style={{ flexDirection: 'row', gap: spacing.md }}>
          <Stat label="Exames" value={summary ? `${summary.processed}/${summary.exams}` : '—'} hint="processados" onPress={() => router.push('/(app)/exams')} />
          <Stat label="Indicadores" value={summary ? String(summary.biomarkers) : '—'} hint="biomarcadores" onPress={() => router.push('/(app)/saude')} />
        </View>

        {SECTIONS.map((section) => (
          <View key={section.title} style={{ gap: spacing.md }}>
            <Text style={{ fontSize: font.size.xs, color: colors.mauve, textTransform: 'uppercase', letterSpacing: 1 }}>
              {section.title}
            </Text>
            {section.items.map((q) => (
              <Pressable
                key={q.label}
                onPress={() => router.push(q.route)}
                style={{ backgroundColor: colors.cream, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.lg }}
              >
                <Text style={{ fontSize: font.size.md, fontWeight: font.weight.semibold, color: colors.onyx }}>{q.label}</Text>
                <Text style={{ fontSize: font.size.sm, color: colors.mauve, marginTop: 2 }}>{q.desc}</Text>
              </Pressable>
            ))}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  )
}

function Stat({ label, value, hint, onPress }: { label: string; value: string; hint: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={{ flex: 1, backgroundColor: colors.cream, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.lg }}>
      <Text style={{ fontSize: font.size.xs, color: colors.mauve, textTransform: 'uppercase' }}>{label}</Text>
      <Text style={{ fontSize: font.size.xl, fontWeight: font.weight.semibold, color: colors.onyx, marginTop: spacing.xs }}>{value}</Text>
      <Text style={{ fontSize: font.size.xs, color: colors.mauve }}>{hint}</Text>
    </Pressable>
  )
}
