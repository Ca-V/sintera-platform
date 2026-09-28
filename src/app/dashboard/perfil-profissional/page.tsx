'use client'

// ============================================================
// Perfil profissional — a identificação de quem acompanha
// ============================================================
// CARE-003. "Um login, uma pessoa, dois perfis, duas assinaturas" (decisão da fundadora). Esta tela cria o
// SEGUNDO perfil dentro da MESMA conta: a pessoa continua tendo a saúde dela na plataforma, e passa a poder
// acompanhar quem a autorizar.
//
// O QUE ELA NÃO FAZ: atestar. `status_verificacao` não é enviado — o default do banco manda, e a policy de
// update proíbe alterá-lo, inclusive pelo próprio dono da conta. Quem confere o registro no conselho é
// decisão de fora da plataforma (questão 3 do Briefing Jurídico), e até lá ninguém se declara verificado.
//
// PARIDADE com o aplicativo (PerfilProfissionalScreen): campos, ordem, rótulos e regras vêm do core.
// ============================================================

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import PageHeader from '@/components/PageHeader'
import { Card } from '@/lib/ui/ds'
import { getPerfilProfissional, criarPerfilProfissional } from '@sintera/api-client'
import {
  SCREEN_COPY, nomeDaProfissao, conselhoDe, exigeConselho, destinoAposLogin,
  type Profissao,
} from '@sintera/core'

const C = SCREEN_COPY.perfilProfissional

const PROFISSOES: Profissao[] = ['medico', 'nutricionista', 'educador_fisico', 'fisioterapeuta', 'outro']

export default function PerfilProfissionalPage() {
  const router = useRouter()
  const supabase = createClient()

  const [carregando, setCarregando] = useState(true)
  const [jaTem, setJaTem] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  const [nome, setNome] = useState('')
  const [profissao, setProfissao] = useState<Profissao>('medico')
  const [especialidade, setEspecialidade] = useState('')
  const [registro, setRegistro] = useState('')
  const [uf, setUf] = useState('')

  // Para onde voltar depois de criar — normalmente o convite que trouxe a pessoa até aqui. Validado pela
  // MESMA porta do login: destino de fora da plataforma é recusado.
  const [destino, setDestino] = useState('/dashboard/profissional')

  useEffect(() => {
    const next = new URLSearchParams(window.location.search).get('next')
    if (next) setDestino(destinoAposLogin(next))
  }, [])

  const carregar = useCallback(async () => {
    setCarregando(true)
    try {
      setJaTem((await getPerfilProfissional(supabase)) !== null)
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não consegui verificar seu perfil.')
    } finally {
      setCarregando(false)
    }
  }, [supabase])

  useEffect(() => { void carregar() }, [carregar])

  const conselho = conselhoDe(profissao)

  const salvar = async () => {
    if (!nome.trim() || salvando) return
    setSalvando(true)
    setErro(null)
    try {
      await criarPerfilProfissional(supabase, {
        nomeProfissional: nome,
        profissao,
        especialidade,
        conselho,
        registroNumero: registro,
        registroUf: uf,
      })
      router.push(destino)
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não consegui criar o perfil.')
    } finally {
      setSalvando(false)
    }
  }

  if (carregando) {
    return <div className="flex justify-center py-12"><Loader2 className="h-5 w-5 animate-spin text-mauve" aria-hidden /></div>
  }

  return (
    <div className="max-w-xl mx-auto flex flex-col gap-4">
      <PageHeader title={C.title} subtitle={C.subtitle} />

      {jaTem ? (
        <Card className="p-6 flex flex-col gap-3">
          <p className="font-body text-sm text-onyx">{C.existingNote}</p>
          <button type="button" onClick={() => router.push(destino)}
            className="rounded-lg bg-petal px-4 py-3 font-body text-sm text-white">
            {SCREEN_COPY.painelProfissional.title}
          </button>
        </Card>
      ) : (
        <Card className="p-6 flex flex-col gap-4">
          <label className="flex flex-col gap-1">
            <span className="font-body text-sm text-onyx">{C.fieldNome}</span>
            <input value={nome} onChange={(e) => setNome(e.target.value)}
              className="rounded-lg border border-border bg-ivory px-3 py-2 font-body text-sm text-onyx" />
          </label>

          <label className="flex flex-col gap-1">
            <span className="font-body text-sm text-onyx">{C.fieldProfissao}</span>
            <select value={profissao} onChange={(e) => setProfissao(e.target.value as Profissao)}
              className="rounded-lg border border-border bg-ivory px-3 py-2 font-body text-sm text-onyx">
              {PROFISSOES.map(p => <option key={p} value={p}>{nomeDaProfissao(p)}</option>)}
            </select>
          </label>

          <label className="flex flex-col gap-1">
            <span className="font-body text-sm text-onyx">{C.fieldEspecialidade}</span>
            <input value={especialidade} onChange={(e) => setEspecialidade(e.target.value)}
              className="rounded-lg border border-border bg-ivory px-3 py-2 font-body text-sm text-onyx" />
          </label>

          {/* O conselho não é escolhido: ele DECORRE da profissão, e quem sabe isso é o core. Deixar a pessoa
              escolher abriria a porta para nutricionista com CRM. Profissão sem conselho obrigatório
              (`outro`) simplesmente não mostra os campos. */}
          {exigeConselho(profissao) && (
            <div className="flex gap-2">
              <label className="flex flex-col gap-1 w-24">
                <span className="font-body text-sm text-onyx">{C.fieldConselho}</span>
                <input value={conselho ?? ''} readOnly
                  className="rounded-lg border border-border bg-warm px-3 py-2 font-body text-sm text-mauve" />
              </label>
              <label className="flex flex-col gap-1 flex-1">
                <span className="font-body text-sm text-onyx">{C.fieldRegistro}</span>
                <input value={registro} onChange={(e) => setRegistro(e.target.value)}
                  className="rounded-lg border border-border bg-ivory px-3 py-2 font-body text-sm text-onyx" />
              </label>
              <label className="flex flex-col gap-1 w-20">
                <span className="font-body text-sm text-onyx">{C.fieldUf}</span>
                <input value={uf} onChange={(e) => setUf(e.target.value.toUpperCase().slice(0, 2))} maxLength={2}
                  className="rounded-lg border border-border bg-ivory px-3 py-2 font-body text-sm text-onyx" />
              </label>
            </div>
          )}

          {/* Dito ANTES de criar, não descoberto depois. Evita que alguém suponha que a SINTERA atestou o que
              não atestou — e é o que o vocabulário regulatório exige. */}
          <p className="font-body text-xs text-mauve">{C.verifyNote}</p>

          {erro && <p className="font-body text-sm text-red-700" role="alert">{erro}</p>}

          <button type="button" onClick={() => void salvar()} disabled={!nome.trim() || salvando}
            className="rounded-lg bg-petal px-4 py-3 font-body text-sm text-white disabled:opacity-50">
            {salvando ? <Loader2 className="h-4 w-4 animate-spin mx-auto" aria-hidden /> : C.save}
          </button>
        </Card>
      )}
    </div>
  )
}
