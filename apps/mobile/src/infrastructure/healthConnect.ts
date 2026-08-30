// HIP-014 §5/§6 — Health Connect no aparelho. Camada FINA de IO, de propósito.
//
// Toda a lógica vive em `@sintera/core` (normalização, mapeamento, proveniência) e é coberta por teste. Aqui só
// existe o que não dá para testar sem um Android na mão: disponibilidade, permissão e leitura. Se este arquivo
// crescer, é sinal de que alguma regra vazou para um lugar onde ninguém consegue verificá-la.
//
// O APARELHO É CONDUTO, NUNCA ARMAZENAMENTO: o que se lê aqui sobe para a nuvem na MESMA sincronização
// (princípio de nuvem sem servidor próprio). Nada fica só no telefone — perderia-se na troca de aparelho,
// seria invisível na Web e ficaria fora de backup.
//
// A escrita usa a SESSÃO da pessoa, não chave privilegiada: desde a migração 150 o dono tem política de INSERT
// em `wearable_readings` e `connector_sync_runs`.
import { Platform } from 'react-native'
import {
  HC_RECORD_TYPES, normalizeHealthConnect, healthConnectSamples, healthConnectActivities,
  type HcRecordType, type DiagnosticoSync, type LeituraPorTipo,
  DIAS_PRIMEIRA_SINCRONIZACAO, DIAS_SEM_HISTORICO,
} from '@sintera/core'
import { apiClient } from './apiClient'

/** Versão deste conector — vai na proveniência de cada leitura (auditoria e reprodutibilidade). */
export const HEALTH_CONNECT_VERSION = '1.0.0'

/** Resultado de uma sincronização, para o painel de Conexões. */
export interface ResultadoSync {
  disponivel: boolean
  autorizado: boolean
  /** Tudo que foi RECEBIDO e guardado no bruto — inclusive o que ainda não tem tela. */
  leituras: number
  /**
   * O que efetivamente APARECE em Monitoramento.
   *
   * Nem tudo que o Health Connect entrega tem lugar na tela hoje: passos, por exemplo, chegam e ficam só no
   * bruto, porque não são métrica corporal nem sessão de atividade. Reportar só `leituras` faria a plataforma
   * dizer "12 leituras — veja em Monitoramento" e a pessoa não encontrar as 12 lá. É a mesma armadilha que
   * custou dois ciclos de homologação em 27 e 28/08: um número que não corresponde ao que se vê.
   */
  visiveis: number
  sessoes: number
  erro?: string
  /**
   * TUDO o que a sincronização viu, para a tela poder explicar um resultado zero.
   *
   * Sem isto, "nada novo" era a resposta para cinco situações diferentes — ver `healthConnectDiagnostico`.
   * `null` só quando nem chegou a haver leitura (aparelho sem Health Connect).
   */
  diagnostico: DiagnosticoSync | null
}

// O ALCANCE DA BUSCA é regra de domínio e vive no núcleo (`janelaImportacao`), porque vale igual para toda
// fonte — Health Connect, Apple Saúde e o que vier. Aqui só se APLICA o teto que a permissão concedida impõe.

/**
 * API mínima do Android em que a biblioteca do Health Connect roda. Abaixo disto NEM TENTAMOS importá-la.
 *
 * O app instala em Android 7 de propósito (princípio de disponibilidade universal — ver
 * `plugins/withMinSdkOverride`). Quem está lá nunca teria o Health Connect de qualquer forma: ele exige
 * Android 9. Esta checagem é o que garante que o aparelho antigo veja "não disponível" em vez de um erro.
 */
const API_MINIMA_ANDROID = 26

/** O aparelho tem sistema onde a biblioteca roda? Verificado ANTES de qualquer importação. */
function plataformaSuportada(): boolean {
  if (Platform.OS !== 'android') return false
  const api = typeof Platform.Version === 'number' ? Platform.Version : Number(Platform.Version)
  return Number.isFinite(api) && api >= API_MINIMA_ANDROID
}

/**
 * Carrega a biblioteca sob demanda, e SÓ onde ela roda.
 *
 * A importação é dinâmica de propósito: em iOS e em Android antigo o módulo nunca é tocado pelo nosso código.
 * Devolve `null` em vez de lançar — indisponibilidade é resposta legítima, não erro.
 */
async function lib(): Promise<typeof import('react-native-health-connect') | null> {
  if (!plataformaSuportada()) return null
  try {
    return await import('react-native-health-connect')
  } catch {
    return null
  }
}

/**
 * Em que estado o Health Connect está NESTE aparelho.
 *
 * `initialize()` devolvia só `true`/`false`, e falso significava duas coisas muito diferentes: não existe, ou
 * existe e está velho demais. São problemas com soluções opostas — instalar × atualizar — e a pessoa recebia a
 * mesma frase para os dois. `getSdkStatus` distingue, e sempre distinguiu; nós é que não perguntávamos.
 */
export type StatusHc = 'indisponivel' | 'atualizar' | 'ok'

export async function statusHealthConnect(): Promise<StatusHc> {
  try {
    const hc = await lib()
    if (!hc) return 'indisponivel'
    const s = await hc.getSdkStatus()
    if (s === hc.SdkAvailabilityStatus.SDK_AVAILABLE) {
      return (await hc.initialize()) ? 'ok' : 'indisponivel'
    }
    if (s === hc.SdkAvailabilityStatus.SDK_UNAVAILABLE_PROVIDER_UPDATE_REQUIRED) return 'atualizar'
    return 'indisponivel'
  } catch {
    return 'indisponivel'
  }
}

/** O aparelho tem Health Connect instalado e disponível? Mantido para quem só precisa do sim/não. */
export async function healthConnectDisponivel(): Promise<boolean> {
  return (await statusHealthConnect()) === 'ok'
}

/**
 * A permissão que libera dados anteriores aos 30 dias. Não é um tipo de registro — é um privilégio à parte, e a
 * biblioteca a pede pelo mesmo canal, com este nome reservado.
 */
const PERMISSAO_HISTORICO = 'ReadHealthDataHistory'

export interface Permissoes {
  /** Tipos de registro autorizados. */
  tipos: HcRecordType[]
  /** O histórico completo foi liberado? Sem ele, a janela tem teto de 30 dias. */
  historico: boolean
}

/**
 * Pede as permissões de leitura. Devolve quais foram concedidas — a pessoa pode conceder só algumas.
 *
 * Pede TAMBÉM o histórico, e no mesmo diálogo: uma plataforma de continuidade que só enxerga 30 dias não é uma
 * plataforma de continuidade. Recusar o histórico é escolha legítima e não impede nada — apenas limita a janela,
 * e a tela passa a dizer isso em vez de deixar a pessoa achar que faltou dado.
 */
export async function pedirPermissoes(): Promise<Permissoes> {
  const nada: Permissoes = { tipos: [], historico: false }
  try {
    const hc = await lib()
    if (!hc || !(await hc.initialize())) return nada
    const concedidas = await hc.requestPermission([
      ...HC_RECORD_TYPES.map((recordType) => ({ accessType: 'read' as const, recordType })),
      { accessType: 'read' as const, recordType: PERMISSAO_HISTORICO as 'ReadHealthDataHistory' },
    ])
    const nomes = (concedidas ?? []).map((p: { recordType?: string }) => p.recordType)
    return {
      tipos: nomes.filter((t): t is HcRecordType => !!t && (HC_RECORD_TYPES as readonly string[]).includes(t)),
      historico: nomes.includes(PERMISSAO_HISTORICO),
    }
  } catch {
    return nada
  }
}

/**
 * Lê a janela pedida e GRAVA na nuvem. Idempotente: rodar de novo com janela sobreposta não duplica —
 * as leituras entram por upsert e as sessões por `ingestActivitySessions`.
 *
 * Concessão PARCIAL é caso normal, não erro: a pessoa pode autorizar passos e recusar glicemia. Lê-se o que
 * foi concedido e ignora-se o resto, em silêncio.
 */
export async function sincronizarHealthConnect(desde: Date, ate: Date): Promise<ResultadoSync> {
  const vazio: ResultadoSync = {
    disponivel: false, autorizado: false, leituras: 0, visiveis: 0, sessoes: 0, diagnostico: null,
  }
  try {
    const hc = await lib()
    if (!hc || !(await hc.initialize())) return vazio

    const { tipos: concedidas, historico } = await pedirPermissoes()
    const negadas = HC_RECORD_TYPES.filter((t) => !concedidas.includes(t))
    if (concedidas.length === 0) {
      return {
        ...vazio,
        disponivel: true,
        diagnostico: {
          concedidas: [], negadas, historico, diasJanela: 0, porTipo: [],
          amostras: 0, sessoes: 0, gravadas: 0, visiveis: 0, gravadasSessoes: 0,
        },
      }
    }

    // A JANELA É APARADA AQUI, num lugar só. Quem chama pede o que quiser; o teto do Health Connect é imposto
    // neste ponto, porque ultrapassá-lo não devolve menos dado — faz a leitura inteira ser recusada.
    const dias = historico ? DIAS_PRIMEIRA_SINCRONIZACAO : DIAS_SEM_HISTORICO
    const piso = new Date(ate.getTime() - dias * 24 * 60 * 60 * 1000)
    const inicio = desde.getTime() < piso.getTime() ? piso : desde
    const diasJanela = Math.max(1, Math.round((ate.getTime() - inicio.getTime()) / 86_400_000))

    const janela = {
      timeRangeFilter: {
        operator: 'between' as const,
        startTime: inicio.toISOString(),
        endTime: ate.toISOString(),
      },
    }

    const porTipo: Partial<Record<HcRecordType, unknown[]>> = {}
    const leiturasPorTipo: LeituraPorTipo[] = []
    for (const tipo of concedidas) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const r = (await hc.readRecords(tipo as any, janela)) as { records?: unknown[] }
        const registros = r?.records ?? []
        porTipo[tipo] = registros
        leiturasPorTipo.push({ tipo, registros: registros.length })
      } catch (e) {
        // Um tipo que falha não derruba os outros — o Modelo Aberto vale também para a ingestão.
        //
        // MAS A FALHA É REGISTRADA. Antes ela virava lista vazia, e um erro convertido em zero deixa de ser
        // erro: some do relatório e reaparece como "nada novo". Foi assim que a recusa por janela ficou
        // invisível durante toda a homologação de 30/08.
        porTipo[tipo] = []
        leiturasPorTipo.push({ tipo, registros: 0, erro: e instanceof Error ? e.message : 'falha na leitura' })
      }
    }

    const brutos = normalizeHealthConnect(porTipo)
    const amostras = healthConnectSamples(brutos, HEALTH_CONNECT_VERSION)
    const sessoes = healthConnectActivities(brutos, HEALTH_CONNECT_VERSION)

    // Grava pela API pública do pacote — a sessão e o cliente ficam lá dentro. O aplicativo nunca toca no SDK.
    const leituras = await apiClient.wearables.ingestSamples(amostras)
    const atividades = await apiClient.activity.ingestActivitySessions(sessoes)

    return {
      disponivel: true,
      autorizado: true,
      leituras: leituras.result.rawCount,
      visiveis: leituras.result.projectedCount,
      sessoes: atividades.result.gravadas,
      erro: leituras.error?.message ?? atividades.error?.message,
      diagnostico: {
        concedidas, negadas, historico, diasJanela,
        porTipo: leiturasPorTipo,
        amostras: amostras.length,
        sessoes: sessoes.length,
        gravadas: leituras.result.rawCount,
        visiveis: leituras.result.projectedCount,
        gravadasSessoes: atividades.result.gravadas,
      },
    }
  } catch (e) {
    return { ...vazio, erro: e instanceof Error ? e.message : 'Falha ao sincronizar' }
  }
}
