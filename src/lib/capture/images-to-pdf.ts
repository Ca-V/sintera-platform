// Combina várias IMAGENS (páginas fotografadas/escaneadas do MESMO documento) num único
// PDF — para que um documento de várias páginas vire UM registro. Roda no navegador
// (canvas + pdf-lib). Cada imagem é normalizada para JPEG (cobre webp/heic decodificável)
// e reduzida para caber, controlando o tamanho do arquivo.
import { PDFDocument } from 'pdf-lib'

async function fileToJpegBytes(file: File, maxDim = 2200, quality = 0.85): Promise<Uint8Array> {
  const bitmap = await createImageBitmap(file)
  let { width, height } = bitmap
  const scale = Math.min(1, maxDim / Math.max(width, height))
  width = Math.max(1, Math.round(width * scale))
  height = Math.max(1, Math.round(height * scale))
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('canvas indisponível')
  ctx.drawImage(bitmap, 0, 0, width, height)
  bitmap.close?.()
  const blob: Blob = await new Promise((resolve, reject) =>
    canvas.toBlob(b => (b ? resolve(b) : reject(new Error('falha ao gerar imagem'))), 'image/jpeg', quality),
  )
  return new Uint8Array(await blob.arrayBuffer())
}

/** Monta um PDF (uma página por imagem, na ordem recebida). */
export async function imagesToPdf(files: File[], name = 'documento.pdf'): Promise<File> {
  const pdf = await PDFDocument.create()
  for (const file of files) {
    const jpeg = await fileToJpegBytes(file)
    const img = await pdf.embedJpg(jpeg)
    const page = pdf.addPage([img.width, img.height])
    page.drawImage(img, { x: 0, y: 0, width: img.width, height: img.height })
  }
  const bytes = await pdf.save()
  return new File([bytes as unknown as BlobPart], name, { type: 'application/pdf' })
}
