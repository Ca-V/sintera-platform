// ============================================================
// SINTERA — Camada de Comunicação: DATASET DO RELATÓRIO (read-model)
// ============================================================
// Conceito permanente: o "dataset de comunicação" é o CONJUNTO FACTUAL COMPLETO
// da pessoa reunido para comunicar com um profissional (relatório privado e link
// público). É uma PROJEÇÃO DE LEITURA cross-domínio — dona ÚNICA da forma como
// esses dados são buscados e normalizados. Antes desta camada, a mesma projeção de
// 11 tabelas era clonada em `dashboard/relatorio` (RLS) e `r/[token]` (service-role),
// divergindo em silêncio a cada mudança de coluna.
//
// Fronteira (mesma da escrita): NENHUMA regra de negócio de outro domínio vive aqui.
//   • eventos → devolvidos como `HealthEvent[]` (domínio Agenda, via rowToHealthEvent);
//     Despesas continuam sendo `selectFinancial(dataset.events)` (SSOT do domínio).
//   • recorte temporal → responsabilidade do consumidor (period.ts), não do dataset.
// O read-model só REÚNE e NORMALIZA; cada consumidor renderiza como quiser.
//
// Neutro quanto à origem do cliente: recebe um SupabaseClient (RLS do usuário OU
// service-role do link público) e projeta o mesmo dataset. Prepara integrações
// futuras (labs/wearables): novas fontes entram aqui, os dois consumidores herdam.
// ============================================================

import type { SupabaseClient } from '@supabase/supabase-js'
import { rowToHealthEvent, type HealthEvent, type HealthEventRow } from '../agenda/event'

// ── Formas normalizadas (camelCase) — contrato de apresentação do relatório ──────
export interface ReportProfile { name: string | null; heightCm: number | null }
export interface ReportMed {
  name: string; kind: string; dose: string | null; frequency: string | null
  startedOn: string | null; untilOn: string | null; status: string
}
export interface ReportExam { id: string; type: string; date: string; fileUrl: string | null }
export interface ReportMeasure {
  metric: string; label: string | null; valueText: string; unit: string | null
  date: string; examId: string | null
}
export interface ReportCondition { scope: string; name: string; relative: string | null; since: string | null; notes: string | null }
export interface ReportHabit { category: string; description: string; frequency: string | null; notes: string | null }
export interface ReportEyewear {
  kind: string; prescribedOn: string | null; prescriber: string | null
  odSph: string | null; odCyl: string | null; odAxis: string | null; odAdd: string | null
  oeSph: string | null; oeCyl: string | null; oeAxis: string | null; oeAdd: string | null
  dnp: string | null; bc: string | null; dia: string | null; fileUrl: string | null
}
export interface ReportOmics { domain: string; laboratory: string | null; totalFeatures: number | null; date: string | null }
export interface ReportContraceptive { kind: string; brand: string | null; startedOn: string | null; replaceOn: string | null; status: string }
export interface ReportMenstruation { startedOn: string; notes: string | null }

/** Dataset factual completo da pessoa para comunicação (relatório privado + link público). */
export interface ReportDataset {
  profile: ReportProfile
  medications: ReportMed[]
  events: HealthEvent[]                 // domínio Agenda; Despesas = selectFinancial(events)
  exams: ReportExam[]
  measures: ReportMeasure[]
  conditions: ReportCondition[]
  habits: ReportHabit[]
  eyewear: ReportEyewear[]
  omics: ReportOmics[]
  contraceptives: ReportContraceptive[]
  menstruations: ReportMenstruation[]
}

type Row = Record<string, unknown>
const str = (v: unknown): string | null => (typeof v === 'string' ? v : v == null ? null : String(v))

// ── Normalizadores PUROS (uma definição por forma; antes duplicados nas 2 páginas) ──
export function toMed(r: Row): ReportMed {
  return {
    name: (r.name as string) ?? '', kind: (r.kind as string) ?? 'medicamento',
    dose: str(r.dose), frequency: str(r.frequency),
    startedOn: str(r.started_on), untilOn: str(r.until_date), status: (r.status as string) ?? 'em_uso',
  }
}
export function toExam(r: Row): ReportExam {
  return {
    id: r.id as string, type: (r.type as string) || 'Exame',
    date: (r.exam_date as string) || (r.created_at as string) || '', fileUrl: str(r.file_url),
  }
}
export function toMeasure(r: Row): ReportMeasure {
  return {
    metric: (r.metric as string) ?? 'outro', label: str(r.label),
    valueText: (r.value_text as string) ?? '', unit: str(r.unit),
    date: r.measured_on as string, examId: str(r.exam_id),
  }
}
export function toCondition(r: Row): ReportCondition {
  return {
    scope: (r.scope as string) ?? 'propria', name: (r.name as string) ?? '',
    relative: str(r.relative), since: str(r.since_label), notes: str(r.notes),
  }
}
export function toHabit(r: Row): ReportHabit {
  return {
    category: (r.category as string) ?? 'outro', description: (r.description as string) ?? '',
    frequency: str(r.frequency), notes: str(r.notes),
  }
}
/** Achata `health_resources.attributes` (JSON od/oe/…) na forma plana de óculos/lentes. */
export function toEyewear(r: Row): ReportEyewear {
  const a = (r.attributes as Row) ?? {}
  const od = (a.od as Record<string, string>) ?? {}
  const oe = (a.oe as Record<string, string>) ?? {}
  return {
    kind: (a.vision_kind as string) ?? 'oculos', prescribedOn: str(r.started_on), prescriber: str(r.prescriber),
    odSph: od.sph ?? null, odCyl: od.cyl ?? null, odAxis: od.axis ?? null, odAdd: od.add ?? null,
    oeSph: oe.sph ?? null, oeCyl: oe.cyl ?? null, oeAxis: oe.axis ?? null, oeAdd: oe.add ?? null,
    dnp: str(a.dnp), bc: str(a.bc), dia: str(a.dia), fileUrl: str(r.file_url),
  }
}
export function toOmics(r: Row): ReportOmics {
  return {
    domain: (r.domain as string) ?? 'metabolomics', laboratory: str(r.laboratory),
    totalFeatures: (r.total_features as number) ?? null, date: (r.collected_on as string) ?? (r.created_at as string) ?? null,
  }
}
export function toContraceptive(r: Row): ReportContraceptive {
  return {
    kind: (r.kind as string) ?? 'outro', brand: str(r.brand),
    startedOn: str(r.started_on), replaceOn: str(r.replace_on), status: (r.status as string) ?? 'ativo',
  }
}
export function toMenstruation(r: Row): ReportMenstruation {
  return { startedOn: r.started_on as string, notes: str(r.notes) }
}

// ── Loader ÚNICO — busca canônica das 11 tabelas + normalização ─────────────────
export async function loadReportDataset(supabase: SupabaseClient, userId: string): Promise<ReportDataset> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any
  const [prof, meds, events, exams, measures, conditions, habits, eyewear, omics, contraceptives, menstruations] = await Promise.all([
    db.from('profiles').select('name, height_cm').eq('id', userId).maybeSingle(),
    db.from('medications').select('name, kind, dose, frequency, started_on, until_date, status').eq('user_id', userId).order('status'),
    db.from('health_events').select('id, event_type, title, event_date, notes, professional_kind, status, amount_cents, direct_expense').eq('user_id', userId).eq('synthetic', false).order('event_date', { ascending: false }),
    db.from('exams').select('id, type, exam_date, created_at, file_url').eq('user_id', userId).order('created_at', { ascending: false }),
    db.from('body_metrics').select('metric, label, value_text, unit, measured_on, exam_id').eq('user_id', userId).order('measured_on', { ascending: false }),
    db.from('health_conditions').select('scope, name, relative, since_label, notes').eq('user_id', userId).order('created_at', { ascending: false }),
    db.from('life_habits').select('category, description, frequency, notes').eq('user_id', userId).order('created_at', { ascending: false }),
    db.from('health_resources').select('name, resource_type, prescriber, started_on, attributes, file_url').eq('user_id', userId).eq('resource_type', 'correcao_visual').order('created_at', { ascending: false }),
    db.from('omics_panels').select('domain, laboratory, total_features, collected_on, created_at').eq('user_id', userId).order('collected_on', { ascending: false, nullsFirst: false }),
    db.from('contraceptive_methods').select('kind, brand, started_on, replace_on, status').eq('user_id', userId).order('created_at', { ascending: false }),
    db.from('menstrual_periods').select('started_on, notes').eq('user_id', userId).order('started_on', { ascending: false }).limit(24),
  ])

  const rows = (res: { data?: unknown } | null): Row[] => ((res?.data ?? []) as Row[])
  const p = (prof?.data ?? null) as Row | null
  return {
    profile: { name: (p?.name as string) ?? null, heightCm: (p?.height_cm as number) ?? null },
    medications: rows(meds).map(toMed),
    events: rows(events).map((r) => rowToHealthEvent(r as unknown as HealthEventRow)),
    exams: rows(exams).map(toExam),
    measures: rows(measures).map(toMeasure),
    conditions: rows(conditions).map(toCondition),
    habits: rows(habits).map(toHabit),
    eyewear: rows(eyewear).map(toEyewear),
    omics: rows(omics).map(toOmics),
    contraceptives: rows(contraceptives).map(toContraceptive),
    menstruations: rows(menstruations).map(toMenstruation),
  }
}
