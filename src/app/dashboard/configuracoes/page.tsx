'use client'

import { useState } from 'react'
import { Bell, Shield, Palette, Globe, ChevronRight } from 'lucide-react'
import { useUser } from '@/context/UserContext'

export default function ConfiguracoesPage() {
  const { signOut } = useUser()
  const [notifications, setNotifications] = useState({ daily: true, phase: true, email: false, weekly: true })

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-onyx mb-1">Configurações</h1>
        <p className="font-body text-sm text-mauve">Gerencie sua conta e preferências</p>
      </div>

      {/* Notifications */}
      <div className="card-premium p-6 space-y-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-8 rounded-lg bg-blush flex items-center justify-center">
            <Bell size={15} className="text-petal" />
          </div>
          <h2 className="font-body text-sm font-semibold text-onyx">Notificações</h2>
        </div>
        {[
          { key: 'daily' as const,   label: 'Lembretes diários de registro' },
          { key: 'phase' as const,   label: 'Alertas de transição de fase' },
          { key: 'email' as const,   label: 'Insights semanais por e-mail' },
          { key: 'weekly' as const,  label: 'Resumo semanal no app' },
        ].map(p => (
          <div key={p.key} className="flex items-center justify-between py-2 border-b border-border last:border-0">
            <span className="text-sm font-body text-onyx/80">{p.label}</span>
            <button
              onClick={() => setNotifications(prev => ({ ...prev, [p.key]: !prev[p.key] }))}
              className={`w-10 h-[22px] rounded-full relative transition-all duration-300 flex-shrink-0 ${notifications[p.key] ? 'gradient-sintera' : 'bg-warm'}`}
            >
              <div className={`absolute top-[2px] w-[18px] h-[18px] rounded-full bg-white shadow-sm transition-all duration-300 ${notifications[p.key] ? 'left-[20px]' : 'left-[2px]'}`} />
            </button>
          </div>
        ))}
      </div>

      {/* Privacy */}
      <div className="card-premium p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-lg bg-sage-light flex items-center justify-center">
            <Shield size={15} className="text-sage" />
          </div>
          <h2 className="font-body text-sm font-semibold text-onyx">Privacidade & Dados</h2>
        </div>
        {[
          'Baixar meus dados',
          'Exportar histórico de saúde',
          'Excluir minha conta',
        ].map(item => (
          <button key={item}
            className={`w-full flex items-center justify-between py-3 border-b border-border last:border-0 text-sm font-body hover:text-petal transition-colors text-left ${item.includes('Excluir') ? 'text-red-400 hover:text-red-500' : 'text-onyx/70'}`}>
            {item}
            <ChevronRight size={15} className="text-border" />
          </button>
        ))}
      </div>

      {/* Appearance */}
      <div className="card-premium p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-lg bg-lavender-light flex items-center justify-center">
            <Palette size={15} className="text-lavender" />
          </div>
          <h2 className="font-body text-sm font-semibold text-onyx">Aparência & Idioma</h2>
        </div>
        <div className="flex items-center justify-between py-3 border-b border-border">
          <span className="text-sm font-body text-onyx/80">Idioma</span>
          <span className="text-sm font-body text-mauve flex items-center gap-1.5">
            <Globe size={13}/> Português (BR)
          </span>
        </div>
        <div className="flex items-center justify-between py-3">
          <span className="text-sm font-body text-onyx/80">Tema</span>
          <span className="text-sm font-body text-mauve">Claro</span>
        </div>
      </div>

      {/* Sign out */}
      <button onClick={signOut}
        className="w-full py-3.5 rounded-xl border border-red-200 text-red-400 text-sm font-body font-medium hover:bg-red-50 transition-colors">
        Sair da conta
      </button>

      <p className="text-center text-xs font-body text-mauve/40">SINTERA v0.1.0 · Beta</p>
    </div>
  )
}
