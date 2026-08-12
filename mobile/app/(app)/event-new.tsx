import { useState } from 'react'
import { View, Text, Pressable, Switch } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Screen, Card, Button, Field } from '@/components/ui'
import { api, ApiError } from '@/lib/api'
import { colors, spacing, radius, font } from '@/lib/theme'

// Criação de evento na Agenda — POST /api/agenda { type, title, date, ... }. A validação
// e a máquina de estados são do domínio (servidor); aqui é só o formulário.
const TYPES = [
  { value: 'consulta', label: 'Consulta' },
  { value: 'retorno', label: 'Retorno' },
  { value: 'exame', label: 'Exame' },
  { value: 'procedimento', label: 'Procedimento' },
  { value: 'vacina', label: 'Vacina' },
  { value: 'medicamento', label: 'Medicamento' },
  { value: 'outro', label: 'Outro' },
]

export default function EventNewScreen() {
  const router = useRouter()
  // Params de edição (vindos do menu de ações da Agenda). Sem `id` = criação.
  const p = useLocalSearchParams<{
    id?: string; type?: string; title?: string; date?: string; time?: string
    professionalName?: string; establishment?: string; notes?: string
  }>()
  const editingId = p.id ?? null
  const [type, setType] = useState(p.type || 'consulta')
  const [title, setTitle] = useState(p.title ?? '')
  const [date, setDate] = useState(p.date ?? '')
  const [time, setTime] = useState(p.time ?? '')
  const [professionalName, setProfessionalName] = useState(p.professionalName ?? '')
  const [establishment, setEstablishment] = useState(p.establishment ?? '')
  const [notes, setNotes] = useState(p.notes ?? '')
  const [reminderEnabled, setReminderEnabled] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit() {
    setSaving(true)
    setError(null)
    try {
      await api.post('/api/agenda', {
        ...(editingId ? { id: editingId } : {}),
        type,
        title: title.trim(),
        date: date.trim(),
        time: time.trim() || null,
        professionalName: professionalName.trim() || null,
        establishment: establishment.trim() || null,
        notes: notes.trim() || null,
        reminderEnabled,
      })
      router.back()
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Não foi possível salvar o evento.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Screen title={editingId ? 'Editar evento' : 'Novo evento'} back>
      <Card>
        <View style={{ gap: spacing.md }}>
          <View style={{ gap: spacing.xs }}>
            <Text style={{ fontSize: font.size.xs, color: colors.mauve, textTransform: 'uppercase' }}>Tipo</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs }}>
              {TYPES.map((t) => {
                const active = type === t.value
                return (
                  <Pressable
                    key={t.value}
                    onPress={() => setType(t.value)}
                    style={{
                      paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: radius.full,
                      borderWidth: 1, borderColor: active ? colors.petal : colors.border,
                      backgroundColor: active ? colors.petal : 'transparent',
                    }}
                  >
                    <Text style={{ color: active ? '#fff' : colors.onyx, fontSize: font.size.sm }}>{t.label}</Text>
                  </Pressable>
                )
              })}
            </View>
          </View>
          <Field label="Título" value={title} onChangeText={setTitle} placeholder="Ex.: Consulta com cardiologista" />
          <Field label="Data" value={date} onChangeText={setDate} placeholder="AAAA-MM-DD" />
          <Field label="Horário" value={time} onChangeText={setTime} placeholder="HH:MM (opcional)" />
          <Field label="Profissional" value={professionalName} onChangeText={setProfessionalName} placeholder="Opcional" />
          <Field label="Local" value={establishment} onChangeText={setEstablishment} placeholder="Opcional" />
          <Field label="Observações" value={notes} onChangeText={setNotes} multiline />
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: font.size.md, color: colors.onyx }}>Lembrete</Text>
              <Text style={{ fontSize: font.size.sm, color: colors.mauve, marginTop: 2 }}>Aviso por e-mail no dia anterior</Text>
            </View>
            <Switch value={reminderEnabled} onValueChange={setReminderEnabled} trackColor={{ true: colors.petal, false: colors.border }} />
          </View>
          {error && <Text style={{ color: colors.red, fontSize: font.size.sm }}>{error}</Text>}
          <Button label={editingId ? 'Salvar alterações' : 'Salvar evento'} onPress={submit} loading={saving} disabled={!title.trim() || !date.trim()} />
        </View>
      </Card>
    </Screen>
  )
}
