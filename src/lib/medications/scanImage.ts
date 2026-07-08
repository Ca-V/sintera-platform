// Utilitário de scan de medicamento por IMAGEM — compartilhado entre a página de
// Medicamentos e o processador de captura da Home. Client-side (usa FileReader/canvas).
// Reduz a foto antes de enviar (câmera gera arquivos grandes) e chama a rota de visão.

export type ScannedMed = {
  name: string; dose: string | null; frequency: string | null
  startedOn?: string | null; acquiredQty?: number | null; packQty?: number | null
  dailyCons?: number | null; purchasedOn?: string | null
  form?: string | null; route?: string | null; packUnit?: string | null; prescriber?: string | null
}

// Chave de handoff: a captura da Home guarda os itens aqui; a página de Medicamentos
// lê e limpa ao montar, abrindo a prévia "Detectado".
export const PENDING_MED_SCAN_KEY = 'sintera:med-scan'

const SUPPORTED = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

export async function downscaleImage(file: File, maxDim = 1100): Promise<{ base64: string; mediaType: string }> {
  const dataUrl = await new Promise<string>((res, rej) => {
    const r = new FileReader(); r.onload = () => res(r.result as string); r.onerror = rej; r.readAsDataURL(file)
  })
  try {
    const img = await new Promise<HTMLImageElement>((res, rej) => {
      const i = new window.Image(); i.onload = () => res(i); i.onerror = rej; i.src = dataUrl
    })
    const scale = Math.min(1, maxDim / Math.max(img.width, img.height))
    if (scale < 1) {
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(img.width * scale); canvas.height = Math.round(img.height * scale)
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        const out = canvas.toDataURL('image/jpeg', 0.85)
        return { base64: out.split(',')[1] ?? '', mediaType: 'image/jpeg' }
      }
    }
  } catch { /* fallback p/ a imagem original */ }
  // Fallback: se o navegador não decodificou a foto (ex.: HEIC do iPhone),
  // não dá pra converter aqui — só enviamos se for um formato que a IA aceita.
  const t = file.type || 'image/jpeg'
  if (!SUPPORTED.includes(t)) {
    throw new Error('Formato de foto não suportado (ex.: HEIC do iPhone). Tire a foto como JPG, ou em Ajustes → Câmera → Formatos escolha "Mais compatível".')
  }
  return { base64: dataUrl.split(',')[1] ?? '', mediaType: t }
}

// Base64 do arquivo (sem o prefixo data:) — usado para PDF, que vai como documento.
function fileToBase64(file: File): Promise<string> {
  return new Promise((res, rej) => {
    const r = new FileReader()
    r.onload = () => res((r.result as string).split(',')[1] ?? '')
    r.onerror = rej
    r.readAsDataURL(file)
  })
}

// Extrai medicamentos de um ARQUIVO (imagem OU PDF). Imagem: reduz e envia como visão;
// PDF: envia como documento (a IA lê o PDF). Pré-preenche o cadastro para a usuária revisar.
export async function scanMedicationFile(file: File): Promise<{ ok: boolean; items: ScannedMed[]; error?: string }> {
  try {
    let payload: { fileBase64: string; mediaType: string }
    if (file.type === 'application/pdf') {
      payload = { fileBase64: await fileToBase64(file), mediaType: 'application/pdf' }
    } else {
      const { base64, mediaType } = await downscaleImage(file)
      payload = { fileBase64: base64, mediaType }
    }
    const resp = await fetch('/api/medications/scan', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const j = await resp.json().catch(() => ({}))
    if (!resp.ok) return { ok: false, items: [], error: j.error ?? `Falha ao ler o documento (${resp.status}).` }
    return { ok: true, items: (j.items ?? []) as ScannedMed[] }
  } catch (e) {
    return { ok: false, items: [], error: e instanceof Error ? e.message : 'Falha ao processar o documento.' }
  }
}

/** Alias retrocompatível (aceita imagem e PDF). */
export const scanMedicationImage = scanMedicationFile
