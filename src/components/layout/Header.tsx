'use client'

import { Menu, Search, Bell, ChevronDown } from 'lucide-react'
import { useState } from 'react'
import { useUser } from '@/context/UserContext'

interface HeaderProps { onMenuClick: () => void }

export default function Header({ onMenuClick }: HeaderProps) {
  const [showUserMenu, setShowUserMenu] = useState(false)
  const { profile, signOut } = useUser()
  const displayName = profile?.name ?? 'Usuária'
  const initials = displayName.charAt(0).toUpperCase()

  const today = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })
  const todayCap = today.charAt(0).toUpperCase() + today.slice(1)

  return (
    <header className="h-14 bg-cream/90 backdrop-blur-sm border-b border-black/[0.05] flex items-center px-5 gap-4 sticky top-0 z-30">
      <button
        onClick={onMenuClick}
        className="lg:hidden p-1.5 text-mauve hover:text-onyx transition-colors"
      >
        <Menu size={19}/>
      </button>

      {/* Date */}
      <p className="hidden sm:block text-sm font-body text-mauve font-medium">{todayCap}</p>

      {/* Search */}
      <div className="flex-1 max-w-xs ml-auto sm:ml-0">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-mauve/50"/>
          <input
            type="text"
            placeholder="Buscar..."
            className="w-full pl-8 pr-3 py-1.5 text-sm font-body bg-white/70 border border-black/[0.06] rounded-lg text-onyx placeholder:text-mauve/40 focus:outline-none focus:ring-2 focus:ring-petal/20 focus:border-petal/30 transition-all"
          />
        </div>
      </div>

      <div className="flex items-center gap-1.5 ml-auto">
        {/* Phase chip */}
        <div className="hidden md:flex items-center gap-1.5 bg-blush border border-petal-light/50 rounded-full px-3 py-1">
          <span className="w-1.5 h-1.5 rounded-full bg-petal animate-pulse-soft"/>
          <span className="text-xs font-body font-medium text-petal-dark">Fase Folicular · Dia 8</span>
        </div>

        {/* Notifications */}
        <button className="relative p-2 text-mauve hover:text-onyx transition-colors rounded-lg hover:bg-black/5">
          <Bell size={17}/>
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-petal"/>
        </button>

        {/* User */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 pl-1.5 pr-2 py-1 rounded-lg hover:bg-black/5 transition-colors"
          >
            <div className="w-7 h-7 rounded-full gradient-sintera flex items-center justify-center shadow-sm">
              <span className="text-white text-[11px] font-display font-bold">{initials}</span>
            </div>
            <ChevronDown size={13} className="text-mauve hidden sm:block"/>
          </button>

          {showUserMenu && (
            <div className="absolute right-0 top-full mt-1.5 w-44 bg-white border border-black/[0.06] rounded-xl shadow-xl p-1.5 z-50">
              {['Meu perfil', 'Planos', 'Configurações'].map((item) => (
                <button key={item}
                  className="w-full text-left px-3 py-2 text-sm font-body text-onyx/70 hover:bg-ivory hover:text-petal rounded-lg transition-colors"
                  onClick={() => setShowUserMenu(false)}
                >
                  {item}
                </button>
              ))}
              <button
                className="w-full text-left px-3 py-2 text-sm font-body text-red-400 hover:bg-red-50 rounded-lg transition-colors"
                onClick={signOut}
              >
                Sair
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
