// @sintera/core — APPLE SAÚDE: do formato da Apple para o modelo da plataforma.
//
// O SEGUNDO PILAR (HIP-014). O Health Connect resolve o Android; no iPhone ele não existe, e sem este caminho
// metade das pessoas não tem forma nenhuma de trazer dado de wearable — nem pelo cofre, nem por conector.
// A arquitetura é a MESMA do Android: o aplicativo lê o cofre do próprio aparelho, onde Strava, Whoop, Oura e
// os demais já escrevem. Nenhum acordo com nenhuma empresa.
//
// ─────────────────────────────────────────────────────────────────────────────────────────────────────────
// A DECISÃO MAIS IMPORTANTE DESTE ARQUIVO: mapear por NOME, nunca por número.
//
// A Apple trata os valores numéricos de `HKWorkoutActivityType` como detalhe de implementação, não os
// documenta, e desaconselha fixá-los — eles podem mudar entre versões do iOS. Uma tabela de números aqui
// funcionaria hoje e passaria a classificar errado depois de uma atualização do sistema, EM SILÊNCIO, porque
// número desconhecido degrada para 'outro' sem reclamar.
//
// Foi exatamente esse o defeito que custou a primeira ingestão real no Android — só que ao contrário: lá o
// tipo vinha como número e a leitura só aceitava texto. A lição é a mesma nos dois casos: **não supor o
// formato; aceitar o que a fonte manda e DIZER o que não foi entendido.**
//
// Por isso `normalizeAppleHealth` devolve, junto com os registros, a lista de tipos que não reconheceu. A
// primeira sincronização no iPhone da fundadora vai revelar os nomes reais, e o mapa cresce com evidência em
// vez de palpite.
// ─────────────────────────────────────────────────────────────────────────────────────────────────────────
import type { ActivityType } from '../body/activity'
import type { HcRecord } from './healthConnect'

/**
 * Tipos que a SINTERA lê do Apple Saúde.
 *
 * Os identificadores são os do HealthKit, que são ESTÁVEIS — ao contrário dos números do enum de exercício.
 * Espelha o que já se lê no Android, para as duas pontas trazerem o mesmo conjunto.
 */
export const HK_TYPES = [
  'HKQuantityTypeIdentifierHeartRate',
  'HKQuantityTypeIdentifierOxygenSaturation',
  'HKQuantityTypeIdentifierBodyTemperature',
  'HKQuantityTypeIdentifierBodyMass',
  'HKQuantityTypeIdentifierHeight',
  'HKQuantityTypeIdentifierStepCount',
  'HKQuantityTypeIdentifierBloodGlucose',
  'HKQuantityTypeIdentifierDistanceWalkingRunning',
  'HKQuantityTypeIdentifierActiveEnergyBurned',
  // A pressão arterial no HealthKit são DOIS tipos separados, ligados por uma correlação. Diferente do Health
  // Connect, onde um registro só carrega as duas medidas — ver `pareiaPressao` abaixo.
  'HKQuantityTypeIdentifierBloodPressureSystolic',
  'HKQuantityTypeIdentifierBloodPressureDiastolic',
  'HKWorkoutTypeIdentifier',
] as const
export type HkType = (typeof HK_TYPES)[number]

/**
 * Nome do exercício no HealthKit → taxonomia da plataforma.
 *
 * Os nomes vêm da biblioteca, que os mantém colados aos da Apple. Comparação sem acento, minúsculas e sem
 * separadores, para `traditionalStrengthTraining`, `TRADITIONAL_STRENGTH_TRAINING` e `Traditional Strength
 * Training` caírem no mesmo lugar — o formato exato depende da versão da ponte nativa, e apostar em um só
 * seria repetir o erro do Android.
 */
const EXERCICIOS_APPLE: Record<string, ActivityType> = {
  walking: 'caminhada', hiking: 'caminhada', wheelchairwalkpace: 'caminhada',
  running: 'corrida', trackandfield: 'corrida',
  cycling: 'ciclismo', handcycling: 'ciclismo',
  swimming: 'natacao', swimbikerun: 'natacao', waterfitness: 'natacao',
  traditionalstrengthtraining: 'musculacao', functionalstrengthtraining: 'musculacao',
  highintensityintervaltraining: 'funcional', crosstraining: 'funcional', coretraining: 'funcional',
  elliptical: 'funcional', rowing: 'funcional', stairclimbing: 'funcional', stairs: 'funcional',
  mixedcardio: 'funcional', jumprope: 'funcional',
  pilates: 'pilates',
  yoga: 'yoga', mindandbody: 'yoga',
  dance: 'danca', cardiodance: 'danca', socialdance: 'danca', barre: 'danca',
  soccer: 'esporte_coletivo', basketball: 'esporte_coletivo', volleyball: 'esporte_coletivo',
  handball: 'esporte_coletivo', americanfootball: 'esporte_coletivo', rugby: 'esporte_coletivo',
  hockey: 'esporte_coletivo', softball: 'esporte_coletivo', baseball: 'esporte_coletivo',
}

/** Minúsculas, sem acento e sem separadores — para o mesmo nome casar venha como vier da ponte nativa. */
function chaveExercicio(s: string): string {
  return s.trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]/g, '')
}

/**
 * Tipo de exercício da Apple → taxonomia da plataforma. `null` quando não reconhecido.
 *
 * Devolve `null`, e não 'outro', de propósito: quem chama precisa saber a DIFERENÇA entre "é outro tipo" e
 * "não entendi" — é essa diferença que alimenta o relatório da primeira sincronização.
 */
export function activityTypeFromApple(nome: string | null | undefined): ActivityType | null {
  const k = chaveExercicio(nome ?? '')
  if (!k) return null
  return EXERCICIOS_APPLE[k] ?? null
}

/** Uma amostra bruta como a ponte nativa entrega. Tudo opcional: o formato vem de fora. */
type Bruto = Record<string, unknown>
const obj = (v: unknown): Bruto => (v && typeof v === 'object' ? (v as Bruto) : {})
const str = (v: unknown): string | null => (typeof v === 'string' && v.trim() ? v : null)
const num = (v: unknown): number | null => (typeof v === 'number' && Number.isFinite(v) ? v : null)

/**
 * De onde veio a amostra.
 *
 * O HealthKit diz qual aplicativo escreveu em `sourceRevision.source`. É o equivalente do `dataOrigin` do
 * Health Connect, e é o que preserva a procedência: uma leitura do Strava continua sendo do Strava depois de
 * atravessar o cofre da Apple.
 */
function origem(r: Bruto): { app: string | null; id: string | null } {
  const rev = obj(r.sourceRevision)
  const src = obj(rev.source)
  return {
    app: str(src.bundleIdentifier) ?? str(src.name) ?? str(r.sourceId) ?? null,
    id: str(r.uuid) ?? str(r.id) ?? null,
  }
}

/** O instante da amostra. Prefere o início; medida pontual tem início e fim iguais. */
function quando(r: Bruto): string | null {
  return str(r.startDate) ?? str(r.date) ?? str(r.endDate)
}

/** O valor numérico, seja qual for o nome do campo que a ponte usar. */
function valor(r: Bruto): number | null {
  return num(r.quantity) ?? num(r.value) ?? num(obj(r.quantity).quantity)
}

export interface ResultadoNormalizacaoApple {
  readonly registros: HcRecord[]
  /**
   * Tipos de exercício que chegaram e NÃO foram reconhecidos.
   *
   * É o que transforma a primeira sincronização num relatório em vez de num palpite: a atividade entra como
   * 'outro' — degradação correta — mas a plataforma passa a SABER e a DIZER que não entendeu aquele nome.
   */
  readonly exerciciosDesconhecidos: string[]
}

/**
 * Amostras brutas por tipo → registros da plataforma.
 *
 * Reaproveita o MESMO formato intermediário do Health Connect (`HcRecord`), e por isso as mesmas funções de
 * projeção — `healthConnectSamples` e `healthConnectActivities` — servem aos dois cofres. Um segundo formato
 * intermediário significaria duas regras de projeção, que divergiriam na primeira métrica nova.
 *
 * DEFENSIVA em cada campo: o formato vem de fora, e campo ausente faz o registro ser ignorado, nunca virar
 * zero. Zero é uma afirmação sobre a saúde de alguém.
 */
export function normalizeAppleHealth(
  porTipo: Partial<Record<HkType | string, unknown[]>>,
): ResultadoNormalizacaoApple {
  const registros: HcRecord[] = []
  const desconhecidos = new Set<string>()

  const cada = (tipo: string, fn: (r: Bruto, m: { app: string | null; id: string | null }) => HcRecord | null) => {
    for (const bruto of porTipo[tipo] ?? []) {
      const r = obj(bruto)
      const rec = fn(r, origem(r))
      if (rec) registros.push(rec)
    }
  }

  const pontual = (
    tipo: string,
    monta: (t: string, v: number, m: { app: string | null; id: string | null }) => HcRecord,
  ) => cada(tipo, (r, m) => {
    const t = quando(r); const v = valor(r)
    return t !== null && v !== null ? monta(t, v, m) : null
  })

  pontual('HKQuantityTypeIdentifierHeartRate', (time, bpm, m) => ({ kind: 'heart_rate', time, bpm, app: m.app, id: m.id }))
  pontual('HKQuantityTypeIdentifierBodyTemperature', (time, celsius, m) => ({ kind: 'body_temperature', time, celsius, app: m.app, id: m.id }))
  pontual('HKQuantityTypeIdentifierBodyMass', (time, kg, m) => ({ kind: 'weight', time, kg, app: m.app, id: m.id }))
  pontual('HKQuantityTypeIdentifierStepCount', (time, count, m) => ({ kind: 'steps', time, count, app: m.app, id: m.id }))
  pontual('HKQuantityTypeIdentifierBloodGlucose', (time, mgdl, m) => ({ kind: 'blood_glucose', time, mgdl, app: m.app, id: m.id }))

  // ALTURA em metros no HealthKit, centímetros no nosso modelo. A conversão é aqui, e não na tela: uma
  // conversão de unidade em camada de apresentação é como se troca 1,70 m por 170 m sem ninguém notar.
  pontual('HKQuantityTypeIdentifierHeight', (time, metros, m) => ({ kind: 'height', time, cm: metros * 100, app: m.app, id: m.id }))

  // SATURAÇÃO vem como FRAÇÃO (0,98), e a plataforma guarda porcentagem (98). Aceita as duas: uma ponte que
  // já converta entregaria 98, e multiplicar de novo daria 9800 — um número absurdo num registro clínico.
  pontual('HKQuantityTypeIdentifierOxygenSaturation', (time, v, m) => ({
    kind: 'oxygen_saturation', time, percent: v <= 1 ? v * 100 : v, app: m.app, id: m.id,
  }))

  cada('HKQuantityTypeIdentifierDistanceWalkingRunning', (r, m) => {
    const ini = quando(r); const metros = valor(r)
    return ini && metros !== null
      ? { kind: 'distance', startTime: ini, endTime: str(r.endDate), meters: metros, app: m.app, id: m.id }
      : null
  })

  cada('HKQuantityTypeIdentifierActiveEnergyBurned', (r, m) => {
    const ini = quando(r); const kcal = valor(r)
    return ini && kcal !== null
      ? { kind: 'energy', startTime: ini, endTime: str(r.endDate), kcal, ativa: true, app: m.app, id: m.id }
      : null
  })

  // PRESSÃO ARTERIAL: dois tipos separados que precisam voltar a ser um fato só.
  registros.push(...pareiaPressao(porTipo))

  cada('HKWorkoutTypeIdentifier', (r, m) => {
    const ini = quando(r)
    if (!ini) return null
    const nome = str(r.workoutActivityType) ?? str(r.activityName) ?? str(r.activityType)
    // NÃO RECONHECIDO É REGISTRADO, não engolido. A atividade entra como 'outro' — degradação correta — mas o
    // nome vai para o relatório, e o mapa cresce com evidência do aparelho real.
    if (nome && !activityTypeFromApple(nome)) desconhecidos.add(nome)
    return {
      kind: 'exercise',
      startTime: ini,
      endTime: str(r.endDate),
      exercise: nome,
      title: str(r.title) ?? str(r.workoutName),
      distanceM: num(obj(r.totalDistance).quantity) ?? num(r.totalDistance),
      energyKcal: num(obj(r.totalEnergyBurned).quantity) ?? num(r.totalEnergyBurned),
      steps: null,
      avgHeartRate: null,
      app: m.app,
      id: m.id,
    }
  })

  return { registros, exerciciosDesconhecidos: [...desconhecidos] }
}

/**
 * Tolerância para considerar que sistólica e diastólica são a MESMA aferição, em milissegundos.
 *
 * O HealthKit grava as duas com o mesmo instante quando vêm da mesma correlação, mas aparelhos e aplicativos
 * arredondam diferente. Um segundo é folga suficiente e continua estreito o bastante para não juntar duas
 * aferições distintas — que é o que o médico pede ao mandar medir de novo após repouso.
 */
const TOLERANCIA_PRESSAO_MS = 1000

/**
 * Sistólica + diastólica → UM registro de pressão.
 *
 * No Health Connect a pressão é um registro só. No HealthKit são dois tipos, ligados por uma correlação. Se
 * cada metade entrasse sozinha, Monitoramento mostraria "120" e "80" como duas medições sem sentido clínico —
 * e o relatório levado ao médico teria dois números soltos onde deveria haver uma pressão.
 *
 * Metade sem par é DESCARTADA. Uma sistólica sem diastólica não é uma pressão, e inventar a outra metade seria
 * a pior coisa que a plataforma pode fazer com um registro clínico.
 */
function pareiaPressao(porTipo: Partial<Record<HkType | string, unknown[]>>): HcRecord[] {
  const sis = (porTipo['HKQuantityTypeIdentifierBloodPressureSystolic'] ?? []).map(obj)
  const dia = (porTipo['HKQuantityTypeIdentifierBloodPressureDiastolic'] ?? []).map(obj)
  if (sis.length === 0 || dia.length === 0) return []

  const instante = (r: Bruto): number => {
    const t = quando(r)
    const ms = t ? Date.parse(t) : NaN
    return Number.isFinite(ms) ? ms : NaN
  }

  const usadas = new Set<number>()
  const out: HcRecord[] = []
  for (const s of sis) {
    const ts = instante(s); const vs = valor(s)
    if (!Number.isFinite(ts) || vs === null) continue

    let melhor = -1; let menorDist = Number.POSITIVE_INFINITY
    for (let i = 0; i < dia.length; i++) {
      if (usadas.has(i)) continue
      const td = instante(dia[i])
      if (!Number.isFinite(td)) continue
      const d = Math.abs(ts - td)
      if (d <= TOLERANCIA_PRESSAO_MS && d < menorDist) { menorDist = d; melhor = i }
    }
    if (melhor < 0) continue
    const vd = valor(dia[melhor])
    if (vd === null) continue
    usadas.add(melhor)

    const m = origem(s)
    const t = quando(s)!
    out.push({ kind: 'blood_pressure', time: t, systolic: vs, diastolic: vd, app: m.app, id: m.id })
  }
  return out
}
