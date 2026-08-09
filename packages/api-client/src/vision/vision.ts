// @sintera/api-client — CAPTURA ASSISTIDA (T1), capacidade TRANSVERSAL da plataforma. PONTE ADR-020: reusa os
// MESMOS serviços de OCR/IA da Web (/api/vision/*, /api/medications/scan) autenticando por Bearer — nada de
// reimplementar leitura por módulo. As telas escolhem a fonte (arquivo/foto em base64); este módulo envia e
// devolve os campos PRÉ-PREENCHIDOS para a usuária revisar e confirmar (FACTUAL, RDC 657 — só transcreve).
// Convenção: retornam { data, error }; NÃO lançam. `data` é null quando a IA não reconhece nada no documento.
import type { SupabaseClient } from '@supabase/supabase-js'
import { asError } from '../net/errors'

/** Documento capturado: conteúdo em base64 + tipo de mídia (image/jpeg|png|webp|application/pdf). */
export type CaptureInput = { fileBase64: string; mediaType: string }

/** POST base64 → rota de visão (Bearer). Devolve o envelope cru da rota (`{result}` ou `{items}`). */
async function postVision<T>(
  client: SupabaseClient, webBaseUrl: string | undefined, path: string, body: Record<string, unknown>,
): Promise<{ data: T | null; error: Error | null }> {
  try {
    if (!webBaseUrl) return { data: null, error: new Error('URL não configurada.') }
    const { data: { session } } = await client.auth.getSession()
    if (!session) return { data: null, error: new Error('Não autenticado') }
    const res = await fetch(`${webBaseUrl.replace(/\/+$/, '')}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify(body),
    })
    if (!res.ok) return { data: null, error: new Error(`Leitura falhou (${res.status}).`) }
    return { data: (await res.json()) as T, error: null }
  } catch (e) {
    return { data: null, error: asError(e) }
  }
}

// ── Formas dos campos PRÉ-PREENCHIDOS (espelham as rotas; a usuária revisa antes de salvar) ──

export type ConditionScan = {
  name: string | null; kind: string; since: string | null; notes: string | null
  isExam: boolean; examType: string | null; examDate: string | null
}
export type BioimpedanceScan = {
  measured_on: string | null; peso: string | null; gordura_corporal: string | null; massa_muscular: string | null
  agua_corporal: string | null; gordura_visceral: string | null; massa_ossea: string | null; taxa_metabolica: string | null
}
export type EyeglassesEye = { sph: string | null; cyl: string | null; axis: string | null; add: string | null }
export type EyeglassesScan = {
  od: EyeglassesEye; oe: EyeglassesEye; dnp: string | null; bc: string | null; dia: string | null
  prescribed_on: string | null; prescriber: string | null
}
export type MedicationScanItem = {
  name: string; dose: string | null; frequency: string | null; startedOn: string | null
  acquiredQty: number | null; packQty: number | null; dailyCons: number | null; purchasedOn: string | null
  form: string | null; route: string | null; packUnit: string | null; prescriber: string | null
}

/** Lê uma CONDIÇÃO/diagnóstico/alergia de um documento (imagem ou PDF). Indica também se é um exame (salvamento duplo). */
export async function readCondition(client: SupabaseClient, webBaseUrl: string | undefined, input: CaptureInput) {
  const { data, error } = await postVision<{ result: ConditionScan | null }>(
    client, webBaseUrl, '/api/vision/condition', { fileBase64: input.fileBase64, mediaType: input.mediaType })
  return { data: data?.result ?? null, error }
}

/** Lê as medidas de um laudo de BIOIMPEDÂNCIA (imagem). */
export async function readBioimpedance(client: SupabaseClient, webBaseUrl: string | undefined, input: CaptureInput) {
  const { data, error } = await postVision<{ result: BioimpedanceScan | null }>(
    client, webBaseUrl, '/api/vision/bioimpedance', { imageBase64: input.fileBase64, mediaType: input.mediaType })
  return { data: data?.result ?? null, error }
}

/** Lê o GRAU de uma receita de ÓCULOS (imagem): OD/OE (esf/cil/eixo/adição), DNP, curva-base, diâmetro. */
export async function readEyeglasses(client: SupabaseClient, webBaseUrl: string | undefined, input: CaptureInput) {
  const { data, error } = await postVision<{ result: EyeglassesScan | null }>(
    client, webBaseUrl, '/api/vision/eyeglasses', { imageBase64: input.fileBase64, mediaType: input.mediaType })
  return { data: data?.result ?? null, error }
}

/** Lê MEDICAMENTOS/suplementos de uma receita ou rótulo (imagem/PDF) — pode retornar vários itens. */
export async function scanMedications(client: SupabaseClient, webBaseUrl: string | undefined, input: CaptureInput) {
  const { data, error } = await postVision<{ items: MedicationScanItem[] }>(
    client, webBaseUrl, '/api/medications/scan', { fileBase64: input.fileBase64, mediaType: input.mediaType })
  return { data: data?.items ?? [], error }
}
