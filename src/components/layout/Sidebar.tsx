'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import type { SupabaseClient } from '@supabase/supabase-js'
import { getMinhaSaudeCounts, searchRecords, type MinhaSaudeCounts } from '@sintera/api-client'
import { PLATFORM_NAV, searchSections, rankHits, groupHits, shouldQuery, type SectionId, type SearchHit } from '@sintera/core'
import { createClient } from '@/lib/supabase/client'
import {
  LayoutDashboard, FileText, FileHeart, ClipboardList, Clock, Pill, Receipt, CalendarDays,
  HeartPulse, Stethoscope, Droplet, Activity, Ruler, Settings,
  Accessibility, X, ChevronRight, ChevronDown, TrendingUp, Leaf, Heart, Users,
  Search as SearchIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useUser } from '@/context/UserContext'
import { useContextualDescription, ContextualDescriptionCard } from '@/components/ui/ContextualDescription'
import { navDescription } from '@/lib/ui/navDescriptions'

// TAXONOMIA OFICIAL DA PLATAFORMA (ADR-021 / MOBILE-036 — rev. 2026-08-06). Organizada pelo MODELO MENTAL do usuário,
// não pela natureza da tela: "Exames" deixa de ser módulo e vira um REGISTRO dentro de Minha Saúde; "Compartilhamento"
// (ação) dá lugar a "Rede de Cuidado" (entidade permanente). Web e Mobile espelham esta mesma taxonomia.
//   Painel Inicial · Agenda (diretos, 1 tela — sem clique redundante).
//   Minha Saúde (expansível) = Documentos (o que alguém EMITIU: Exames, Receitas e atestados) · Cuidados (o que
//                              se USA ou TOMA: Medicamentos, Suplementos, Recursos) · Saúde (estado atual:
//                              Condições, Composição, Ciclo, Monitoramento, Hábitos) · Histórico (linha do tempo).
//   Rede de Cuidado / Despesas = HOJE link DIRETO (1 item cada — sem clique redundante). "Organização" foi
//   descartado como rótulo: o menu dizia "Organização" e a página dizia "Despesas". Vira grupo ao ganhar itens.
//   Configurações (direta). As subdivisões (Documentos/Cuidados/Saúde/Histórico) recolhem por clique.
// Follow-up (reorganização funcional): alinhar a taxonomia do Relatório (SELECT_GROUPS + core REPORT_GROUPS).
type Leaf = { href: string; icon: React.ElementType; label: string; extra?: string[] }
type Section = { label?: string; items: Leaf[] }
type NavNode =
  | { type: 'link'; leaf: Leaf }
  | { type: 'group'; icon: React.ElementType; label: string; sections: Section[] }

// O DESTINO e o ÍCONE de cada seção — a parte que só existe na Web. O NOME, a ORDEM e o AGRUPAMENTO vêm de
// PLATFORM_NAV (@sintera/core), o mesmo catálogo que os menus do aplicativo leem. Antes disto a taxonomia estava
// escrita em três lugares e só concordava por disciplina: renomear "Receitas e atestados" aqui e esquecer o
// aplicativo fazia as duas pontas chamarem a mesma tela por nomes diferentes (base única, 27/08).
//
// `extra` = caminhos que também acendem o item (páginas que pertencem à seção mas têm rota própria).
const DESTINO: Record<SectionId, { href: string; icon: React.ElementType; extra?: string[] }> = {
  inicio:       { href: '/dashboard',                icon: LayoutDashboard },
  agenda:       { href: '/dashboard/agenda',         icon: CalendarDays },
  exames:       { href: '/dashboard/exams',          icon: FileText },
  // O pedido é a ORIGEM do fluxo assistencial (Q1), não um detalhe do exame. Compartilha a rota; a query distingue a aba.
  pedidos:      { href: '/dashboard/exams?aba=pedidos', icon: ClipboardList },
  // O código continua `documents`/`patient_documents`; o rótulo é pelo que a pessoa PROCURA.
  documentos:   { href: '/dashboard/documentos',     icon: FileHeart },
  medicamentos: { href: '/dashboard/medicamentos',   icon: Pill },
  suplementos:  { href: '/dashboard/suplementos',    icon: Leaf },
  recursos:     { href: '/dashboard/recursos',       icon: Accessibility },
  condicoes:    { href: '/dashboard/condicoes',      icon: Stethoscope },
  medidas:      { href: '/dashboard/medidas',        icon: Ruler },
  ciclo:        { href: '/dashboard/ciclo',          icon: Droplet },
  monitoramento:{ href: '/dashboard/sinais-vitais',  icon: Activity },
  habitos:      { href: '/dashboard/habitos',        icon: HeartPulse },
  'historico-exames': { href: '/dashboard/saude',    icon: TrendingUp },
  'historico-saude':  { href: '/dashboard/timeline', icon: Clock, extra: ['/dashboard/historico'] },
  rede:         { href: '/dashboard/rede-de-cuidado', icon: Users, extra: ['/dashboard/relatorio', '/dashboard/relatorios'] },
  despesas:     { href: '/dashboard/gastos',         icon: Receipt },
  configuracoes:{ href: '/dashboard/configuracoes',  icon: Settings },
}

const folha = (s: { id: SectionId; label: string }): Leaf => ({ ...DESTINO[s.id], label: s.label })

// Grupo do catálogo SEM título vira links de primeiro nível; COM título vira grupo recolhível. É a mesma regra
// que já valia à mão — "1 item hoje → link direto, vira grupo expansível quando crescer".
const NAV: readonly NavNode[] = PLATFORM_NAV.flatMap((g): NavNode[] =>
  g.label === null
    ? g.subgroups.flatMap(sg => sg.sections.map(s => ({ type: 'link' as const, leaf: folha(s) })))
    : [{
        type: 'group' as const,
        icon: Heart,
        label: g.label,
        sections: g.subgroups.map(sg => ({ label: sg.label ?? undefined, items: sg.sections.map(folha) })),
      }],
)

/**
 * Item ativo. Considera a ABA quando dois itens compartilham a mesma rota — é o caso de Exames e Pedidos de
 * exame, que vivem em `/dashboard/exams` e se distinguem por `?aba=pedidos`.
 *
 * Sem isto, "Pedidos" nunca acenderia (o `pathname` não carrega a query) e "Exames" ficaria aceso mesmo com a
 * pessoa na aba de pedidos — o menu mentiria sobre onde ela está.
 */
function isActive(pathname: string, search: string, href: string, extra?: string[]): boolean {
  const [hrefPath, hrefQuery] = href.split('?')
  if (hrefPath === '/dashboard') return pathname === '/dashboard'

  const noCaminho = pathname === hrefPath || pathname.startsWith(hrefPath + '/')
  if (!noCaminho) return (extra ?? []).some(e => pathname === e || pathname.startsWith(e + '/'))

  const abaAtual = new URLSearchParams(search).get('aba')
  const abaDoItem = hrefQuery ? new URLSearchParams(hrefQuery).get('aba') : null
  return abaAtual === abaDoItem
}
function groupActive(node: Extract<NavNode, { type: 'group' }>, pathname: string, search: string): boolean {
  return node.sections.some(s => s.items.some(it => isActive(pathname, search, it.href, it.extra)))
}

interface SidebarProps { open: boolean; onClose: () => void }

// Descrição contextual da navegação = infraestrutura reutilizável (@/components/ui/ContextualDescription).
function NavItem({ href, icon: Icon, label, active, soon, onClose, hintProps, count }: {
  href: string; icon: React.ElementType; label: string; active: boolean; soon?: boolean; onClose: () => void
  hintProps?: React.HTMLAttributes<HTMLElement>; count?: number
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
      {/* §5d — indicador de conteúdo (contador opcional, injetado): mostra onde há registros sem abrir a tela. */}
      {typeof count === 'number' && count > 0 && (
        <span className="font-body text-[10px] font-semibold text-onyx/70 bg-white/45 px-1.5 py-0.5 rounded-full border border-onyx/10 tabular-nums">
          {count}
        </span>
      )}
      {soon && (
        <span className="font-body text-[9px] font-medium text-onyx/70 bg-white/40 px-1.5 py-0.5 rounded-full border border-onyx/10">
          Em breve
        </span>
      )}
    </Link>
  )
}

// Grupo EXPANSÍVEL (hoje só Minha Saúde; Rede de Cuidado e Despesas são links diretos). O rótulo do módulo é o cabeçalho; as
// subdivisões (Documentos/Cuidados/Saúde/Histórico) são ABERTAS por padrão e aparentes — recolhíveis no clique.
function NavGroup({ node, pathname, search, open, onToggle, onClose, bind, countOf }: {
  node: Extract<NavNode, { type: 'group' }>; pathname: string; search: string; open: boolean; onToggle: () => void
  onClose: () => void; bind: (text: string) => React.HTMLAttributes<HTMLElement>; countOf: (href: string) => number | undefined
}) {
  const active = groupActive(node, pathname, search)
  const Icon = node.icon
  // Subdivisões (Documentos/Cuidados/Saúde/Histórico) ABERTAS por padrão — o usuário pode recolher no clique.
  const [openSub, setOpenSub] = useState<Record<string, boolean>>({})
  const toggleSub = (k: string) => setOpenSub(s => ({ ...s, [k]: !(s[k] ?? true) }))
  return (
    <div className="mb-1">
      <button type="button" onClick={onToggle} aria-expanded={open} aria-label={`${node.label} — ${open ? 'recolher' : 'expandir'}`}
        className={cn('w-full flex items-center gap-3 px-3 py-1.5 rounded-xl transition-all duration-200 text-sm font-body group',
          active ? 'text-onyx font-semibold' : 'text-onyx font-medium hover:bg-white/25')}>
        <Icon size={16} className={cn('flex-shrink-0 transition-colors', active ? 'text-petal' : 'text-onyx/75 group-hover:text-onyx')} />
        <span className="flex-1 text-left">{node.label}</span>
        <ChevronDown size={14} className={cn('text-onyx/50 transition-transform duration-200', open ? '' : '-rotate-90')} />
      </button>
      {open && (
        <div className="mt-0.5 ml-3.5 pl-2 border-l border-white/30 flex flex-col gap-0.5">
          {node.sections.map((sec, i) => {
            const items = sec.items.map(item => (
              <NavItem key={item.href} href={item.href} icon={item.icon} label={item.label}
                active={isActive(pathname, search, item.href, item.extra)} onClose={onClose}
                hintProps={bind(navDescription(item.href))} count={countOf(item.href)} />
            ))
            if (!sec.label) return <div key={i} className="flex flex-col gap-0.5">{items}</div>
            const subOpen = openSub[sec.label] ?? true
            // §5d — quando a subdivisão está RECOLHIDA, o total dela vira um indicador (ex.: "Registros 24").
            const sectionTotal = sec.items.reduce((n, it) => n + (countOf(it.href) ?? 0), 0)
            return (
              <div key={sec.label} className="flex flex-col gap-0.5">
                <button type="button" onClick={() => toggleSub(sec.label!)} aria-expanded={subOpen} aria-label={`${sec.label} — ${subOpen ? 'recolher' : 'expandir'}`}
                  className="flex items-center gap-1.5 px-3 mt-1 text-xs font-body font-semibold tracking-wide text-onyx/80 hover:text-onyx transition-colors">
                  <ChevronDown size={13} className={cn('transition-transform duration-200', subOpen ? '' : '-rotate-90')} />
                  <span className="flex-1 text-left">{sec.label}</span>
                  {!subOpen && sectionTotal > 0 && (
                    <span className="font-body text-[10px] font-semibold text-onyx/60 tabular-nums normal-case tracking-normal">{sectionTotal}</span>
                  )}
                </button>
                {subOpen ? items : null}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function SidebarContent({ onClose }: { onClose: () => void }) {
  const pathname = usePathname()
  // A query importa: Exames e Pedidos compartilham a rota e se distinguem por ?aba=pedidos.
  const search = useSearchParams().toString()
  const { profile } = useUser()
  const displayName = profile?.name ?? 'Usuária'
  const initials    = displayName.charAt(0).toUpperCase()
  const { tip, bind } = useContextualDescription()
  // Grupos expansíveis abertos por padrão (mostram os itens); a pessoa pode recolher para uma sidebar mais limpa.
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(
    () => Object.fromEntries(NAV.filter((n): n is Extract<NavNode, { type: 'group' }> => n.type === 'group').map(n => [n.label, true]))
  )
  const toggle = (label: string) => setOpenGroups(o => ({ ...o, [label]: !(o[label] ?? true) }))
  // §5d — contadores de conteúdo por INJEÇÃO (best-effort): a Sidebar só apresenta; o dado vem do @sintera/api-client
  // (MESMA consulta do Mobile — SSOT). Falha é silenciosa: sem contagem, nenhum indicador aparece.
  const [supabase] = useState(() => createClient() as unknown as SupabaseClient)
  const [counts, setCounts] = useState<MinhaSaudeCounts | null>(null)
  useEffect(() => {
    let alive = true
    // Re-tenta quando o perfil/sessão hidrata (profile?.id) — senão, numa corrida de montagem, getSession()
    // ainda vazio lançaria "Não autenticado" e o contador ficaria mudo sem nova tentativa.
    getMinhaSaudeCounts(supabase).then(c => { if (alive) setCounts(c) }).catch(() => { /* indicador é opcional */ })
    return () => { alive = false }
  }, [supabase, profile?.id])
  // BUSCA — duas naturezas, as mesmas do aplicativo, pelos MESMOS motores do core:
  //   • REGISTROS (`searchRecords` + `rankHits`) — "vitamina D" acha o suplemento que ela toma E o indicador do
  //     laudo. Vêm primeiro: quem digita o nome de uma coisa sua quer a coisa, não o mapa.
  //   • SEÇÕES (`searchSections`) — onde as coisas ficam. Vale quando o nome não é de nada já registrado.
  const [busca, setBusca] = useState('')
  const [hits, setHits] = useState<SearchHit[]>([])
  const [procurando, setProcurando] = useState(false)
  const buscando = shouldQuery(busca)
  const resultados = buscando ? searchSections(busca) : []
  const registros = buscando ? groupHits(rankHits(hits, busca)) : []

  useEffect(() => {
    if (!shouldQuery(busca)) { setHits([]); setProcurando(false); return }
    setProcurando(true)
    // Espera antes de consultar: são onze consultas em paralelo, e disparar a cada tecla multiplicaria isso por
    // letra. `cancelado` descarta a resposta que chegar tarde — sem ele, o resultado de "vit" sobrescreveria o
    // de "vitamina" por ter demorado mais.
    let cancelado = false
    const timer = setTimeout(() => {
      searchRecords(supabase, busca)
        .then(r => { if (!cancelado) setHits(r) })
        .catch(() => { if (!cancelado) setHits([]) })
        .finally(() => { if (!cancelado) setProcurando(false) })
    }, 300)
    return () => { cancelado = true; clearTimeout(timer) }
  }, [busca, supabase])

  const countOf = (href: string): number | undefined => {
    if (!counts) return undefined
    const map: Record<string, number> = {
      '/dashboard/exams': counts.exams, '/dashboard/medicamentos': counts.medications,
      '/dashboard/suplementos': counts.supplements, '/dashboard/recursos': counts.resources,
      '/dashboard/condicoes': counts.conditions, '/dashboard/habitos': counts.habits,
    }
    return map[href]
  }

  return (
    <div className="relative overflow-hidden flex flex-col h-full select-none border-r border-black/5" style={{ background: 'linear-gradient(160deg, #9BD8E0 0%, #6FC1CF 58%, #57B0BF 100%)' }}>

      {/* "Flores" do Almond Blossom — manchas desfocadas creme · sálvia · terracota sobre o campo aqua (decorativas). */}
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

      {/* Perfil da usuária — atalho para o perfil */}
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

      {/* BUSCA — a mesma do aplicativo, pelo MESMO motor (`searchSections`, no core). Encontra pela palavra que
          a pessoa usa: "pressão" leva a Monitoramento, "remédio" a Medicamentos. Enquanto há busca, a árvore dá
          lugar aos resultados: mostrar as duas coisas obrigaria a procurar o acerto dentro do menu inteiro. */}
      <div className="relative z-10 mx-4 mb-2">
        <label htmlFor="nav-busca" className="sr-only">Buscar na plataforma</label>
        <SearchIcon size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-onyx/45" />
        <input
          id="nav-busca"
          type="search"
          value={busca}
          onChange={e => setBusca(e.target.value)}
          placeholder="Buscar em toda a plataforma"
          className="w-full rounded-xl border border-onyx/10 bg-white/35 py-2 pl-8 pr-3 font-body text-sm text-onyx placeholder:text-onyx/45 focus:bg-white/60 focus:outline-none focus:ring-1 focus:ring-white/70"
        />
      </div>

      {/* Navegação principal — modelo mental do usuário: itens diretos + módulos expansíveis. */}
      <nav className="relative z-10 flex-1 px-3 overflow-y-auto pb-3 flex flex-col gap-0.5">
        {buscando ? (
          <>
            {/* OS SEUS REGISTROS primeiro, agrupados por natureza. O grupo é o que distingue o suplemento
                "Vitamina D" do indicador "Vitamina D" — sem ele, dois achados de mesmo nome ficariam
                indistinguíveis e a escolha não existiria. */}
            {registros.map(g => (
              <div key={g.kind} className="mb-1">
                <p className="px-3 pb-1 pt-2 font-body text-[10px] uppercase tracking-wider text-onyx/45">{g.label}</p>
                {g.hits.map(h => {
                  const d = DESTINO[h.section]
                  return (
                    <NavItem key={`${g.kind}-${h.id}`} href={d.href} icon={d.icon} label={h.title}
                      active={false}
                      onClose={() => { setBusca(''); onClose() }}
                      hintProps={bind(h.subtitle ?? g.label)} />
                  )
                })}
              </div>
            ))}

            {/* AS SEÇÕES depois, sob um título que diz o que são: quem procurava um registro não deve confundir
                "Monitoramento" com um dado seu. */}
            {resultados.length > 0 && (
              <div className="mb-1">
                <p className="px-3 pb-1 pt-2 font-body text-[10px] uppercase tracking-wider text-onyx/45">Onde registrar</p>
                {resultados.map(m => {
                  const d = DESTINO[m.section.id]
                  return (
                    <NavItem key={m.section.id} href={d.href} icon={d.icon} label={m.section.label}
                      active={isActive(pathname, search, d.href, d.extra)}
                      onClose={() => { setBusca(''); onClose() }}
                      hintProps={bind(m.section.summary)} />
                  )
                })}
              </div>
            )}

            {procurando && registros.length === 0 && (
              <p className="px-3 py-2 font-body text-xs text-onyx/60">Procurando…</p>
            )}

            {!procurando && registros.length === 0 && resultados.length === 0 && (
              <p className="px-3 py-2 font-body text-xs text-onyx/60">
                Nada encontrado para “{busca.trim()}” — nem nos seus registros, nem nas seções.
              </p>
            )}
          </>
        ) : NAV.map(node => node.type === 'link' ? (
          <NavItem key={node.leaf.href} href={node.leaf.href} icon={node.leaf.icon} label={node.leaf.label}
            active={isActive(pathname, search, node.leaf.href, node.leaf.extra)} onClose={onClose}
            hintProps={bind(navDescription(node.leaf.href))} />
        ) : (
          <NavGroup key={node.label} node={node} pathname={pathname} search={search} open={openGroups[node.label] ?? true}
            onToggle={() => toggle(node.label)} onClose={onClose} bind={bind} countOf={countOf} />
        ))}
      </nav>

      {/* Descrição contextual da categoria (hover/foco). */}
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
