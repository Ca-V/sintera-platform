// Conversão de arquivo → base64 para a classificação por conteúdo. FONTE ÚNICA na Web.
//
// Estava duplicada em `intake/CaptureCenter.tsx` e em `medications/scanImage.ts`, com comportamentos
// diferentes: uma reduzia a imagem, a outra não. Duas implementações do mesmo passo significam duas
// qualidades de leitura para a mesma pessoa, dependendo de qual tela ela usou.
//
// Client-only: usa canvas e FileReader.
//
// A imagem é REDUZIDA antes de enviar. Não é economia apenas — foto de celular hoje passa de 4000px, e mandá-la
// inteira aumenta latência e custo sem melhorar a leitura do TIPO do documento, que é o que se quer aqui.

/** Maior lado da imagem enviada à classificação. Acima disto não melhora a leitura do tipo. */
const MAX_LADO = 1600

/** Qualidade do JPEG de saída — suficiente para ler cabeçalho, carimbo e data. */
const QUALIDADE = 0.8

export interface Base64Payload {
  fileBase64: string
  mediaType: string
}

/**
 * Converte para base64. Imagem: reduz e recodifica como JPEG. PDF e demais: base64 direto.
 *
 * NUNCA lança: falha devolve `fileBase64` vazio, e quem chama trata como "não deu para ler". Uma leitura
 * assistida que quebra a tela seria pior que uma leitura que não acontece.
 */
export async function fileToBase64(file: File): Promise<Base64Payload> {
  if (file.type.startsWith('image/')) {
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const img = new Image()
        const url = URL.createObjectURL(file)
        img.onload = () => {
          const escala = Math.min(1, MAX_LADO / Math.max(img.width, img.height))
          const canvas = document.createElement('canvas')
          canvas.width = Math.max(1, Math.round(img.width * escala))
          canvas.height = Math.max(1, Math.round(img.height * escala))
          const ctx = canvas.getContext('2d')
          if (!ctx) { URL.revokeObjectURL(url); reject(new Error('canvas')); return }
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
          URL.revokeObjectURL(url)
          resolve(canvas.toDataURL('image/jpeg', QUALIDADE))
        }
        img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('img')) }
        img.src = url
      })
      return { fileBase64: dataUrl.split(',')[1] ?? '', mediaType: 'image/jpeg' }
    } catch {
      return { fileBase64: '', mediaType: file.type }
    }
  }

  const b64 = await new Promise<string>((resolve) => {
    const r = new FileReader()
    r.onload = () => resolve(String(r.result).split(',')[1] ?? '')
    r.onerror = () => resolve('')
    r.readAsDataURL(file)
  })
  return { fileBase64: b64, mediaType: file.type }
}
