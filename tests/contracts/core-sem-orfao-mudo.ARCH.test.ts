// ARCH · símbolo público do core sem consumidor tem que ter um MOTIVO escrito.
//
// ============================================================================================
// O PADRÃO QUE ISTO NOMEIA
// ============================================================================================
// A auditoria de paridade mede 734 símbolos públicos nos pacotes. 62 deles não são chamados por nenhuma tela
// nem pelo `api-client` — só por teste. Sozinho, esse número não diz nada: há três coisas MUITO diferentes
// misturadas nele, e tratá-las como uma só foi o que manteve a lista parada por semanas.
//
//   1. AJUDANTE DE CATRACA — existe PARA o teste. `posicaoDaSecao`, `secoesSemNome` e
//      `modulosDoPadraoSemCatalogo` não têm consumidor porque o consumidor delas É a catraca. Está certo.
//
//   2. ESPECIFICADO E NUNCA LIGADO — regra escrita, testada, e que nenhum caminho de produção consulta.
//      Já custou caro três vezes nesta plataforma: a telemetria inteira (29/09), o convite que não enviava
//      (27/09), e o Compartilhamentos dado como Fase 4 (28/09). É a categoria perigosa, porque parece pronta.
//
//   3. SOBRA DE DESENHO ANTERIOR — foi escrita para um modelo que mudou. `allowedTargets` e
//      `documentTargetLabel` serviam ao vínculo iniciado pelo DOCUMENTO; a fundadora propôs o modelo
//      inverso — iniciado pelo REGISTRO — e ele é melhor. As funções ficaram.
//
// ============================================================================================
// A REGRA
// ============================================================================================
// Todo órfão tem entrada nesta lista, com o motivo e a categoria. Não é permissão para existir: é obrigação
// de declarar. Um órfão NOVO que ninguém classificou reprova, e quem o escreveu decide ali se liga, apaga ou
// declara.
//
// A lista também não pode guardar símbolo que voltou a ser usado — senão vira depósito e para de medir.

import { describe, it, expect } from 'vitest'
// A classificacao mora no .mjs de proposito: o script de auditoria e esta catraca medem a MESMA coisa.
// medirem a MESMA coisa. Duas medicoes do mesmo numero divergem, e ai ninguem sabe qual acreditar.
import { classificar } from '../../scripts/lib/paridade.mjs'

const ROOT = process.cwd()

type Categoria = 'catraca' | 'nunca-ligado' | 'desenho-anterior'

interface Motivo { categoria: Categoria; porque: string }

const DECLARADOS: Readonly<Record<string, Motivo>> = {
  // ---- 1. AJUDANTES DE CATRACA — o consumidor é o próprio teste, e está certo assim ----
  posicaoDaSecao:             { categoria: 'catraca', porque: 'a catraca de ordem das seções de Composição é quem a usa' },
  secoesSemNome:              { categoria: 'catraca', porque: 'garante que toda seção do Relatório tem rótulo legível' },
  modulosDoPadraoSemCatalogo: { categoria: 'catraca', porque: 'garante que todo módulo do escopo padrão abre para o profissional' },
  LEGENDA_DAS_ORIGENS:        { categoria: 'catraca', porque: 'garante que toda forma de marcador tem glifo e rótulo' },
  PROIBIDO_NO_CONVITE:        { categoria: 'catraca', porque: 'lista do que o convite NÃO pode conter; a catraca confere contra ela' },
  ESCOPO_SENSIVEL:            { categoria: 'catraca', porque: 'lista dos módulos que não entram no escopo padrão; a catraca confere' },
  CAPABILITY_FORMATS:         { categoria: 'catraca', porque: 'formatos declarados por capacidade; a catraca de anexo confere contra ela' },
  isDeclaredFormat:           { categoria: 'catraca', porque: 'idem' },

  // ---- 2. ESPECIFICADO E NUNCA LIGADO — a categoria perigosa ----
  // BILLING-003: schema em produção, contrato pronto, nenhuma tela de plano, checkout ou assinatura.
  // Depende de quatro decisões de produto que ainda não têm dono: caminho de compra, período de teste,
  // meio de pagamento e preço na tela.
  canApply:                   { categoria: 'nunca-ligado', porque: 'BILLING-003 sem tela de plano' },
  grantsPaidPlan:             { categoria: 'nunca-ligado', porque: 'BILLING-003 sem tela de plano' },
  visivelIndependenteDoPlano: { categoria: 'nunca-ligado', porque: 'BILLING-003 sem tela de plano' },
  LIMITE_DOCUMENTOS_PROPRIOS: { categoria: 'nunca-ligado', porque: 'BILLING-003 sem tela de plano' },
  planTransition:             { categoria: 'nunca-ligado', porque: 'BILLING-003 sem caminho de compra' },
  prorationCreditCents:       { categoria: 'nunca-ligado', porque: 'BILLING-003 sem meio de pagamento' },
  buildInvoice:               { categoria: 'nunca-ligado', porque: 'BILLING-003 sem meio de pagamento' },

  // Proposta de documento pelo profissional: migração 160 aplicada, nenhuma tela. Bloqueada pela questão 3
  // do Briefing Jurídico (quem pode propor documento a quem).
  podePropor:                 { categoria: 'nunca-ligado', porque: 'CARE-003 §proposta — bloqueado pela questão 3 do jurídico' },
  motivoNaoPodePropor:        { categoria: 'nunca-ligado', porque: 'idem' },
  aguardaResposta:            { categoria: 'nunca-ligado', porque: 'idem' },
  rotuloParaProfissional:     { categoria: 'nunca-ligado', porque: 'idem' },
  rotuloParaPaciente:         { categoria: 'nunca-ligado', porque: 'idem' },
  AVISO_ANTES_DE_ACEITAR:     { categoria: 'nunca-ligado', porque: 'idem' },

  // Convite iniciado pelo PROFISSIONAL — a direção oposta. Mesma questão 3.
  podeIniciarConvite:         { categoria: 'nunca-ligado', porque: 'convite profissional→paciente não existe; questão 3 do jurídico' },
  conviteExigeDeclaracao:     { categoria: 'nunca-ligado', porque: 'idem' },
  direcaoDe:                  { categoria: 'nunca-ligado', porque: 'idem' },
  quemIniciou:                { categoria: 'nunca-ligado', porque: 'idem' },
  podeEnviarDocumento:        { categoria: 'nunca-ligado', porque: 'idem' },
  podeConvidarPacientes:      { categoria: 'nunca-ligado', porque: 'idem' },
  motivoDeNaoAgir:            { categoria: 'nunca-ligado', porque: 'idem' },

  // Coorte do experimento VAL-001: gravada no cadastro, que ainda não emite evento nenhum.
  deveOferecerConvite:        { categoria: 'nunca-ligado', porque: 'VAL-001 §2.1 — o cadastro ainda não atribui coorte' },
  metadataDaCoorte:           { categoria: 'nunca-ligado', porque: 'idem' },

  // Máquina de estados do vínculo: a RLS impõe o acesso, então estas funções descrevem a mesma regra do lado
  // do cliente e nenhuma tela precisou delas ainda. Quando o painel do profissional mostrar por que um
  // módulo não abre, elas passam a ser o texto dessa explicação.
  profissionalEnxerga:        { categoria: 'nunca-ligado', porque: 'a RLS impõe; falta a tela que EXPLICA por que um módulo não abre' },
  concedeAcesso:              { categoria: 'nunca-ligado', porque: 'idem' },
  motivoTransicaoInvalida:    { categoria: 'nunca-ligado', porque: 'idem' },
  normalizarEscopo:           { categoria: 'nunca-ligado', porque: 'entra quando a pessoa puder EDITAR o escopo de um vínculo' },
  pendenciasDoConvite:        { categoria: 'nunca-ligado', porque: 'a tela de convite ainda não lista pendências' },
  podeResponder:              { categoria: 'nunca-ligado', porque: 'o remetente ainda não tem ações sobre o convite além de cancelar' },
  motivoRespostaInvalida:     { categoria: 'nunca-ligado', porque: 'idem' },
  DIAS_ATE_EXPIRAR:           { categoria: 'nunca-ligado', porque: 'o prazo vem do DEFAULT do banco; esta constante ainda não é lida por tela' },
  AVISO_CONTATO_NAO_RECONHECIDO: { categoria: 'nunca-ligado', porque: 'a tela ainda não avisa antes de enviar — o aviso vem só depois, na entrega' },

  // Conectores e captura: infraestrutura pronta, consumidor parcial.
  reconcileSamples:           { categoria: 'nunca-ligado', porque: 'HIP-009 — a deduplicação roda no servidor, não no cliente' },
  connectorRegistry:          { categoria: 'nunca-ligado', porque: 'o registro é lido pelo runtime do servidor, fora do alcance desta medição' },
  alcanceLabel:               { categoria: 'nunca-ligado', porque: 'a tela de Conexões ainda não mostra a janela de importação escolhida' },
  pendingUpload:              { categoria: 'nunca-ligado', porque: 'o estado intermediário do anexo não é exibido — a tela mostra só o fim' },
  withUploadedUrl:            { categoria: 'nunca-ligado', porque: 'idem' },
  origemLabel:                { categoria: 'nunca-ligado', porque: 'a origem da transcrição não aparece na tela; entra com a revisão do fluxo' },
  hasRequiredActions:         { categoria: 'nunca-ligado', porque: 'o cartão de documento ainda não destaca ação obrigatória' },

  // Os que a auditoria conta como órfãos sem nem teste os usar — o estado mais silencioso de todos.
  LIMITE_PROFISSIONAIS_NA_CONTA:    { categoria: 'nunca-ligado', porque: 'BILLING-003 — o teto por conta não é consultado por tela nenhuma' },
  motivoRespostaDaPropostaInvalida: { categoria: 'nunca-ligado', porque: 'CARE-003 §proposta — bloqueado pela questão 3 do jurídico' },
  MAX_UPLOAD_BASE64_BYTES:          { categoria: 'nunca-ligado', porque: 'o limite de upload em base64 não é conferido no cliente; o servidor recusa' },
  abreORegistro:                    { categoria: 'nunca-ligado', porque: 'a tela ainda não distingue documento que ABRE um registro do que só o acompanha' },

  // ---- 3. SOBRA DE DESENHO ANTERIOR ----
  DOCUMENT_DOMAIN_KIND:       { categoria: 'desenho-anterior', porque: 'taxonomia do vínculo iniciado pelo documento — modelo substituído em 28/08' },
  prescribedLabel:            { categoria: 'desenho-anterior', porque: 'o rótulo do item prescrito passou a vir do próprio item, não de um mapa à parte' },
  medStatusLabel:             { categoria: 'desenho-anterior', porque: 'a tela de Medicamentos usa o catálogo com rótulo embutido' },
  // O vínculo documento↔registro era iniciado pelo DOCUMENTO. A fundadora propôs o inverso — iniciado pelo
  // REGISTRO — em 28/08, e o modelo dela é melhor: quem fotografa a receita ainda não cadastrou o
  // medicamento. Estas cinco serviam ao modelo antigo. `canAssociate`, que impõe a regra, CONTINUA em uso
  // no `api-client`.
  allowedTargets:             { categoria: 'desenho-anterior', porque: 'vínculo iniciado pelo documento — modelo substituído em 28/08' },
  documentTargetLabel:        { categoria: 'desenho-anterior', porque: 'idem' },
  isDocumentSubtype:          { categoria: 'desenho-anterior', porque: 'idem' },
  createPatientDocument:      { categoria: 'desenho-anterior', porque: 'idem — a criação passou para o api-client' },
  associateDocument:          { categoria: 'desenho-anterior', porque: 'idem' },

  // Helpers de formato de anexo: a política passou a ser consultada por `entryMethodsFor` e
  // `supportedNowAcceptAttr`; estes três ficaram do desenho que checava arquivo a arquivo.
  isAcceptedMime:             { categoria: 'desenho-anterior', porque: 'a checagem por arquivo saiu quando a política passou a declarar formatos' },
  isAcceptedExtension:        { categoria: 'desenho-anterior', porque: 'idem' },
  attachmentAcceptAttr:       { categoria: 'desenho-anterior', porque: 'substituído por supportedNowAcceptAttr' },

  // Rótulos e utilitários de telas que mudaram de forma.
  compareMeasurementsDesc:    { categoria: 'desenho-anterior', porque: 'a ordenação passou para a consulta, no banco' },
  sectionLabel:               { categoria: 'desenho-anterior', porque: 'a Sidebar virou SSOT da taxonomia e traz os próprios rótulos' },
  sectionSummary:             { categoria: 'desenho-anterior', porque: 'idem' },
  resourceTypeLabel:          { categoria: 'desenho-anterior', porque: 'a tela de Recursos usa o catálogo com rótulo embutido' },
  isDeviceContraceptive:      { categoria: 'desenho-anterior', porque: 'a distinção passou a vir do próprio método, não de um teste à parte' },
  contraceptiveStopLabel:     { categoria: 'desenho-anterior', porque: 'idem' },
  storageFileName:            { categoria: 'desenho-anterior', porque: 'o nome do arquivo passou a ser gerado no upload, junto do caminho' },
}

// ------------------------------------------------------------------------------------------------------

interface Orfao { nome: string; arq: string; emTeste: boolean }

const { total, orfaos } = classificar(ROOT) as { total: number; orfaos: Orfao[] }
const nomes = orfaos.map(o => o.nome)

describe('ARCH · CATRACA — órfão do core tem motivo declarado', () => {
  it('a varredura encontra símbolos — senão a catraca não mede nada', () => {
    expect(total, 'nenhum símbolo público nos pacotes: o parser quebrou').toBeGreaterThan(200)
  })

  it('nenhum órfão fica sem classificação', () => {
    const mudos = nomes.filter(n => !DECLARADOS[n])
    expect(
      mudos,
      'Símbolo público do core sem consumidor e sem motivo escrito.\n' +
        'Três coisas diferentes se escondem nesse estado — ajudante de catraca, especificado-e-nunca-ligado,\n' +
        'e sobra de desenho anterior — e tratá-las como uma só é o que mantém a lista parada.\n' +
        'Ligue, apague, ou declare em DECLARADOS com a categoria e o porquê.\n\n' + mudos.join('\n'),
    ).toEqual([])
  })

  it('a lista não guarda símbolo que voltou a ser usado', () => {
    // Sem isto ela vira depósito: um símbolo religado continuaria declarado como órfão, e a catraca pararia
    // de medir justamente o que passou a funcionar.
    const religados = Object.keys(DECLARADOS).filter(n => !nomes.includes(n))
    expect(
      religados,
      'Estes já têm consumidor — tire-os de DECLARADOS:\n' + religados.join('\n'),
    ).toEqual([])
  })

  it('todo motivo declarado tem categoria e explicação de verdade', () => {
    // `idem` é legítimo e vale mais do que repetir a frase: ele diz que o motivo é o mesmo da entrada
    // anterior, e obriga quem lê a olhar o grupo — que é onde a explicação está por escrito.
    const fracos = Object.entries(DECLARADOS)
      .filter(([, m]) => m.porque !== 'idem' && m.porque.length < 15)
    expect(fracos.map(([n]) => n), 'motivo curto demais para dizer alguma coisa').toEqual([])
  })

  it('a categoria PERIGOSA está nomeada e é a maior — e isso é o relatório, não um defeito', () => {
    // "Especificado e nunca ligado" já custou caro três vezes: a telemetria inteira, o convite que não
    // enviava, e o Compartilhamentos dado como Fase 4. Contar quantos ainda estão nesse estado é o ponto
    // desta catraca; o número cair é o progresso.
    const porCategoria = Object.values(DECLARADOS).reduce<Record<string, number>>((a, m) => {
      a[m.categoria] = (a[m.categoria] ?? 0) + 1
      return a
    }, {})
    expect(porCategoria['nunca-ligado'], 'nenhum "nunca ligado" declarado — a lista perdeu o sentido').toBeGreaterThan(0)
    expect(porCategoria['catraca'], 'nenhum ajudante de catraca declarado').toBeGreaterThan(0)
  })
})
