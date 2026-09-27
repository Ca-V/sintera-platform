'use client'

// ============================================================
// Pessoas que acompanho — o painel de quem recebeu o convite
// ============================================================
// CARE-003. A outra metade da etapa 9: até 27/09/2026 só existia o lado de quem convida.
//
// "Um login, uma pessoa, dois perfis, duas assinaturas" (decisão da fundadora). O profissional NÃO entra na
// conta de ninguém — ele tem a dele, e aqui estão as pessoas que o autorizaram. Abrir uma mostra só o que ela
// autorizou.
//
// Isto não é escolha de desenho: é o que o banco pressupõe desde a migração 158.
// `profissional_tem_vinculo_ativo()` filtra por `auth.uid()` DO PROFISSIONAL, e as 8 policies da 161 leem
// dessa função. Sem conta própria não há `auth.uid()`, e nenhuma policy devolveria linha alguma.
//
// PARIDADE com o aplicativo (PainelProfissionalScreen).
// ============================================================

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { Loader2, Users } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import PageHeader from '@/components/PageHeader'
import EmptyState from '@/components/EmptyState'
import { Card } from '@/lib/ui/ds'
import { getPacientesDoProfissional, getPerfilProfissional } from '@sintera/api-client'
import {
  SCREEN_COPY, nomeDoPaciente, resumoDoAcesso, painelEstaVazio, formatDateBR, nomeDaProfissao,
  type PacienteNaLista, type PerfilProfissional,
} from '@sintera/core'

const C = SCREEN_COPY.painelProfissional

export default function PainelProfissionalPage() {
  const supabase = createClient()
  const [pacientes, setPacientes] = useState<PacienteNaLista[]>([])
  const [perfil, setPerfil] = useState<PerfilProfissional | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)

  const carregar = useCallback(async () => {
    setCarregando(true)
    setErro(null)
    try {
      const [lista, p] = await Promise.all([
        getPacientesDoProfissional(supabase),
        getPerfilProfissional(supabase),
      ])
      setPacientes(lista)
      setPerfil(p)
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não consegui carregar as pessoas que acompanham você.')
    } finally {
      setCarregando(false)
    }
  }, [supabase])

  useEffect(() => { void carregar() }, [carregar])

  if (carregando) {
    return <div className="flex justify-center py-12"><Loader2 className="h-5 w-5 animate-spin text-mauve" aria-hidden /></div>
  }

  // Sem perfil profissional, esta tela não tem o que mostrar — e o caminho é criar o perfil, não um erro.
  if (!perfil) {
    return (
      <div className="max-w-3xl mx-auto flex flex-col gap-4">
        <PageHeader title={C.title} subtitle={C.subtitle} />
        <Card className="p-6 flex flex-col gap-3">
          <p className="font-body text-sm text-onyx">{SCREEN_COPY.perfilProfissional.subtitle}</p>
          <Link href="/dashboard/perfil-profissional"
            className="rounded-lg bg-petal px-4 py-3 font-body text-sm text-white text-center">
            {SCREEN_COPY.perfilProfissional.save}
          </Link>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto flex flex-col gap-4">
      <PageHeader title={C.title} subtitle={C.subtitle} />

      <Card className="p-4">
        <p className="font-body text-sm text-onyx">{perfil.nomeProfissional}</p>
        <p className="font-body text-xs text-mauve">
          {nomeDaProfissao(perfil.profissao)}
          {perfil.especialidade ? ` · ${perfil.especialidade}` : ''}
          {perfil.conselho && perfil.registroNumero ? ` · ${perfil.conselho} ${perfil.registroNumero}${perfil.registroUf ? `/${perfil.registroUf}` : ''}` : ''}
        </p>
      </Card>

      {erro && <p className="font-body text-sm text-red-700" role="alert">{erro}</p>}

      {painelEstaVazio(pacientes) ? (
        <EmptyState icon={<Users size={28} className="text-petal" aria-hidden />} title={C.emptyTitle} message={C.emptyMessage} />
      ) : (
        <div className="flex flex-col gap-2">
          {pacientes.map((p) => (
            <Link key={p.careLinkId} href={`/dashboard/profissional/${p.careLinkId}`}>
              <Card className="p-4 flex items-start justify-between gap-3">
                <div>
                  <p className="font-body text-sm text-onyx">{nomeDoPaciente(p)}</p>
                  <p className="font-body text-xs text-mauve mt-1">
                    {resumoDoAcesso(p.escopo)}
                    {p.desde ? ` · desde ${formatDateBR(p.desde.toISOString())}` : ''}
                  </p>
                </div>
                <span className="font-body text-xs text-mauve shrink-0" aria-hidden>›</span>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {/* Dito no painel, porque é o que impede o profissional de procurar o que não está lá — e o que deixa
          claro que o controle é da pessoa, não dele. */}
      <p className="font-body text-xs text-mauve">{C.scopeHint}</p>
    </div>
  )
}
