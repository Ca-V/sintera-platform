'use client'

// ============================================================
// Uma pessoa que autorizou você — só o que ela autorizou
// ============================================================
// CARE-003. Quem impõe o limite é o RLS (migração 161), não esta tela. Se uma consulta devolvesse dado
// indevido, o defeito estaria na policy — a tela nunca é a última linha de defesa.
//
// O QUE ELA NÃO FAZ: interpretar. Lista o que existe, com data e título, e leva ao documento de origem. A
// plataforma preserva, organiza e apresenta; não produz conteúdo clínico (RDC 657).
//
// PARIDADE com o aplicativo (PacienteDoProfissionalScreen).
// ============================================================

import { use, useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import PageHeader from '@/components/PageHeader'
import { Card } from '@/lib/ui/ds'
import { getPacientesDoProfissional, getConteudoDosModulos, type ConteudoDoModulo } from '@sintera/api-client'
import {
  SCREEN_COPY, nomeDoPaciente, modulosAutorizados, rotuloDoModulo, moduloCarregou, formatDateBR,
  type PacienteNaLista,
} from '@sintera/core'

const C = SCREEN_COPY.painelProfissional

export default function PacientePage({ params }: { params: Promise<{ careLinkId: string }> }) {
  const { careLinkId } = use(params)
  const supabase = createClient()

  const [paciente, setPaciente] = useState<PacienteNaLista | null>(null)
  const [modulos, setModulos] = useState<ConteudoDoModulo[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)

  const carregar = useCallback(async () => {
    setCarregando(true)
    setErro(null)
    try {
      // A lista vem da função do banco, que já filtra por vínculo ativo deste profissional. Procurar o
      // vínculo aqui, e não aceitar o id cru da URL, é o que impede que trocar o id na barra de endereço
      // mostre o nome de outra pessoa — o RLS já barraria os DADOS, mas o nome viria do lugar errado.
      const lista = await getPacientesDoProfissional(supabase)
      const p = lista.find(x => x.careLinkId === careLinkId) ?? null
      setPaciente(p)
      if (p) setModulos(await getConteudoDosModulos(supabase, p.pacienteUserId, p.escopo))
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não consegui carregar esta pessoa.')
    } finally {
      setCarregando(false)
    }
  }, [supabase, careLinkId])

  useEffect(() => { void carregar() }, [carregar])

  if (carregando) {
    return <div className="flex justify-center py-12"><Loader2 className="h-5 w-5 animate-spin text-mauve" aria-hidden /></div>
  }

  if (!paciente) {
    // Vínculo encerrado enquanto a tela estava aberta, ou id que não é desta conta. Os dois caem aqui, e é
    // assim de propósito: distinguir confirmaria a existência de um vínculo alheio.
    return (
      <div className="max-w-3xl mx-auto flex flex-col gap-4">
        <PageHeader title={C.title} />
        <Card className="p-6 flex flex-col gap-3">
          <p className="font-body text-sm text-onyx">Esta pessoa não está mais na sua lista.</p>
          <Link href="/dashboard/profissional" className="font-body text-sm text-mauve underline self-start">
            Voltar
          </Link>
        </Card>
      </div>
    )
  }

  const autorizados = modulosAutorizados(paciente.escopo)

  return (
    <div className="max-w-3xl mx-auto flex flex-col gap-4">
      <PageHeader title={nomeDoPaciente(paciente)} subtitle={C.scopeTitle} />

      {erro && <p className="font-body text-sm text-red-700" role="alert">{erro}</p>}

      {autorizados.length === 0 ? (
        <Card className="p-6"><p className="font-body text-sm text-onyx">{C.noAccess}</p></Card>
      ) : (
        autorizados.map((m) => {
          const conteudo = modulos.find(x => x.chave === m.chave)
          const total = conteudo?.total ?? -1
          return (
            <section key={m.chave} className="flex flex-col gap-2">
              <div>
                <h2 className="font-display text-sm font-semibold text-onyx">{m.label}</h2>
                <p className="font-body text-xs text-mauve">{m.descricao} · {rotuloDoModulo(total)}</p>
              </div>

              {moduloCarregou(total) && (conteudo?.itens ?? []).map((i) => (
                <Card key={i.id} className="p-3">
                  <p className="font-body text-sm text-onyx">{i.titulo}</p>
                  {/* Registro sem data própria existe (importação, lançamento manual). Dizer "sem data" é
                      melhor do que inventar uma ou esconder a linha. */}
                  <p className="font-body text-xs text-mauve">
                    {i.data ? formatDateBR(i.data) : 'Sem data registrada'}
                  </p>
                </Card>
              ))}
            </section>
          )
        })
      )}

      <p className="font-body text-xs text-mauve">{C.scopeHint}</p>
    </div>
  )
}
