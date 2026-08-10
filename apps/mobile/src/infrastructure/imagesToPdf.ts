// Mobile — monta um PDF de VÁRIAS páginas (imagens do MESMO documento) NO APARELHO, via expo-print. Espelha a
// Web (@/lib/capture/images-to-pdf): uma página por imagem, na ordem recebida → PDF único, que é enviado como UM
// só arquivo (o backend não muda; recebe um documento, como no fluxo de arquivo único). ISOLA a lib nativa aqui.
import * as Print from 'expo-print'

/** Uma página do documento: imagem em base64 + o mime (image/jpeg ou image/png). */
export interface BundlePage {
  base64: string
  mime: string
}

/**
 * Renderiza as páginas (na ordem) em um PDF e devolve o URI do arquivo gerado (cache local), pronto para upload.
 * Cada imagem ocupa a largura da página; a altura acompanha a proporção. Sem margem (documento "cheio").
 */
export async function imagesToPdf(pages: BundlePage[]): Promise<string> {
  const body = pages
    .map(({ base64, mime }) =>
      `<div style="page-break-after:always;margin:0;padding:0;"><img src="data:${mime};base64,${base64}" style="display:block;width:100%;"/></div>`,
    )
    .join('')
  const html = `<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width, initial-scale=1"/></head><body style="margin:0;padding:0;">${body}</body></html>`
  const { uri } = await Print.printToFileAsync({ html, base64: false })
  return uri
}
