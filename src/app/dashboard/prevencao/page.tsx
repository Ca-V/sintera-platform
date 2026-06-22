'use client'

// ============================================================
// PRÉVIA INTERNA — Protocolo de prevenção por faixa etária (Mulher 40+)
// ============================================================
// ⚠️ NÃO É RECOMENDAÇÃO MÉDICA. Conteúdo de DEMONSTRAÇÃO para teste de
// experiência, PENDENTE de validação por Responsável Clínico (CRM).
// Visível APENAS para a conta admin (não aparece para nenhuma usuária).
// Removível: basta apagar este arquivo (e o link no Sidebar, se houver).
//
// As referências abaixo reproduzem, de forma resumida, o que fontes públicas
// brasileiras divulgam — com CITAÇÃO da fonte e NOTA onde elas divergem. A
// seleção, a redação e a aplicabilidade definitivas são atribuição do RC.
// ============================================================

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ShieldAlert, Stethoscope, Syringe, HeartPulse, Eye } from 'lucide-react'
import { useUser } from '@/context/UserContext'

const ADMIN_EMAIL = 'carinaleite.br@gmail.com'

interface PrevItem {
  nome: string
  faixa: string
  periodicidade: string
  fonte: string
  nota?: string
}

// Itens ilustrativos para teste de formato. Valores a CONFIRMAR pelo RC.
const RASTREAMENTOS: PrevItem[] = [
  {
    nome: 'Mamografia (câncer de mama)',
    faixa: '40+ anos',
    periodicidade: 'Anual (sociedades) · Bienal (programa SUS)',
    fonte: 'FEBRASGO/SBM · INCA/Ministério da Saúde',
    nota: 'Fontes divergem: INCA/MS (rastreamento organizado no SUS) indica bienal, 50–69 anos; FEBRASGO/SBM indica anual a partir dos 40. Decisão de qual adotar é do Responsável Clínico.',
  },
  {
    nome: 'Citopatológico (Papanicolau — câncer de colo do útero)',
    faixa: '25–64 anos',
    periodicidade: 'A cada 3 anos (após 2 exames anuais normais)',
    fonte: 'INCA / Ministério da Saúde',
  },
  {
    nome: 'Aferição de pressão arterial',
    faixa: 'Adulto (periódico)',
    periodicidade: 'Em toda consulta / pelo menos anual',
    fonte: 'Sociedade Brasileira de Cardiologia (SBC)',
  },
  {
    nome: 'Rastreamento de diabetes (glicemia/HbA1c)',
    faixa: 'A partir de ~35–45 anos (ou antes com fatores de risco)',
    periodicidade: 'A cada 1–3 anos conforme risco',
    fonte: 'Sociedade Brasileira de Diabetes (SBD)',
  },
  {
    nome: 'Perfil lipídico (colesterol/triglicerídeos)',
    faixa: 'Adulto, conforme risco cardiovascular',
    periodicidade: 'Conforme avaliação de risco',
    fonte: 'Sociedade Brasileira de Cardiologia (SBC)',
  },
  {
    nome: 'Rastreamento de câncer colorretal',
    faixa: 'A partir de ~45–50 anos',
    periodicidade: 'Sangue oculto anual e/ou colonoscopia periódica',
    fonte: 'Sociedades de gastroenterologia/oncologia',
    nota: 'Idade de início e método variam entre fontes — a confirmar pelo RC.',
  },
]

const VACINAS: PrevItem[] = [
  { nome: 'Influenza (gripe)', faixa: 'Adulto', periodicidade: 'Anual', fonte: 'PNI / SBIm' },
  { nome: 'dT / dTpa (difteria, tétano, coqueluche)', faixa: 'Adulto', periodicidade: 'Reforço a cada 10 anos', fonte: 'PNI / SBIm' },
  { nome: 'Hepatite B', faixa: 'Adulto não imunizado', periodicidade: 'Esquema de 3 doses', fonte: 'PNI / SBIm' },
  { nome: 'COVID-19', faixa: 'Adulto', periodicidade: 'Conforme calendário vigente', fonte: 'PNI / Ministério da Saúde' },
]

function Section({ title, Icon, items }: { title: string; Icon: typeof Stethoscope; items: PrevItem[] }) {
  return (
    <div className="card-premium p-6">
      <div className="flex items-center gap-2.5 mb-4">
        <div className="w-9 h-9 rounded-xl bg-blush flex items-center justify-center">
          <Icon size={18} className="text-petal" />
        </div>
        <h2 className="font-display text-lg font-semibold text-onyx">{title}</h2>
      </div>
      <div className="space-y-3">
        {items.map(it => (
          <div key={it.nome} className="rounded-xl border border-border bg-ivory p-4">
            <p className="font-body text-sm font-semibold text-onyx">{it.nome}</p>
            <div className="grid sm:grid-cols-3 gap-2 mt-2">
              <p className="font-body text-xs text-mauve"><span className="text-mauve/50">Faixa: </span>{it.faixa}</p>
              <p className="font-body text-xs text-mauve"><span className="text-mauve/50">Periodicidade: </span>{it.periodicidade}</p>
              <p className="font-body text-xs text-mauve"><span className="text-mauve/50">Fonte: </span>{it.fonte}</p>
            </div>
            {it.nota && (
              <p className="font-body text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-1.5 mt-2 leading-relaxed">
                ⚠️ {it.nota}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export default function PrevencaoPreviewPage() {
  const { user, loading } = useUser()
  const router = useRouter()

  // Trava de visibilidade: só a conta admin enxerga esta prévia.
  useEffect(() => {
    if (!loading && (!user || user.email !== ADMIN_EMAIL)) {
      router.replace('/dashboard')
    }
  }, [loading, user, router])

  if (loading || !user || user.email !== ADMIN_EMAIL) {
    return <div className="p-10 text-center font-body text-sm text-mauve">Carregando…</div>
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      {/* Faixa de aviso — não-validado */}
      <div className="rounded-2xl border-2 border-amber-300 bg-amber-50 px-5 py-4 flex items-start gap-3">
        <ShieldAlert size={20} className="text-amber-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-body text-sm font-bold text-amber-900">PRÉVIA NÃO-VALIDADA — apenas para teste</p>
          <p className="font-body text-xs text-amber-800 mt-1 leading-relaxed">
            Conteúdo de <strong>demonstração</strong> para você avaliar o formato. <strong>Não é recomendação
            médica</strong> e <strong>não substitui avaliação clínica</strong>. As referências reproduzem, de forma
            resumida, o que fontes públicas divulgam — a seleção, a redação e a aplicabilidade definitivas
            dependem de aprovação de um <strong>Responsável Clínico (CRM)</strong> antes de qualquer publicação para usuárias.
            Esta página é visível somente para a conta de administração.
          </p>
        </div>
      </div>

      <div>
        <h1 className="font-display text-2xl font-semibold text-onyx">Prevenção — Mulher 40+</h1>
        <p className="font-body text-sm text-mauve mt-1">
          Exemplo de como a SINTERA pode organizar os cuidados preventivos por faixa etária. Avalie o formato e me diga o que melhorar.
        </p>
      </div>

      <Section title="Rastreamentos e exames" Icon={Stethoscope} items={RASTREAMENTOS} />
      <Section title="Vacinação do adulto" Icon={Syringe} items={VACINAS} />

      <div className="card-premium p-6">
        <div className="flex items-center gap-2.5 mb-2">
          <HeartPulse size={18} className="text-sage" />
          <h2 className="font-display text-base font-semibold text-onyx">Acompanhamento periódico</h2>
        </div>
        <p className="font-body text-sm text-mauve leading-relaxed">
          Avaliação ginecológica periódica, saúde bucal e <span className="inline-flex items-center gap-1"><Eye size={13} className="text-mauve/60" /> exame oftalmológico</span> também
          costumam ser citados. Frequência e indicação a definir pelo Responsável Clínico.
        </p>
      </div>

      <p className="font-body text-[11px] text-mauve/50 text-center leading-relaxed">
        Protótipo interno · pendente de validação clínica · pode ser removido a qualquer momento.
        Quando houver um Responsável Clínico (CRM), o conteúdo é revisado, aprovado item a item e então publicado — para todas as faixas (bebê a idoso, mulher e homem).
      </p>
    </div>
  )
}
