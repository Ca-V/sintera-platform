// Mobile — INFRAESTRUTURA: converte um arquivo local (uri do seletor ou da câmera) em base64 para a leitura
// assistida. Isola o acesso ao arquivo, como o `documentPickerAdapter`.
//
// A POLÍTICA de preparo (tamanho máximo, qualidade, quando reduzir) vem do CORE — a Web lê as MESMAS
// constantes. Só o mecanismo é daqui: a Web usa canvas, o aplicativo usa `expo-image-manipulator`.
//
// O DEFEITO QUE ISTO CORRIGE (27/08): antes, a Web reduzia a imagem e o aplicativo mandava o arquivo inteiro.
// Duas consequências:
//   1. o MESMO documento chegava ao classificador em resoluções diferentes conforme a ponta — e podia ser
//      lido de formas diferentes. Divergência silenciosa entre plataformas.
//   2. foto de celular passa de 12MP; em base64 isso ultrapassa 4 MB, acima do limite de requisição da
//      hospedagem. A leitura assistida no aplicativo falharia POR TAMANHO, com uma mensagem que não explica
//      nada. Não era desperdício: era o recurso não funcionar.
//
// Devolve APENAS o base64, sem o prefixo `data:...;base64,`.
import * as ImageManipulator from 'expo-image-manipulator'
import { targetImageSize, shouldResize, IMAGE_QUALITY, IMAGE_MAX_SIDE } from '@sintera/core'

/** Lê um arquivo local como base64, sem tocar no conteúdo. Usado para PDF e como alternativa da imagem. */
export async function readFileBase64(uri: string): Promise<string> {
  const res = await fetch(uri)
  const blob = await res.blob()
  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('Falha ao ler o arquivo.'))
    reader.onload = () => {
      const s = String(reader.result ?? '')
      const comma = s.indexOf(',')
      resolve(comma >= 0 ? s.slice(comma + 1) : s)
    }
    reader.readAsDataURL(blob)
  })
}

export interface Base64Payload {
  fileBase64: string
  mediaType: string
}

/**
 * Prepara o arquivo para a leitura assistida, aplicando a política do core.
 *
 * PDF e demais formatos passam direto — reduzir não se aplica. Imagem é redimensionada quando ultrapassa o
 * limite; quando já cabe, passa intacta (a política nunca amplia).
 *
 * NUNCA lança: qualquer falha devolve o base64 do arquivo original, e a leitura segue com o que der. Uma
 * imagem grande demais é melhor que leitura nenhuma — e se ela exceder o limite do servidor, quem chama já
 * trata a falha como "não deu para ler".
 */
export async function fileToBase64(uri: string, mimeType?: string | null): Promise<Base64Payload> {
  const tipo = (mimeType ?? '').toLowerCase()

  if (!tipo.startsWith('image/')) {
    return { fileBase64: await readFileBase64(uri), mediaType: tipo || 'application/octet-stream' }
  }

  try {
    // Descobre a dimensão real antes de decidir — sem isso não dá para saber se vale reduzir.
    const { width, height } = await new Promise<{ width: number; height: number }>((resolve, reject) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const RN = require('react-native') as any
      RN.Image.getSize(uri, (w: number, h: number) => resolve({ width: w, height: h }), reject)
    })

    if (!shouldResize({ width, height }, IMAGE_MAX_SIDE)) {
      return { fileBase64: await readFileBase64(uri), mediaType: tipo }
    }

    const alvo = targetImageSize({ width, height }, IMAGE_MAX_SIDE)
    const ctx = ImageManipulator.ImageManipulator.manipulate(uri)
    ctx.resize({ width: alvo.width, height: alvo.height })
    const imagem = await ctx.renderAsync()
    const saida = await imagem.saveAsync({
      compress: IMAGE_QUALITY,
      format: ImageManipulator.SaveFormat.JPEG,
      base64: true,
    })

    return saida.base64
      ? { fileBase64: saida.base64, mediaType: 'image/jpeg' }
      : { fileBase64: await readFileBase64(saida.uri), mediaType: 'image/jpeg' }
  } catch {
    // Melhor enviar a imagem original que não enviar nada.
    return { fileBase64: await readFileBase64(uri), mediaType: tipo }
  }
}
