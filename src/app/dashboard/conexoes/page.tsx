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
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Disclaimer from '@/components/ui/Disclaimer'
import { useOnOpenSync } from '@/lib/connectors/useOnOpenSync'

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

function statusBadge(c: ConnectorState) {
  switch (c.status) {
    case 'connected':
      return <Badge variant="sage">Conectado</Badge>
    case 'expired':
      return <Badge variant="gold">Reconexão necessária</Badge>
    case 'error':
      return <Badge variant="gold">Atenção</Badge>
    case 'revoked':
      return <Badge variant="neutral">Desconectado</Badge>
    default:
      return <Badge variant="neutral">Não conectado</Badge>
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

  // V2 Épico 3.1 — ao abrir Conexões, sincroniza sozinho as fontes conectadas (throttle no servidor);
  // quando chega dado novo, recarrega o estado. A SINTERA trabalha em segundo plano.
  useOnOpenSync(() => { load() })

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
        <Card padding="md" className="border-petal/30 bg-blush/60">
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
        <Card padding="md" className="border-gold/40 bg-warm/50">
          <div className="flex items-start gap-3">
            <AlertTriangle size={20} className="text-gold flex-shrink-0 mt-0.5" />
            <p className="font-body text-sm text-onyx">Não foi possível concluir a conexão. Tente novamente.</p>
          </div>
        </Card>
      )}

      {loading ? (
        <Card padding="2xl" className="text-center"><Loader2 size={24} className="animate-spin text-petal mx-auto" /></Card>
      ) : error ? (
        <Card padding="lg" className="text-center"><p className="font-body text-sm text-mauve">{error}</p></Card>
      ) : (
        <div className="space-y-4">
          {connectors.map((c) => (
            <Card key={c.source} padding="lg" className="space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="font-display text-lg font-semibold text-onyx">{c.label}</h2>
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
    <Suspense fallback={<div className="max-w-2xl mx-auto px-4 py-8"><Card padding="2xl" className="text-center"><Loader2 size={24} className="animate-spin text-petal mx-auto" /></Card></div>}>
      <ConexoesInner />
    </Suspense>
  )
}
