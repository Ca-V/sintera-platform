'use client'

// Perfil — SPEC CANÔNICA ÚNICA Web+Mobile (paridade total). Ordem fixa das seções: cabeçalho → avatar → nome →
// e-mail → membro desde → estatísticas → formulário de edição (nome·telefone·faixa etária·objetivos) →
// informações da conta (plano·conta criada) → link Configurações. Edição por FORMULÁRIO + Salvar, com as MESMAS
// validações do Mobile (@sintera/validation) e as MESMAS estatísticas (getProfileStats — SSOT do api-client).
import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { useUser } from '@/context/UserContext'
import { createClient } from '@/lib/supabase/client'
import { Loader2, FileText, FlaskConical, CalendarDays } from 'lucide-react'
import { Card } from '@/lib/ui/ds'
import MotionCard from '@/components/ui/MotionCard'
import ActionCard from '@/components/ui/ActionCard'
import Select from '@/components/ui/Select'
import {
  monthLabel, DIAL_COUNTRIES, DEFAULT_DIAL_ISO, splitPhone, joinPhone, dialLabel,
  // Data de nascimento (31/08/2026): idade, fase e faixa são DERIVADAS; os textos de LGPD vêm do núcleo,
  // para a Web e o aplicativo prometerem exatamente a mesma coisa sobre o uso do dado.
  idadeLabel, faseDaVida, faseLabel, faixaDerivada, MOTIVO_DATA_NASCIMENTO, LIMITE_DATA_NASCIMENTO,
} from '@sintera/core'
import { getProfileStats, type ProfileStats } from '@sintera/api-client'
import { validateName, validatePhone, validateAgeRange, validateGoals, parseGoals, goalsToInput, AGE_RANGE_OPTIONS, AGE_RANGE_EMPTY_LABEL } from '@sintera/validation'

const AGE_RANGE_SELECT = [{ value: '', label: AGE_RANGE_EMPTY_LABEL }, ...AGE_RANGE_OPTIONS.map(o => ({ value: o, label: o }))]

/** Dias desde a criação da conta (mín. 1). Cálculo de exibição — MESMA fórmula do Mobile. */
function daysSince(iso: string | null): number {
  if (!iso) return 0
  // eslint-disable-next-line react-hooks/purity -- cálculo de exibição (dias desde o cadastro)
  return Math.max(1, Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000))
}

type FieldErrors = { name?: string; phone?: string; age_range?: string; goals?: string }

export default function ProfilePage() {
  const { user, profile, updateProfile } = useUser()
  const supabase = useRef(createClient()).current

  const [stats, setStats] = useState<ProfileStats | null>(null)

  // Form (edição por formulário — mesmo fluxo do Mobile).
  const [name, setName]         = useState('')
  // Telefone dividido: país (ISO) + número nacional. O gravado é E.164 (`+DDI…`).
  // O DDI nunca é adivinhado — é o mesmo contrato do Mobile (@sintera/core).
  const [phone, setPhone]       = useState('')
  const [phoneIso, setPhoneIso] = useState<string>(DEFAULT_DIAL_ISO)
  const [ageRange, setAgeRange] = useState('')
  // Data de nascimento (migração 152). OPCIONAL — ver o bloco do formulário para o tratamento de LGPD.
  const [birthDate, setBirthDate] = useState('')
  const [goalsText, setGoals]   = useState('')
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [saving, setSaving]     = useState(false)
  const [saved, setSaved]       = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const displayName = profile?.name ?? 'Usuária'
  const initials    = displayName.charAt(0).toUpperCase()
  const memberSince = stats?.memberSince ?? null

  // Semeia o form a partir do perfil carregado.
  useEffect(() => {
    setName(profile?.name ?? '')
    // Separa o gravado em país + número. Valor legado (só dígitos, sem "+") é
    // lido como Brasil — que é o que sempre significou.
    {
      const split = splitPhone(profile?.phone)
      setPhoneIso(split.iso)
      setPhone(split.national)
    }
    setAgeRange(profile?.age_range ?? '')
    setBirthDate(profile?.birth_date ?? '')
    setGoals(goalsToInput(profile?.goals ?? null))
  }, [profile])

  // Estatísticas — MESMA consulta do Mobile (SSOT). Falha é silenciosa (exibição).
  useEffect(() => {
    if (!user) return
    const controller = new AbortController()
    getProfileStats(supabase, controller.signal).then(setStats).catch(() => {})
    return () => controller.abort()
  }, [user, supabase])

  function onEdit<T>(setter: (v: T) => void) {
    return (v: T) => { setter(v); setSaved(false); setSaveError(null) }
  }

  async function save() {
    const nres = validateName(name)
    const pres = validatePhone(phone)
    const ares = validateAgeRange(ageRange)
    const gres = validateGoals(parseGoals(goalsText))
    const errs: FieldErrors = {}
    if (!nres.ok) errs.name = nres.error
    if (!pres.ok) errs.phone = pres.error
    if (!ares.ok) errs.age_range = ares.error
    if (!gres.ok) errs.goals = gres.error
    setFieldErrors(errs)
    if (!nres.ok || !pres.ok || !ares.ok || !gres.ok) return

    setSaving(true); setSaveError(null); setSaved(false)
    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        // Grava em E.164 com o DDI do país escolhido: `+5511999999999`.
        body: JSON.stringify({ name: nres.value, phone: joinPhone(phoneIso, pres.value), age_range: ares.value, goals: gres.value, birth_date: birthDate || null }),
      })
      if (!res.ok) throw new Error('Erro ao salvar')
      updateProfile(await res.json())
      setSaved(true)
    } catch {
      setSaveError('Não foi possível salvar. Tente novamente.')
    } finally {
      setSaving(false)
    }
  }

  const statCards = [
    { icon: FileText,     value: stats?.totalExams ?? 0,      label: 'Exames',         color: 'text-petal',    bg: 'bg-blush' },
    { icon: FlaskConical, value: stats?.totalBiomarkers ?? 0, label: 'Biomarcadores',  color: 'text-lavender', bg: 'bg-lavender-light' },
    { icon: CalendarDays, value: daysSince(memberSince),      label: 'Dias na SINTERA', color: 'text-petal',    bg: 'bg-blush' },
  ]

  const inputCls = 'w-full px-3 py-2.5 rounded-xl border bg-ivory text-sm font-body text-onyx placeholder:text-mauve/40 focus:outline-none focus:ring-2 focus:ring-petal/25 focus:border-petal transition-all'

  // IDADE, FASE E FAIXA são DERIVADAS da data — nunca guardadas em paralelo. Guardar as duas seria manter dois
  // registros do mesmo fato, e o segundo envelheceria: a pessoa faria aniversário e a faixa continuaria a
  // antiga. Regra no núcleo (`fasesDaVida`), idêntica no aplicativo.
  // eslint-disable-next-line react-hooks/purity -- exibição derivada da data atual
  const agora = new Date()
  const idade = idadeLabel(birthDate || null, agora)
  const fase = (() => { const f = faseDaVida(birthDate || null, agora); return f ? faseLabel(f) : null })()
  const faixa = faixaDerivada(birthDate || null, agora)

  return (
    <div className="max-w-2xl mx-auto space-y-6">

      {/* 1. Cabeçalho */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-display text-2xl font-semibold text-onyx mb-1">Meu Perfil</h1>
        <p className="font-body text-sm text-mauve">Seus dados na SINTERA</p>
      </motion.div>

      {/* 2–5. Avatar · Nome · E-mail · Membro desde */}
      <MotionCard initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} padding="none" className="p-6">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 rounded-full gradient-sintera flex items-center justify-center shadow-lg flex-shrink-0">
            <span className="text-white font-display text-2xl font-semibold">{initials}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-display text-xl font-semibold text-onyx break-words">{displayName}</p>
            <p className="font-body text-sm text-mauve mt-0.5">{user?.email}</p>
            {memberSince && (
              <p className="font-body text-xs text-mauve mt-1">Membro desde {monthLabel(memberSince)}</p>
            )}
          </div>
        </div>
      </MotionCard>

      {/* 6. Estatísticas */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="grid grid-cols-3 gap-3">
        {statCards.map(({ icon: Icon, value, label, color, bg }) => (
          <Card key={label} padding="none" className="p-4 text-center">
            <div className={`w-8 h-8 rounded-xl ${bg} flex items-center justify-center mx-auto mb-2`}>
              <Icon size={15} className={color} />
            </div>
            <p className="font-display text-xl font-bold text-onyx">{value}</p>
            <p className="font-body text-[11px] text-mauve mt-0.5 leading-tight">{label}</p>
          </Card>
        ))}
      </motion.div>

      {/* 7. Formulário de edição */}
      <MotionCard initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} padding="none" className="p-6 space-y-4">
        <h2 className="font-body text-xs font-semibold text-onyx/50 uppercase tracking-wider">Editar perfil</h2>

        <div>
          <label className="font-body text-[11px] text-mauve uppercase tracking-wider mb-1 block">Nome</label>
          <input value={name} onChange={e => onEdit(setName)(e.target.value)} placeholder="Seu nome" disabled={saving}
            className={`${inputCls} ${fieldErrors.name ? 'border-red-400' : 'border-border'}`} />
          {fieldErrors.name && <p className="font-body text-xs text-red-500 mt-1">{fieldErrors.name}</p>}
        </div>

        <div>
          <label className="font-body text-[11px] text-mauve uppercase tracking-wider mb-1 block">Telefone <span className="text-mauve/60 normal-case">· país e número com DDD</span></label>
          {/* País + número. O DDI NUNCA é adivinhado: vem da escolha explícita, e é
              o que o envio de WhatsApp usa. Ver @sintera/core/domain/profile/phone. */}
          <div className="flex gap-2">
            <select value={phoneIso} onChange={e => onEdit(setPhoneIso)(e.target.value)} disabled={saving}
              aria-label="Código de país"
              className={`${inputCls} border-border w-[46%] shrink-0`}>
              {DIAL_COUNTRIES.map(c => (
                <option key={c.iso} value={c.iso}>{dialLabel(c)}</option>
              ))}
            </select>
            <input value={phone} onChange={e => onEdit(setPhone)(e.target.value)} placeholder="(00) 00000-0000" inputMode="tel" disabled={saving}
              className={`${inputCls} ${fieldErrors.phone ? 'border-red-400' : 'border-border'}`} />
          </div>
          {fieldErrors.phone && <p className="font-body text-xs text-red-500 mt-1">{fieldErrors.phone}</p>}
        </div>

        {/* ─────────────────────────────────────────────────────────────────────────────────────────────
            DATA DE NASCIMENTO — decisão da fundadora, 31/08/2026, com o tratamento de LGPD que ela pediu.
            A faixa etária não serve para o começo da vida: "0 a 5 anos" trata um recém-nascido e uma criança
            de cinco anos como a mesma coisa, e entre os 2 e os 8 meses um bebê muda de tudo.
            LGPD, e é por isso que o texto está NA TELA e não numa política que ninguém abre: finalidade dita
            ANTES de pedir, campo OPCIONAL, e o limite ("não usamos a idade para avaliar nada") declarado —
            porque o silêncio aqui seria lido como a promessa oposta.
            ───────────────────────────────────────────────────────────────────────────────────────────── */}
        <div>
          <label htmlFor="perfil-nascimento" className="font-body text-[11px] text-mauve uppercase tracking-wider mb-1 block">
            Data de nascimento <span className="text-mauve/60 normal-case">· opcional</span>
          </label>
          <input
            id="perfil-nascimento"
            type="date"
            value={birthDate}
            max={new Date().toISOString().slice(0, 10)}
            onChange={e => onEdit(setBirthDate)(e.target.value)}
            disabled={saving}
            className={`${inputCls} border-border`}
          />
          <p className="font-body text-xs text-mauve mt-1 leading-relaxed">{MOTIVO_DATA_NASCIMENTO}</p>
          <p className="font-body text-xs text-mauve/80 mt-1 leading-relaxed">{LIMITE_DATA_NASCIMENTO}</p>
          {idade && (
            <p className="font-body text-xs text-onyx mt-1">
              {idade} · {fase}
            </p>
          )}
        </div>

        <div>
          {/* A FAIXA passa a ser DERIVADA quando há data — guardar as duas seria manter dois registros do mesmo
              fato, e o segundo envelheceria: a pessoa faria aniversário e a faixa continuaria a antiga. */}
          <label className="font-body text-[11px] text-mauve uppercase tracking-wider mb-1 block">Faixa etária</label>
          {faixa ? (
            <p className="font-body text-sm text-onyx">{faixa} <span className="text-xs text-mauve">· calculada a partir da data de nascimento</span></p>
          ) : (
            <>
              <Select options={AGE_RANGE_SELECT} value={ageRange} onChange={onEdit(setAgeRange)} placeholder="Selecione a faixa" aria-label="Faixa etária" />
              {fieldErrors.age_range && <p className="font-body text-xs text-red-500 mt-1">{fieldErrors.age_range}</p>}
            </>
          )}
        </div>

        <div>
          <label className="font-body text-[11px] text-mauve uppercase tracking-wider mb-1 block">Objetivos <span className="text-mauve/60 normal-case">· separe por vírgula</span></label>
          <input value={goalsText} onChange={e => onEdit(setGoals)(e.target.value)} placeholder="Ex.: Sono, Energia, Longevidade" disabled={saving}
            className={`${inputCls} ${fieldErrors.goals ? 'border-red-400' : 'border-border'}`} />
          {fieldErrors.goals && <p className="font-body text-xs text-red-500 mt-1">{fieldErrors.goals}</p>}
        </div>

        <div className="flex items-center gap-3">
          <button onClick={save} disabled={saving}
            className="inline-flex items-center gap-2 gradient-sintera text-white font-body font-medium px-6 py-2.5 rounded-full text-sm hover:opacity-90 disabled:opacity-50 transition-opacity">
            {saving && <Loader2 size={14} className="animate-spin" />} {saving ? 'Salvando…' : 'Salvar'}
          </button>
          {saved && <span className="font-body text-sm text-sage">Perfil salvo ✓</span>}
          {saveError && <span className="font-body text-sm text-red-500">{saveError}</span>}
        </div>
      </MotionCard>

      {/* 8. Informações da conta */}
      <MotionCard initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} padding="none" className="p-6 space-y-4">
        <h2 className="font-body text-xs font-semibold text-onyx/50 uppercase tracking-wider">Informações da conta</h2>
        <div className="grid sm:grid-cols-2 gap-3">
          <div className="p-3 bg-ivory rounded-xl">
            <p className="font-body text-[11px] text-mauve uppercase tracking-wider mb-1">Plano</p>
            <p className="font-body text-sm font-medium text-onyx">Gratuito</p>
          </div>
          <div className="p-3 bg-ivory rounded-xl">
            <p className="font-body text-[11px] text-mauve uppercase tracking-wider mb-1">Conta criada</p>
            <p className="font-body text-sm font-medium text-onyx">{memberSince ? monthLabel(memberSince) : '—'}</p>
          </div>
        </div>
      </MotionCard>

      {/* 9. Link Configurações da conta */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
        <ActionCard href="/dashboard/configuracoes" padding="default" className="flex items-center justify-between">
          <div>
            <p className="font-body text-sm font-semibold text-onyx">Configurações da conta</p>
            <p className="font-body text-xs text-mauve mt-0.5">Alterar senha, privacidade, excluir conta</p>
          </div>
          <span className="font-body text-sm text-petal">→</span>
        </ActionCard>
      </motion.div>

    </div>
  )
}
