import type { Metadata } from 'next'
import { Cormorant_Garamond, DM_Sans } from 'next/font/google'
import { UserProvider } from '@/context/UserContext'
import './globals.css'

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-cormorant',
  display: 'swap',
})

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-dm-sans',
  display: 'swap',
})

export const metadata: Metadata = {
  title: { default: 'SINTERA', template: '%s — SINTERA' },
  description: 'Organize seus laudos laboratoriais com IA e acompanhe a evolução dos seus biomarcadores ao longo do tempo. Gratuito durante o Beta.',
  keywords: ['laudos laboratoriais', 'biomarcadores', 'histórico de saúde', 'exames', 'saúde feminina', 'IA', 'SINTERA'],
  metadataBase: new URL('https://sinteramais.com.br'),
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    url: 'https://sinteramais.com.br',
    siteName: 'SINTERA',
    title: 'SINTERA — Seus exames têm uma história.',
    description: 'Organize seus laudos laboratoriais com IA e acompanhe a evolução dos seus biomarcadores ao longo do tempo.',
    images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: 'SINTERA — Seus exames têm uma história.' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SINTERA — Seus exames têm uma história.',
    description: 'Organize seus laudos laboratoriais com IA e acompanhe a evolução dos seus biomarcadores.',
    images: ['/opengraph-image'],
  },
  robots: { index: true, follow: true },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" className={`${cormorant.variable} ${dmSans.variable} h-full`}>
      <body className="min-h-full font-body antialiased bg-cream text-onyx">
        <UserProvider>{children}</UserProvider>
      </body>
    </html>
  )
}
