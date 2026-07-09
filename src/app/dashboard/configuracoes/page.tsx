'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import MotionCard from '@/components/ui/MotionCard'
import { Shield, Mail, Key, AlertTriangle, Check, X, Loader2, ExternalLink, Download, MessageCircle } from 'lucide-react'
import { useUser } from '@/context/UserContext'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

export default function ConfiguracoesPage() {
  const { user, signOut } = useUser()
  const supabase = createClient()

  // ── Alterar senha ──────────────────────────────────────────────────────────
  const [pwSent, setPwSent]       = useState(false)
  const [pwLoading, setPwLoading] = useState(false)
  const [pwError, setPwError]     = useState<string | null>(null)

  async function handlePasswordReset() {
    if (!user?.email) return
    setPwLoading(true)
    setPwError(null)
    const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
      redirectTo: `${window.location.origin}/atualizar-senha`,
    })
    if (error) {
      setPwError('Não foi possível enviar o e-mail. Tente novamente.')
    } else {
      setPwSent(true)
    }
    setPwLoading(false)
  }

  // ── Lembretes por WhatsApp ──────────────────────────────────────────────────
  const [phone, setPhone]         = useState('')
  const [waOptIn, setWaOptIn]     = useState(false)
  const [waLoading, setWaLoading] = useState(false)
  const [waSaved, setWaSaved]     = useState(false)

  useEffect(() => {
    if (!user) return
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(supabase as any).from('profiles').select('phone, pref_whatsapp_reminder').eq('id', user.id).maybeSingle()
      .then(({ data }: { data: { phone: string | null; pref_whatsapp_reminder: boolean | null } | null }) => {
        if (data) { setPhone(data.phone ?? ''); setWaOptIn(data.pref_whatsapp_reminder === true) }
      })
  }, [user, supabase])

  async function saveWhatsApp() {
    if (!user || waLoading) return
    setWaLoading(true); setWaSaved(false)
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any).from('profiles')
        .update({ phone: phone.trim() || null, pref_whatsapp_reminder: waOptIn })
        .eq('id', user.id)
      setWaSaved(true)
    } finally {
      setWaLoading(false)
    }
  }

  // ── Exportar dados ────────────────────────────────────────────────────────
  const [exportLoading, setExportLoading] = useState(false)
  const [exportDone, setExportDone]       = useState(false)

  async function handleExport() {
    setExportLoading(true)
    try {
      const res = await fetch('/api/account/export')
      if (!res.ok) throw new Error('Erro ao exportar')
      const blob = await res.blob()
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement('a')
      a.href     = url
      a.download = `sintera-dados-${new Date().toISOString().slice(0, 10)}.json`
      a.click()
      URL.revokeObjectURL(url)
      setExportDone(true)
      setTimeout(() => setExportDone(false), 4000)
    } catch {
      // silencia — erro raro, usuária pode tentar novamente
    } finally {
      setExportLoading(false)
    }
  }

  // ── Excluir conta ──────────────────────────────────────────────────────────
  const [deleteStep, setDeleteStep] = useState<'idle' | 'confirm' | 'loading' | 'done'>('idle')
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [deleteError, setDeleteError] = useState<string | null>(null)

  async function handleDeleteAccount() {
    setDeleteStep('loading')
    setDeleteError(null)
    try {
      const res = await fetch('/api/account', { method: 'DELETE' })
      if (!res.ok) {
        const json = await res.json().catch(() => ({})) as { error?: string }
        throw new Error(json.error ?? 'Erro ao excluir conta')
      }
      setDeleteStep('done')
      setTimeout(() => signOut(), 2500)
    } catch (e) {
      setDeleteError(e instanceof Error ? e.message : 'Erro desconhecido')
      setDeleteStep('confirm')
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-display text-2xl font-semibold text-onyx mb-1">Configurações</h1>
        <p className="font-body text-sm text-mauve">Gerencie sua conta e dados</p>
      </motion.div>

      {/* ── Conta ── */}
      <MotionCard initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
        padding="lg" className="space-y-4">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-8 h-8 rounded-lg bg-blush flex items-center justify-center">
            <Key size={15} className="text-petal" />
          </div>
          <h2 className="font-body text-sm font-semibold text-onyx">Conta</h2>
        </div>

        {/* E-mail */}
        <div className="flex items-center justify-between py-3 border-b border-border/50">
          <div>
            <p className="font-body text-sm text-onyx">E-mail</p>
            <p className="font-body text-xs text-mauve mt-0.5">{user?.email ?? '—'}</p>
          </div>
          <span className="font-body text-xs text-mauve bg-ivory px-2.5 py-1 rounded-full border border-border">
            Verificado
          </span>
        </div>

        {/* Alterar senha */}
        <div className="flex items-center justify-between py-3">
          <div>
            <p className="font-body text-sm text-onyx">Senha</p>
            <p className="font-body text-xs text-mauve mt-0.5">Enviaremos um link para o seu e-mail</p>
          </div>
          {pwSent ? (
            <span className="flex items-center gap-1.5 font-body text-xs text-sage font-medium">
              <Check size={13} /> Link enviado
            </span>
          ) : (
            <button onClick={handlePasswordReset} disabled={pwLoading}
              className="flex items-center gap-1.5 font-body text-sm text-petal hover:underline disabled:opacity-50 transition-colors">
              {pwLoading ? <Loader2 size={13} className="animate-spin" /> : <Mail size={13} />}
              Alterar senha
            </button>
          )}
        </div>
        {pwError && <p className="font-body text-xs text-red-500">{pwError}</p>}
      </MotionCard>

      {/* ── Lembretes por WhatsApp ── */}
      <MotionCard initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}
        padding="lg" className="space-y-4">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-8 h-8 rounded-lg bg-sage-light flex items-center justify-center">
            <MessageCircle size={15} className="text-sage" />
          </div>
          <h2 className="font-body text-sm font-semibold text-onyx">Lembretes por WhatsApp</h2>
        </div>

        <div className="flex items-center justify-between py-2">
          <div className="pr-4">
            <p className="font-body text-sm text-onyx">Receber lembretes por WhatsApp</p>
            <p className="font-body text-xs text-mauve mt-0.5">Lembretes dos eventos da sua Agenda (consultas, exames). Você pode desativar quando quiser.</p>
          </div>
          <button onClick={() => setWaOptIn(v => !v)} aria-label="Ativar lembretes por WhatsApp"
            className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${waOptIn ? 'bg-sage' : 'bg-border'}`}>
            <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${waOptIn ? 'left-[22px]' : 'left-0.5'}`} />
          </button>
        </div>

        <div>
          <label htmlFor="config-phone" className="font-body text-xs font-semibold text-onyx/60 uppercase tracking-wider">Telefone (WhatsApp)</label>
          <input id="config-phone" type="tel" value={phone} onChange={e => setPhone(e.target.value)}
            placeholder="(11) 99999-9999"
            className="mt-1 w-full px-3 py-2.5 border border-border rounded-xl font-body text-sm text-onyx bg-ivory placeholder:text-mauve/40 focus:outline-none focus:ring-1 focus:ring-petal/30" />
          <p className="font-body text-[11px] text-mauve mt-1">Com DDD. Usado apenas para enviar seus lembretes.</p>
        </div>

        <div className="flex items-center justify-end gap-3">
          {waSaved && <span className="font-body text-xs text-sage flex items-center gap-1"><Check size={13} /> Salvo</span>}
          <button onClick={saveWhatsApp} disabled={waLoading || (waOptIn && !phone.trim())}
            className="px-4 py-2 rounded-full gradient-sintera text-white font-body text-sm font-medium disabled:opacity-40 hover:opacity-90 transition-opacity">
            {waLoading ? 'Salvando…' : 'Salvar'}
          </button>
        </div>
        {waOptIn && !phone.trim() && (
          <p className="font-body text-[11px] text-amber-600">Informe o telefone para ativar os lembretes por WhatsApp.</p>
        )}
      </MotionCard>

      {/* ── Privacidade & Dados ── */}
      <MotionCard initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        padding="lg" className="space-y-1">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-lg bg-sage-light flex items-center justify-center">
            <Shield size={15} className="text-sage" />
          </div>
          <h2 className="font-body text-sm font-semibold text-onyx">Privacidade & Dados</h2>
        </div>

        <button onClick={handleExport} disabled={exportLoading}
          className="w-full flex items-center justify-between py-3 border-b border-border/50 text-sm font-body text-onyx/70 hover:text-petal transition-colors disabled:opacity-50">
          <span>Exportar meus dados</span>
          {exportDone ? (
            <Check size={13} className="text-sage" />
          ) : exportLoading ? (
            <Loader2 size={13} className="animate-spin text-petal" />
          ) : (
            <Download size={13} className="text-border" />
          )}
        </button>

        <Link href="/lgpd" target="_blank"
          className="w-full flex items-center justify-between py-3 border-b border-border/50 text-sm font-body text-onyx/70 hover:text-petal transition-colors">
          Seus direitos (LGPD)
          <ExternalLink size={13} className="text-border" />
        </Link>

        <Link href="/privacidade" target="_blank"
          className="w-full flex items-center justify-between py-3 border-b border-border/50 text-sm font-body text-onyx/70 hover:text-petal transition-colors">
          Política de Privacidade
          <ExternalLink size={13} className="text-border" />
        </Link>

        <Link href="/termos" target="_blank"
          className="w-full flex items-center justify-between py-3 border-b border-border/50 text-sm font-body text-onyx/70 hover:text-petal transition-colors">
          Termos de Uso
          <ExternalLink size={13} className="text-border" />
        </Link>

        <div className="pt-2">
          <p className="font-body text-xs text-mauve leading-relaxed">
            Seus dados são armazenados de forma segura e nunca compartilhados com terceiros.
            Você pode excluir sua conta e todos os seus dados a qualquer momento.
          </p>
        </div>
      </MotionCard>

      {/* ── Excluir conta ── */}
      <MotionCard initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
        padding="lg" className="border border-red-100">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center">
            <AlertTriangle size={15} className="text-red-400" />
          </div>
          <h2 className="font-body text-sm font-semibold text-onyx">Excluir conta</h2>
        </div>

        <AnimatePresence mode="wait">
          {deleteStep === 'idle' && (
            <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <p className="font-body text-xs text-mauve leading-relaxed mb-4">
                Ao excluir sua conta, todos os seus exames, biomarcadores e dados pessoais serão
                permanentemente removidos. Esta ação não pode ser desfeita.
              </p>
              <button onClick={() => setDeleteStep('confirm')}
                className="font-body text-sm text-red-400 hover:text-red-600 font-medium transition-colors">
                Quero excluir minha conta →
              </button>
            </motion.div>
          )}

          {deleteStep === 'confirm' && (
            <motion.div key="confirm" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="space-y-4">
              <div className="bg-red-50 rounded-xl px-4 py-3">
                <p className="font-body text-xs text-red-700 font-semibold mb-1">Atenção — ação irreversível</p>
                <p className="font-body text-xs text-red-600 leading-relaxed">
                  Todos os seus exames, biomarcadores e histórico serão excluídos permanentemente.
                </p>
              </div>
              <div className="space-y-1.5">
                <label htmlFor="config-delete-confirm" className="font-body text-xs text-onyx/60">
                  Digite <strong>EXCLUIR</strong> para confirmar
                </label>
                <input
                  id="config-delete-confirm"
                  type="text"
                  value={deleteConfirmText}
                  onChange={e => setDeleteConfirmText(e.target.value)}
                  placeholder="EXCLUIR"
                  className="w-full px-3 py-2.5 border border-red-200 rounded-xl font-body text-sm text-onyx focus:outline-none focus:ring-1 focus:ring-red-300 transition-colors"
                />
              </div>
              {deleteError && (
                <p className="font-body text-xs text-red-500">{deleteError}</p>
              )}
              <div className="flex gap-2">
                <button onClick={() => { setDeleteStep('idle'); setDeleteConfirmText(''); setDeleteError(null) }}
                  className="flex-1 py-2.5 rounded-xl border border-border text-mauve text-sm font-body hover:border-petal/40 transition-colors flex items-center justify-center gap-2">
                  <X size={13} /> Cancelar
                </button>
                <button
                  onClick={handleDeleteAccount}
                  disabled={deleteConfirmText !== 'EXCLUIR'}
                  className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-body font-medium hover:bg-red-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                  Excluir permanentemente
                </button>
              </div>
            </motion.div>
          )}

          {deleteStep === 'loading' && (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="flex items-center gap-3 py-4">
              <Loader2 size={18} className="animate-spin text-red-400" />
              <p className="font-body text-sm text-mauve">Excluindo seus dados…</p>
            </motion.div>
          )}

          {deleteStep === 'done' && (
            <motion.div key="done" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="text-center py-4">
              <Check size={24} className="text-sage mx-auto mb-2" />
              <p className="font-body text-sm font-semibold text-onyx mb-1">Conta excluída</p>
              <p className="font-body text-xs text-mauve">Redirecionando…</p>
            </motion.div>
          )}
        </AnimatePresence>
      </MotionCard>

      {/* Sair */}
      <button onClick={signOut}
        className="w-full py-3.5 rounded-xl border border-border text-mauve text-sm font-body font-medium hover:border-red-200 hover:text-red-400 transition-colors">
        Sair da conta
      </button>

      <p className="text-center text-xs font-body text-mauve/40 pb-4">SINTERA</p>
    </div>
  )
}
