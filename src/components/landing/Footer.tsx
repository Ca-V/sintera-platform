import Link from 'next/link'

const links = {
  Produto:  ['Funcionalidades', 'Como funciona', 'Beta'],
  Legal:    ['Privacidade', 'Termos de uso', 'LGPD'],
}

export default function Footer() {
  return (
    <footer className="bg-deep text-white/60">
      <div className="max-w-6xl mx-auto px-6 pt-16 pb-10">
        <div className="grid lg:grid-cols-4 gap-12 mb-14">

          {/* Brand */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-7 h-7 rounded-full gradient-sintera flex items-center justify-center">
                <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
                  <circle cx="8" cy="8" r="5.5" stroke="white" strokeWidth="1.2" fill="none" />
                  <circle cx="8" cy="8" r="2" fill="white" />
                  <path d="M8 2.5 A5.5 5.5 0 0 1 13.5 8" stroke="white" strokeWidth="1.4" strokeLinecap="round" />
                </svg>
              </div>
              <span className="font-display text-lg font-semibold tracking-[0.2em] text-white">SINTERA</span>
            </div>
            <p className="font-body text-sm text-white/40 leading-relaxed mb-4 max-w-xs">
              Organize seus laudos laboratoriais com IA.
              Compreenda a evolução da sua saúde ao longo do tempo.
            </p>
            <p className="font-body text-xs text-white/25 leading-relaxed max-w-xs">
              A SINTERA organiza e exibe dados de laudos laboratoriais.
              Não oferece diagnóstico, interpretação clínica ou recomendações médicas.
            </p>
          </div>

          {/* Links */}
          {Object.entries(links).map(([section, items]) => (
            <div key={section}>
              <p className="font-body text-xs font-semibold text-white/30 uppercase tracking-[0.18em] mb-4">
                {section}
              </p>
              <ul className="space-y-2.5">
                {items.map(item => {
                  const href =
                    item === 'Privacidade' ? '/privacidade' :
                    item === 'Termos de uso' ? '/termos' :
                    item === 'LGPD' ? '/lgpd' :
                    item === 'Beta' ? '/lista-de-espera' :
                    '#' + item.toLowerCase().replace(/\s+/g, '-')
                  return (
                    <li key={item}>
                      <Link href={href}
                        className="font-body text-sm text-white/40 hover:text-white/80 transition-colors">
                        {item}
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/8 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="font-body text-xs text-white/25">
            © {new Date().getFullYear()} SINTERA · Versão Beta
          </p>
          <p className="font-body text-xs text-white/20 text-center sm:text-right max-w-sm">
            Os dados exibidos são reprodução estruturada dos laudos originais.
            Não substituem avaliação médica.
          </p>
        </div>
      </div>
    </footer>
  )
}
