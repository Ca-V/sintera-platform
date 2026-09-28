// CARE-003 §2.3 — criar o convite E enviá-lo, num passo só.
//
// POR QUE A CRIAÇÃO SAIU DO CLIENTE. Antes, a tela inseria a linha direto no Supabase e pronto — e era esse
// o defeito que a homologação de 27/09 encontrou: gravava e não enviava. Separar criação de envio em duas
// chamadas apenas mudaria o lugar onde a segunda seria esquecida.
//
// Aqui as duas acontecem juntas, e o RESULTADO DA ENTREGA volta gravado na linha. A tela relata o que
// aconteceu em vez de afirmar o que espera que tenha acontecido.
//
// Aceita cookie (Web) ou Bearer (aplicativo) — o mesmo `authenticateRequest` das demais rotas, para que o
// Mobile use este caminho sem um segundo dono da regra (ADR-023).
import { NextResponse, type NextRequest } from 'next/server'
import { authenticateRequest } from '@/lib/supabase/apiAuth'
import { canalDoContato } from '@sintera/core'
import { enviarConvite } from '@/lib/care/enviarConvite'

export async function POST(req: NextRequest) {
  // O `client` VEM DAQUI, e não de `createClient()`.
  //
  // DEFEITO ACHADO NA HOMOLOGAÇÃO ANDROID (28/09/2026): esta rota pegava só o `user` e criava um segundo
  // cliente por COOKIE. Na Web funcionava; no aplicativo, que manda `Authorization: Bearer`, não há cookie —
  // o cliente nascia ANÔNIMO, `auth.uid()` ficava nulo, e a RLS recusava o insert. A pessoa lia "Não consegui
  // criar o convite" sem nada dizer que o problema era a porta, não o convite.
  //
  // É exatamente o defeito que `apiAuth.ts` foi escrito para corrigir em 27/08, reintroduzido um arquivo ao
  // lado. O helper já devolve o cliente no contexto da pessoa — descartá-lo é o erro.
  const { user, client: supabase } = await authenticateRequest(req)
  if (!user || !supabase) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  let contato = ''
  try {
    const body = await req.json() as { paraContato?: string }
    contato = (body.paraContato ?? '').trim()
  } catch {
    return NextResponse.json({ error: 'Corpo inválido' }, { status: 400 })
  }
  if (!contato) return NextResponse.json({ error: 'Informe o e-mail ou telefone do profissional' }, { status: 400 })

  const canal = canalDoContato(contato)
  if (canal === 'desconhecido') {
    return NextResponse.json({ error: 'Não reconheci este contato como e-mail nem como telefone.' }, { status: 400 })
  }

  // A inserção passa pela RLS da pessoa: ela só cria convite em nome dela mesma. O `token` e o prazo vêm do
  // DEFAULT do banco — o cliente não gera token, e o servidor também não precisa.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('care_invites')
    .insert({
      de_user_id: user.id,
      para_contato: contato,
      direcao: 'paciente_convida_profissional',
      canal,
    })
    .select('id, token')
    .single()

  if (error) {
    // Índice único parcial: já existe convite pendente para este destino.
    const duplicado = typeof error.code === 'string' && error.code === '23505'
    return NextResponse.json(
      { error: duplicado ? 'Você já tem um convite pendente para este contato.' : 'Não consegui criar o convite.' },
      { status: duplicado ? 409 : 500 },
    )
  }

  const { id, token } = data as { id: string; token: string }

  // O nome de quem convida deixa o convite reconhecível. Ausência não impede o envio — o texto tem variante
  // sem nome, porque bloquear o convite por falta de um dado de perfil seria trocar o essencial pelo enfeite.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: perfil } = await (supabase as any)
    .from('profiles').select('name').eq('id', user.id).maybeSingle()
  const primeiroNome = ((perfil?.name as string | null) ?? '').trim().split(/\s+/)[0] || null

  const resultado = await enviarConvite({
    paraContato: contato,
    token,
    nomeDeQuemConvida: primeiroNome,
    baseUrl: process.env.CONNECTOR_PUBLIC_BASE_URL || req.nextUrl.origin,
  })

  // Gravar o estado é o que permite a tela RELATAR. Se esta escrita falhar, o convite continua válido e o
  // rótulo fica em "Enviando…" — impreciso, mas nunca mentindo que chegou.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase as any)
    .from('care_invites')
    .update({
      entrega: resultado.entrega,
      entrega_detalhe: resultado.detalhe ?? null,
      entregue_em: resultado.entrega === 'entregue' ? new Date().toISOString() : null,
    })
    .eq('id', id)

  if (resultado.entrega !== 'entregue') {
    console.warn('[care/invites] convite gravado sem entrega:', resultado.entrega, resultado.detalhe)
  }

  return NextResponse.json({ id, canal: resultado.canal, entrega: resultado.entrega })
}
