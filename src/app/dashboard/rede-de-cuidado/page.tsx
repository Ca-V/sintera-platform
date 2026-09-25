'use client'

// Rede de Cuidado — página-MENU (CARE-001/CARE-003). Paridade TOTAL com o Mobile (RedeCuidadoMenuScreen):
// mesma frase e as MESMAS linhas, na mesma ordem e no mesmo estado. Só navegação; sem placeholder de dados.
//
// As linhas e o texto vêm do core (BASE ÚNICA). Estavam digitados aqui E no aplicativo, com as mesmas
// palavras — iguais até o dia em que uma das pontas mudasse, e aí divergiriam sem ninguém notar.
import Link from 'next/link'
import { MENU_REDE, SCREEN_COPY, type DestinoRede } from '@sintera/core'

const HREF: Readonly<Record<DestinoRede, string>> = {
  relatorio: '/dashboard/relatorio',
  profissionais: '/dashboard/rede-de-cuidado/profissionais',
  compartilhamentos: '',
}

export default function RedeDeCuidadoPage() {
  return (
    <div className="max-w-3xl mx-auto flex flex-col gap-4">
      <div>
        <h1 className="font-display text-2xl font-semibold text-onyx">{SCREEN_COPY.rede.title}</h1>
        <p className="font-body text-sm text-mauve mt-1">{SCREEN_COPY.rede.subtitle}</p>
      </div>
      <div className="flex flex-col gap-2">
        {MENU_REDE.map((r) => {
          const inner = (
            <div className={`flex items-center justify-between p-4 rounded-xl border bg-ivory border-border ${r.disponivel ? 'hover:border-petal/40 transition-colors' : 'opacity-50'}`}>
              <span className="font-body text-sm text-onyx">{r.label}</span>
              <span className="font-body text-xs text-mauve">{r.disponivel ? '›' : SCREEN_COPY.rede.soonLabel}</span>
            </div>
          )
          return r.disponivel
            ? <Link key={r.destino} href={HREF[r.destino]}>{inner}</Link>
            : (
              <div key={r.destino}>
                {inner}
                {/* Indisponível sem motivo faz a pessoa achar que errou. O motivo vem do core. */}
                <p className="font-body text-xs text-mauve mt-1 px-1">{SCREEN_COPY.rede.soonReason}</p>
              </div>
            )
        })}
      </div>
    </div>
  )
}
