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
  type HcRecordType,
} from '@sintera/core'
import { apiClient } from './apiClient'

/** Versão deste conector — vai na proveniência de cada leitura (auditoria e reprodutibilidade). */
export const HEALTH_CONNECT_VERSION = '1.0.0'

/** Resultado de uma sincronização, para o painel de Conexões. */
export interface ResultadoSync {
  disponivel: boolean
  autorizado: boolean
  leituras: number
  sessoes: number
  erro?: string
}

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

/** O aparelho tem Health Connect instalado e disponível? */
export async function healthConnectDisponivel(): Promise<boolean> {
  try {
    const hc = await lib()
    return hc ? await hc.initialize() : false
  } catch {
    return false
  }
}

/** Pede as permissões de leitura. Devolve quais foram concedidas — a pessoa pode conceder só algumas. */
export async function pedirPermissoes(): Promise<HcRecordType[]> {
  try {
    const hc = await lib()
    if (!hc || !(await hc.initialize())) return []
    const concedidas = await hc.requestPermission(
      HC_RECORD_TYPES.map((recordType) => ({ accessType: 'read' as const, recordType })),
    )
    return (concedidas ?? [])
      .map((p: { recordType?: string }) => p.recordType)
      .filter((t): t is HcRecordType => !!t && (HC_RECORD_TYPES as readonly string[]).includes(t))
  } catch {
    return []
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
  const vazio: ResultadoSync = { disponivel: false, autorizado: false, leituras: 0, sessoes: 0 }
  try {
    const hc = await lib()
    if (!hc || !(await hc.initialize())) return vazio

    const concedidas = await pedirPermissoes()
    if (concedidas.length === 0) return { ...vazio, disponivel: true }

    const janela = {
      timeRangeFilter: {
        operator: 'between' as const,
        startTime: desde.toISOString(),
        endTime: ate.toISOString(),
      },
    }

    const porTipo: Partial<Record<HcRecordType, unknown[]>> = {}
    for (const tipo of concedidas) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const r = (await hc.readRecords(tipo as any, janela)) as { records?: unknown[] }
        porTipo[tipo] = r?.records ?? []
      } catch {
        // Um tipo que falha não derruba os outros — o Modelo Aberto vale também para a ingestão.
        porTipo[tipo] = []
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
      sessoes: atividades.result.gravadas,
      erro: leituras.error?.message ?? atividades.error?.message,
    }
  } catch (e) {
    return { ...vazio, erro: e instanceof Error ? e.message : 'Falha ao sincronizar' }
  }
}
