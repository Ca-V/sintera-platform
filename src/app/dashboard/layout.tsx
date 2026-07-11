'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Sidebar from '@/components/layout/Sidebar'
import Header from '@/components/layout/Header'
import { useUser } from '@/context/UserContext'

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#F5F1E8' }}>
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
    // Only redirect after the auth check is complete and there's definitely no user.
    // Use replace() to avoid polluting browser history and creating a back-button loop.
    if (!loading && !user) {
      router.replace('/login')
    }
  }, [user, loading, router])

  // Show loading screen while auth state is being determined
  if (loading) return <LoadingScreen />

  // Auth check done but no user — proxy should have already redirected,
  // show loading screen briefly while router.replace('/login') takes effect
  if (!user) return <LoadingScreen />

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#F5F1E8' }}>
      {/* Skip-link (a11y): primeiro foco no teclado — pula a navegação e vai ao conteúdo. */}
      <a href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:z-[100] focus:top-3 focus:left-3 focus:px-4 focus:py-2 focus:rounded-xl focus:bg-white focus:text-onyx focus:shadow-lg focus:font-body focus:text-sm focus:outline-none focus:ring-2 focus:ring-petal">
        Pular para o conteúdo
      </a>
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0">
        <Header onMenuClick={() => setSidebarOpen(true)} />
        <main id="main-content" tabIndex={-1} className="flex-1 overflow-y-auto p-5 lg:p-6 outline-none">
          {children}
        </main>
      </div>
    </div>
  )
}
