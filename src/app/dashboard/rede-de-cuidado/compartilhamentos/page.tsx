'use client'

// ============================================================
// Compartilhamentos — os links de relatório que você criou
// ============================================================
// CARE-003. PARIDADE com o aplicativo (CompartilhamentosScreen): seções, ordem, texto e estados vêm do core —
// só o mecanismo diverge (aqui `navigator.clipboard`, lá `expo-clipboard`).
//
// ADR-001. O link é do domínio Relatório, que o cria, define prazo e seções. Esta tela PROJETA: lista,
// mostra o estado e encerra. Nenhuma regra de compartilhamento nasce aqui.
//
// O FATO QUE A TELA PRECISA DIZER ANTES: o link é PÚBLICO. `/r/<token>` não pede login — quem tiver o
// endereço abre o relatório. É isso que faz o link servir ao médico que não tem conta, e é exatamente por
// isso que precisa estar escrito em cima, e não ser descoberto depois.
// ============================================================

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { Loader2, Share2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import PageHeader from '@/components/PageHeader'
import EmptyState from '@/components/EmptyState'
import ConfirmDialog from '@/components/ConfirmDialog'
import { Card } from '@/lib/ui/ds'
import { listAllShares, revokeShare } from '@sintera/api-client'
import {
  SCREEN_COPY, secoesDeCompartilhamentos, compartilhamentosVazio, estadoDoCompartilhamento, podeRevogar,
  rotuloDoCompartilhamento, resumoDoConteudo, urlDoCompartilhamento, formatDateBR,
  type CompartilhamentoNaLista,
} from '@sintera/core'

const C = SCREEN_COPY.compartilhamentos
const dataBR = (d: Date) => formatDateBR(d.toISOString())

export default function CompartilhamentosPage() {
  const supabase = createClient()
  const [itens, setItens] = useState<CompartilhamentoNaLista[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)
  const [copiado, setCopiado] = useState<string | null>(null)
  const [aRevogar, setARevogar] = useState<CompartilhamentoNaLista | null>(null)

  const carregar = useCallback(async () => {
    setCarregando(true)
    setErro(null)
    try {
      const linhas = await listAllShares(supabase)
      setItens(linhas.map((l) => ({
        id: l.id,
        token: l.token,
        criadoEm: new Date(l.created_at),
        expiraEm: new Date(l.expires_at),
        revogado: l.revoked,
        // `sections` é jsonb: link antigo pode não ter. Vazio significa relatório inteiro — é o que o
        // core resolve em `resumoDoConteudo`, e não uma falha a tratar aqui.
        secoes: Array.isArray(l.sections) ? l.sections : [],
      })))
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não consegui carregar seus compartilhamentos.')
    } finally {
      setCarregando(false)
    }
  }, [supabase])

  useEffect(() => { void carregar() }, [carregar])

  const copiar = async (c: CompartilhamentoNaLista) => {
    const url = urlDoCompartilhamento(c.token, window.location.origin)
    try {
      await navigator.clipboard.writeText(url)
      setCopiado(c.id)
      window.setTimeout(() => setCopiado(null), 2000)
    } catch {
      // Área de transferência bloqueada (contexto inseguro, permissão negada). Não afirmar que copiou.
      setErro('Não consegui copiar. Toque e segure no link para copiar manualmente.')
    }
  }

  const agora = new Date()
  const secoes = secoesDeCompartilhamentos(itens, agora)
  const vazia = compartilhamentosVazio(itens)

  return (
    <div className="max-w-3xl mx-auto flex flex-col gap-4">
      <PageHeader title={C.title} subtitle={C.subtitle} />

      {/* O aviso vem ANTES da lista. Depois dela, viraria rodapé que ninguém lê. */}
      <Card className="p-4">
        <p className="font-body text-xs text-mauve">{C.publicWarning}</p>
      </Card>

      {erro && <p className="font-body text-sm text-red-700" role="alert">{erro}</p>}

      {carregando ? (
        <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-mauve" aria-hidden /></div>
      ) : vazia ? (
        <EmptyState
          icon={<Share2 size={28} className="text-petal" aria-hidden />}
          title={C.emptyTitle}
          message={C.emptyMessage}
          action={
            <Link href="/dashboard/relatorio" className="rounded-lg bg-petal px-4 py-2 font-body text-sm text-white">
              {C.goToReport}
            </Link>
          }
        />
      ) : (
        secoes.map((s) => (
          <section key={s.chave} className="flex flex-col gap-2">
            <h2 className="font-display text-sm font-semibold text-onyx">{s.titulo}</h2>

            {s.itens.map((c) => {
              const estado = estadoDoCompartilhamento(c, agora)
              return (
                <Card key={c.id} className="p-4 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-body text-sm text-onyx">{resumoDoConteudo(c.secoes)}</p>
                    <p className="font-body text-xs text-mauve">{rotuloDoCompartilhamento(c, agora, dataBR)}</p>
                    <p className="font-body text-xs text-mauve mt-1">
                      Criado em {dataBR(c.criadoEm)}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    {/* Copiar só para link que abre. Oferecer o endereço de um link morto seria entregar algo
                        que não funciona sem dizer que não funciona. */}
                    {podeRevogar(estado) && (
                      <>
                        <button type="button" onClick={() => void copiar(c)}
                          className="font-body text-xs text-mauve underline">
                          {copiado === c.id ? C.copied : C.copyLink}
                        </button>
                        <button type="button" onClick={() => setARevogar(c)}
                          className="font-body text-xs text-mauve underline">{C.revoke}</button>
                      </>
                    )}
                  </div>
                </Card>
              )
            })}
          </section>
        ))
      )}

      <ConfirmDialog
        open={aRevogar !== null}
        title={C.revoke}
        message={C.revokeHint}
        confirmLabel={C.revoke}
        onCancel={() => setARevogar(null)}
        onConfirm={async () => {
          const alvo = aRevogar
          setARevogar(null)
          if (!alvo) return
          const { error } = await revokeShare(supabase, alvo.id)
          if (error) setErro(error.message)
          await carregar()
        }}
      />
    </div>
  )
}
