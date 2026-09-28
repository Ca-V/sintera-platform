'use client'

// ============================================================
// Responder ao convite — a tela que fechava a corrente
// ============================================================
// CARE-003. Até 27/09/2026 o convite era criado, enviado e aberto — e parava ali. Nada consumia o token,
// nada criava vínculo, e quem clicasse no link chegava ao `/login` com o token descartado pelo caminho.
//
// PARIDADE com o aplicativo (ConviteRecebidoScreen): estados, frases e o que cada erro significa vêm do core.
//
// O QUE ESTA TELA NÃO FAZ: prometer. Ela não diz "aceito" antes de o banco confirmar, e quando não dá, diz
// POR QUE e o que fazer — a lição da homologação de 27/09, em que "tente de novo" mandava repetir o que nunca
// poderia funcionar.
// ============================================================

import { use, useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import PageHeader from '@/components/PageHeader'
import { Card } from '@/lib/ui/ds'
import { getConviteRecebido, aceitarConviteProfissional, recusarConviteProfissional } from '@sintera/api-client'
import {
  SCREEN_COPY, podeResponderConviteRecebido, rotuloDoConviteRecebido, quemConvidou,
  motivoDoAceite, fraseDoMotivo, temCaminho, paramDestino, rotaDoConvite,
  type ConviteRecebido, type MotivoDoAceite,
} from '@sintera/core'

const C = SCREEN_COPY.conviteRecebido

export default function ResponderConvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params)
  const router = useRouter()
  const supabase = createClient()

  const [convite, setConvite] = useState<ConviteRecebido | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [respondendo, setRespondendo] = useState(false)
  const [motivo, setMotivo] = useState<MotivoDoAceite | null>(null)
  const [feito, setFeito] = useState<'aceito' | 'recusado' | null>(null)

  const carregar = useCallback(async () => {
    setCarregando(true)
    setMotivo(null)
    try {
      setConvite(await getConviteRecebido(supabase, token))
    } catch (e) {
      setMotivo(motivoDoAceite(e instanceof Error ? e.message : null))
    } finally {
      setCarregando(false)
    }
  }, [supabase, token])

  useEffect(() => { void carregar() }, [carregar])

  const responder = async (acao: 'aceitar' | 'recusar') => {
    if (respondendo) return
    setRespondendo(true)
    setMotivo(null)
    try {
      if (acao === 'aceitar') await aceitarConviteProfissional(supabase, token)
      else await recusarConviteProfissional(supabase, token)
      setFeito(acao === 'aceitar' ? 'aceito' : 'recusado')
    } catch (e) {
      // O erro cru do banco vira frase AQUI NÃO — vira no core. Esta tela só escolhe onde mostrá-la.
      setMotivo(motivoDoAceite(e instanceof Error ? e.message : null))
    } finally {
      setRespondendo(false)
    }
  }

  const agora = new Date()
  const respondivel = convite ? podeResponderConviteRecebido(convite, agora) : false

  return (
    <div className="max-w-xl mx-auto flex flex-col gap-4">
      <PageHeader title={C.title} />

      {carregando ? (
        <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-mauve" aria-hidden /></div>
      ) : feito ? (
        <Card className="p-6 flex flex-col gap-3">
          <p className="font-body text-sm text-onyx">
            {feito === 'aceito' ? C.accepted : C.declined}
          </p>
          {feito === 'aceito' && (
            <Link href="/dashboard/profissional" className="rounded-lg bg-petal px-4 py-3 font-body text-sm text-white text-center">
              {SCREEN_COPY.painelProfissional.title}
            </Link>
          )}
        </Card>
      ) : !convite ? (
        // Convite inexistente é indistinguível, de propósito, de token errado: dizer "esse convite existe mas
        // não é seu" confirmaria a existência dele a quem tem só o endereço.
        <Card className="p-6">
          <p className="font-body text-sm text-onyx">{fraseDoMotivo('convite_nao_encontrado')}</p>
        </Card>
      ) : (
        <Card className="p-6 flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <h2 className="font-display text-lg font-semibold text-onyx">{rotuloDoConviteRecebido(convite, agora)}</h2>
            {respondivel && <p className="font-body text-sm text-mauve">{C.whatHappens}</p>}
          </div>

          {motivo && (
            <div className="rounded-xl bg-warm/60 border border-border p-4 flex flex-col gap-3">
              <p className="font-body text-sm text-onyx" role="alert">{fraseDoMotivo(motivo)}</p>
              {/* Motivo com saída ganha o caminho; motivo sem saída ganha só a explicação. Botão que não
                  resolve nada é a mesma armadilha do "tente de novo" sobre configuração ausente. */}
              {temCaminho(motivo) && motivo === 'sem_perfil_profissional' && (
                <Link
                  href={`/dashboard/perfil-profissional${paramDestino(rotaDoConvite(token))}`}
                  className="rounded-lg bg-petal px-4 py-2 font-body text-sm text-white text-center"
                >
                  {C.createProfile}
                </Link>
              )}
            </div>
          )}

          {respondivel && (
            <div className="flex flex-col gap-2">
              <button
                type="button" onClick={() => void responder('aceitar')} disabled={respondendo}
                className="rounded-lg bg-petal px-4 py-3 font-body text-sm text-white disabled:opacity-50"
              >
                {respondendo ? <Loader2 className="h-4 w-4 animate-spin mx-auto" aria-hidden /> : C.accept}
              </button>
              <button
                type="button" onClick={() => void responder('recusar')} disabled={respondendo}
                className="rounded-lg border border-border px-4 py-3 font-body text-sm text-mauve disabled:opacity-50"
              >
                {C.decline}
              </button>
            </div>
          )}

          {!respondivel && (
            <button type="button" onClick={() => router.push('/dashboard')}
              className="font-body text-sm text-mauve underline self-start">
              Voltar ao início
            </button>
          )}
        </Card>
      )}

      {/* Quem convidou aparece só quando há convite respondível — e só o primeiro nome. O token viaja em URL,
          e URL vaza: nome completo aqui identificaria a pessoa para quem quer que tenha o endereço. */}
      {convite && respondivel && (
        <p className="font-body text-xs text-mauve">
          Convite enviado por {quemConvidou(convite)}.
        </p>
      )}
    </div>
  )
}
