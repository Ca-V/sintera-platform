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

// A POLÍTICA (tamanho, qualidade, quando reduzir) vem do core — o aplicativo lê as MESMAS constantes. Só o
// mecanismo é daqui: a Web usa canvas, o aplicativo usa a biblioteca nativa. Antes, os números viviam neste
// arquivo e o aplicativo não os tinha — o mesmo documento chegava ao leitor em resoluções diferentes.
import { targetImageSize, IMAGE_QUALITY } from '@sintera/core'

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
          // `targetImageSize` já decide: devolve a entrada intacta quando ela cabe, e nunca amplia.
          const alvo = targetImageSize({ width: img.width, height: img.height })
          const canvas = document.createElement('canvas')
          canvas.width = alvo.width
          canvas.height = alvo.height
          const ctx = canvas.getContext('2d')
          if (!ctx) { URL.revokeObjectURL(url); reject(new Error('canvas')); return }
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
          URL.revokeObjectURL(url)
          resolve(canvas.toDataURL('image/jpeg', IMAGE_QUALITY))
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
