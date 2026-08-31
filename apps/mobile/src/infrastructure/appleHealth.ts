// APPLE SAÚDE no aparelho — camada FINA de IO, igual à do Health Connect e pelo mesmo motivo.
//
// Toda a regra vive em `@sintera/core` (`normalizeAppleHealth`), onde é função pura e coberta por teste. Aqui
// fica só o que não dá para verificar sem um iPhone na mão: disponibilidade, permissão e leitura. Se este
// arquivo crescer, é sinal de que alguma regra vazou para onde ninguém consegue conferi-la.
//
// O APARELHO É CONDUTO, NUNCA ARMAZENAMENTO: o que se lê sobe para a nuvem na MESMA sincronização. Nada fica só
// no telefone — perderia-se na troca de aparelho e seria invisível na Web.
//
// ─────────────────────────────────────────────────────────────────────────────────────────────────────────
// O TIPO DE EXERCÍCIO É RESOLVIDO PELA PRÓPRIA BIBLIOTECA, e é aqui que está a decisão que evita repetir o
// defeito do Android.
//
// A Apple entrega `workoutActivityType` como NÚMERO e não documenta os valores — eles podem mudar entre
// versões do iOS. Uma tabela de números escrita por nós funcionaria hoje e classificaria errado depois de uma
// atualização, EM SILÊNCIO.
//
// Mas a biblioteca publica o enum. Então convertemos número → NOME usando o enum DELA, em tempo de execução, e
// mandamos o nome ao núcleo. Se os números mudarem, a biblioteca acompanha e nós acompanhamos junto — sem
// tabela nossa para envelhecer.
// ─────────────────────────────────────────────────────────────────────────────────────────────────────────
import { Platform } from 'react-native'
import {
  HK_TYPES, normalizeAppleHealth, healthConnectSamples, healthConnectActivities,
  type DiagnosticoSync, type LeituraPorTipo,
} from '@sintera/core'
import { apiClient } from './apiClient'

/** Versão deste conector — vai na proveniência de cada leitura (auditoria e reprodutibilidade). */
export const APPLE_HEALTH_VERSION = '1.0.0'

export interface ResultadoSyncApple {
  disponivel: boolean
  autorizado: boolean
  leituras: number
  visiveis: number
  sessoes: number
  erro?: string
  diagnostico: DiagnosticoSync | null
  /**
   * Nomes de exercício que o núcleo não reconheceu.
   *
   * Existe para a PRIMEIRA sincronização num iPhone real virar relatório em vez de palpite: o mapa de tipos foi
   * escrito sem aparelho para conferir, e é isto que revela o que faltou. Foi supor o formato — sem esta rede —
   * que fez doze atividades reais entrarem como "Outra atividade" no Android.
   */
  exerciciosDesconhecidos: string[]
}

/**
 * Carrega a biblioteca sob demanda, e SÓ no iOS.
 *
 * Importação dinâmica de propósito: no Android o módulo nunca é tocado. Devolve `null` em vez de lançar —
 * indisponibilidade é resposta legítima, não erro.
 */
async function lib(): Promise<typeof import('@kingstinct/react-native-healthkit') | null> {
  if (Platform.OS !== 'ios') return null
  try {
    return await import('@kingstinct/react-native-healthkit')
  } catch {
    return null
  }
}

/** O aparelho tem Apple Saúde? Falso em iPad sem HealthKit e em qualquer coisa que não seja iPhone. */
export async function appleHealthDisponivel(): Promise<boolean> {
  try {
    const hk = await lib()
    return hk ? hk.isHealthDataAvailable() : false
  } catch {
    return false
  }
}

/** Os tipos que pedimos, no formato que a biblioteca espera. */
function tiposParaAutorizar(): string[] {
  return [...HK_TYPES]
}

/**
 * Pede a autorização de leitura.
 *
 * DIFERENÇA IMPORTANTE EM RELAÇÃO AO ANDROID, e ela muda o que a tela pode dizer: por privacidade, a Apple
 * NÃO informa ao aplicativo o que foi negado. `requestAuthorization` devolve apenas que o diálogo foi
 * apresentado. Um tipo recusado se comporta como "existe e está vazio".
 *
 * Por isso a tela não pode afirmar "você autorizou X de Y" no iPhone — seria invenção. O que ela pode, e faz,
 * é dizer quantos registros vieram de cada tipo, e apontar o app Saúde quando tudo vier vazio.
 */
export async function pedirPermissoesApple(): Promise<boolean> {
  try {
    const hk = await lib()
    if (!hk || !hk.isHealthDataAvailable()) return false
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return await hk.requestAuthorization({ read: tiposParaAutorizar() } as any)
  } catch {
    return false
  }
}

/**
 * Número do enum de exercício → NOME, usando o enum da própria biblioteca.
 *
 * `WorkoutActivityType` é um enum numérico do TypeScript, então a busca reversa devolve o nome. Se o valor não
 * estiver no enum (versão de iOS mais nova que a biblioteca), devolve o número como texto — que o núcleo
 * registra como desconhecido e reporta, em vez de descartar em silêncio.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function nomeDoExercicio(hk: any, valor: unknown): string | null {
  if (typeof valor === 'string') return valor
  if (typeof valor !== 'number') return null
  const nome = hk?.WorkoutActivityType?.[valor]
  return typeof nome === 'string' ? nome : String(valor)
}

/**
 * Lê a janela pedida e GRAVA na nuvem. Idempotente: repetir a janela não duplica.
 */
export async function sincronizarAppleHealth(desde: Date, ate: Date): Promise<ResultadoSyncApple> {
  const vazio: ResultadoSyncApple = {
    disponivel: false, autorizado: false, leituras: 0, visiveis: 0, sessoes: 0,
    diagnostico: null, exerciciosDesconhecidos: [],
  }
  try {
    const hk = await lib()
    if (!hk || !hk.isHealthDataAvailable()) return vazio

    const autorizado = await pedirPermissoesApple()
    if (!autorizado) return { ...vazio, disponivel: true }

    const filtro = { filter: { startDate: desde, endDate: ate } }
    const porTipo: Record<string, unknown[]> = {}
    const leiturasPorTipo: LeituraPorTipo[] = []

    for (const tipo of HK_TYPES) {
      if (tipo === 'HKWorkoutTypeIdentifier') continue
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const r = await hk.queryQuantitySamples(tipo as any, filtro as any)
        const lista = Array.isArray(r) ? [...r] : []
        porTipo[tipo] = lista
        leiturasPorTipo.push({ tipo, registros: lista.length })
      } catch (e) {
        // A FALHA É REGISTRADA, nunca convertida em zero. Um erro virado fato some do relatório e reaparece
        // como "nada novo" — foi assim que a recusa por janela ficou invisível no Android.
        porTipo[tipo] = []
        leiturasPorTipo.push({ tipo, registros: 0, erro: e instanceof Error ? e.message : 'falha na leitura' })
      }
    }

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const w = await hk.queryWorkoutSamples(filtro as any)
      // O nome do exercício é resolvido AQUI, pelo enum da biblioteca — ver o cabeçalho deste arquivo.
      const lista = (Array.isArray(w) ? w : []).map((s: Record<string, unknown>) => ({
        ...s, workoutActivityType: nomeDoExercicio(hk, s.workoutActivityType),
      }))
      porTipo['HKWorkoutTypeIdentifier'] = lista
      leiturasPorTipo.push({ tipo: 'HKWorkoutTypeIdentifier', registros: lista.length })
    } catch (e) {
      porTipo['HKWorkoutTypeIdentifier'] = []
      leiturasPorTipo.push({ tipo: 'HKWorkoutTypeIdentifier', registros: 0, erro: e instanceof Error ? e.message : 'falha na leitura' })
    }

    const { registros, exerciciosDesconhecidos } = normalizeAppleHealth(porTipo)
    const amostras = healthConnectSamples(registros, APPLE_HEALTH_VERSION)
    const sessoes = healthConnectActivities(registros, APPLE_HEALTH_VERSION)

    const leituras = await apiClient.wearables.ingestSamples(amostras)
    const atividades = await apiClient.activity.ingestActivitySessions(sessoes)

    const diasJanela = Math.max(1, Math.round((ate.getTime() - desde.getTime()) / 86_400_000))

    return {
      disponivel: true,
      autorizado: true,
      leituras: leituras.result.rawCount,
      visiveis: leituras.result.projectedCount,
      sessoes: atividades.result.gravadas,
      erro: leituras.error?.message ?? atividades.error?.message,
      exerciciosDesconhecidos,
      diagnostico: {
        // A Apple não diz o que foi negado (ver `pedirPermissoesApple`). Declarar tudo como concedido seria
        // afirmar o que não sabemos; declarar nada seria esconder que pedimos. Os tipos PEDIDOS entram como
        // concedidos e a lista de negados fica vazia — e é a contagem por tipo, logo abaixo, que mostra a
        // verdade: o tipo negado aparece com zero, como qualquer outro sem dado.
        concedidas: [...HK_TYPES],
        negadas: [],
        historico: true,
        diasJanela,
        porTipo: leiturasPorTipo,
        amostras: amostras.length,
        sessoes: sessoes.length,
        gravadas: leituras.result.rawCount,
        visiveis: leituras.result.projectedCount,
        gravadasSessoes: atividades.result.gravadas,
        atualizadas: atividades.result.atualizadas,
      },
    }
  } catch (e) {
    return { ...vazio, erro: e instanceof Error ? e.message : 'Falha ao sincronizar' }
  }
}
