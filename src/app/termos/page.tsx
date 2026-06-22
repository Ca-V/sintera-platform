import Link from 'next/link'

export const metadata = { title: 'Termos de Uso — SINTERA' }

export default function TermosPage() {
  return (
    <div className="min-h-screen bg-cream">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <div className="mb-10">
          <Link href="/" className="flex items-center gap-2.5 mb-8">
            <div className="w-7 h-7 rounded-full gradient-sintera flex items-center justify-center shadow-sm">
              <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="8" r="5.5" stroke="white" strokeWidth="1.2" fill="none"/>
                <circle cx="8" cy="8" r="2" fill="white"/>
                <path d="M8 2.5 A5.5 5.5 0 0 1 13.5 8" stroke="white" strokeWidth="1.4" strokeLinecap="round"/>
              </svg>
            </div>
            <span className="font-display text-lg font-semibold tracking-[0.18em] text-onyx">SINTERA</span>
          </Link>
          <h1 className="font-display text-3xl font-semibold text-onyx mb-2">Termos de Uso</h1>
          <p className="font-body text-sm text-mauve">Versão 2.0 · Vigente a partir de junho de 2026</p>
        </div>

        <div className="card-premium p-8 space-y-8 font-body text-sm text-onyx/80 leading-relaxed">

          <section className="space-y-3">
            <h2 className="font-display text-lg font-semibold text-onyx">1. Aceitação dos termos</h2>
            <p>Ao criar uma conta na SINTERA e utilizar a plataforma, você concorda integralmente com estes Termos de Uso e com nossa <Link href="/privacidade" className="text-petal hover:underline">Política de Privacidade</Link>. Se não concordar, não utilize o serviço.</p>
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-lg font-semibold text-onyx">2. O que é a SINTERA</h2>
            <p>A SINTERA é uma plataforma de organização de dados de saúde que utiliza inteligência artificial para:</p>
            <ul className="space-y-1 list-disc list-inside text-mauve">
              <li><span className="text-onyx/80">Extrair biomarcadores</span> de laudos laboratoriais em PDF.</li>
              <li><span className="text-onyx/80">Organizar e estruturar</span> os dados extraídos.</li>
              <li><span className="text-onyx/80">Exibir histórico longitudinal</span> dos resultados ao longo do tempo.</li>
            </ul>
          </section>

          <section className="space-y-3 border border-amber-200 bg-amber-50 rounded-2xl p-5">
            <h2 className="font-display text-lg font-semibold text-amber-800">3. Limitações — leia com atenção</h2>
            <p className="text-amber-800">A SINTERA <strong>não é um dispositivo médico</strong> e <strong>não substitui avaliação médica profissional</strong>.</p>
            <ul className="space-y-2 list-disc list-inside text-amber-700">
              <li>A plataforma <strong>não oferece diagnóstico</strong> de doenças ou condições de saúde.</li>
              <li>A plataforma <strong>não oferece prescrição</strong> de medicamentos, exames ou tratamentos.</li>
              <li>A plataforma <strong>não oferece interpretação clínica</strong> dos resultados.</li>
              <li>A plataforma <strong>não oferece aconselhamento de saúde</strong>.</li>
              <li>Os dados exibidos são <strong>reprodução estruturada</strong> do laudo original. Erros de extração são possíveis.</li>
              <li>Decisões de saúde devem sempre ser tomadas <strong>em conjunto com um profissional de saúde habilitado</strong>.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-lg font-semibold text-onyx">4. Cadastro e conta</h2>
            <ul className="space-y-2 list-disc list-inside text-mauve">
              <li>Você deve ter pelo menos 18 anos para criar uma conta.</li>
              <li>Você é responsável por manter a confidencialidade da sua senha.</li>
              <li>Você é responsável por todas as atividades realizadas com sua conta.</li>
              <li>Uma conta por pessoa. Contas de terceiros não são permitidas sem autorização expressa.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-lg font-semibold text-onyx">5. Uso permitido</h2>
            <p>Você pode usar a SINTERA para organizar seus próprios laudos laboratoriais. É proibido:</p>
            <ul className="space-y-2 list-disc list-inside text-mauve">
              <li>Fazer upload de laudos de terceiros sem autorização expressa.</li>
              <li>Usar a plataforma para finalidades comerciais sem autorização prévia por escrito.</li>
              <li>Tentar acessar dados de outros usuários.</li>
              <li>Realizar engenharia reversa ou extrair dados da plataforma de forma automatizada.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-lg font-semibold text-onyx">6. Seus dados</h2>
            <p>Você mantém a propriedade integral dos seus dados. A SINTERA não reivindica qualquer direito de propriedade sobre os laudos que você faz upload ou os dados extraídos. Consulte nossa <Link href="/privacidade" className="text-petal hover:underline">Política de Privacidade</Link> para detalhes sobre como seus dados são tratados.</p>
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-lg font-semibold text-onyx">7. Disponibilidade do serviço</h2>
            <p>A SINTERA é fornecida "como está". Não garantimos disponibilidade ininterrupta. O serviço pode ser interrompido para manutenção ou por razões técnicas sem aviso prévio.</p>
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-lg font-semibold text-onyx">8. Limitação de responsabilidade</h2>
            <p>A SINTERA não se responsabiliza por decisões de saúde tomadas com base nos dados exibidos na plataforma. O uso da plataforma é de inteira responsabilidade da usuária.</p>
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-lg font-semibold text-onyx">9. Encerramento</h2>
            <p>Você pode encerrar sua conta a qualquer momento em <strong>Configurações → Excluir conta</strong>. Podemos encerrar ou suspender contas que violem estes termos.</p>
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-lg font-semibold text-onyx">10. Alterações</h2>
            <p>Podemos atualizar estes termos. Informaremos por e-mail com antecedência mínima de 15 dias antes de mudanças materiais entrarem em vigor.</p>
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-lg font-semibold text-onyx">11. Lei aplicável</h2>
            <p>Estes termos são regidos pela legislação brasileira. Qualquer disputa será resolvida no foro da comarca de São Paulo — SP.</p>
          </section>

          <div className="border-t border-border pt-6">
            <p className="text-xs text-mauve/60">SINTERA · Termos de Uso v2.0 · Junho de 2026</p>
          </div>
        </div>

        <div className="mt-6 text-center">
          <Link href="/" className="font-body text-sm text-petal hover:underline">← Voltar à página inicial</Link>
        </div>
      </div>
    </div>
  )
}
