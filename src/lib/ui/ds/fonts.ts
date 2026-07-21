// Adaptador Web — carregamento TÉCNICO das fontes que o DS-002 escolheu (BRAND-002 v2.1). Três camadas:
//   Fraunces (títulos) · Hanken Grotesk (interface/leitura) · IBM Plex Mono (dados científicos).
// A DECISÃO tipográfica está no token; aqui só disponibilizamos os arquivos (self-host via next/font).
import { Fraunces, Hanken_Grotesk, IBM_Plex_Mono } from 'next/font/google'

export const frauncesFont = Fraunces({ subsets: ['latin'], weight: ['400', '500', '600'], display: 'swap' })
export const hankenFont = Hanken_Grotesk({ subsets: ['latin'], weight: ['400', '500', '600', '700'], display: 'swap' })
// Mono só para DADOS (valores/índices/IDs/códigos) — pesos enxutos (regular/medium) bastam.
export const monoFont = IBM_Plex_Mono({ subsets: ['latin'], weight: ['400', '500'], display: 'swap' })

/** Mapeia a família declarada no token (ex.: "'Fraunces', …") para a fonte realmente carregada. */
export function resolveFontFamily(tokenFamily: string): string {
  if (tokenFamily.includes('Fraunces')) return frauncesFont.style.fontFamily
  if (tokenFamily.includes('Hanken')) return hankenFont.style.fontFamily
  if (tokenFamily.includes('IBM Plex Mono')) return monoFont.style.fontFamily
  return tokenFamily
}
