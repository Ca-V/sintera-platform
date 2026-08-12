import { useState } from 'react'
import { View, Text, Pressable } from 'react-native'
import { useRouter } from 'expo-router'
import { Screen, Card, Button, Field } from '@/components/ui'
import { api, ApiError } from '@/lib/api'
import { DOMAIN_LABEL } from '@/lib/omics'
import { colors, spacing, radius, font } from '@/lib/theme'

// Criação de painel ômico — POST /api/omics/panels { domain, laboratory?, technology?,
// collectedOn? } → { id }. Depois o usuário adiciona o laudo por foto no detalhe.
export default function OmicaNewScreen() {
  const router = useRouter()
  const [domain, setDomain] = useState('metabolomics')
  const [laboratory, setLaboratory] = useState('')
  const [collectedOn, setCollectedOn] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit() {
    setBusy(true)
    setError(null)
    try {
      const { id } = await api.post<{ id: string }>('/api/omics/panels', {
        domain,
        laboratory: laboratory.trim() || null,
        collectedOn: collectedOn.trim() || null,
      })
      // Vai direto ao detalhe do painel recém-criado para adicionar o laudo.
      router.replace(`/(app)/omica/${id}`)
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Não foi possível criar o painel.')
      setBusy(false)
    }
  }

  return (
    <Screen title="Novo painel" back>
      <Card>
        <View style={{ gap: spacing.md }}>
          <View style={{ gap: spacing.xs }}>
            <Text style={{ fontSize: font.size.xs, color: colors.mauve, textTransform: 'uppercase' }}>Domínio</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs }}>
              {Object.entries(DOMAIN_LABEL).map(([value, label]) => {
                const active = domain === value
                return (
                  <Pressable
                    key={value}
                    onPress={() => setDomain(value)}
                    style={{
                      paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: radius.full,
                      borderWidth: 1, borderColor: active ? colors.petal : colors.border,
                      backgroundColor: active ? colors.petal : 'transparent',
                    }}
                  >
                    <Text style={{ color: active ? '#fff' : colors.onyx, fontSize: font.size.sm }}>{label}</Text>
                  </Pressable>
                )
              })}
            </View>
          </View>
          <Field label="Laboratório" value={laboratory} onChangeText={setLaboratory} placeholder="Opcional" />
          <Field label="Data da coleta" value={collectedOn} onChangeText={setCollectedOn} placeholder="AAAA-MM-DD" />
          {error && <Text style={{ color: colors.red, fontSize: font.size.sm }}>{error}</Text>}
          <Button label="Criar painel" onPress={submit} loading={busy} />
        </View>
      </Card>
    </Screen>
  )
}
