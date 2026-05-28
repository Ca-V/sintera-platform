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
  title: 'SINTERA — Inteligência Feminina',
  description: 'Plataforma de inteligência feminina para monitoramento de saúde, performance, fisiologia e dados biológicos.',
  keywords: ['saúde feminina', 'ciclo menstrual', 'biohacking', 'performance', 'hormônios'],
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
