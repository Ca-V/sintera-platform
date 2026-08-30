// Conexões — dispositivos e serviços de saúde (HIP-001). Paridade com a Web /dashboard/conexoes.
//
// POR QUE ESTA TELA PASSOU A EXISTIR (homologação da fundadora, 25/08): Conexões só existia na Web. O
// protocolo é que tudo que existe numa ponta existe na outra — e esta tela em particular é a PORTA das
// integrações com dispositivos, que é a próxima fase do produto. Sem ela, o Mobile não tinha caminho nenhum.
//
// O estado, os rótulos e o tom vêm do core (`connectorStatusLabel`, `connectorPrimaryAction`) — a Web lê os
// MESMOS. O texto da tela vem de SCREEN_COPY. Nada é redigido aqui.
//
// O fluxo de autorização abre no NAVEGADOR, de propósito: é OAuth do fabricante, e o app nunca manipula a
// credencial da pessoa.
import { useCallback, useEffect, useRef, useState } from 'react'
import { ScrollView, View, ActivityIndicator, RefreshControl, Pressable, Alert, Linking, StyleSheet, Platform } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { text } from '@sintera/design-system'
import type { ConnectorState } from '@sintera/core'
import {
  connectorStatusLabel, connectorStatusTone, connectorPrimaryAction, isConnectorActive, SCREEN_COPY,
  HEALTH_CONNECT_DOIS_PASSOS, HEALTH_CONNECT_COMO_TESTAR, fontesDisponiveis, fontesIndisponiveis,
  resumoSincronizacao, formatInstantBR,
} from '@sintera/core'
import { useNavigation } from '@react-navigation/native'
import { Text, Button, Disclaimer } from '../../primitives'
import { useTheme } from '../../theme'
import { apiClient } from '../../../infrastructure/apiClient'
import { healthConnectDisponivel, statusHealthConnect, sincronizarHealthConnect } from '../../../infrastructure/healthConnect'

const C = SCREEN_COPY.conexoes

// Versao do Android deste aparelho. O guia de fontes depende dela: o Samsung Health, por exemplo, so conversa
// com o Health Connect a partir do Android 10, e num aparelho abaixo disso listar o caminho dele e mentir.
const apiAndroid: number | undefined = Platform.OS === 'android'
  ? (typeof Platform.Version === 'number' ? Platform.Version : Number(Platform.Version)) || undefined
  : undefined

// A hora da última sincronização é um INSTANTE, e recortar a string mostrava-o em UTC — três horas erradas, e
// um dia errado para tudo que acontece à noite. A conversão mora no core (`formatInstantBR`), porque a Web lê
// o mesmo campo e não pode divergir.
function fmtDataHora(iso: string | null): string {
  return formatInstantBR(iso) || '—'
}

export function ConexoesScreen() {
  const t = useTheme()
  // Navegação por nome — o padrão do projeto para stack interno; sem regra de negócio.
  const navigation = useNavigation() as unknown as { navigate: (n: string) => void }
  const insets = useSafeAreaInsets()
  const [items, setItems] = useState<ConnectorState[]>([])
  const [phase, setPhase] = useState<'loading' | 'ready' | 'error'>('loading')
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState<string | null>(null)
  const alive = useRef(true)

  // Health Connect — estado próprio, porque não vem da API: é do aparelho. `null` = ainda não perguntamos.
  const [hcDisponivel, setHcDisponivel] = useState<boolean | null>(null)
  const [hcOcupado, setHcOcupado] = useState(false)
  const [hcResumo, setHcResumo] = useState<string | null>(null)
  /** As linhas de fato que sustentam a frase: permissões, janela e o que veio de cada tipo. */
  const [hcFatos, setHcFatos] = useState<string[]>([])
  /**
   * O passo a passo já foi mostrado nesta visita?
   *
   * Aparece assim que a pessoa AUTORIZA — é o momento em que ela está configurando e disposta a ir aos outros
   * apps. Deixá-lo apenas parado na tela faria com que fosse lido só por quem já desconfia que falta algo.
   */
  const [guiaAberto, setGuiaAberto] = useState(false)
  /** A sincronização terminou sem trazer nada? É quando a orientação deixa de ser útil e passa a ser essencial. */
  const [hcVazio, setHcVazio] = useState(false)

  useEffect(() => {
    healthConnectDisponivel().then(d => { if (alive.current) setHcDisponivel(d) }).catch(() => {
      if (alive.current) setHcDisponivel(false)
    })
  }, [])

  const sincronizarHc = useCallback(async () => {
    setHcOcupado(true); setHcResumo(null); setHcFatos([])
    // O guia abre AGORA, junto com a autorização — é quando a pessoa está configurando.
    setGuiaAberto(true); setHcVazio(false)
    try {
      // Pede uma janela larga: o teto real (30 dias sem a permissão de histórico) é aparado dentro do conector,
      // que é quem sabe o que foi autorizado. O bruto é idempotente — repetir a janela não duplica.
      const ate = new Date()
      const desde = new Date(ate.getTime() - 365 * 24 * 60 * 60 * 1000)
      const r = await sincronizarHealthConnect(desde, ate)
      if (!alive.current) return
      setHcDisponivel(r.disponivel)

      // NENHUM CAMINHO PODE TERMINAR EM SILÊNCIO (homologação de 30/08: "apertei autorizar e sincronizar, mas
      // nada ocorreu"). Este ramo LIMPAVA a mensagem e voltava — a pessoa tocava no botão e a tela não mudava.
      // "Nada aconteceu" é o pior resultado possível: não dá para distinguir de app quebrado, e não sugere ação.
      if (!r.disponivel) {
        // "Não disponível" tinha duas causas com soluções OPOSTAS — não existe × existe e está velho — e a
        // mesma frase para as duas. Perguntar qual é custa uma chamada.
        const st = await statusHealthConnect()
        setHcResumo(st === 'atualizar'
          ? 'O Health Connect deste aparelho está desatualizado. Atualize o aplicativo "Saúde Connect" na Play Store e volte aqui.'
          : 'O Health Connect não respondeu. Abra o aplicativo "Saúde Connect" uma vez e volte aqui.')
        setHcVazio(true)
        return
      }
      if (r.erro) { setHcResumo(r.erro); setHcFatos(r.diagnostico ? [...resumoSincronizacao(r.diagnostico).fatos] : []); return }

      // A FRASE E OS FATOS VÊM DO CORE. Antes eram montados aqui, e "Nada novo desde a última vez" respondia
      // por cinco situações diferentes — inclusive por leituras que o Health Connect tinha RECUSADO. O núcleo
      // distingue, é testável sem Android, e a Web dirá exatamente o mesmo (BASE ÚNICA).
      if (!r.diagnostico) { setHcResumo(C.hcDenied); setHcVazio(true); return }
      const resumo = resumoSincronizacao(r.diagnostico)
      setHcResumo(resumo.frase)
      setHcFatos([...resumo.fatos])
      setHcVazio(resumo.vazio)
    } catch (e) {
      // Última rede: exceção não pode virar silêncio. Depois de tocar no botão, ALGO tem de mudar na tela.
      if (alive.current) {
        setHcResumo(e instanceof Error ? e.message : 'Não foi possível sincronizar agora. Tente de novo.')
        setHcVazio(true)
      }
    } finally {
      if (alive.current) setHcOcupado(false)
    }
  }, [])

  const load = useCallback((silent: boolean) => {
    if (silent) setRefreshing(true); else setPhase('loading')
    apiClient.connectors.listConnectors()
      .then((cs) => { if (!alive.current) return; setItems(cs); setPhase('ready'); setError(null) })
      .catch((e) => {
        if (alive.current && !silent) {
          setError(e instanceof Error ? e.message : 'Não foi possível carregar.')
          setPhase('error')
        }
      })
      .finally(() => { if (alive.current) setRefreshing(false) })
  }, [])
  useEffect(() => { alive.current = true; load(false); return () => { alive.current = false } }, [load])

  async function conectar(c: ConnectorState) {
    const url = apiClient.connectors.connectUrl(c.source)
    if (!url) { Alert.alert('Indisponível', 'A conexão não está configurada neste aparelho.'); return }
    // Navegador: a autorização é do fabricante e a credencial é da pessoa. Ao voltar, o pull-to-refresh
    // atualiza o estado — o retorno do OAuth acontece na Web.
    await Linking.openURL(url)
  }

  async function sincronizar(c: ConnectorState) {
    setBusy(c.source)
    try {
      const { error: err } = await apiClient.connectors.syncConnector(c.source)
      if (err) Alert.alert('Não foi possível sincronizar', err.message)
      else load(true)
    } finally { setBusy(null) }
  }

  function desconectar(c: ConnectorState) {
    Alert.alert(
      `${C.disconnect} ${c.label}?`,
      'Os dados já recebidos permanecem. A fonte para de enviar novos.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: C.disconnect, style: 'destructive',
          onPress: async () => {
            setBusy(c.source)
            try {
              const { error: err } = await apiClient.connectors.disconnectConnector(c.source)
              if (err) Alert.alert('Não foi possível desconectar', err.message)
              else load(true)
            } finally { setBusy(null) }
          },
        },
      ],
    )
  }

  const toneColor = (c: ConnectorState) => {
    const tone = connectorStatusTone(c.status)
    if (tone === 'success') return t.color.badge.success.text
    if (tone === 'error') return t.color.badge.error.text
    if (tone === 'attention') return t.color.badge.attention.text
    return t.color.text.muted
  }

  if (phase === 'loading') {
    return <View style={s.center}><ActivityIndicator color={t.color.identity.primary} /></View>
  }
  // NÃO há retorno antecipado em erro (defeito encontrado na homologação de 27/08): o Health Connect é do
  // APARELHO e não depende desta API. Quando ela falhava, a tela inteira virava mensagem de erro e o cartão
  // dele desaparecia junto — a integração ficava refém de uma chamada de rede com que nada tem a ver.
  // A falha das conexões remotas agora é dita NO LUGAR delas, e o resto da tela continua de pé.
  const card = { backgroundColor: t.color.surface.base, borderColor: t.color.border.default }

  return (
    <ScrollView
      style={{ backgroundColor: t.color.surface.app }}
      contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 32, gap: 12 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={t.color.identity.primary} />}
    >
      <Text spec={text(t, { role: 'bodyStrong' })} style={{ fontSize: 22 }}>{C.title}</Text>
      <Text spec={text(t, { role: 'caption', tone: 'muted' })}>{C.subtitle}</Text>

      {/* HEALTH CONNECT (HIP-014 §5) — vem PRIMEIRO porque é de natureza diferente das demais: lê o que já
          está no aparelho, sem login nem senha, e traz junto Strava, Oura e Garmin sem contrato separado com
          cada fabricante. A autorização vive na permissão do sistema operacional — a pessoa revoga por lá. */}
      <View style={[s.card, card, { gap: 8 }]}>
        <View style={s.linha}>
          <Text spec={text(t, { role: 'bodyStrong' })} style={{ flex: 1 }}>{C.hcTitle}</Text>
          {hcDisponivel === false && (
            <Text spec={text(t, { role: 'caption' })} style={{ color: t.color.text.muted }}>{C.hcUnavailable}</Text>
          )}
        </View>
        <Text spec={text(t, { role: 'caption', tone: 'muted' })}>{C.hcSubtitle}</Text>

        {hcDisponivel === false ? (
          // NÃO DISPONÍVEL — mas com saída. A versão anterior constatava e parava; a pessoa ficava sabendo que
          // não dá, sem saber o que fazer. Aqui vai o motivo E o caminho, com o botão que abre a Play Store no
          // app certo, para ninguém precisar procurar entre resultados parecidos.
          <View style={{ gap: 8 }}>
            <Text spec={text(t, { role: 'caption', tone: 'muted' })}>{C.hcUnavailableHint}</Text>
            <Button
              label={C.hcInstallAction}
              variant="secondary"
              onPress={() => {
                // `market://` abre direto na Play Store; se não houver Play Store (aparelho sem serviços
                // Google), cai para o endereço web, que funciona em qualquer navegador.
                Linking.openURL('market://details?id=com.google.android.apps.healthdata')
                  .catch(() => Linking.openURL('https://play.google.com/store/apps/details?id=com.google.android.apps.healthdata'))
              }}
            />
            <Text spec={text(t, { role: 'caption', tone: 'faint' })}>{C.hcAppleHint}</Text>
          </View>
        ) : (
          <>
            <Button
              label={hcOcupado ? C.hcSyncing : C.hcAction}
              onPress={sincronizarHc}
              loading={hcOcupado}
              loadingLabel={C.hcSyncing}
              variant="secondary"
            />
            {/* O RESULTADO FICA COLADO NO BOTÃO. Ele já esteve no fim do cartão, depois de seis cartões de
                fonte — e a fundadora tocou duas vezes relatando "nada aconteceu". Acontecia: a resposta era
                desenhada fora da tela. O resultado de uma ação pertence ao lado dela; longe, equivale a não
                existir. Mesmo erro que tornou o "Editar" da receita invisível. */}
            {hcResumo && (
              <View style={[s.resultado, { borderColor: t.color.identity.primary }]}>
                <Text spec={text(t, { role: 'body' })} style={{ color: t.color.identity.primary }}>{hcResumo}</Text>
                {/* OS FATOS FICAM À VISTA, não escondidos atrás de "detalhes". Um resultado zero sem os números
                    que o produziram é indistinguível de defeito — foi o que fez a fundadora concluir três vezes
                    que a sincronização não funcionava. Aqui ela vê quantas permissões saíram, que janela foi
                    pedida, e o que cada tipo devolveu ou recusou. */}
                {hcFatos.length > 0 && (
                  <View style={s.fatos}>
                    {hcFatos.map((f) => (
                      <Text key={f} spec={text(t, { role: 'caption' })} style={{ color: t.color.text.muted }}>
                        {`• ${f}`}
                      </Text>
                    ))}
                  </View>
                )}
              </View>
            )}

            <Text spec={text(t, { role: 'caption', tone: 'muted' })}>{C.hcRevokeHint}</Text>

            {/* O SEGUNDO PASSO — o que faltava dizer. Autorizar a SINTERA é metade; a outra metade acontece
                dentro do app do aparelho. Sem esta orientação a pessoa autoriza, não vem nada, e conclui que a
                plataforma não funciona — quando o que falta é uma chave do lado dela.

                Aparece ao AUTORIZAR (é quando ela está configurando) e fica disponível por um toque no resto do
                tempo. Quando a sincronização volta VAZIA, ganha destaque e muda de tom: deixa de ser referência
                e vira a explicação do que acabou de acontecer. */}
            {!guiaAberto && (
              <Pressable onPress={() => setGuiaAberto(true)} accessibilityRole="button" hitSlop={8}>
                <Text spec={text(t, { role: 'caption' })} style={{ color: t.color.identity.primary }}>
                  Como liberar os dados do Strava, Whoop e outros
                </Text>
              </Pressable>
            )}

            {guiaAberto && (
            <View
              style={[
                { gap: 8, marginTop: 6 },
                hcVazio && [s.guiaDestaque, { borderColor: t.color.badge.attention.text, backgroundColor: t.color.badge.attention.soft }],
              ]}
            >
              {hcVazio && (
                <Text spec={text(t, { role: 'bodyStrong' })} style={{ color: t.color.badge.attention.text }}>
                  Falta um passo — e ele é dentro do app do seu aparelho
                </Text>
              )}
              <Text spec={text(t, { role: 'caption', tone: 'muted' })}>{HEALTH_CONNECT_DOIS_PASSOS}</Text>

              {/* COMO PROVAR AGORA, em vez de esperar. Sem isto, o cofre vazio é indistinguível de configuração
                  errada — e foi exatamente aí que a homologação de 30/08 travou. */}
              {hcVazio && (
                <Text spec={text(t, { role: 'caption', tone: 'muted' })}>{HEALTH_CONNECT_COMO_TESTAR}</Text>
              )}

              {/* A LISTA É FILTRADA PELO APARELHO. Uma fonte que exige um Android mais novo que este não
                  aparece como opção: ela aceitaria a permissão e nunca escreveria nada. */}
              {fontesDisponiveis(apiAndroid).map(f => (
                <View key={f.source} style={[s.guia, { borderColor: t.color.border.default }]}>
                  <Text spec={text(t, { role: 'body' })}>{f.nome}</Text>
                  <Text spec={text(t, { role: 'caption', tone: 'muted' })}>{f.caminho}</Text>
                  <Text spec={text(t, { role: 'caption', tone: 'faint' })}>Traz: {f.traz}</Text>
                </View>
              ))}

              {/* O QUE AINDA NÃO DÁ aparece com o motivo, nunca escondido: mandar procurar um menu que não
                  existe faz a pessoa se sentir errada por não achar o que não está lá. */}
              {fontesIndisponiveis(apiAndroid).map(({ fonte, motivo }) => (
                <View key={fonte.source} style={[s.guia, { borderColor: t.color.border.default, opacity: 0.75 }]}>
                  <Text spec={text(t, { role: 'body' })}>{fonte.nome}</Text>
                  <Text spec={text(t, { role: 'caption', tone: 'muted' })}>{motivo}</Text>
                </View>
              ))}
            </View>
            )}
          </>
        )}

      </View>

      {phase === 'error' ? (
        <View style={[s.card, card, { gap: 10, alignItems: 'center' }]}>
          <Text spec={text(t, { role: 'body', tone: 'muted' })} style={{ textAlign: 'center' }}>{error}</Text>
          <Button label="Tentar de novo" onPress={() => load(false)} variant="secondary" />
        </View>
      ) : items.length === 0 ? (
        <View style={[s.card, card, { gap: 4 }]}>
          <Text spec={text(t, { role: 'bodyStrong' })} style={{ textAlign: 'center' }}>{C.emptyTitle}</Text>
          <Text spec={text(t, { role: 'body', tone: 'muted' })} style={{ textAlign: 'center' }}>{C.emptyMessage}</Text>
        </View>
      ) : (
        items.map(c => (
          <View key={c.source} style={[s.card, card, { gap: 8 }]}>
            <View style={s.linha}>
              <Text spec={text(t, { role: 'bodyStrong' })} style={{ flex: 1 }}>{c.label}</Text>
              <Text spec={text(t, { role: 'caption' })} style={{ color: toneColor(c) }}>
                {connectorStatusLabel(c.status)}
              </Text>
            </View>

            {isConnectorActive(c.status) && (
              <Text spec={text(t, { role: 'caption', tone: 'muted' })}>
                {C.lastSync}: {fmtDataHora(c.lastSyncAt)}
              </Text>
            )}
            {c.lastError && (
              <Text spec={text(t, { role: 'caption' })} style={{ color: t.color.badge.error.text }}>{c.lastError}</Text>
            )}

            <View style={{ gap: 8 }}>
              {isConnectorActive(c.status) ? (
                <>
                  <Button
                    label="Sincronizar agora"
                    variant="secondary"
                    onPress={() => sincronizar(c)}
                    loading={busy === c.source}
                    loadingLabel="Sincronizando…"
                  />
                  <Pressable onPress={() => desconectar(c)} disabled={busy === c.source} hitSlop={8}>
                    <Text spec={text(t, { role: 'caption' })} style={{ color: t.color.badge.error.text }}>
                      {C.disconnect}
                    </Text>
                  </Pressable>
                </>
              ) : (
                <Button label={connectorPrimaryAction(c.status)} onPress={() => conectar(c)} />
              )}
            </View>
          </View>
        ))
      )}

      {/* A PORTA para o que entrou. Com a sincronização automática, o dado passa a chegar sem ninguém pedir —
          e sem este caminho, "entra sozinho" viraria "entra sem que eu saiba". Fica em Conexões porque é aqui
          que a pessoa pensa em origem de dado. */}
      <Button
        label={SCREEN_COPY.dadosRecebidos.title}
        variant="secondary"
        onPress={() => navigation.navigate('DadosRecebidos')}
      />

      <Disclaimer variant="geral" />
    </ScrollView>
  )
}

const s = StyleSheet.create({
  guia: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, gap: 2 },
  resultado: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, gap: 8 },
  fatos: { gap: 2 },
  guiaDestaque: { borderWidth: 1, borderRadius: 14, padding: 14 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  card: { borderWidth: 1, borderRadius: 16, padding: 16 },
  linha: { flexDirection: 'row', alignItems: 'center', gap: 12 },
})
