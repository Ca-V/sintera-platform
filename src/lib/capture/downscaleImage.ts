// Reduz a imagem antes de enviar à IA de visão — corta MUITO os tokens de entrada
// (custo) e acelera. PDF vai como está. Se o navegador não decodificar (ex.: HEIC do
// iPhone), lança mensagem clara em vez de mandar formato inválido.
// Utilitário ÚNICO/compartilhado (antes reimplementado em Condições e Medidas). Client-only.
const SUPPORTED = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

export async function downscaleImageToPayload(
  file: File,
  maxDim = 1400,
): Promise<{ base64: string; mediaType: string }> {
  const dataUrl = await new Promise<string>((res, rej) => {
    const r = new FileReader(); r.onload = () => res(r.result as string); r.onerror = rej; r.readAsDataURL(file)
  })
  if (file.type === 'application/pdf') return { base64: dataUrl.split(',')[1] ?? '', mediaType: 'application/pdf' }
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
  } catch { /* usa a imagem original */ }
  const t = file.type || 'image/jpeg'
  if (!SUPPORTED.includes(t)) {
    throw new Error('Formato de foto não suportado (ex.: HEIC do iPhone). Tire a foto como JPG, ou envie PDF/PNG.')
  }
  return { base64: dataUrl.split(',')[1] ?? '', mediaType: t }
}
