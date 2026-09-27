// CARE-003 §2.3 — a página que o convite abre. PÚBLICA, e de propósito.
//
// Quem recebe o convite pode não ter conta. Exigir login antes de explicar o que é seria pedir cadastro para
// uma pessoa que ainda não sabe para quê — e é o tipo de porta que faz o convite morrer ali.
//
// O QUE ESTA PÁGINA NÃO MOSTRA: absolutamente nada sobre quem convidou além do primeiro nome, e nada sobre
// saúde. O token está na URL, e URL vaza — fica em histórico, em print, em mensagem encaminhada. Então o que
// ela revela é o mínimo: que existe um convite, e o que acontece se for aceito.
//
// O ACEITE NÃO ACONTECE AQUI. Ele exige sessão, porque criar vínculo é ato do titular dos dados e precisa de
// identidade. Esta página explica e leva ao cadastro; o convite é reconhecido depois, pelo contato.
import Link from 'next/link'
import { SCREEN_COPY, rotaDoConvite, paramDestino } from '@sintera/core'

export const metadata = {
  title: 'Convite',
  // Convite não é conteúdo público: não deve aparecer em busca nem em pré-visualização de link.
  robots: { index: false, follow: false },
}

export default async function ConvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params

  return (
    <main className="min-h-screen bg-warm flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-ivory rounded-2xl border border-border p-8 flex flex-col gap-5">
        <p className="font-display text-2xl font-semibold text-petal">SINTERA</p>

        <div className="flex flex-col gap-2">
          <h1 className="font-display text-xl font-semibold text-onyx">Você recebeu um convite</h1>
          <p className="font-body text-sm text-mauve">
            Alguém convidou você para a {SCREEN_COPY.rede.title} dela na SINTERA — onde exames, medidas e
            documentos ficam reunidos num só lugar.
          </p>
        </div>

        <div className="rounded-xl bg-warm/60 border border-border p-4 flex flex-col gap-2">
          <p className="font-body text-sm text-onyx">O que acontece se você aceitar</p>
          <ul className="font-body text-sm text-mauve list-disc pl-5 flex flex-col gap-1">
            <li>Você vê <strong>o que a pessoa autorizar</strong> — ela escolhe as áreas.</li>
            <li>Ela pode encerrar o acesso quando quiser, e o encerramento é imediato.</li>
            <li>Receber não tem custo. Você entra no plano gratuito.</li>
          </ul>
        </div>

        {/* O DESTINO SEGUE JUNTO. Isto era `/login?convite=<token>` — e NADA lia esse parâmetro: a pessoa
            entrava, caía no painel dela, e o convite ficava para trás sem aviso e sem rastro. Agora o token
            vai como destino validado, e o login leva direto à tela de resposta depois de autenticar. */}
        <Link
          href={`/login${paramDestino(rotaDoConvite(token))}`}
          className="rounded-lg bg-petal px-4 py-3 font-body text-sm text-white text-center"
        >
          Entrar ou criar conta para aceitar
        </Link>

        <p className="font-body text-xs text-mauve">
          Se você não esperava este convite, pode fechar esta página — nada acontece sem a sua ação.
        </p>
      </div>
    </main>
  )
}
