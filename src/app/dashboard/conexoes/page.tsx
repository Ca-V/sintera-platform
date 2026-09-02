'use client'

// ============================================================
// Conexões — captura automática de dados (HIP-001 / V2 Épico 2)
// ============================================================
// O usuário conecta uma fonte; a SINTERA passa a construir a história sozinha.
// Estado visível por conexão (Conectado · Última sincronização · Sincronizando ·
// Atenção · Erro). Acessível a partir do Monitoramento. Vendor-neutral: a lista
// vem do registro de conectores (mock hoje; Withings/demais depois).
// ============================================================

import { Suspense, useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { ArrowLeft, RefreshCw, Link2, Unlink, CheckCircle2, AlertTriangle, Loader2, Sparkles } from 'lucide-react'
import PageHeader from '@/components/PageHeader'
import { Card } from "@/lib/ui/ds"
import { Badge } from "@/lib/ui/ds"
import Disclaimer from '@/components/ui/Disclaimer'
// O rótulo vem do núcleo: as duas pontas chamam a tela pelo MESMO nome, e um rótulo escrito duas vezes divergiria.
import {
  SCREEN_COPY, CONEXOES_ONDE_FUNCIONA, HEALTH_CONNECT_DOIS_PASSOS, fontesDisponiveis, fontesIndisponiveis,
  caminhoDaFonte,
} from '@sintera/core'
import { useNovelty } from '@/lib/novelty/useNovelty'

type Status = 'disconnected' | 'connected' | 'expired' | 'revoked' | 'error'

interface ConnectorState {
  source: string
  label: string
  domain: string
  status: Status
  lastSyncAt: string | null
  lastSyncStatus: string | null
  lastError: string | null
}

function fmtDateTime(iso: string | null): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

// Rótulo amigável do domínio do conector (o que ele fornece). Modelo ABERTO: domínio desconhecido
// degrada para o próprio valor, sem quebrar (FB-014-E: exibir o domain que já vinha do descriptor).
const DOMAIN_LABEL: Record<string, string> = {
  wearable: 'Dispositivo vestível',
  scale: 'Balança',
  medical_device: 'Dispositivo médico',
}
function domainLabel(d: string): string {
  return DOMAIN_LABEL[d] ?? d
}

function statusBadge(c: ConnectorState) {
  switch (c.status) {
    case 'connected':
      return <Badge tone="info">Conectado</Badge>
    case 'expired':
      return <Badge tone="attention">Reconexão necessária</Badge>
    case 'error':
      return <Badge tone="attention">Atenção</Badge>
    case 'revoked':
      return <Badge tone="neutral">Desconectado</Badge>
    default:
      return <Badge tone="neutral">Não conectado</Badge>
  }
}

function ConexoesInner() {
  const params = useSearchParams()
  const [connectors, setConnectors] = useState<ConnectorState[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const justConnected = params.get('conexao') === 'ok'
  const connectError = params.get('conexao') === 'erro'

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/connectors', { cache: 'no-store' })
      if (!res.ok) throw new Error('Falha ao carregar')
      const data = await res.json()
      setConnectors(data.connectors ?? [])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  // NOV-001 — ao abrir, sincroniza sozinho as fontes e recarrega o estado das conexões. O AVISO de novidade fica
  // no Painel Inicial; aqui a página apenas exibe o estado de cada conexão.
  useNovelty(() => { load() })

  const syncNow = useCallback(async (source: string) => {
    setSyncing(source)
    try {
      await fetch(`/api/connectors/${source}/sync`, { method: 'POST' })
      await load()
    } finally {
      setSyncing(null)
    }
  }, [load])

  const disconnect = useCallback(async (source: string) => {
    setSyncing(source)
    try {
      await fetch(`/api/connectors/${source}/disconnect`, { method: 'POST' })
      await load()
    } finally {
      setSyncing(null)
    }
  }, [load])

  const isConnected = (c: ConnectorState) => c.status === 'connected' || c.status === 'error' || c.status === 'expired'

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      <Link href="/dashboard/sinais-vitais" className="inline-flex items-center gap-1.5 font-body text-sm text-mauve hover:text-petal transition-colors">
        <ArrowLeft size={15} /> Monitoramento
      </Link>

      <PageHeader
        icon={<Link2 size={16} />}
        eyebrow="Conexões"
        title="Dispositivos e conexões"
        subtitle={<>Conecte uma fonte de dados e a sua história de saúde passa a se construir sozinha — as medições entram automaticamente no seu Monitoramento e na Composição Corporal.</>}
      />

      {justConnected && (
        <Card padding="relaxed" className="border-petal/30 bg-blush/60">
          <div className="flex items-start gap-3">
            <Sparkles size={20} className="text-petal flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-body text-sm font-medium text-onyx">Seu primeiro dado chegou.</p>
              <p className="font-body text-sm text-mauve">
                As medições sincronizadas já aparecem no{' '}
                <Link href="/dashboard/sinais-vitais" className="text-petal underline">Monitoramento</Link> e na{' '}
                <Link href="/dashboard/medidas" className="text-petal underline">Composição Corporal</Link>.
              </p>
            </div>
          </div>
        </Card>
      )}

      {connectError && (
        <Card padding="relaxed" className="border-gold/40 bg-warm/50">
          <div className="flex items-start gap-3">
            <AlertTriangle size={20} className="text-gold flex-shrink-0 mt-0.5" />
            <p className="font-body text-sm text-onyx">Não foi possível concluir a conexão. Tente novamente.</p>
          </div>
        </Card>
      )}

      {loading ? (
        <Card padding="none" className="p-10 text-center"><Loader2 size={24} className="animate-spin text-petal mx-auto" /></Card>
      ) : error ? (
        <Card padding="none" className="p-6 text-center"><p className="font-body text-sm text-mauve">{error}</p></Card>
      ) : connectors.length === 0 ? (
        // ESTAVA VAZIO E CALADO: sem fonte configurada, a página renderizava uma lista vazia e mais nada.
        // Quem abrisse Conexões no navegador via um espaço em branco e concluía que a plataforma não faz isso.
        <Card padding="relaxed">
          <p className="font-body text-sm text-onyx">
            Nenhum serviço com conexão própria está disponível por aqui no momento.
          </p>
          <p className="font-body text-sm text-mauve mt-2">
            Isso não impede a entrada automática de dados: ela acontece pelo aplicativo, no celular — como está
            explicado abaixo.
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {connectors.map((c) => (
            <Card key={c.source} padding="none" className="p-6 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="font-display text-lg font-semibold text-onyx">{c.label}</h2>
                  <p className="font-body text-xs text-mauve mt-0.5">{domainLabel(c.domain)}</p>
                </div>
                {statusBadge(c)}
              </div>

              {isConnected(c) && (
                <dl className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <dt className="font-body text-xs text-mauve">Última sincronização</dt>
                    <dd className="font-body text-onyx">{syncing === c.source ? 'Sincronizando…' : fmtDateTime(c.lastSyncAt)}</dd>
                  </div>
                  <div>
                    <dt className="font-body text-xs text-mauve">Situação</dt>
                    <dd className="font-body text-onyx inline-flex items-center gap-1">
                      {c.status === 'connected' && <><CheckCircle2 size={14} className="text-petal" /> Em dia</>}
                      {c.status === 'expired' && <><AlertTriangle size={14} className="text-gold" /> Reconecte a fonte</>}
                      {c.status === 'error' && <><AlertTriangle size={14} className="text-gold" /> Falha na última tentativa</>}
                    </dd>
                  </div>
                </dl>
              )}

              {c.status === 'error' && c.lastError && (
                <p className="font-body text-xs text-mauve">Detalhe: {c.lastError}</p>
              )}

              <div className="flex flex-wrap gap-2">
                {c.status === 'expired' || c.status === 'revoked' || c.status === 'disconnected' ? (
                  <a href={`/api/connectors/${c.source}/connect`}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full gradient-sintera text-white font-body text-sm font-medium hover:opacity-90 transition-opacity">
                    <Link2 size={15} /> {c.status === 'expired' ? 'Reconectar' : 'Conectar'}
                  </a>
                ) : (
                  <>
                    <button onClick={() => syncNow(c.source)} disabled={syncing === c.source}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blush text-petal-dark border border-petal-light font-body text-sm font-medium hover:bg-petal-light transition-colors disabled:opacity-50">
                      <RefreshCw size={15} className={syncing === c.source ? 'animate-spin' : ''} /> Sincronizar agora
                    </button>
                    <button onClick={() => disconnect(c.source)} disabled={syncing === c.source}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-mauve hover:text-petal hover:bg-blush font-body text-sm font-medium transition-colors disabled:opacity-50">
                      <Unlink size={15} /> Desconectar
                    </button>
                  </>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* O CAMINHO AUTOMÁTICO, dito também aqui. A plataforma tem essa capacidade e o navegador não a
          mencionava em lugar nenhum — e capacidade que não se conta é capacidade que ninguém usa.
          Não é acionável a partir do computador, e o texto diz isso: os passos são no celular. Prometer um
          botão que não existe aqui seria pior que não falar. */}
      <Card padding="relaxed" className="space-y-3">
        <h2 className="font-display text-lg font-semibold text-onyx">{CONEXOES_ONDE_FUNCIONA.titulo}</h2>
        <p className="font-body text-sm text-onyx">{CONEXOES_ONDE_FUNCIONA.comoFunciona}</p>
        <p className="font-body text-sm text-mauve">{HEALTH_CONNECT_DOIS_PASSOS}</p>
        <p className="font-body text-xs text-mauve">{CONEXOES_ONDE_FUNCIONA.ondeFazer}</p>

        <div className="space-y-2 pt-1">
          {/* No navegador não se sabe qual celular a pessoa tem, então mostram-se OS DOIS caminhos, rotulados.
              Escolher um seria adivinhar, e adivinhar aqui manda metade das pessoas procurar um menu que não
              existe no aparelho delas — que é exatamente o que esta lista existe para evitar. */}
          {fontesDisponiveis().map(f => (
            <div key={f.source} className="rounded-xl border border-border px-4 py-3">
              <p className="font-body text-sm text-onyx">{f.nome}</p>
              <p className="font-body text-xs text-mauve">
                <span className="text-mauve/70">Android: </span>{caminhoDaFonte(f, 'android')}
              </p>
              <p className="font-body text-xs text-mauve">
                <span className="text-mauve/70">iPhone: </span>{caminhoDaFonte(f, 'ios')}
              </p>
              <p className="font-body text-xs text-mauve/70">Traz: {f.traz}</p>
            </div>
          ))}
          {/* O que ainda não dá aparece COM o motivo, nunca escondido — igual ao aplicativo. */}
          {fontesIndisponiveis().map(({ fonte, motivo }) => (
            <div key={fonte.source} className="rounded-xl border border-border px-4 py-3 opacity-75">
              <p className="font-body text-sm text-onyx">{fonte.nome}</p>
              <p className="font-body text-xs text-mauve">{motivo}</p>
            </div>
          ))}
        </div>

        {/* O QUE NÃO DÁ NO IPHONE, dito de frente. Silenciar faria quem tem iPhone procurar por semanas um
            botão que não está lá. */}
        <p className="font-body text-xs text-mauve border-t border-border pt-3">
          {CONEXOES_ONDE_FUNCIONA.iphone}
        </p>
      </Card>

      {/* A PORTA para o que entrou. Com a sincronização automática, o dado passa a chegar sem ninguém pedir —
          e sem este caminho, "entra sozinho" viraria "entra sem que eu saiba". Fica em Conexões porque é aqui
          que a pessoa pensa em origem de dado. Mesmo lugar, mesmo rótulo que no aplicativo. */}
      <Link
        href="/dashboard/dados-recebidos"
        className="block rounded-xl border border-border px-4 py-3 text-center text-sm hover:bg-black/[0.02]"
      >
        {SCREEN_COPY.dadosRecebidos.title}
      </Link>

      <p className="font-body text-xs text-mauve leading-relaxed">
        A SINTERA organiza e apresenta os dados das fontes que você conectar, com a origem preservada. Você concede e
        revoga o acesso de cada fonte a qualquer momento.
      </p>
      <Disclaimer variant="geral" />
    </div>
  )
}

export default function ConexoesPage() {
  return (
    <Suspense fallback={<div className="max-w-2xl mx-auto px-4 py-8"><Card padding="none" className="p-10 text-center"><Loader2 size={24} className="animate-spin text-petal mx-auto" /></Card></div>}>
      <ConexoesInner />
    </Suspense>
  )
}
