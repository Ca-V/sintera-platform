'use client'

// ============================================================
// PRÉVIA INTERNA — Acompanhamentos por fase da vida (personalizado por idade)
// ============================================================
// Abordagem: NÃO prescreve exames/vacinas (isso é do médico). Apenas LEMBRA
// que, em cada fase da vida, certos acompanhamentos são importantes — sempre
// remetendo à orientação médica e ao quadro de saúde individual.
// Personalizado pela faixa etária informada no cadastro (profiles.age_range).
//
// Visível APENAS para a conta admin enquanto é teste. Removível (apagar arquivo).
// Conteúdo geral de letramento — não é recomendação clínica nem diagnóstico.
// A versão completa (todas as faixas, bebê a idoso, mulher e homem) e a
// eventual exibição pública dependem de validação do Responsável Clínico (CRM).
// ============================================================

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Stethoscope, Smile, Eye, HeartPulse, CalendarCheck, Info } from 'lucide-react'
import { useUser } from '@/context/UserContext'

const ADMIN_EMAIL = 'carinaleite.br@gmail.com'

interface CareItem {
  Icon: typeof Stethoscope
  titulo: string
  texto: string
}

interface LifeBand {
  faixaLabel: string
  intro: string
  itens: CareItem[]
}

// Extrai a idade aproximada do age_range ("46+", "36-45", "18-25"…).
function ageFrom(range: string | null | undefined): number | null {
  if (!range) return null
  const m = range.match(/\d+/)
  return m ? parseInt(m[0], 10) : null
}

// Bandas de fase da vida. Por ora, foco na fase de maturidade (teste).
// As demais faixas entram com a validação do Responsável Clínico.
function bandFor(age: number | null): LifeBand {
  if (age !== null && age >= 40) {
    return {
      faixaLabel: 'Fase de maturidade (a partir dos 40)',
      intro: 'Nesta fase, manter alguns acompanhamentos em dia ajuda a cuidar da sua saúde com continuidade. As frequências e indicações dependem do seu quadro e da orientação do seu médico.',
      itens: [
        { Icon: Stethoscope, titulo: 'Avaliação ginecológica periódica', texto: 'Mantenha consultas periódicas com seu ginecologista, na frequência que ele orientar.' },
        { Icon: Smile,       titulo: 'Saúde bucal', texto: 'Acompanhamento odontológico regular faz parte do cuidado integral.' },
        { Icon: Eye,         titulo: 'Saúde dos olhos', texto: 'Avaliação oftalmológica conforme orientação profissional.' },
        { Icon: HeartPulse,  titulo: 'Acompanhamento clínico geral', texto: 'Consultas e acompanhamentos cardiometabólicos e demais cuidados conforme seu histórico e a indicação do seu médico.' },
      ],
    }
  }
  // Faixa genérica (demais idades) — também não prescritiva.
  return {
    faixaLabel: 'Cuidado contínuo',
    intro: 'Manter acompanhamentos de saúde em dia, na frequência e da forma que seu médico orientar, ajuda a cuidar da sua saúde ao longo do tempo.',
    itens: [
      { Icon: Stethoscope, titulo: 'Consultas periódicas', texto: 'Acompanhamento médico regular conforme orientação profissional.' },
      { Icon: Smile,       titulo: 'Saúde bucal', texto: 'Acompanhamento odontológico regular.' },
      { Icon: Eye,         titulo: 'Saúde dos olhos', texto: 'Avaliação oftalmológica conforme orientação.' },
    ],
  }
}

export default function PrevencaoPreviewPage() {
  const { user, profile, loading } = useUser()
  const router = useRouter()

  useEffect(() => {
    if (!loading && (!user || user.email !== ADMIN_EMAIL)) {
      router.replace('/dashboard')
    }
  }, [loading, user, router])

  if (loading || !user || user.email !== ADMIN_EMAIL) {
    return <div className="p-10 text-center font-body text-sm text-mauve">Carregando…</div>
  }

  const ageRange = (profile as { age_range?: string | null } | null)?.age_range ?? null
  const band = bandFor(ageFrom(ageRange))

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      {/* Aviso de prévia (teste interno) */}
      <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 flex items-start gap-2.5">
        <Info size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
        <p className="font-body text-[11px] text-amber-800 leading-relaxed">
          <strong>Prévia (teste interno).</strong> Conteúdo geral de organização do cuidado — <strong>não é
          recomendação médica</strong> nem diagnóstico, e não substitui a avaliação do seu médico. Visível só para a conta de administração enquanto avaliamos o formato.
        </p>
      </div>

      <div>
        <div className="inline-flex items-center gap-1.5 text-petal mb-2">
          <CalendarCheck size={16} />
          <span className="font-body text-xs font-medium uppercase tracking-wider">{band.faixaLabel}</span>
        </div>
        <h1 className="font-display text-2xl font-semibold text-onyx">Acompanhamentos importantes para a sua fase</h1>
        <p className="font-body text-sm text-mauve mt-2 leading-relaxed">{band.intro}</p>
        {ageRange && (
          <p className="font-body text-[11px] text-mauve/50 mt-1">Personalizado pela faixa informada no seu cadastro: {ageRange}.</p>
        )}
      </div>

      <div className="space-y-3">
        {band.itens.map(it => (
          <div key={it.titulo} className="card-premium p-5 flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-blush flex items-center justify-center flex-shrink-0">
              <it.Icon size={18} className="text-petal" />
            </div>
            <div>
              <p className="font-body text-sm font-semibold text-onyx">{it.titulo}</p>
              <p className="font-body text-sm text-mauve mt-0.5 leading-relaxed">{it.texto}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-2xl bg-ivory border border-border p-5">
        <p className="font-body text-sm text-onyx font-medium mb-1">E os demais cuidados?</p>
        <p className="font-body text-sm text-mauve leading-relaxed">
          Outros acompanhamentos e procedimentos dependem do seu <strong>quadro de saúde atual</strong>, diagnosticado por um
          profissional, e da <strong>orientação do seu médico</strong>. A SINTERA organiza seus lembretes — quem indica o que fazer é sempre o seu médico.
        </p>
      </div>

      <p className="font-body text-[11px] text-mauve/50 text-center leading-relaxed">
        Protótipo interno · personalizado por faixa etária · pendente de validação clínica. A versão completa (todas as faixas, da infância à terceira idade, mulher e homem) e a exibição para usuárias dependem da aprovação de um Responsável Clínico (CRM).
      </p>
    </div>
  )
}
