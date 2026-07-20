'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import MotionCard from '@/components/ui/MotionCard'
import { Shield, Mail, Key, AlertTriangle, Check, X, Loader2, ExternalLink, Download, MessageCircle, Bell } from 'lucide-react'
import { useUser } from '@/context/UserContext'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import {
  NOTIFICATION_CATEGORIES, NOTIFICATION_CHANNELS, DEFAULT_CHANNEL, MANDATORY_NOTIFICATIONS,
  recommendedChannels, type NotificationChannel,
} from '@/lib/notifications/preferences'

const CHANNEL_LABEL: Record<NotificationChannel, string> = {
  email: 'E-mail', whatsapp: 'WhatsApp', both: 'Ambos', none: 'Nenhum',
}

// FB-016-3 (re-validação) — código do país (DDI) do WhatsApp.
const DDI_OPTS: { v: string; l: string }[] = [
  { v: '+55', l: '🇧🇷 +55' }, { v: '+351', l: '🇵🇹 +351' }, { v: '+1', l: '🇺🇸 +1' },
  { v: '+44', l: '🇬🇧 +44' }, { v: '+34', l: '🇪🇸 +34' }, { v: '+49', l: '🇩🇪 +49' },
  { v: '+33', l: '🇫🇷 +33' }, { v: '+39', l: '🇮🇹 +39' }, { v: '+54', l: '🇦🇷 +54' }, { v: '+61', l: '🇦🇺 +61' },
]

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

  // ── Contatos: WhatsApp (com código do país) ─────────────────────────────────
  const [ddi, setDdi]             = useState('+55')   // FB-016-3 (re-validação): código do país
  const [phone, setPhone]         = useState('')      // só o número (sem DDI)
  const [waLoading, setWaLoading] = useState(false)
  const [waSaved, setWaSaved]     = useState(false)
  // FB-016-3 (re-validação) — e-mail EDITÁVEL (e-mail da conta; alteração exige confirmação por link).
  const [email, setEmail]           = useState('')
  const [emailLoading, setEmailLoading] = useState(false)
  const [emailSent, setEmailSent]   = useState(false)
  const [emailError, setEmailError] = useState<string | null>(null)

  useEffect(() => { if (user?.email) setEmail(user.email) }, [user])

  async function saveEmail() {
    if (!user || emailLoading) return
    const next = email.trim()
    if (!next || next === user.email) return
    setEmailLoading(true); setEmailSent(false); setEmailError(null)
    const { error } = await supabase.auth.updateUser({ email: next })
    setEmailLoading(false)
    if (error) { setEmailError(error.message); return }
    setEmailSent(true)   // Supabase envia link de confirmação ao novo e-mail; só vale após confirmar.
  }

  useEffect(() => {
    if (!user) return
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(supabase as any).from('profiles').select('phone').eq('id', user.id).maybeSingle()
      .then(({ data }: { data: { phone: string | null } | null }) => {
        const raw = (data?.phone ?? '').trim()
        const m = raw.match(/^(\+\d{1,3})\s*(.*)$/)   // separa DDI do número, se houver
        if (m) { setDdi(m[1]); setPhone(m[2].trim()) } else setPhone(raw)
      })
  }, [user, supabase])

  async function saveWhatsApp() {
    if (!user || waLoading) return
    setWaLoading(true); setWaSaved(false)
    try {
      // FB-016-3: o canal (e-mail/WhatsApp/ambos/nenhum) é governado pela Central de Notificações, por categoria.
      // Aqui só cadastramos o CONTATO (número em formato internacional: DDI + número).
      const full = phone.trim() ? `${ddi} ${phone.trim()}` : null
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any).from('profiles')
        .update({ phone: full, pref_whatsapp_reminder: !!full })
        .eq('id', user.id)
      setWaSaved(true)
    } finally {
      setWaLoading(false)
    }
  }

  // ── Central de Notificações (NOTIF-001) — canal por categoria ───────────────
  const [notifPrefs, setNotifPrefs]   = useState<Record<string, NotificationChannel>>({})
  const [notifLoading, setNotifLoading] = useState(false)
  const [notifSaved, setNotifSaved]   = useState(false)

  useEffect(() => {
    if (!user) return
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(supabase as any).from('notification_preferences').select('category, channel').eq('user_id', user.id)
      .then(({ data }: { data: { category: string; channel: NotificationChannel }[] | null }) => {
        const next: Record<string, NotificationChannel> = {}
        for (const c of NOTIFICATION_CATEGORIES) next[c.key] = DEFAULT_CHANNEL
        for (const r of data ?? []) next[r.category] = r.channel
        setNotifPrefs(next)
      })
  }, [user, supabase])

  async function saveNotifPrefs() {
    if (!user || notifLoading) return
    setNotifLoading(true); setNotifSaved(false)
    try {
      const rows = NOTIFICATION_CATEGORIES.map(c => ({
        user_id: user.id, category: c.key, channel: notifPrefs[c.key] ?? DEFAULT_CHANNEL, updated_at: new Date().toISOString(),
      }))
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any).from('notification_preferences').upsert(rows, { onConflict: 'user_id,category' })
      setNotifSaved(true)
    } finally {
      setNotifLoading(false)
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

        {/* Alterar senha */}
        <div className="flex items-center justify-between py-3">
          <div>
            <p className="font-body text-sm text-onyx">Senha</p>
            <p className="font-body text-xs text-mauve mt-0.5">Enviaremos um link para o seu e-mail</p>
          </div>
          {pwSent ? (
            <span className="flex items-center gap-1.5 font-body text-xs text-petal font-medium">
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

      {/* ── Contatos cadastrados (FB-016-3) — os DESTINOS; o canal é escolhido na Central abaixo ── */}
      <MotionCard initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}
        padding="lg" className="space-y-4">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-8 h-8 rounded-lg bg-blush flex items-center justify-center">
            <MessageCircle size={15} className="text-petal" />
          </div>
          <h2 className="font-body text-sm font-semibold text-onyx">Contatos cadastrados</h2>
        </div>
        <p className="font-body text-xs text-mauve">
          Onde você pode receber notificações. <strong>O que</strong> você recebe e <strong>por qual canal</strong>
          {' '}(e-mail, WhatsApp, ambos ou nenhum) é definido na <strong>Central de Notificações</strong>, abaixo.
        </p>

        {/* E-mail (da conta) — editável, com confirmação */}
        <div className="py-2 border-b border-border/50">
          <label htmlFor="config-email" className="font-body text-xs font-semibold text-onyx/60 uppercase tracking-wider">E-mail</label>
          <div className="mt-1 flex items-stretch gap-2">
            <input id="config-email" type="email" value={email} onChange={e => { setEmail(e.target.value); setEmailSent(false); setEmailError(null) }}
              placeholder="voce@email.com"
              className="flex-1 min-w-0 px-3 py-2.5 border border-border rounded-xl font-body text-sm text-onyx bg-ivory placeholder:text-mauve/40 focus:outline-none focus:ring-1 focus:ring-petal/30" />
            <button onClick={saveEmail} disabled={emailLoading || !email.trim() || email.trim() === user?.email}
              className="px-4 py-2.5 rounded-xl border border-petal-light bg-blush text-petal-dark font-body text-sm font-medium disabled:opacity-40 hover:bg-petal-light transition-colors">
              {emailLoading ? '…' : 'Alterar'}
            </button>
          </div>
          {emailSent
            ? <p className="font-body text-[11px] text-petal mt-1 flex items-center gap-1"><Check size={12} /> Enviamos um link de confirmação ao novo e-mail. A alteração vale após você confirmar.</p>
            : emailError
              ? <p className="font-body text-[11px] text-red-500 mt-1">{emailError}</p>
              : <p className="font-body text-[11px] text-mauve mt-1">É o e-mail da sua conta. Alterá-lo pede confirmação por link no novo endereço.</p>}
        </div>

        {/* WhatsApp (com código do país) */}
        <div>
          <label htmlFor="config-phone" className="font-body text-xs font-semibold text-onyx/60 uppercase tracking-wider">WhatsApp</label>
          <div className="mt-1 flex items-stretch gap-2">
            <select aria-label="Código do país" value={ddi} onChange={e => setDdi(e.target.value)}
              className="px-2.5 py-2.5 border border-border rounded-xl font-body text-sm text-onyx bg-ivory focus:outline-none focus:ring-1 focus:ring-petal/30">
              {DDI_OPTS.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
            </select>
            <input id="config-phone" type="tel" value={phone} onChange={e => setPhone(e.target.value)}
              placeholder="(11) 99999-9999"
              className="flex-1 min-w-0 px-3 py-2.5 border border-border rounded-xl font-body text-sm text-onyx bg-ivory placeholder:text-mauve/40 focus:outline-none focus:ring-1 focus:ring-petal/30" />
          </div>
          <p className="font-body text-[11px] text-mauve mt-1">Código do país + DDD. Necessário para receber notificações por WhatsApp.</p>
        </div>

        <div className="flex items-center justify-end gap-3">
          {waSaved && <span className="font-body text-xs text-petal flex items-center gap-1"><Check size={13} /> Salvo</span>}
          <button onClick={saveWhatsApp} disabled={waLoading}
            className="px-4 py-2 rounded-full gradient-sintera text-white font-body text-sm font-medium disabled:opacity-40 hover:opacity-90 transition-opacity">
            {waLoading ? 'Salvando…' : 'Salvar'}
          </button>
        </div>
      </MotionCard>

      {/* ── Central de Notificações (NOTIF-001) — canal por categoria ── */}
      <MotionCard initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.09 }}
        padding="lg" className="space-y-4">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-8 h-8 rounded-lg bg-blush flex items-center justify-center">
            <Bell size={15} className="text-petal" />
          </div>
          <h2 className="font-body text-sm font-semibold text-onyx">Central de Notificações</h2>
        </div>
        <p className="font-body text-xs text-mauve">
          Esta é a <strong>fonte única</strong> das suas preferências: escolha, para cada categoria, se e como quer
          ser avisada. Vale para toda a plataforma — os formulários usam o que você definir aqui. Para receber
          por WhatsApp, cadastre o telefone acima.
        </p>

        <div className="flex items-center justify-between gap-2 flex-wrap">
          <p className="font-body text-[11px] font-semibold text-onyx/60 uppercase tracking-wider">Lembretes (você escolhe)</p>
          <button type="button"
            onClick={() => setNotifPrefs(recommendedChannels())}
            className="font-body text-[11px] text-petal hover:underline">
            Restaurar configurações recomendadas
          </button>
        </div>

        {/* FB-017: agrupado pelas SEÇÕES da Sidebar (a Central espelha a navegação — sem taxonomia própria). */}
        <div className="space-y-4">
          {['Acompanhamento', 'Minha Saúde'].map(section => {
            const cats = NOTIFICATION_CATEGORIES.filter(c => c.section === section)
            if (cats.length === 0) return null
            return (
              <div key={section} className="space-y-1">
                <p className="font-body text-[11px] font-semibold text-mauve uppercase tracking-wider">{section}</p>
                {cats.map(cat => (
                  <div key={cat.key} className="flex flex-wrap items-center justify-between gap-2 py-2 border-b border-border/40 last:border-0">
                    <p className="font-body text-sm text-onyx">{cat.label}</p>
                    <div className="flex gap-1 bg-ivory border border-border rounded-xl p-0.5" role="group" aria-label={`Canal para ${cat.label}`}>
                      {NOTIFICATION_CHANNELS.map(ch => {
                        const active = (notifPrefs[cat.key] ?? DEFAULT_CHANNEL) === ch
                        return (
                          <button key={ch} type="button"
                            onClick={() => setNotifPrefs(p => ({ ...p, [cat.key]: ch }))}
                            aria-pressed={active}
                            className={`px-2.5 py-1 rounded-lg font-body text-[11px] font-medium transition-colors ${active ? 'bg-white text-onyx shadow-sm' : 'text-mauve hover:text-onyx'}`}>
                            {CHANNEL_LABEL[ch]}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )
          })}
        </div>

        {/* Prioridade (NOTIF-001/FB-011): obrigatórias são SEMPRE enviadas — fora das preferências. */}
        <div className="rounded-xl bg-ivory border border-border p-3">
          <p className="font-body text-[11px] font-semibold text-onyx/60 uppercase tracking-wider mb-1.5">Sempre enviadas</p>
          <p className="font-body text-[11px] text-mauve mb-2">Avisos essenciais de conta e segurança — enviados por e-mail, sem opção de desativar.</p>
          <ul className="flex flex-wrap gap-1.5">
            {MANDATORY_NOTIFICATIONS.map(m => (
              <li key={m.key} className="font-body text-[11px] text-onyx bg-white border border-border rounded-full px-2 py-0.5">{m.label}</li>
            ))}
          </ul>
        </div>

        <div className="flex items-center justify-end gap-3">
          {notifSaved && <span className="font-body text-xs text-petal flex items-center gap-1"><Check size={13} /> Salvo</span>}
          <button onClick={saveNotifPrefs} disabled={notifLoading}
            className="px-4 py-2 rounded-full gradient-sintera text-white font-body text-sm font-medium disabled:opacity-40 hover:opacity-90 transition-opacity">
            {notifLoading ? 'Salvando…' : 'Salvar preferências'}
          </button>
        </div>
      </MotionCard>

      {/* ── Privacidade & Dados ── */}
      <MotionCard initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        padding="lg" className="space-y-1">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-lg bg-blush flex items-center justify-center">
            <Shield size={15} className="text-petal" />
          </div>
          <h2 className="font-body text-sm font-semibold text-onyx">Privacidade & Dados</h2>
        </div>

        <button onClick={handleExport} disabled={exportLoading}
          className="w-full flex items-center justify-between py-3 border-b border-border/50 text-sm font-body text-onyx/70 hover:text-petal transition-colors disabled:opacity-50">
          <span>Exportar meus dados</span>
          {exportDone ? (
            <Check size={13} className="text-petal" />
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
              <Check size={24} className="text-petal mx-auto mb-2" />
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
