// RESPONDER AO CONVITE — a tela que fechava a corrente.
//
// CARE-003. PARIDADE com a Web (/dashboard/convite/[token]): estados, frases e o que cada erro significa vêm
// do core. Só o mecanismo diverge.
//
// O QUE ESTA TELA NÃO FAZ: prometer. Ela não diz "aceito" antes de o banco confirmar, e quando não dá, diz
// POR QUE e o que fazer — a lição da homologação de 27/09, em que "tente de novo" mandava repetir o que nunca
// poderia funcionar.
import { useCallback, useEffect, useRef, useState } from 'react'
import { ScrollView, View, ActivityIndicator, StyleSheet } from 'react-native'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { heading, text } from '@sintera/design-system'
import {
  SCREEN_COPY, podeResponderConviteRecebido, rotuloDoConviteRecebido, quemConvidou,
  motivoDoAceite, fraseDoMotivo, temCaminho,
  type ConviteRecebido, type MotivoDoAceite,
} from '@sintera/core'
import { Text, Button } from '../../primitives'
import { useTheme } from '../../theme'
import { apiClient } from '../../../infrastructure/apiClient'
import type { MaisStackParamList } from '../../navigation/types'

const C = SCREEN_COPY.conviteRecebido

type Props = NativeStackScreenProps<MaisStackParamList, 'ConviteRecebido'>

export function ConviteRecebidoScreen({ route, navigation }: Props) {
  const { token } = route.params
  const t = useTheme()
  const insets = useSafeAreaInsets()

  const [convite, setConvite] = useState<ConviteRecebido | null>(null)
  const [phase, setPhase] = useState<'loading' | 'ready'>('loading')
  const [respondendo, setRespondendo] = useState(false)
  const [motivo, setMotivo] = useState<MotivoDoAceite | null>(null)
  const [feito, setFeito] = useState<'aceito' | 'recusado' | null>(null)
  const alive = useRef(true)

  useEffect(() => () => { alive.current = false }, [])

  const carregar = useCallback(async () => {
    try {
      const c = await apiClient.care.getConviteRecebido(token)
      if (!alive.current) return
      setConvite(c)
    } catch (e) {
      if (alive.current) setMotivo(motivoDoAceite(e instanceof Error ? e.message : null))
    } finally {
      if (alive.current) setPhase('ready')
    }
  }, [token])

  useEffect(() => { void carregar() }, [carregar])

  const responder = async (acao: 'aceitar' | 'recusar') => {
    if (respondendo) return
    setRespondendo(true)
    setMotivo(null)
    try {
      if (acao === 'aceitar') await apiClient.care.aceitarConviteProfissional(token)
      else await apiClient.care.recusarConviteProfissional(token)
      if (alive.current) setFeito(acao === 'aceitar' ? 'aceito' : 'recusado')
    } catch (e) {
      // O erro cru do banco NÃO vira frase aqui — vira no core, para que as duas pontas leiam a mesma.
      if (alive.current) setMotivo(motivoDoAceite(e instanceof Error ? e.message : null))
    } finally {
      if (alive.current) setRespondendo(false)
    }
  }

  const agora = new Date()
  const respondivel = convite ? podeResponderConviteRecebido(convite, agora) : false

  return (
    <ScrollView
      style={{ backgroundColor: t.color.surface.app }}
      contentContainerStyle={[styles.content, { paddingBottom: styles.content.padding + insets.bottom }]}
    >
      {phase === 'loading' && <ActivityIndicator color={t.color.text.muted} />}

      {phase === 'ready' && feito && (
        <View style={[styles.card, { backgroundColor: t.color.surface.base, borderColor: t.color.border.default }]}>
          <Text spec={text(t, { role: 'body' })}>{feito === 'aceito' ? C.accepted : C.declined}</Text>
          {feito === 'aceito' && (
            <Button label={SCREEN_COPY.painelProfissional.title}
              onPress={() => navigation.navigate('PainelProfissional')} />
          )}
        </View>
      )}

      {/* Convite inexistente é indistinguível, de propósito, de token errado: dizer "esse convite existe mas
          não é seu" confirmaria a existência dele a quem tem só o endereço. */}
      {phase === 'ready' && !feito && !convite && (
        <View style={[styles.card, { backgroundColor: t.color.surface.base, borderColor: t.color.border.default }]}>
          <Text spec={text(t, { role: 'body' })}>{fraseDoMotivo(motivo ?? 'convite_nao_encontrado')}</Text>
        </View>
      )}

      {phase === 'ready' && !feito && convite && (
        <View style={[styles.card, { backgroundColor: t.color.surface.base, borderColor: t.color.border.default }]}>
          <Text spec={heading(t, { level: 'section' })}>{rotuloDoConviteRecebido(convite, agora)}</Text>
          {respondivel && <Text spec={text(t, { role: 'caption', tone: 'muted' })}>{C.whatHappens}</Text>}

          {motivo && (
            <View style={{ gap: 8 }}>
              <Text spec={text(t, { role: 'body' })}>{fraseDoMotivo(motivo)}</Text>
              {/* Motivo com saída ganha o caminho; motivo sem saída ganha só a explicação. Botão que não
                  resolve nada é a mesma armadilha do "tente de novo" sobre configuração ausente. */}
              {temCaminho(motivo) && motivo === 'sem_perfil_profissional' && (
                <Button label={C.createProfile}
                  onPress={() => navigation.navigate('PerfilProfissional', { token })} />
              )}
            </View>
          )}

          {respondivel && (
            <View style={{ gap: 8 }}>
              <Button label={C.accept} onPress={() => { void responder('aceitar') }} disabled={respondendo} />
              <Button label={C.decline} onPress={() => { void responder('recusar') }} disabled={respondendo} />
            </View>
          )}

          {/* Primeiro nome só. O token viaja em URL e URL vaza — nome completo identificaria a pessoa para
              quem quer que tenha recebido o endereço encaminhado. */}
          {respondivel && (
            <Text spec={text(t, { role: 'caption', tone: 'muted' })}>
              Convite enviado por {quemConvidou(convite)}.
            </Text>
          )}
        </View>
      )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  content: { padding: 24, gap: 16 },
  card: { padding: 16, borderRadius: 12, borderWidth: 1, gap: 12 },
})
