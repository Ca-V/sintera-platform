import type { Metadata } from 'next'
import { UserProvider } from '@/context/UserContext'
import './globals.css'

// Identidade oficial da SINTERA (BRAND-002): título Fraunces + corpo/interface Hanken Grotesk.
//
// AS FONTES SÃO DEFINIDAS UMA VEZ SÓ, em `@/lib/ui/ds/fonts` — o adaptador do DS. Estavam declaradas aqui E
// lá: duas chamadas independentes para as mesmas famílias. O Next deduplica os arquivos por conteúdo, então
// não custava banda; mas eram duas fontes de verdade para a mesma decisão, e bastaria alguém mudar um peso
// num dos lados para as duas divergirem sem nada acusar.
import { frauncesFont as fraunces, hankenFont as hanken } from '@/lib/ui/ds/fonts'

export const metadata: Metadata = {
  title: { default: 'SINTERA', template: '%s — SINTERA' },
  description: 'Organize num só lugar exames, medicamentos, condições, hábitos e composição corporal. Acompanhe a evolução da sua saúde e compartilhe com seus profissionais. Gratuito.',
  keywords: ['saúde', 'organização de saúde', 'exames', 'biomarcadores', 'histórico de saúde', 'medicamentos', 'saúde feminina', 'SINTERA'],
  metadataBase: new URL('https://sinteramais.com.br'),
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    url: 'https://sinteramais.com.br',
    siteName: 'SINTERA',
    title: 'SINTERA — Sua saúde tem uma história.',
    description: 'Organize suas informações de saúde num só lugar, acompanhe a evolução ao longo do tempo e compartilhe com seus profissionais.',
    images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: 'SINTERA — Sua saúde tem uma história.' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SINTERA — Sua saúde tem uma história.',
    description: 'Organize suas informações de saúde num só lugar, acompanhe a evolução e compartilhe com seus profissionais.',
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
    <html lang="pt-BR" className={`${fraunces.variable} ${hanken.variable} h-full`}>
      <body className="min-h-full font-body antialiased bg-cream text-onyx">
        <UserProvider>{children}</UserProvider>
      </body>
    </html>
  )
}
