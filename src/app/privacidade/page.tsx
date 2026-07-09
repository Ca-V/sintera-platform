import Link from 'next/link'

export const metadata = { title: 'Política de Privacidade — SINTERA' }

export default function PrivacidadePage() {
  return (
    <div className="min-h-screen bg-cream">
      <div className="max-w-3xl mx-auto px-6 py-16">
        {/* Header */}
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
          <h1 className="font-display text-3xl font-semibold text-onyx mb-2">Política de Privacidade</h1>
          <p className="font-body text-sm text-mauve">Versão 2.0 · Vigente a partir de junho de 2026</p>
        </div>

        <div className="card-premium p-8 space-y-8 font-body text-sm text-onyx/80 leading-relaxed">

          <section className="space-y-3">
            <h2 className="font-display text-lg font-semibold text-onyx">1. Quem somos</h2>
            <p>A SINTERA é uma plataforma digital que organiza dados de laudos laboratoriais utilizando inteligência artificial. Operamos exclusivamente como software de organização e visualização de dados — não oferecemos diagnóstico, interpretação clínica, prescrição ou aconselhamento de saúde.</p>
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-lg font-semibold text-onyx">2. Dados que coletamos</h2>
            <ul className="space-y-2 list-disc list-inside text-mauve">
              <li><span className="text-onyx/80">Dados cadastrais:</span> nome e endereço de e-mail fornecidos no cadastro.</li>
              <li><span className="text-onyx/80">Arquivos de laudos:</span> PDFs enviados pela usuária para extração de dados. Armazenados de forma segura e acessíveis apenas pela própria usuária.</li>
              <li><span className="text-onyx/80">Dados extraídos:</span> biomarcadores, valores, unidades e referências extraídos dos laudos pela IA.</li>
              <li><span className="text-onyx/80">Dados de uso:</span> eventos de navegação dentro da plataforma (exames visualizados, extrações realizadas), sem identificação pessoal de comportamento fora da plataforma.</li>
              <li><span className="text-onyx/80">Dados técnicos:</span> IP de acesso e user-agent para fins de segurança e auditoria de consentimento (LGPD).</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-lg font-semibold text-onyx">3. Como usamos seus dados</h2>
            <ul className="space-y-2 list-disc list-inside text-mauve">
              <li><span className="text-onyx/80">Prestação do serviço:</span> extração de biomarcadores, organização do histórico longitudinal e exibição dos dados na plataforma.</li>
              <li><span className="text-onyx/80">Melhoria da qualidade:</span> análise agregada e anônima de padrões de extração para aprimorar o algoritmo de IA.</li>
              <li><span className="text-onyx/80">Comunicações:</span> e-mails transacionais (confirmação de cadastro, recuperação de senha, alertas de pipeline) e digest semanal de monitoramento.</li>
              <li><span className="text-onyx/80">Segurança e conformidade:</span> registro de auditoria para exclusão de conta e registros de consentimento.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-lg font-semibold text-onyx">4. Dados de saúde — tratamento especial (LGPD Art. 11)</h2>
            <p>Os dados extraídos dos seus laudos são dados pessoais sensíveis de saúde nos termos da Lei Geral de Proteção de Dados (LGPD, Art. 11). O tratamento ocorre exclusivamente:</p>
            <ul className="space-y-2 list-disc list-inside text-mauve">
              <li>Com seu consentimento expresso, obtido no momento do cadastro.</li>
              <li>Para a finalidade declarada: organização e visualização dos seus próprios dados.</li>
              <li>Os dados de saúde <strong className="text-onyx">nunca são compartilhados</strong> com terceiros, vendidos, ou utilizados para fins publicitários.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-lg font-semibold text-onyx">5. Seus direitos (LGPD)</h2>
            <p>Você tem direito a:</p>
            <ul className="space-y-2 list-disc list-inside text-mauve">
              <li>Acessar os dados que temos sobre você</li>
              <li>Corrigir dados incompletos ou desatualizados</li>
              <li>Excluir sua conta e todos os dados associados — disponível em <strong className="text-onyx">Configurações → Excluir conta</strong></li>
              <li>Revogar o consentimento a qualquer momento</li>
              <li>Portabilidade dos dados (sob solicitação)</li>
            </ul>
            <p>Para exercer esses direitos, entre em contato: <a href="mailto:privacidade@sinteramais.com.br" className="text-petal hover:underline">privacidade@sinteramais.com.br</a></p>
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-lg font-semibold text-onyx">6. Segurança</h2>
            <p>Utilizamos criptografia em trânsito (TLS) e em repouso. Os arquivos PDF são armazenados em bucket privado (Supabase Storage) acessível apenas pela usuária autenticada. Senhas nunca são armazenadas em texto simples.</p>
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-lg font-semibold text-onyx">7. Retenção de dados</h2>
            <p>Seus dados são mantidos enquanto sua conta estiver ativa. Ao excluir sua conta, todos os seus dados pessoais, laudos, biomarcadores e histórico são permanentemente removidos. O registro de auditoria da exclusão é mantido por obrigação legal.</p>
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-lg font-semibold text-onyx">8. Cookies e rastreamento</h2>
            <p>Utilizamos apenas cookies de sessão estritamente necessários para autenticação. Não utilizamos cookies de rastreamento, publicidade ou analytics de terceiros.</p>
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-lg font-semibold text-onyx">9. Alterações nesta política</h2>
            <p>Informaremos por e-mail sobre mudanças materiais nesta política com antecedência mínima de 15 dias. O uso continuado da plataforma após as alterações constitui aceite da nova versão.</p>
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-lg font-semibold text-onyx">10. Contato</h2>
            <p>Dúvidas sobre privacidade: <a href="mailto:privacidade@sinteramais.com.br" className="text-petal hover:underline">privacidade@sinteramais.com.br</a></p>
          </section>

          <div className="border-t border-border pt-6">
            <p className="text-xs text-mauve">SINTERA · Política de Privacidade v2.0 · Junho de 2026</p>
          </div>
        </div>

        <div className="mt-6 text-center">
          <Link href="/" className="font-body text-sm text-petal hover:underline">← Voltar à página inicial</Link>
        </div>
      </div>
    </div>
  )
}
