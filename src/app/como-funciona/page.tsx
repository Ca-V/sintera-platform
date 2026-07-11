import Link from 'next/link'
import { ArrowRight, Upload, FlaskConical, TrendingUp, CheckCircle, Shield } from 'lucide-react'

export const metadata = {
  title: 'Como Funciona',
  description: 'Veja como a SINTERA transforma seus laudos laboratoriais em PDF em um histórico visual dos seus biomarcadores.',
}

function MockupUpload() {
  return (
    <div className="bg-white rounded-2xl shadow-lg border border-border overflow-hidden">
      <div className="bg-cream px-4 py-3 border-b border-border flex items-center gap-2">
        <div className="w-2.5 h-2.5 rounded-full bg-red-300" />
        <div className="w-2.5 h-2.5 rounded-full bg-amber-300" />
        <div className="w-2.5 h-2.5 rounded-full bg-green-300" />
        <span className="font-body text-xs text-mauve/40 ml-2">sinteramais.com.br/dashboard/exams</span>
      </div>
      <div className="p-6">
        <div className="border-2 border-dashed border-petal/30 rounded-2xl p-8 text-center bg-blush/20">
          <div className="w-12 h-12 rounded-xl bg-blush flex items-center justify-center mx-auto mb-3">
            <Upload size={20} className="text-petal" />
          </div>
          <p className="font-body text-sm font-semibold text-onyx mb-1">Arraste seu laudo aqui</p>
          <p className="font-body text-xs text-mauve">PDF de qualquer laboratório · até 20MB</p>
        </div>
        <div className="mt-4 space-y-2">
          {['Hemograma Completo.pdf', 'Painel Metabólico.pdf'].map(f => (
            <div key={f} className="flex items-center gap-3 px-3 py-2 rounded-xl bg-sage-light/30">
              <div className="w-7 h-7 rounded-lg bg-sage-light flex items-center justify-center flex-shrink-0">
                <CheckCircle size={13} className="text-sage" />
              </div>
              <span className="font-body text-xs text-onyx">{f}</span>
              <span className="ml-auto font-body text-[11px] text-sage font-medium">Dados extraídos</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function MockupBiomarkers() {
  const items = [
    { name: 'Hemoglobina', value: '13.8', unit: 'g/dL', status: 'normal' },
    { name: 'Glicemia',    value: '95',   unit: 'mg/dL', status: 'normal' },
    { name: 'Vitamina D',  value: '18',   unit: 'ng/mL', status: 'low'    },
    { name: 'TSH',         value: '2.1',  unit: 'mUI/L', status: 'normal' },
    { name: 'Ferritina',   value: '12',   unit: 'ng/mL', status: 'low'    },
  ]
  return (
    <div className="bg-white rounded-2xl shadow-lg border border-border overflow-hidden">
      <div className="bg-cream px-4 py-3 border-b border-border flex items-center gap-2">
        <div className="w-2.5 h-2.5 rounded-full bg-red-300" />
        <div className="w-2.5 h-2.5 rounded-full bg-amber-300" />
        <div className="w-2.5 h-2.5 rounded-full bg-green-300" />
        <span className="font-body text-xs text-mauve/40 ml-2">Biomarcadores extraídos</span>
      </div>
      <div className="p-4 space-y-2">
        {items.map(item => (
          <div key={item.name} className="flex items-center justify-between px-3 py-2.5 rounded-xl border border-border/50">
            <div>
              <p className="font-body text-xs font-semibold text-onyx">{item.name}</p>
              <p className="font-body text-[11px] text-mauve">{item.unit}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-body text-sm font-bold text-onyx">{item.value}</span>
              <span className={`w-2 h-2 rounded-full ${item.status === 'normal' ? 'bg-sage' : 'bg-amber-400'}`} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function MockupHistory() {
  const bars = [40, 55, 48, 62, 58, 72, 68]
  return (
    <div className="bg-white rounded-2xl shadow-lg border border-border overflow-hidden">
      <div className="bg-cream px-4 py-3 border-b border-border flex items-center gap-2">
        <div className="w-2.5 h-2.5 rounded-full bg-red-300" />
        <div className="w-2.5 h-2.5 rounded-full bg-amber-300" />
        <div className="w-2.5 h-2.5 rounded-full bg-green-300" />
        <span className="font-body text-xs text-mauve/40 ml-2">Histórico — Vitamina D</span>
      </div>
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="font-body text-xs text-mauve">Última medição</p>
            <p className="font-display text-2xl font-semibold text-petal">38 <span className="text-sm font-body text-mauve">ng/mL</span></p>
          </div>
          <div className="text-right">
            <p className="font-body text-xs text-mauve">Variação total</p>
            <p className="font-body text-sm font-semibold text-sage">+111% desde 2021</p>
          </div>
        </div>
        <div className="flex items-end gap-2 h-20">
          {bars.map((h, i) => (
            <div key={i} className="flex-1 rounded-t-md transition-all"
              style={{
                height: `${h}%`,
                background: i === bars.length - 1
                  ? 'linear-gradient(to top, #0E7580, #14746B)'
                  : 'rgba(232,164,184,0.25)',
              }} />
          ))}
        </div>
        <div className="flex justify-between mt-2">
          {['2021', '2022', '2022', '2023', '2023', '2024', '2025'].map((y, i) => (
            <span key={i} className="font-body text-[9px] text-mauve/40">{y}</span>
          ))}
        </div>
      </div>
    </div>
  )
}

const steps = [
  {
    number: '01',
    icon: Upload,
    color: 'bg-blush',
    iconColor: 'text-petal',
    title: 'Faça upload do seu laudo',
    description: 'Envie qualquer laudo laboratorial em PDF — de qualquer laboratório do Brasil. O processo leva menos de 1 minuto.',
    details: [
      'PDF de texto nativo ou escaneado',
      'Qualquer laboratório — Fleury, Dasa, Hermes Pardini e outros',
      'Hemograma, bioquímica, hormônios, vitaminas e mais',
      'Até 20MB por arquivo',
    ],
    mockup: <MockupUpload />,
  },
  {
    number: '02',
    icon: FlaskConical,
    color: 'bg-lavender-light',
    iconColor: 'text-lavender',
    title: 'A IA extrai os biomarcadores',
    description: 'Nossa IA lê o laudo e estrutura automaticamente cada biomarcador — com o valor, a unidade e a referência do próprio laudo.',
    details: [
      'Extração automática — sem digitação manual',
      'Referências do laudo original, não genéricas',
      'Resultados qualitativos (ex: Reagente/Não reagente) também capturados',
      'Transparência total: você vê o que foi extraído e de onde',
    ],
    mockup: <MockupBiomarkers />,
  },
  {
    number: '03',
    icon: TrendingUp,
    color: 'bg-sage-light',
    iconColor: 'text-sage',
    title: 'Acompanhe sua evolução',
    description: 'Visualize como cada biomarcador evoluiu ao longo dos anos. Uma visão que você nunca teve antes — e pode levar para a próxima consulta.',
    details: [
      'Histórico longitudinal de todos os seus biomarcadores',
      'Filtros por período, tipo e nome',
      'Variação percentual entre medições',
      'Export em CSV e PDF para compartilhar com seu médico',
    ],
    mockup: <MockupHistory />,
  },
]

export default function ComoFuncionaPage() {
  return (
    <div className="min-h-screen bg-cream">

      {/* Header */}
      <header className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
        <Link href="/" className="inline-flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full gradient-sintera flex items-center justify-center shadow-sm">
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
              <circle cx="8" cy="8" r="5.5" stroke="white" strokeWidth="1.2" fill="none"/>
              <circle cx="8" cy="8" r="2" fill="white"/>
              <path d="M8 2.5 A5.5 5.5 0 0 1 13.5 8" stroke="white" strokeWidth="1.4" strokeLinecap="round"/>
            </svg>
          </div>
          <span className="font-display text-lg font-semibold tracking-[0.18em] text-onyx">SINTERA</span>
        </Link>
        <Link href="/lista-de-espera"
          className="inline-flex items-center gap-2 gradient-sintera text-white font-body text-sm font-medium px-5 py-2.5 rounded-full hover:opacity-90 transition-opacity">
          Começar grátis <ArrowRight size={14} />
        </Link>
      </header>

      {/* Hero */}
      <div className="max-w-3xl mx-auto px-6 pt-16 pb-20 text-center">
        <span className="inline-block px-4 py-1.5 rounded-full bg-blush border border-petal-light text-xs font-body font-medium text-petal-dark uppercase tracking-wider mb-6">
          Como funciona
        </span>
        <h1 className="font-display text-4xl lg:text-5xl font-semibold text-onyx leading-tight mb-5">
          Três passos.<br />
          <span className="text-gradient">Anos de saúde organizados.</span>
        </h1>
        <p className="font-body text-lg text-mauve leading-relaxed max-w-xl mx-auto">
          Do PDF ao histórico visual dos seus biomarcadores em minutos.
          Sem digitação. Sem planilhas. Sem perder o fio da meada entre uma consulta e outra.
        </p>
      </div>

      {/* Steps */}
      <div className="max-w-6xl mx-auto px-6 pb-24 space-y-32">
        {steps.map((step, i) => {
          const Icon = step.icon
          const isEven = i % 2 === 1
          return (
            <div key={step.number}
              className={`grid lg:grid-cols-2 gap-12 xl:gap-20 items-center ${isEven ? 'lg:grid-flow-dense' : ''}`}>

              {/* Text */}
              <div className={isEven ? 'lg:col-start-2' : ''}>
                <div className="flex items-center gap-4 mb-6">
                  <div className={`w-12 h-12 rounded-2xl ${step.color} flex items-center justify-center flex-shrink-0`}>
                    <Icon size={20} className={step.iconColor} />
                  </div>
                  <span className="font-display text-6xl font-semibold text-border/50">{step.number}</span>
                </div>
                <h2 className="font-display text-3xl font-semibold text-onyx mb-4 leading-tight">
                  {step.title}
                </h2>
                <p className="font-body text-mauve leading-relaxed mb-6 text-lg">
                  {step.description}
                </p>
                <ul className="space-y-3">
                  {step.details.map(d => (
                    <li key={d} className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-sage-light flex items-center justify-center flex-shrink-0 mt-0.5">
                        <CheckCircle size={11} className="text-sage" />
                      </div>
                      <span className="font-body text-sm text-onyx/70 leading-relaxed">{d}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Mockup */}
              <div className={isEven ? 'lg:col-start-1 lg:row-start-1' : ''}>
                <div className="max-w-sm mx-auto lg:mx-0">
                  {step.mockup}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Privacidade */}
      <div className="bg-white border-y border-border">
        <div className="max-w-4xl mx-auto px-6 py-12 flex flex-col md:flex-row items-center gap-6 text-center md:text-left">
          <div className="w-14 h-14 rounded-2xl bg-sage-light flex items-center justify-center flex-shrink-0">
            <Shield size={24} className="text-sage" />
          </div>
          <div className="flex-1">
            <h3 className="font-body text-base font-semibold text-onyx mb-1">Seus dados são seus.</h3>
            <p className="font-body text-sm text-mauve leading-relaxed">
              A SINTERA não vende, compartilha ou monetiza seus dados de saúde.
              Seus laudos são acessíveis apenas por você. Você pode exportar ou excluir tudo a qualquer momento.
              LGPD compliant.
            </p>
          </div>
          <Link href="/lgpd" className="font-body text-sm text-petal hover:underline flex-shrink-0">
            Seus direitos →
          </Link>
        </div>
      </div>

      {/* CTA */}
      <div className="max-w-2xl mx-auto px-6 py-24 text-center">
        <h2 className="font-display text-3xl font-semibold text-onyx mb-4">
          Pronta para ver a história<br />dos seus exames?
        </h2>
        <p className="font-body text-mauve mb-8">
          Acesso gratuito · Comece em minutos
        </p>
        <Link href="/lista-de-espera">
          <button className="inline-flex items-center gap-2 gradient-sintera text-white font-body font-medium px-8 py-4 rounded-full hover:opacity-90 transition-opacity shadow-md text-[0.95rem]">
            Criar conta gratuita
            <ArrowRight size={16} />
          </button>
        </Link>
        <p className="font-body text-xs text-mauve/40 mt-4">
          Sem cartão de crédito. Sem compromisso.
        </p>
      </div>

    </div>
  )
}
