import Link from 'next/link'

const links = {
  Produto: ['Funcionalidades', 'Preços', 'Roadmap', 'Changelog'],
  Empresa: ['Sobre nós', 'Blog', 'Carreiras', 'Imprensa'],
  Suporte: ['Central de ajuda', 'Comunidade', 'Contato', 'Status'],
  Legal: ['Privacidade', 'Termos de uso', 'Cookies', 'LGPD'],
}

export default function Footer() {
  return (
    <footer className="bg-deep text-white/60">
      <div className="max-w-6xl mx-auto px-6 pt-16 pb-10">
        <div className="grid lg:grid-cols-6 gap-12 mb-14">
          {/* Brand col */}
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
            <p className="font-body text-sm text-white/40 leading-relaxed mb-6 max-w-xs">
              Inteligência feminina para cada fase da sua vida.
              Dados que te conhecem. Ciência que te respeita.
            </p>

            {/* Newsletter */}
            <div className="flex gap-2">
              <input
                type="email"
                placeholder="Seu e-mail"
                className="flex-1 bg-white/8 border border-white/12 rounded-xl px-4 py-2.5 text-sm font-body text-white placeholder:text-white/30 focus:outline-none focus:border-petal/50 transition-colors min-w-0"
              />
              <button className="gradient-sintera text-white text-sm font-body font-medium px-4 py-2.5 rounded-xl hover:opacity-90 transition-opacity flex-shrink-0">
                Entrar
              </button>
            </div>
            <p className="text-[10px] font-body text-white/25 mt-2">
              Novidades e insights sobre saúde feminina. Sem spam.
            </p>
          </div>

          {/* Links */}
          {Object.entries(links).map(([category, items]) => (
            <div key={category} className="lg:col-span-1">
              <p className="font-body text-xs font-semibold text-white/50 mb-4 uppercase tracking-widest">
                {category}
              </p>
              <ul className="flex flex-col gap-2.5">
                {items.map((item) => (
                  <li key={item}>
                    <Link
                      href="#"
                      className="font-body text-sm text-white/40 hover:text-petal-light transition-colors duration-200"
                    >
                      {item}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-white/8 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="font-body text-xs text-white/30">
            © 2025 SINTERA. Todos os direitos reservados.
          </p>
          <p className="font-body text-xs text-white/20">
            Feito com cuidado para mulheres extraordinárias. 🌸
          </p>
        </div>
      </div>
    </footer>
  )
}
