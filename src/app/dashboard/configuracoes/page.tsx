'use client'

import { useState } from 'react'
import { Bell, Shield, Palette, Globe, ChevronRight, AlertTriangle, Eye, EyeOff } from 'lucide-react'
import { useUser } from '@/context/UserContext'

export default function ConfiguracoesPage() {
  const { signOut } = useUser()
  const [notifications, setNotifications] = useState({ daily: true, phase: true, email: false, weekly: true })

  // Delete account modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deletePassword, setDeletePassword] = useState('')
  const [showDeletePassword, setShowDeletePassword] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  const handleDeleteAccount = async () => {
    if (!deletePassword) return
    setDeleteLoading(true)
    setDeleteError('')

    try {
      const res = await fetch('/api/account', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: deletePassword }),
      })

      if (res.ok) {
        window.location.href = '/'
      } else {
        const data = await res.json()
        setDeleteError(data.error || 'Erro ao excluir conta')
        setDeleteLoading(false)
      }
    } catch {
      setDeleteError('Erro de conexão. Tente novamente.')
      setDeleteLoading(false)
    }
  }

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
        ].map(item => (
          <button key={item}
            className="w-full flex items-center justify-between py-3 border-b border-border text-sm font-body text-onyx/70 hover:text-petal transition-colors text-left">
            {item}
            <ChevronRight size={15} className="text-border" />
          </button>
        ))}
        <button
          onClick={() => setShowDeleteModal(true)}
          className="w-full flex items-center justify-between py-3 text-sm font-body text-red-400 hover:text-red-500 transition-colors text-left">
          Excluir minha conta
          <ChevronRight size={15} className="text-border" />
        </button>
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

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center flex-shrink-0">
                <AlertTriangle size={18} className="text-red-400" />
              </div>
              <div>
                <h3 className="font-body text-sm font-semibold text-onyx">Excluir conta permanentemente</h3>
                <p className="font-body text-xs text-mauve">Esta ação é irreversível</p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-red-50 border border-red-100">
              <p className="text-xs font-body text-red-700 leading-relaxed">
                Todos os seus laudos, biomarcadores e dados de saúde serão excluídos imediatamente.
                Essa ação não pode ser desfeita.
              </p>
            </div>

            {deleteError && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200">
                <p className="text-xs font-body text-red-600">{deleteError}</p>
              </div>
            )}

            <div className="flex flex-col gap-2">
              <label className="text-xs font-body font-medium text-mauve uppercase tracking-wider">
                Confirme com sua senha
              </label>
              <div className="relative">
                <input
                  type={showDeletePassword ? 'text' : 'password'}
                  value={deletePassword}
                  onChange={e => setDeletePassword(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && deletePassword && handleDeleteAccount()}
                  placeholder="Sua senha atual"
                  className="w-full px-4 py-3 pr-10 rounded-xl border border-border bg-white text-sm font-body text-onyx placeholder:text-mauve/40 focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-300 transition-all"
                />
                <button type="button" onClick={() => setShowDeletePassword(!showDeletePassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-mauve hover:text-onyx transition-colors">
                  {showDeletePassword ? <EyeOff size={14}/> : <Eye size={14}/>}
                </button>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => { setShowDeleteModal(false); setDeletePassword(''); setDeleteError('') }}
                className="flex-1 py-3 rounded-xl border border-border text-sm font-body text-mauve hover:border-petal/40 transition-colors">
                Cancelar
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={!deletePassword || deleteLoading}
                className="flex-1 py-3 rounded-xl bg-red-500 text-white text-sm font-body font-medium hover:bg-red-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                {deleteLoading ? 'Excluindo...' : 'Excluir tudo'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}