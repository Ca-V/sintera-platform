import Link from 'next/link'
import { Shield, Eye, Edit3, Download, Trash2, XCircle, AlertCircle, Mail } from 'lucide-react'

export const metadata = {
  title: 'Seus Direitos de Privacidade — SINTERA',
  description:
    'Como titular de dados pessoais, você tem direitos garantidos pela LGPD. Saiba como exercê-los na SINTERA.',
}

const CONTACT_EMAIL = 'privacidade@sinteramais.com.br'

interface Right {
  icon: React.ElementType
  title: string
  article: string
  description: string
  howTo: string
  sla: string
}

const rights: Right[] = [
  {
    icon: Eye,
    title: 'Acesso',
    article: 'Art. 18, I',
    description: 'Confirmar se tratamos seus dados e obter uma cópia de todos os dados pessoais que mantemos sobre você.',
    howTo: 'Acesse Configurações → Privacidade & Dados → "Exportar meus dados". O arquivo JSON gerado contém todos os seus dados de forma legível.',
    sla: 'Imediato (via plataforma) ou até 15 dias úteis por e-mail.',
  },
  {
    icon: Edit3,
    title: 'Correção',
    article: 'Art. 18, III',
    description: 'Solicitar a correção de dados incompletos, inexatos ou desatualizados.',
    howTo: 'Acesse Configurações → Perfil para corrigir nome e dados pessoais. Para correção de dados extraídos de laudos, envie e-mail para ' + CONTACT_EMAIL + '.',
    sla: 'Até 15 dias úteis após a solicitação.',
  },
  {
    icon: Download,
    title: 'Portabilidade',
    article: 'Art. 18, V',
    description: 'Receber seus dados em formato estruturado e interoperável para transferência a outro fornecedor de serviço.',
    howTo: 'Acesse Configurações → Privacidade & Dados → "Exportar meus dados". O arquivo JSON é portável para qualquer sistema que aceite este formato.',
    sla: 'Imediato (via plataforma).',
  },
  {
    icon: Trash2,
    title: 'Eliminação',
    article: 'Art. 18, VI',
    description: 'Solicitar a exclusão dos seus dados pessoais tratados com base no seu consentimento.',
    howTo: 'Acesse Configurações → "Excluir conta". Todos os seus dados, arquivos e biomarcadores serão removidos permanentemente em até 30 dias.',
    sla: 'Iniciado imediatamente; concluído em até 30 dias.',
  },
  {
    icon: XCircle,
    title: 'Revogação de consentimento',
    article: 'Art. 18, IX',
    description: 'Revogar o consentimento dado para o tratamento dos seus dados a qualquer momento.',
    howTo: 'Entre em contato pelo e-mail ' + CONTACT_EMAIL + ' informando quais tratamentos deseja revogar. A revogação não afeta o tratamento realizado anteriormente com base no consentimento.',
    sla: 'Confirmação em até 5 dias úteis.',
  },
  {
    icon: AlertCircle,
    title: 'Informação sobre compartilhamento',
    article: 'Art. 18, VII',
    description: 'Saber com quais entidades públicas e privadas compartilhamos seus dados.',
    howTo: 'Consulte nossa Política de Privacidade (seção "Com quem compartilhamos"). Resumo: não vendemos nem compartilhamos dados com terceiros para fins comerciais. Compartilhamos apenas com provedores de infraestrutura (Supabase, Anthropic) sob contrato de sigilo.',
    sla: 'Disponível na Política de Privacidade.',
  },
]

function RightCard({ right }: { right: Right }) {
  const Icon = right.icon
  return (
    <div className="ds-card p-6 space-y-3">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl bg-blush flex items-center justify-center flex-shrink-0 mt-0.5">
          <Icon size={16} className="text-petal" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-body text-sm font-semibold text-onyx">{right.title}</h3>
            <span className="font-body text-[11px] text-mauve bg-ivory border border-border px-2 py-0.5 rounded-full">
              LGPD {right.article}
            </span>
          </div>
          <p className="font-body text-xs text-mauve mt-1 leading-relaxed">{right.description}</p>
        </div>
      </div>

      <div className="ml-12 space-y-2">
        <div className="bg-ivory rounded-xl px-4 py-3 space-y-1">
          <p className="font-body text-[11px] font-semibold text-petal uppercase tracking-wider">Como exercer</p>
          <p className="font-body text-xs text-onyx/70 leading-relaxed">{right.howTo}</p>
        </div>
        <p className="font-body text-[11px] text-mauve">
          <span className="font-semibold">Prazo de resposta:</span> {right.sla}
        </p>
      </div>
    </div>
  )
}

export default function LgpdPage() {
  return (
    <div className="min-h-screen bg-cream">
      <div className="max-w-3xl mx-auto px-6 py-16">

        {/* Header */}
        <div className="mb-10">
          <Link href="/" className="flex items-center gap-2.5 mb-8">
            <div className="w-7 h-7 rounded-full gradient-sintera flex items-center justify-center shadow-sm">
              <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="8" r="5.5" stroke="white" strokeWidth="1.2" fill="none"/>
                <circle cx="8" cy="8" r="2" fill="white"/>
                <path d="M8 2.5 A5.5 5.5 0 0 1 13.5 8" stroke="white" strokeWidth="1.4" strokeLinecap="round"/>
              </svg>
            </div>
            <span className="font-display text-lg font-semibold tracking-[0.18em] text-onyx">SINTERA</span>
          </Link>

          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-2xl bg-blush flex items-center justify-center">
              <Shield size={20} className="text-petal" />
            </div>
            <div>
              <h1 className="font-display text-3xl font-semibold text-onyx">Seus direitos de privacidade</h1>
              <p className="font-body text-sm text-mauve mt-0.5">
                Lei Geral de Proteção de Dados · Lei nº 13.709/2018
              </p>
            </div>
          </div>

          <div className="ds-card p-5 border-l-4 border-petal/40">
            <p className="font-body text-sm text-onyx/80 leading-relaxed">
              Como titular dos seus dados pessoais, você tem direitos garantidos pela LGPD.
              Na SINTERA, priorizamos transparência e controle: todos os direitos listados abaixo
              podem ser exercidos diretamente pela plataforma ou por e-mail, sem burocracia.
            </p>
          </div>
        </div>

        {/* Direitos */}
        <div className="space-y-4 mb-10">
          {rights.map(right => (
            <RightCard key={right.title} right={right} />
          ))}
        </div>

        {/* Controlador */}
        <div className="ds-card p-6 space-y-4 mb-8">
          <h2 className="font-display text-base font-semibold text-onyx">Controladora de dados</h2>
          <div className="font-body text-sm text-onyx/70 space-y-1 leading-relaxed">
            <p className="font-semibold text-onyx">SINTERA Tecnologia em Saúde</p>
            <p>Responsável pelo tratamento dos seus dados pessoais na plataforma SINTERA.</p>
          </div>
          <a href={`mailto:${CONTACT_EMAIL}`}
            className="inline-flex items-center gap-2 font-body text-sm text-petal hover:underline transition-colors">
            <Mail size={14} />
            {CONTACT_EMAIL}
          </a>
          <p className="font-body text-xs text-mauve leading-relaxed">
            Para exercer qualquer direito não disponível diretamente na plataforma, envie um e-mail
            com o assunto <strong>&ldquo;LGPD — [Direito que deseja exercer]&rdquo;</strong> e o endereço
            de e-mail cadastrado na sua conta. Respondemos em até 15 dias úteis.
          </p>
        </div>

        {/* ANPD */}
        <div className="rounded-2xl border border-border bg-ivory px-5 py-4 mb-8">
          <p className="font-body text-xs text-mauve leading-relaxed">
            <span className="font-semibold text-onyx">Autoridade Nacional de Proteção de Dados (ANPD):</span>{' '}
            Se considerar que seus direitos não foram atendidos, você pode registrar uma reclamação
            junto à ANPD em{' '}
            <span className="text-petal">gov.br/anpd</span>.
          </p>
        </div>

        {/* Links */}
        <div className="flex flex-wrap gap-3">
          <Link href="/privacidade"
            className="font-body text-sm text-mauve hover:text-petal transition-colors underline underline-offset-4">
            Política de Privacidade
          </Link>
          <span className="text-border">·</span>
          <Link href="/termos"
            className="font-body text-sm text-mauve hover:text-petal transition-colors underline underline-offset-4">
            Termos de Uso
          </Link>
          <span className="text-border">·</span>
          <Link href="/dashboard/configuracoes"
            className="font-body text-sm text-petal hover:underline transition-colors underline underline-offset-4">
            Configurações da conta
          </Link>
        </div>

        <p className="font-body text-xs text-mauve mt-8">
          SINTERA · Versão 1.0 · Vigente a partir de junho de 2026
        </p>
      </div>
    </div>
  )
}
