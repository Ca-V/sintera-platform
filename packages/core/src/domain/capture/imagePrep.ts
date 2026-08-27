// @sintera/core — POLÍTICA de preparo de imagem antes da leitura assistida. Fonte ÚNICA Web + Mobile.
//
// O MECANISMO é necessariamente diferente em cada ponta — a Web usa canvas, o aplicativo usa a biblioteca
// nativa. A DECISÃO não pode ser: qual o tamanho máximo, qual a qualidade, quando vale reduzir. Ela mora aqui.
//
// O DEFEITO QUE ISTO CORRIGE (27/08): a Web reduzia para 1600px antes de enviar; o aplicativo mandava o
// arquivo inteiro. Duas consequências:
//   1. O MESMO documento, fotografado nas duas pontas, chegava ao classificador em resoluções diferentes —
//      e podia ser lido de formas diferentes. Divergência silenciosa entre plataformas.
//   2. Foto de celular hoje passa de 12MP. Em base64 isso ultrapassa 4 MB, acima do limite de requisição da
//      hospedagem — a leitura assistida no aplicativo falharia por TAMANHO, com uma mensagem que não explica
//      nada. Não era só desperdício: era o recurso não funcionar.
//
// POR QUE 1600: é o suficiente para ler cabeçalho, carimbo, assinatura e data — que é tudo o que a
// classificação precisa. Acima disso cresce o custo e a latência sem melhorar a leitura do TIPO do documento.

/** Maior lado, em pixels, da imagem enviada à leitura assistida. */
export const IMAGE_MAX_SIDE = 1600

/** Qualidade do JPEG de saída, de 0 a 1. Suficiente para texto impresso e carimbo. */
export const IMAGE_QUALITY = 0.8

/** Acima disto o envio arrisca o limite de requisição da hospedagem. Serve de sanidade, não de meta. */
export const MAX_UPLOAD_BASE64_BYTES = 4 * 1024 * 1024

export interface ImageSize { width: number; height: number }

/**
 * Dimensão de saída para uma imagem de entrada, preservando a proporção.
 *
 * NUNCA AMPLIA: imagem já pequena passa intacta. Ampliar não acrescenta informação — só inventa pixels e
 * aumenta o envio, que é o oposto do que esta política existe para fazer.
 *
 * Dimensão inválida (zero, negativa, não finita) devolve a própria entrada: quem chamar decide o que fazer,
 * e é melhor não mexer do que produzir um canvas de tamanho impossível.
 */
export function targetImageSize(size: ImageSize, maxSide = IMAGE_MAX_SIDE): ImageSize {
  const { width, height } = size
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) return size

  const maior = Math.max(width, height)
  if (maior <= maxSide) return size

  const escala = maxSide / maior
  return {
    width: Math.max(1, Math.round(width * escala)),
    height: Math.max(1, Math.round(height * escala)),
  }
}

/** Vale reduzir esta imagem? Falso quando ela já cabe. */
export function shouldResize(size: ImageSize, maxSide = IMAGE_MAX_SIDE): boolean {
  if (!Number.isFinite(size.width) || !Number.isFinite(size.height)) return false
  return Math.max(size.width, size.height) > maxSide
}
