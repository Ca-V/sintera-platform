'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, FileText, Clock, Pill, Receipt, CalendarDays,
  HeartPulse, Stethoscope, ScrollText, Droplet, Activity, Ruler, Settings,
  Accessibility, X, ChevronRight, TrendingUp, Leaf,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useUser } from '@/context/UserContext'
import { useContextualDescription, ContextualDescriptionCard } from '@/components/ui/ContextualDescription'
import { navDescription } from '@/lib/ui/navDescriptions'

// Painel Inicial — item avulso (sem grupo), primeiro do menu.
const homeItem = { href: '/dashboard', icon: LayoutDashboard, label: 'Painel Inicial', extra: undefined as string[] | undefined }

// Arquitetura de navegação por DOMÍNIO de negócio (UX-001 §5; FB-010). Agrupamento
// = organização da experiência, NÃO fusão de entidades (cada módulo preserva modelo/regras).
// A plataforma caminha para 5 domínios de 1º nível: Acompanhamento · Minha Saúde ·
// Rede de Cuidado (CARE-001, ainda a construir) · Organização · Configurações.
//   Acompanhamento = evolução temporal da saúde (Agenda, Histórico de Saúde, Histórico de Exames,
//                    Composição Corporal, Monitoramento).
//   Documentos     = repositório documental/operacional. FASE 1 (beta): Exames como item independente (sem
//                    cabeçalho de grupo); FASE 2 (release): grupo 📁 Documentos oficial ao surgir o 2º tipo.
//   Minha Saúde    = estado permanente da pessoa (Condições, Medicamentos e Suplementos, Recursos, Hábitos, Ciclo).
//   Organização    = finanças e documentos administrativos (Despesas, Relatórios).
//   Configurações  = conta.
// DISTINÇÃO-CHAVE (FB-010): "Exames" é o repositório OPERACIONAL (captura/OCR/laudo original/edição/valor/NF/
// recorrência/reextração); "Histórico de Exames" (/dashboard/saude) é o ACOMPANHAMENTO longitudinal de
// biomarcadores no tempo. São jornadas distintas e complementares — por isso itens separados.
// PRINCÍPIO: toda alteração desta Sidebar reflete na taxonomia do Relatório (relatorio/page SELECT_GROUPS + bandas).
const navGroups: {
  title: string
  titleColor: string
  chipBg?: string
  standalone?: boolean   // FB-010 fase 1: renderiza os itens SEM cabeçalho de grupo (evita "grupo de 1 item")
  items: { href: string; icon: React.ElementType; label: string; extra?: string[] }[]
}[] = [
  {
    title: 'Acompanhamento',
    titleColor: 'text-lavender',
    chipBg: 'bg-[#F5EFE4]',
    items: [
      { href: '/dashboard/agenda',        icon: CalendarDays, label: 'Agenda' },
      { href: '/dashboard/timeline',      icon: Clock,        label: 'Histórico de Saúde', extra: ['/dashboard/historico'] },
      { href: '/dashboard/saude',         icon: TrendingUp,   label: 'Histórico de Exames' },
      { href: '/dashboard/medidas',       icon: Ruler,        label: 'Composição Corporal' },
      { href: '/dashboard/sinais-vitais', icon: Activity,     label: 'Monitoramento' },
    ],
  },
  {
    // FB-010 — DUAS FASES (decisão da fundadora). Fase 1 (beta): Exames é item INDEPENDENTE, sem cabeçalho de
    // grupo (não parecer "grupo vazio"), mas já documentado como pertencente ao FUTURO domínio 📁 Documentos.
    // Fase 2 (release): oficializar o grupo Documentos quando existir o 2º tipo documental (Vacinas · Receitas ·
    // Atestados · Encaminhamentos · Termos · outros documentos médicos). Ver [[DOC-001]] / [[UX-001]].
    title: 'Documentos',
    standalone: true,
    titleColor: 'text-petal',
    items: [
      { href: '/dashboard/exams', icon: FileText, label: 'Exames' },
    ],
  },
  {
    title: 'Minha Saúde',
    titleColor: 'text-lagoa',
    chipBg: 'bg-[#F5EFE4]',
    items: [
      { href: '/dashboard/condicoes',     icon: Stethoscope,   label: 'Condições de Saúde' },
      { href: '/dashboard/medicamentos',  icon: Pill,          label: 'Medicamentos' },
      { href: '/dashboard/suplementos',   icon: Leaf,          label: 'Suplementos' },
      { href: '/dashboard/recursos',      icon: Accessibility, label: 'Recursos de Saúde' },
      { href: '/dashboard/habitos',       icon: HeartPulse,    label: 'Hábitos' },
      { href: '/dashboard/ciclo',         icon: Droplet,       label: 'Ciclo e Contracepção' },
    ],
  },
  {
    title: 'Organização',
    titleColor: 'text-gold',
    chipBg: 'bg-[#F5EFE4]',
    items: [
      { href: '/dashboard/gastos',    icon: Receipt,    label: 'Despesas' },
      { href: '/dashboard/relatorio', icon: ScrollText, label: 'Relatórios' },
    ],
  },
  {
    title: 'Configurações',
    titleColor: 'text-onyx/60',
    chipBg: 'bg-[#F5EFE4]',
    items: [
      { href: '/dashboard/configuracoes', icon: Settings, label: 'Configurações' },
    ],
  },
]

function isActive(pathname: string, href: string, extra?: string[]): boolean {
  if (href === '/dashboard') return pathname === '/dashboard'
  if (pathname === href || pathname.startsWith(href + '/')) return true
  return (extra ?? []).some(e => pathname === e || pathname.startsWith(e + '/'))
}

interface SidebarProps { open: boolean; onClose: () => void }

// Descrição contextual da navegação = infraestrutura reutilizável (@/components/ui/ContextualDescription).
// A Sidebar apenas fornece o texto de cada item; o gatilho (hover/foco) e o card vêm do componente.
function NavItem({ href, icon: Icon, label, active, soon, onClose, hintProps }: {
  href: string; icon: React.ElementType; label: string; active: boolean; soon?: boolean; onClose: () => void
  hintProps?: React.HTMLAttributes<HTMLElement>
}) {
  return (
    <Link href={href} onClick={onClose} {...hintProps}
      className={cn(
        'flex items-center gap-3 px-3 py-1.5 rounded-xl transition-all duration-200 text-sm font-body group',
        active
          ? 'nav-active-glow bg-white/45 text-onyx font-semibold'
          : 'text-onyx font-medium hover:bg-white/25'
      )}
    >
      <Icon size={16} className={cn('flex-shrink-0 transition-colors',
        active ? 'text-petal' : 'text-onyx/75 group-hover:text-onyx')} />
      <span className="flex-1">{label}</span>
      {soon && (
        <span className="font-body text-[9px] font-medium text-onyx/70 bg-white/40 px-1.5 py-0.5 rounded-full border border-onyx/10">
          Em breve
        </span>
      )}
    </Link>
  )
}

function SidebarContent({ onClose }: { onClose: () => void }) {
  const pathname = usePathname()
  const { profile } = useUser()
  const displayName = profile?.name ?? 'Usuária'
  const initials    = displayName.charAt(0).toUpperCase()
  const { tip, bind } = useContextualDescription()

  return (
    <div className="relative overflow-hidden flex flex-col h-full select-none border-r border-black/5" style={{ background: 'linear-gradient(160deg, #9BD8E0 0%, #6FC1CF 58%, #57B0BF 100%)' }}>

      {/* "Flores" do Almond Blossom (mesmas do painel esquerdo do Login) — manchas desfocadas
          creme · sálvia · terracota sobre o campo aqua. Puramente decorativas (atrás do conteúdo). */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0" aria-hidden="true">
        <div className="absolute -top-16 -right-12 w-56 h-56 rounded-full blur-3xl" style={{ background: 'rgba(246,242,234,0.50)' }} />
        <div className="absolute top-1/3 -left-12 w-52 h-52 rounded-full blur-3xl" style={{ background: 'rgba(167,185,140,0.30)' }} />
        <div className="absolute -bottom-16 right-1/4 w-56 h-56 rounded-full blur-3xl" style={{ background: 'rgba(193,131,106,0.20)' }} />
      </div>

      {/* Logo — leva ao Painel Inicial (área logada) */}
      <div className="relative z-10 flex items-center justify-between px-5 py-4">
        <Link href="/dashboard" onClick={onClose} className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full gradient-aqua flex items-center justify-center shadow-lg">
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
              <circle cx="8" cy="8" r="5.5" stroke="white" strokeWidth="1.2" fill="none"/>
              <circle cx="8" cy="8" r="2" fill="white"/>
              <path d="M8 2.5 A5.5 5.5 0 0 1 13.5 8" stroke="white" strokeWidth="1.4" strokeLinecap="round"/>
            </svg>
          </div>
          <span className="font-display text-lg font-semibold tracking-[0.2em] text-onyx">SINTERA</span>
        </Link>
        <button onClick={onClose} className="lg:hidden text-onyx/60 hover:text-onyx transition-colors">
          <X size={17}/>
        </button>
      </div>

      {/* Perfil da usuária — atalho para o perfil (perfil/config/sair ficam no menu do topo) */}
      <Link href="/dashboard/profile" onClick={onClose}
        className="relative z-10 mx-4 mb-3 p-3 rounded-2xl border border-onyx/10 bg-white/35 hover:bg-white/50 transition-colors">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full gradient-aqua flex items-center justify-center flex-shrink-0 shadow-md">
            <span className="text-white text-sm font-display font-bold">{initials}</span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-body font-medium text-onyx leading-tight truncate">{displayName}</p>
          </div>
          <ChevronRight size={13} className="text-onyx/50 flex-shrink-0"/>
        </div>
      </Link>

      {/* Navegação principal — todos os tópicos visíveis sem rolagem.
          Painel Inicial é item avulso; os grupos vêm em seguida (títulos com mais
          destaque, itens mais compactos para caber mais sem rolagem). */}
      <nav className="relative z-10 flex-1 px-3 overflow-y-auto pb-3">
        <div className="mb-2">
          <NavItem href={homeItem.href} icon={homeItem.icon} label={homeItem.label}
            active={isActive(pathname, homeItem.href, homeItem.extra)} onClose={onClose}
            hintProps={bind(navDescription(homeItem.href))} />
        </div>
        {navGroups.map(group => (
          <div key={group.title} className="mb-1.5">
            {group.standalone ? null : group.chipBg ? (
              <div className={cn('mx-1 mt-2 mb-1.5 px-2.5 py-1 rounded-lg shadow-sm', group.chipBg)}>
                <p className="text-[11px] font-body font-bold uppercase tracking-[0.14em] text-onyx">{group.title}</p>
              </div>
            ) : (
              <p className={cn('text-[11px] font-body font-bold uppercase tracking-[0.16em] px-3 mt-1 mb-1', group.titleColor)}>
                {group.title}
              </p>
            )}
            <ul className="flex flex-col gap-0.5">
              {group.items.map(item => (
                <li key={item.href}>
                  <NavItem href={item.href} icon={item.icon} label={item.label}
                    active={isActive(pathname, item.href, item.extra)} onClose={onClose}
                    hintProps={bind(navDescription(item.href))} />
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      {/* Descrição contextual da categoria (hover/foco) — infraestrutura reutilizável, desacoplada do gatilho. */}
      <ContextualDescriptionCard tip={tip} />
    </div>
  )
}

export default function Sidebar({ open, onClose }: SidebarProps) {
  return (
    <>
      <aside className="hidden lg:block w-60 h-screen sticky top-0 flex-shrink-0">
        <SidebarContent onClose={onClose}/>
      </aside>

      <AnimatePresence>
        {open && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm"
              onClick={onClose}/>
            <motion.aside initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="fixed left-0 top-0 bottom-0 w-64 z-50 lg:hidden shadow-2xl">
              <SidebarContent onClose={onClose}/>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
