// HIP-014 §5 — Adaptador do Health Connect (Android). PURO: nenhuma dependência de React Native, de módulo
// nativo ou de IO. A camada nativa lê os registros do aparelho, normaliza para `HcRecord` e chama estas
// funções; o que o núcleo conhece é só a forma normalizada.
//
// POR QUE O HEALTH CONNECT É O PRIMEIRO CONECTOR: numa integração só chegam pressão arterial, glicemia,
// frequência cardíaca, saturação, temperatura, peso, passos E sessões de exercício. E Strava, Oura e Garmin
// chegam POR DENTRO dele, sem contrato separado com cada fabricante (HIP-014 §5).
//
// A PROVENIÊNCIA É O APP QUE MEDIU, não "health_connect". O Health Connect informa qual aplicativo escreveu
// cada registro (`dataOrigin`), e é isso que a fundadora pediu: dados separados pela empresa de onde vieram.
// Dizer que a origem é "Health Connect" esconderia que a corrida é do Strava e o sono é do Oura — o canal não
// é a fonte.

import type { CanonicalSample } from './connector'
import type { ActivityType } from '../body/activity'

/** Canal de aquisição. Vira `source` apenas quando o app de origem é desconhecido. */
export const HEALTH_CONNECT_CHANNEL = 'health_connect' as const

/**
 * Registro já normalizado pela camada nativa. O núcleo NÃO conhece o formato do `react-native-health-connect`:
 * se a biblioteca mudar, muda o adaptador nativo, não isto.
 */
export type HcRecord =
  | { kind: 'blood_pressure';    time: string; systolic: number; diastolic: number; app?: string | null; id?: string | null }
  | { kind: 'blood_glucose';     time: string; mgdl: number;    app?: string | null; id?: string | null }
  | { kind: 'heart_rate';        time: string; bpm: number;     app?: string | null; id?: string | null }
  | { kind: 'oxygen_saturation'; time: string; percent: number; app?: string | null; id?: string | null }
  | { kind: 'body_temperature';  time: string; celsius: number; app?: string | null; id?: string | null }
  | { kind: 'weight';            time: string; kg: number;      app?: string | null; id?: string | null }
  | { kind: 'height';            time: string; cm: number;      app?: string | null; id?: string | null }
  | { kind: 'steps';             time: string; count: number;   app?: string | null; id?: string | null }
  | {
      kind: 'exercise'
      startTime: string
      endTime?: string | null
      /** Nome do tipo já resolvido pela camada nativa (o Health Connect usa códigos numéricos). */
      exercise?: string | null
      title?: string | null
      distanceM?: number | null
      energyKcal?: number | null
      steps?: number | null
      avgHeartRate?: number | null
      app?: string | null
      id?: string | null
    }

/** O que uma sessão de exercício vira. Compatível com `ActivitySessionInput` do api-client (tipagem estrutural). */
export interface ActivitySessionDraft {
  source: string
  external_id?: string | null
  connector_version?: string | null
  activity_type: ActivityType | string
  title?: string | null
  started_at: string
  ended_at?: string | null
  distance_m?: number | null
  active_energy_kcal?: number | null
  avg_heart_rate?: number | null
  steps?: number | null
}

/**
 * Nome do pacote Android → id de fonte estável. O identificador que o Health Connect entrega é o pacote
 * ("com.strava"), não um nome legível. Lista ABERTA: pacote desconhecido vira o próprio pacote, preservado como
 * está — a origem continua rastreável mesmo sem estar mapeada, que é o que importa.
 */
const APPS: { prefixo: string; source: string }[] = [
  { prefixo: 'com.strava',                source: 'strava' },
  { prefixo: 'com.ouraring',              source: 'oura' },
  { prefixo: 'com.garmin',                source: 'garmin' },
  { prefixo: 'com.google.android.apps.fitness', source: 'google_fit' },
  { prefixo: 'com.samsung.android.app.health',  source: 'samsung_health' },
  { prefixo: 'com.fitbit',                source: 'fitbit' },
  { prefixo: 'com.whoop',                 source: 'whoop' },
  { prefixo: 'com.polar',                 source: 'polar' },
  { prefixo: 'com.withings',              source: 'withings' },
]

/** Id de fonte a partir do pacote de origem. Sem pacote conhecido, a origem é o próprio canal. */
export function sourceFromApp(app: string | null | undefined): string {
  const pacote = (app ?? '').trim().toLowerCase()
  if (!pacote) return HEALTH_CONNECT_CHANNEL
  return APPS.find(a => pacote.startsWith(a.prefixo))?.source ?? pacote
}

/** Tipos de exercício do Health Connect → taxonomia da plataforma. Desconhecido degrada para 'outro'. */
const EXERCISES: Record<string, ActivityType> = {
  walking: 'caminhada', hiking: 'caminhada',
  running: 'corrida', running_treadmill: 'corrida',
  biking: 'ciclismo', biking_stationary: 'ciclismo',
  swimming_pool: 'natacao', swimming_open_water: 'natacao',
  strength_training: 'musculacao', weightlifting: 'musculacao',
  high_intensity_interval_training: 'funcional', calisthenics: 'funcional', boot_camp: 'funcional',
  pilates: 'pilates',
  yoga: 'yoga',
  dancing: 'danca',
  football_soccer: 'esporte_coletivo', basketball: 'esporte_coletivo', volleyball: 'esporte_coletivo',
  handball: 'esporte_coletivo', football_american: 'esporte_coletivo',
}

export function activityTypeFromExercise(exercise: string | null | undefined): ActivityType {
  return EXERCISES[(exercise ?? '').trim().toLowerCase()] ?? 'outro'
}

/**
 * Registros → amostras canônicas. Sessões de exercício NÃO entram aqui: não são medida pontual (§3), e saem
 * por `healthConnectActivities`. Registro sem valor utilizável é DESCARTADO em silêncio — o bruto do aparelho
 * não é nossa fonte da verdade, e inventar um número seria pior que perder um ponto.
 */
export function healthConnectSamples(records: readonly HcRecord[], connectorVersion: string): CanonicalSample[] {
  const out: CanonicalSample[] = []
  for (const r of records) {
    if (r.kind === 'exercise') continue
    const prov = { source: sourceFromApp(r.app), connectorVersion, externalId: r.id ?? null }
    const base = { recordedAt: r.time, provenance: prov }

    switch (r.kind) {
      case 'blood_pressure':
        if (!ok(r.systolic) || !ok(r.diastolic)) break
        out.push({
          ...base,
          metric: 'pressao_arterial',
          // `value` guarda a SISTÓLICA para que gráfico e tendência funcionem; `valueText` guarda a leitura
          // inteira, que é o que a pessoa e o médico leem. Sem os dois, ou o gráfico quebra ou a diastólica some.
          value: r.systolic,
          valueText: `${Math.round(r.systolic)}/${Math.round(r.diastolic)}`,
          unit: 'mmHg',
        })
        break
      case 'blood_glucose':
        if (ok(r.mgdl)) out.push({ ...base, metric: 'glicemia', value: r.mgdl, unit: 'mg/dL' })
        break
      case 'heart_rate':
        if (ok(r.bpm)) out.push({ ...base, metric: 'frequencia_cardiaca', value: r.bpm, unit: 'bpm' })
        break
      case 'oxygen_saturation':
        if (ok(r.percent)) out.push({ ...base, metric: 'saturacao', value: r.percent, unit: '%' })
        break
      case 'body_temperature':
        if (ok(r.celsius)) out.push({ ...base, metric: 'temperatura', value: r.celsius, unit: '°C' })
        break
      case 'weight':
        if (ok(r.kg)) out.push({ ...base, metric: 'peso', value: r.kg, unit: 'kg' })
        break
      case 'height':
        if (ok(r.cm)) out.push({ ...base, metric: 'altura', value: r.cm, unit: 'cm' })
        break
      case 'steps':
        // 'passos' não está no catálogo de body_metrics: fica só no bruto (wearable_readings) e a projeção
        // ignora. É o Modelo Aberto funcionando — o desconhecido degrada, não quebra.
        if (ok(r.count)) out.push({ ...base, metric: 'passos', value: r.count, unit: 'passos' })
        break
    }
  }
  return out
}

/** Sessões de exercício → rascunhos de `activity_sessions`. Ausência de grandeza permanece ausência. */
export function healthConnectActivities(records: readonly HcRecord[], connectorVersion: string): ActivitySessionDraft[] {
  const out: ActivitySessionDraft[] = []
  for (const r of records) {
    if (r.kind !== 'exercise') continue
    if (!r.startTime) continue
    out.push({
      source: sourceFromApp(r.app),
      external_id: r.id ?? null,
      connector_version: connectorVersion,
      activity_type: activityTypeFromExercise(r.exercise),
      title: r.title?.trim() || null,
      started_at: r.startTime,
      ended_at: r.endTime || null,
      distance_m: num(r.distanceM),
      active_energy_kcal: num(r.energyKcal),
      avg_heart_rate: num(r.avgHeartRate),
      steps: num(r.steps),
    })
  }
  return out
}

// ─────────────────────────────────────────────────────────────────────────────
// Normalização do formato BRUTO da biblioteca → `HcRecord`.
//
// Fica aqui, e não no aplicativo, por um motivo prático: é a parte que mais erra e a que mais muda quando a
// biblioteca sobe de versão — e no aplicativo ela seria INVERIFICÁVEL (não há toolchain React Native no
// ambiente de desenvolvimento). Aqui é função pura, coberta por teste. O que sobra no aparelho é só a chamada
// de IO, fina o bastante para caber na cabeça.
//
// Toda leitura é DEFENSIVA: o formato vem de fora, e um campo ausente ou de outro tipo faz o registro ser
// ignorado, nunca virar zero. Ver `ok()` no fim do arquivo.
// ─────────────────────────────────────────────────────────────────────────────

/** Tipos de registro que a SINTERA lê. Espelha as permissões declaradas no AndroidManifest. */
export const HC_RECORD_TYPES = [
  'BloodPressure', 'BloodGlucose', 'HeartRate', 'OxygenSaturation',
  'BodyTemperature', 'Weight', 'Height', 'Steps', 'ExerciseSession',
] as const
export type HcRecordType = (typeof HC_RECORD_TYPES)[number]

type Bruto = Record<string, unknown>
const obj = (v: unknown): Bruto => (v && typeof v === 'object' ? (v as Bruto) : {})
const str = (v: unknown): string | null => (typeof v === 'string' && v.trim() ? v : null)
const numDe = (v: unknown): number | null => (typeof v === 'number' && Number.isFinite(v) ? v : null)

/** Proveniência que a biblioteca entrega em `metadata`: pacote de origem e id do registro na fonte. */
function meta(r: Bruto): { app: string | null; id: string | null } {
  const m = obj(r.metadata)
  const origem = obj(m.dataOrigin)
  return {
    app: str(m.dataOrigin) ?? str(origem.packageName) ?? null,
    id: str(m.id) ?? str(m.clientRecordId) ?? null,
  }
}

/**
 * Registros brutos por tipo → `HcRecord[]`. Aceita o mapa parcial: tipo ausente simplesmente não contribui.
 * Determinística; preserva a ordem de entrada dentro de cada tipo.
 */
export function normalizeHealthConnect(porTipo: Partial<Record<HcRecordType, readonly unknown[]>>): HcRecord[] {
  const out: HcRecord[] = []
  const cada = (tipo: HcRecordType, fn: (r: Bruto, m: ReturnType<typeof meta>) => HcRecord | null) => {
    for (const bruto of porTipo[tipo] ?? []) {
      const r = obj(bruto)
      const registro = fn(r, meta(r))
      if (registro) out.push(registro)
    }
  }

  cada('BloodPressure', (r, m) => {
    const t = str(r.time); const s = numDe(obj(r.systolic).inMillimetersOfMercury); const d = numDe(obj(r.diastolic).inMillimetersOfMercury)
    return t && s != null && d != null ? { kind: 'blood_pressure', time: t, systolic: s, diastolic: d, app: m.app, id: m.id } : null
  })

  cada('BloodGlucose', (r, m) => {
    const t = str(r.time); const v = numDe(obj(r.level).inMilligramsPerDeciliter)
    return t && v != null ? { kind: 'blood_glucose', time: t, mgdl: v, app: m.app, id: m.id } : null
  })

  // Frequência cardíaca vem como SESSÃO com várias amostras dentro — cada amostra é uma leitura própria.
  cada('HeartRate', (r, m) => {
    const amostras = Array.isArray(r.samples) ? r.samples : []
    for (const a of amostras) {
      const s = obj(a); const t = str(s.time); const bpm = numDe(s.beatsPerMinute)
      if (t && bpm != null) out.push({ kind: 'heart_rate', time: t, bpm, app: m.app, id: m.id ? `${m.id}:${t}` : null })
    }
    return null // já empurrado acima; nada a devolver
  })

  cada('OxygenSaturation', (r, m) => {
    const t = str(r.time); const v = numDe(obj(r.percentage).value) ?? numDe(r.percentage)
    return t && v != null ? { kind: 'oxygen_saturation', time: t, percent: v, app: m.app, id: m.id } : null
  })

  cada('BodyTemperature', (r, m) => {
    const t = str(r.time); const v = numDe(obj(r.temperature).inCelsius)
    return t && v != null ? { kind: 'body_temperature', time: t, celsius: v, app: m.app, id: m.id } : null
  })

  cada('Weight', (r, m) => {
    const t = str(r.time); const v = numDe(obj(r.weight).inKilograms)
    return t && v != null ? { kind: 'weight', time: t, kg: v, app: m.app, id: m.id } : null
  })

  // A biblioteca entrega altura em METROS; o catálogo da plataforma é em centímetros.
  cada('Height', (r, m) => {
    const t = str(r.time); const metros = numDe(obj(r.height).inMeters)
    return t && metros != null ? { kind: 'height', time: t, cm: metros * 100, app: m.app, id: m.id } : null
  })

  cada('Steps', (r, m) => {
    const t = str(r.startTime) ?? str(r.time); const n = numDe(r.count)
    return t && n != null ? { kind: 'steps', time: t, count: n, app: m.app, id: m.id } : null
  })

  cada('ExerciseSession', (r, m) => {
    const ini = str(r.startTime)
    if (!ini) return null
    return {
      kind: 'exercise',
      startTime: ini,
      endTime: str(r.endTime),
      // A biblioteca já resolve o código numérico do Health Connect para nome quando consegue.
      exercise: str(r.exerciseType) ?? null,
      title: str(r.title),
      distanceM: numDe(obj(r.distance).inMeters),
      energyKcal: numDe(obj(r.totalEnergy).inKilocalories) ?? numDe(obj(r.activeEnergy).inKilocalories),
      steps: numDe(r.steps),
      avgHeartRate: numDe(obj(r.heartRate).avg),
      app: m.app,
      id: m.id,
    }
  })

  return out
}

/** Número utilizável: finito e não-negativo. Qualquer outra coisa é ausência, nunca zero. */
function ok(n: unknown): n is number {
  return typeof n === 'number' && Number.isFinite(n) && n >= 0
}
function num(n: number | null | undefined): number | null {
  return ok(n) ? n : null
}
