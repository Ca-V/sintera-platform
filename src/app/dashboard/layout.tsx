'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Sidebar from '@/components/layout/Sidebar'
import Header from '@/components/layout/Header'
import { useUser } from '@/context/UserContext'
import FeedbackModal from '@/components/dashboard/FeedbackModal'

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#F2EDE8' }}>
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-full gradient-sintera flex items-center justify-center shadow-lg animate-pulse">
          <svg width="20" height="20" viewBox="0 0 16 16" fill="none">
            <circle cx="8" cy="8" r="5.5" stroke="white" strokeWidth="1.2" fill="none"/>
            <circle cx="8" cy="8" r="2" fill="white"/>
          </svg>
        </div>
        <p className="font-body text-sm text-mauve">Carregando sua SINTERA…</p>
      </div>
    </div>
  )
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { user, loading } = useUser()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login')
    }
  }, [user, loading, router])

  if (loading) return <LoadingScreen />
  if (!user) return <LoadingScreen />

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#F2EDE8' }}>
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0">
        <Header onMenuClick={() => setSidebarOpen(true)} />
        {/* Banner Beta */}
        <div className="bg-petal/10 border-b border-petal/20 px-5 py-2 flex items-center justify-center gap-2">
          <span className="text-xs font-body font-semibold text-petal bg-petal/15 px-2 py-0.5 rounded-full">BETA</span>
          <p className="text-xs font-body text-petal-dark">
            Versao em teste. Algumas funcionalidades podem apresentar limitacoes. Duvidas?{' '}
            <a href="mailto:carinaleite.br@gmail.com" className="underline hover:opacity-80">carinaleite.br@gmail.com</a>
          </p>
        </div>
        <main className="flex-1 overflow-y-auto p-5 lg:p-6">
          {children}
        </main>
      </div>
      {/* 6D: Survey de feedback — aparece apos 2 analises bem-sucedidas */}
      <FeedbackModal triggerAfterAnalyses={2} />
    </div>
  )
}