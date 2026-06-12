'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, FileText, TrendingUp,
  Settings, X, LogOut, User, ChevronRight,
  Sparkles, BarChart3, CalendarDays,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useUser } from '@/context/UserContext'

const navItems = [
  { href: '/dashboard',            icon: LayoutDashboard, label: 'Visão Geral', soon: false },
  { href: '/dashboard/exams',      icon: FileText,        label: 'Exames',      soon: false },
  { href: '/dashboard/historico',  icon: TrendingUp,      label: 'Histórico',   soon: false },
  { href: '/dashboard/agenda',     icon: CalendarDays,    label: 'Planejamento', soon: false },
  { href: '/dashboard/insights',   icon: Sparkles,        label: 'Insights',    soon: true  },
  { href: '/dashboard/relatorios', icon: BarChart3,       label: 'Relatórios',  soon: true  },
]

interface SidebarProps { open: boolean; onClose: () => void }

function NavItem({ href, icon: Icon, label, active, soon, onClose }: {
  href: string; icon: React.ElementType; label: string; active: boolean; soon?: boolean; onClose: () => void
}) {
  return (
    <Link href={href} onClick={onClose}
      className={cn(
        'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 text-sm font-body group',
        active
          ? 'nav-active-glow bg-white/8 text-white'
          : 'text-white/45 hover:text-white/80 hover:bg-white/5'
      )}
    >
      <Icon size={16} className={cn('flex-shrink-0 transition-colors',
        active ? 'text-petal' : 'text-white/30 group-hover:text-white/60')} />
      <span className="flex-1">{label}</span>
      {soon && (
        <span className="font-body text-[9px] font-medium text-white/30 bg-white/8 px-1.5 py-0.5 rounded-full border border-white/10">
          Em breve
        </span>
      )}
    </Link>
  )
}

function SidebarContent({ onClose }: { onClose: () => void }) {
  const pathname = usePathname()
  const { profile, signOut } = useUser()
  const displayName = profile?.name ?? 'Usuária'
  const initials    = displayName.charAt(0).toUpperCase()

  return (
    <div className="flex flex-col h-full bg-deep select-none">

      {/* Logo */}
      <div className="flex items-center justify-between px-5 py-5">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full gradient-sintera flex items-center justify-center shadow-lg">
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
              <circle cx="8" cy="8" r="5.5" stroke="white" strokeWidth="1.2" fill="none"/>
              <circle cx="8" cy="8" r="2" fill="white"/>
              <path d="M8 2.5 A5.5 5.5 0 0 1 13.5 8" stroke="white" strokeWidth="1.4" strokeLinecap="round"/>
            </svg>
          </div>
          <span className="font-display text-lg font-semibold tracking-[0.2em] text-white">SINTERA</span>
        </Link>
        <button onClick={onClose} className="lg:hidden text-white/30 hover:text-white/70 transition-colors">
          <X size={17}/>
        </button>
      </div>

      {/* Perfil da usuária */}
      <Link href="/dashboard/profile" onClick={onClose}
        className="mx-4 mb-5 p-3.5 rounded-2xl border border-white/6 bg-white/4 hover:bg-white/7 transition-colors">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full gradient-sintera flex items-center justify-center flex-shrink-0 shadow-md">
            <span className="text-white text-sm font-display font-bold">{initials}</span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-body font-medium text-white leading-tight truncate">{displayName}</p>
            <p className="text-[11px] font-body text-white/40 mt-0.5">Beta</p>
          </div>
          <ChevronRight size={13} className="text-white/25 flex-shrink-0"/>
        </div>
      </Link>

      {/* Navegação principal */}
      <nav className="flex-1 px-3 overflow-y-auto">
        <p className="text-[9px] font-body font-semibold text-white/25 uppercase tracking-[0.2em] px-3 mb-1.5">
          Principal
        </p>
        <ul className="flex flex-col gap-0.5">
          {navItems.map(item => (
            <li key={item.href}>
              <NavItem {...item} active={pathname === item.href} soon={item.soon} onClose={onClose} />
            </li>
          ))}
        </ul>
      </nav>

      {/* Rodapé */}
      <div className="px-3 pb-4 mt-3 border-t border-white/6 pt-3 space-y-0.5">
        <Link href="/dashboard/profile" onClick={onClose}
          className={cn('flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-body transition-all duration-200',
            pathname === '/dashboard/profile'
              ? 'bg-white/8 text-white'
              : 'text-white/40 hover:text-white/75 hover:bg-white/5')}>
          <User size={16} className="flex-shrink-0"/>
          Meu Perfil
        </Link>
        <Link href="/dashboard/configuracoes" onClick={onClose}
          className={cn('flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-body transition-all duration-200',
            pathname === '/dashboard/configuracoes'
              ? 'bg-white/8 text-white'
              : 'text-white/40 hover:text-white/75 hover:bg-white/5')}>
          <Settings size={16} className="flex-shrink-0"/>
          Configurações
        </Link>
        <button onClick={signOut}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-body text-white/40 hover:text-red-400/80 hover:bg-red-500/8 transition-all duration-200">
          <LogOut size={16} className="flex-shrink-0"/>
          Sair
        </button>
      </div>
    </div>
  )
}

export default function Sidebar({ open, onClose }: SidebarProps) {
  return (
    <>
      <aside className="hidden lg:block w-60 h-screen sticky top-0 flex-shrink-0">
        <SidebarContent onClose={onClose}/>
      </aside>

      <AnimatePresence>
        {open && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm"
              onClick={onClose}/>
            <motion.aside initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="fixed left-0 top-0 bottom-0 w-64 z-50 lg:hidden shadow-2xl">
              <SidebarContent onClose={onClose}/>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
