// Adaptador Web — carregamento TÉCNICO das fontes que o DS-002 escolheu (BRAND-002): Fraunces + Hanken Grotesk.
// A DECISÃO tipográfica está no token; aqui só disponibilizamos os arquivos (self-host via next/font).
import { Fraunces, Hanken_Grotesk } from 'next/font/google'

export const frauncesFont = Fraunces({ subsets: ['latin'], weight: ['400', '500', '600'], display: 'swap' })
export const hankenFont = Hanken_Grotesk({ subsets: ['latin'], weight: ['400', '500', '600', '700'], display: 'swap' })

/** Mapeia a família declarada no token (ex.: "'Fraunces', …") para a fonte realmente carregada. */
export function resolveFontFamily(tokenFamily: string): string {
  if (tokenFamily.includes('Fraunces')) return frauncesFont.style.fontFamily
  if (tokenFamily.includes('Hanken')) return hankenFont.style.fontFamily
  return tokenFamily
}
