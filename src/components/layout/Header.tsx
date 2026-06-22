'use client'

import { Menu } from 'lucide-react'
import Link from 'next/link'
import { useUser } from '@/context/UserContext'

interface HeaderProps { onMenuClick: () => void }

export default function Header({ onMenuClick }: HeaderProps) {
  const { profile, signOut } = useUser()
  const displayName = profile?.name ?? 'Usuária'
  const initials    = displayName.charAt(0).toUpperCase()

  const today    = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })
  const todayCap = today.charAt(0).toUpperCase() + today.slice(1)

  return (
    <header className="h-14 bg-cream/90 backdrop-blur-sm border-b border-black/[0.05] flex items-center px-5 gap-4 sticky top-0 z-30">

      {/* Menu mobile */}
      <button onClick={onMenuClick} className="lg:hidden p-1.5 text-mauve hover:text-onyx transition-colors">
        <Menu size={19}/>
      </button>

      {/* Data */}
      <p className="hidden sm:block text-sm font-body text-mauve font-medium">{todayCap}</p>

      {/* Espaço */}
      <div className="flex-1" />

      {/* Avatar + menu */}
      <div className="relative group">
        <button className="flex items-center gap-2 pl-1.5 pr-2 py-1 rounded-lg hover:bg-black/5 transition-colors">
          <div className="w-7 h-7 rounded-full gradient-sintera flex items-center justify-center shadow-sm">
            <span className="text-white text-[11px] font-display font-bold">{initials}</span>
          </div>
          <span className="hidden sm:block text-sm font-body text-onyx/70 truncate max-w-[100px]">
            {displayName}
          </span>
        </button>

        {/* Dropdown — visível no hover/focus */}
        <div className="absolute right-0 top-full mt-1.5 w-44 bg-white border border-black/[0.06] rounded-xl shadow-xl p-1.5 z-50
          opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto
          transition-opacity duration-150">
          <Link href="/dashboard/profile"
            className="block px-3 py-2 text-sm font-body text-onyx/70 hover:bg-ivory hover:text-petal rounded-lg transition-colors">
            Meu Perfil
          </Link>
          <Link href="/dashboard/configuracoes"
            className="block px-3 py-2 text-sm font-body text-onyx/70 hover:bg-ivory hover:text-petal rounded-lg transition-colors">
            Configurações
          </Link>
          <hr className="border-border/50 my-1" />
          <button onClick={signOut}
            className="w-full text-left px-3 py-2 text-sm font-body text-red-400 hover:bg-red-50 rounded-lg transition-colors">
            Sair
          </button>
        </div>
      </div>
    </header>
  )
}
