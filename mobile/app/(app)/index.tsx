import { View, Text, ScrollView, Pressable } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter, type Href } from 'expo-router'
import { useAuth } from '@/lib/auth'
import { colors, spacing, radius, font } from '@/lib/theme'

// Hub central: agrupa os módulos por seção e empurra cada tela na pilha.
// Mesma informação da Web, reorganizada para toque. As telas consomem as rotas /api.
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
    title: 'Conta',
    items: [
      { label: 'Perfil', desc: 'Seus dados e sessão', route: '/(app)/profile' },
    ],
  },
]

export default function Home() {
  const { user } = useAuth()
  const router = useRouter()
  const name = user?.email?.split('@')[0] ?? 'por aqui'

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.ivory }} edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: spacing.xl, gap: spacing.xl, paddingBottom: spacing.xxl }}>
        <View style={{ gap: spacing.xs }}>
          <Text style={{ fontSize: font.size.xxl, fontWeight: font.weight.semibold, color: colors.onyx }}>
            Olá, {name} 👋
          </Text>
          <Text style={{ fontSize: font.size.md, color: colors.mauve }}>
            Sua saúde organizada, no seu bolso.
          </Text>
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
                style={{
                  backgroundColor: colors.cream,
                  borderRadius: radius.lg,
                  borderWidth: 1,
                  borderColor: colors.border,
                  padding: spacing.lg,
                }}
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
