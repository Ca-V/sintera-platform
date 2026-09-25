'use client'

// ============================================================
// Profissionais — quem acompanha você, e o que cada um enxerga
// ============================================================
// CARE-003 §8 etapa 5. Primeira tela do vínculo profissional. PARIDADE com o aplicativo
// (ProfissionaisScreen): as seções, a ordem, o texto e os estados vêm do core — só o mecanismo diverge.
//
// O QUE ESTA TELA PRECISA DEIXAR ÓBVIO, porque é dado de saúde de quem a usa:
//  · ninguém enxerga nada antes do aceite dela;
//  · ela vê de relance o tamanho do acesso que concedeu a cada um;
//  · encerrar é imediato, e o registro de que existiu não some.
//
// O QUE ELA NÃO FAZ: esconder histórico. Vínculo revogado continua listado em "Encerrados" — é o registro de
// quem já teve acesso aos dados dela, e é exatamente o que a auditoria existe para preservar.
// ============================================================

import { useCallback, useEffect, useState } from 'react'
import { Loader2, Users } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import PageHeader from '@/components/PageHeader'
import EmptyState from '@/components/EmptyState'
import ConfirmDialog from '@/components/ConfirmDialog'
import { Card } from '@/lib/ui/ds'
import {
  getRedeDeCuidado, convidarProfissional, revogarVinculo, cancelarConvite,
} from '@sintera/api-client'
import {
  SCREEN_COPY, secoesDaRedeDeCuidado, redeEstaVazia, descricaoDoProfissional, resumoDoEscopo,
  rotuloParaRemetente, formatDateBR,
  type VinculoNaLista, type ConviteNaLista,
} from '@sintera/core'

const C = SCREEN_COPY.profissionais

export default function ProfissionaisPage() {
  const supabase = createClient()
  const [vinculos, setVinculos] = useState<VinculoNaLista[]>([])
  const [convites, setConvites] = useState<ConviteNaLista[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)

  const [contato, setContato] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [aRevogar, setARevogar] = useState<VinculoNaLista | null>(null)

  const carregar = useCallback(async () => {
    setCarregando(true)
    setErro(null)
    try {
      const rede = await getRedeDeCuidado(supabase)
      setVinculos(rede.vinculos)
      setConvites(rede.convites)
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não consegui carregar sua rede de cuidado.')
    } finally {
      setCarregando(false)
    }
  }, [supabase])

  useEffect(() => { void carregar() }, [carregar])

  const convidar = async () => {
    if (!contato.trim() || enviando) return
    setEnviando(true)
    setErro(null)
    try {
      await convidarProfissional(supabase, contato)
      setContato('')
      await carregar()
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não consegui enviar o convite.')
    } finally {
      setEnviando(false)
    }
  }

  const agora = new Date()
  const secoes = secoesDaRedeDeCuidado(vinculos, convites, agora)
  const vazia = redeEstaVazia(vinculos, convites, agora)

  return (
    <div className="max-w-3xl mx-auto flex flex-col gap-4">
      <PageHeader title={C.title} subtitle={C.subtitle} />

      {/* Convidar vem ANTES da lista: numa tela vazia é a única ação possível, e numa cheia continua sendo o
          que a pessoa vem fazer aqui. */}
      <Card className="p-4 flex flex-col gap-2">
        <label htmlFor="contato" className="font-body text-sm text-onyx">{C.fieldContact}</label>
        <div className="flex gap-2">
          <input
            id="contato" type="text" value={contato} onChange={(e) => setContato(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') void convidar() }}
            className="flex-1 rounded-lg border border-border bg-ivory px-3 py-2 font-body text-sm text-onyx"
            placeholder="nome@exemplo.com"
          />
          <button
            type="button" onClick={() => void convidar()} disabled={!contato.trim() || enviando}
            className="rounded-lg bg-petal px-4 py-2 font-body text-sm text-white disabled:opacity-50"
          >
            {enviando ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : C.invite}
          </button>
        </div>
        {/* A frase que desarma a dúvida antes de ela existir. */}
        <p className="font-body text-xs text-mauve">{C.contactHint}</p>
      </Card>

      {erro && <p className="font-body text-sm text-red-700" role="alert">{erro}</p>}

      {carregando ? (
        <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-mauve" aria-hidden /></div>
      ) : vazia ? (
        <EmptyState icon={<Users size={28} className="text-petal" aria-hidden />} title={C.emptyTitle} message={C.emptyMessage} />
      ) : (
        secoes.map((s) => (
          <section key={s.chave} className="flex flex-col gap-2">
            <h2 className="font-display text-sm font-semibold text-onyx">{s.titulo}</h2>

            {s.vinculos.map((v) => (
              <Card key={v.id} className="p-4 flex items-start justify-between gap-3">
                <div>
                  <p className="font-body text-sm text-onyx">{v.nomeProfissional}</p>
                  <p className="font-body text-xs text-mauve">{descricaoDoProfissional(v)}</p>
                  <p className="font-body text-xs text-mauve mt-1">
                    {resumoDoEscopo(v.escopo)}
                    {v.desde ? ` · desde ${formatDateBR(v.desde.toISOString())}` : ''}
                  </p>
                </div>
                {v.status === 'ativo' && (
                  <button type="button" onClick={() => setARevogar(v)}
                    className="font-body text-xs text-mauve underline shrink-0">{C.revoke}</button>
                )}
              </Card>
            ))}

            {s.convites.map((c) => (
              <Card key={c.id} className="p-4 flex items-start justify-between gap-3">
                <div>
                  <p className="font-body text-sm text-onyx">{c.paraContato}</p>
                  {/* "Convite encerrado" e não "recusado": quem convidou não precisa saber que foi negativa. */}
                  <p className="font-body text-xs text-mauve">{rotuloParaRemetente(c.status)}</p>
                </div>
                {c.status === 'enviado' && (
                  <button type="button"
                    onClick={() => { void cancelarConvite(supabase, c.id).then(carregar) }}
                    className="font-body text-xs text-mauve underline shrink-0">{C.cancelInvite}</button>
                )}
              </Card>
            ))}
          </section>
        ))
      )}

      <ConfirmDialog
        open={aRevogar !== null}
        title={C.revoke}
        message={`${aRevogar?.nomeProfissional ?? ''} deixa de ver seus dados. ${C.revokeHint}`}
        confirmLabel={C.revoke}
        onCancel={() => setARevogar(null)}
        onConfirm={async () => {
          const alvo = aRevogar
          setARevogar(null)
          if (alvo) { await revogarVinculo(supabase, alvo.id); await carregar() }
        }}
      />
    </div>
  )
}
