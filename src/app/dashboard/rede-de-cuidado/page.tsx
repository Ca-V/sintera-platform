'use client'

// Rede de Cuidado — página-MENU (entidade permanente, CARE-002 futura). Paridade TOTAL com o Mobile
// (RedeCuidadoMenuScreen): mesma frase + as MESMAS 3 opções na mesma ordem/hierarquia — Relatórios (ativo),
// Profissionais e Compartilhamentos ("em breve"). Só navegação; sem placeholder de dados.
import Link from 'next/link'

const ROWS: readonly { href?: string; label: string; enabled: boolean }[] = [
  { href: '/dashboard/relatorio', label: 'Relatórios', enabled: true },
  { label: 'Profissionais', enabled: false },
  { label: 'Compartilhamentos', enabled: false },
]

export default function RedeDeCuidadoPage() {
  return (
    <div className="max-w-3xl mx-auto flex flex-col gap-4">
      <div>
        <h1 className="font-display text-2xl font-semibold text-onyx">Rede de Cuidado</h1>
        <p className="font-body text-sm text-mauve mt-1">
          Leve sua saúde a quem cuida de você. Relatórios hoje; profissionais e compartilhamentos em breve.
        </p>
      </div>
      <div className="flex flex-col gap-2">
        {ROWS.map((r) => {
          const inner = (
            <div className={`flex items-center justify-between p-4 rounded-xl border bg-ivory border-border ${r.enabled ? 'hover:border-petal/40 transition-colors' : 'opacity-50'}`}>
              <span className="font-body text-sm text-onyx">{r.label}</span>
              <span className="font-body text-xs text-mauve">{r.enabled ? '›' : 'em breve'}</span>
            </div>
          )
          return r.enabled && r.href
            ? <Link key={r.label} href={r.href}>{inner}</Link>
            : <div key={r.label}>{inner}</div>
        })}
      </div>
    </div>
  )
}
