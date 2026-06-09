import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-cream px-4">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 rounded-full gradient-sintera flex items-center justify-center mx-auto mb-6 shadow-lg">
          <svg width="28" height="28" viewBox="0 0 16 16" fill="none">
            <circle cx="8" cy="8" r="5.5" stroke="white" strokeWidth="1.2" fill="none"/>
            <circle cx="8" cy="8" r="2" fill="white"/>
            <path d="M8 2.5 A5.5 5.5 0 0 1 13.5 8" stroke="white" strokeWidth="1.4" strokeLinecap="round"/>
          </svg>
        </div>
        <p className="font-display text-6xl font-bold text-petal mb-4">404</p>
        <h1 className="font-display text-2xl font-semibold text-onyx mb-3">
          Página não encontrada
        </h1>
        <p className="font-body text-sm text-mauve leading-relaxed mb-8">
          A página que você está procurando não existe ou foi movida.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/dashboard"
            className="inline-flex items-center justify-center gap-2 gradient-sintera text-white font-body font-medium px-6 py-3 rounded-full hover:opacity-90 transition-opacity shadow-md text-sm">
            Ir para o dashboard
          </Link>
          <Link href="/"
            className="inline-flex items-center justify-center gap-2 border border-border text-onyx font-body font-medium px-6 py-3 rounded-full hover:bg-blush hover:border-petal/40 transition-colors text-sm">
            Página inicial
          </Link>
        </div>
      </div>
    </div>
  )
}
