// PERFIL PROFISSIONAL — a identificação de quem acompanha.
//
// CARE-003. PARIDADE com a Web (/dashboard/perfil-profissional): campos, ordem, rótulos e regras vêm do core.
//
// "Um login, uma pessoa, dois perfis, duas assinaturas" (decisão da fundadora). Esta tela cria o SEGUNDO
// perfil dentro da MESMA conta.
//
// O QUE ELA NÃO FAZ: atestar. `status_verificacao` não é enviado — o default do banco manda, e a policy de
// update proíbe alterá-lo, inclusive pelo próprio dono da conta.
import { useCallback, useEffect, useRef, useState } from 'react'
import { ScrollView, View, ActivityIndicator, StyleSheet } from 'react-native'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { heading, text } from '@sintera/design-system'
import {
  SCREEN_COPY, nomeDaProfissao, conselhoDe, exigeConselho, type Profissao,
} from '@sintera/core'
import { Text, Input, Button, FieldRow } from '../../primitives'
import { useTheme } from '../../theme'
import { apiClient } from '../../../infrastructure/apiClient'
import type { MaisStackParamList } from '../../navigation/types'

const C = SCREEN_COPY.perfilProfissional
const PROFISSOES: Profissao[] = ['medico', 'nutricionista', 'educador_fisico', 'fisioterapeuta', 'outro']

type Props = NativeStackScreenProps<MaisStackParamList, 'PerfilProfissional'>

export function PerfilProfissionalScreen({ route, navigation }: Props) {
  const token = route.params?.token
  const t = useTheme()
  const insets = useSafeAreaInsets()

  const [phase, setPhase] = useState<'loading' | 'ready'>('loading')
  const [jaTem, setJaTem] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  const [nome, setNome] = useState('')
  const [profissao, setProfissao] = useState<Profissao>('medico')
  const [especialidade, setEspecialidade] = useState('')
  const [registro, setRegistro] = useState('')
  const [uf, setUf] = useState('')
  const alive = useRef(true)

  useEffect(() => () => { alive.current = false }, [])

  const carregar = useCallback(async () => {
    try {
      const p = await apiClient.care.getPerfilProfissional()
      if (alive.current) setJaTem(p !== null)
    } catch (e) {
      if (alive.current) setErro(e instanceof Error ? e.message : 'Não consegui verificar seu perfil.')
    } finally {
      if (alive.current) setPhase('ready')
    }
  }, [])

  useEffect(() => { void carregar() }, [carregar])

  const conselho = conselhoDe(profissao)

  // Depois de criar, volta para o convite que trouxe a pessoa até aqui — ou para o painel, quando ela chegou
  // por conta própria. Perder o convite neste ponto seria repetir o defeito que a correção inteira ataca.
  const seguir = () => {
    if (token) navigation.replace('ConviteRecebido', { token })
    else navigation.replace('PainelProfissional')
  }

  const salvar = async () => {
    if (!nome.trim() || salvando) return
    setSalvando(true)
    setErro(null)
    try {
      await apiClient.care.criarPerfilProfissional({
        nomeProfissional: nome,
        profissao,
        especialidade,
        conselho,
        registroNumero: registro,
        registroUf: uf,
      })
      if (alive.current) seguir()
    } catch (e) {
      if (alive.current) setErro(e instanceof Error ? e.message : 'Não consegui criar o perfil.')
    } finally {
      if (alive.current) setSalvando(false)
    }
  }

  return (
    <ScrollView
      style={{ backgroundColor: t.color.surface.app }}
      contentContainerStyle={[styles.content, { paddingBottom: styles.content.padding + insets.bottom }]}
    >
      <Text spec={heading(t, { level: 'page' })}>{C.title}</Text>
      <Text spec={text(t, { role: 'caption', tone: 'muted' })}>{C.subtitle}</Text>

      {phase === 'loading' && <ActivityIndicator color={t.color.text.muted} />}

      {phase === 'ready' && jaTem && (
        <View style={[styles.card, { backgroundColor: t.color.surface.base, borderColor: t.color.border.default }]}>
          <Text spec={text(t, { role: 'body' })}>{C.existingNote}</Text>
          <Button label={SCREEN_COPY.painelProfissional.title} onPress={seguir} />
        </View>
      )}

      {phase === 'ready' && !jaTem && (
        <View style={[styles.card, { backgroundColor: t.color.surface.base, borderColor: t.color.border.default }]}>
          <FieldRow label={C.fieldNome}>
            <Input value={nome} onChangeText={setNome} />
          </FieldRow>

          {/* Sem `<select>` nativo: a escolha é por toque, e o rótulo de cada profissão vem do core. */}
          <FieldRow label={C.fieldProfissao}>
            <View style={{ gap: 6 }}>
              {PROFISSOES.map(p => (
                <Button key={p} label={`${p === profissao ? '● ' : '○ '}${nomeDaProfissao(p)}`}
                  onPress={() => setProfissao(p)} />
              ))}
            </View>
          </FieldRow>

          <FieldRow label={C.fieldEspecialidade}>
            <Input value={especialidade} onChangeText={setEspecialidade} />
          </FieldRow>

          {/* O conselho não é escolhido: DECORRE da profissão, e quem sabe isso é o core. Deixar escolher
              abriria a porta para nutricionista com CRM. */}
          {exigeConselho(profissao) && (
            <>
              <FieldRow label={C.fieldConselho}>
                <Text spec={text(t, { role: 'body' })}>{conselho ?? '—'}</Text>
              </FieldRow>
              <FieldRow label={C.fieldRegistro}>
                <Input value={registro} onChangeText={setRegistro} autoCapitalize="characters" />
              </FieldRow>
              <FieldRow label={C.fieldUf}>
                <Input value={uf} onChangeText={(v) => setUf(v.toUpperCase().slice(0, 2))} maxLength={2}
                  autoCapitalize="characters" />
              </FieldRow>
            </>
          )}

          {/* Dito ANTES de criar, não descoberto depois — e é o que o vocabulário regulatório exige. */}
          <Text spec={text(t, { role: 'caption', tone: 'muted' })}>{C.verifyNote}</Text>

          {erro && <Text spec={text(t, { role: 'caption', tone: 'muted' })}>{erro}</Text>}

          <Button label={C.save} onPress={() => { void salvar() }} disabled={!nome.trim() || salvando} />
        </View>
      )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  content: { padding: 24, gap: 16 },
  card: { padding: 16, borderRadius: 12, borderWidth: 1, gap: 12 },
})
