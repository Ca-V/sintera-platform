// FUNC · CARE-003 — o lado de QUEM RECEBE o convite.
//
// ============================================================================================
// ESTE ARQUIVO EXISTE POR CAUSA DE UMA FRENTE QUE EU DEI POR PRONTA PELA METADE
// ============================================================================================
// O convite era criado, enviado e aberto — e parava ali. Nada consumia o token, nada criava vínculo. Eu
// relatei a etapa 9 como entregue tendo construído só o lado de quem convida.
//
// AS CATRACAS DAQUI:
//   1. Nenhuma frase de erro deixa a pessoa sem saber o que fazer quando há o que fazer.
//   2. Nenhum rótulo mostra identificador interno onde deveria haver uma pessoa.
//   3. Um módulo que FALHOU nunca é apresentado como "não há nada".
//   4. Todo módulo do escopo padrão tem entrada no catálogo — senão a pessoa autoriza o que ninguém abre.

import { describe, it, expect } from 'vitest'
import {
  MODULOS_DO_VINCULO, modulosAutorizados, modulosDoPadraoSemCatalogo,
  nomeDoPaciente, resumoDoAcesso, painelEstaVazio,
  rotuloDoModulo, moduloCarregou,
  motivoDoAceite, fraseDoMotivo, temCaminho,
  podeResponderConviteRecebido, quemConvidou, rotuloDoConviteRecebido,
  ESCOPO_PADRAO, ESCOPO_SENSIVEL,
  type PacienteNaLista, type ConviteRecebido, type MotivoDoAceite,
} from '@sintera/core'

const AGORA = new Date('2026-09-28T12:00:00Z')
const dia = (n: number) => new Date(AGORA.getTime() + n * 86400000)

const paciente = (p: Partial<PacienteNaLista> = {}): PacienteNaLista => ({
  careLinkId: 'l1', pacienteUserId: 'u1', nome: 'Ana Souza', escopo: [...ESCOPO_PADRAO], desde: dia(-10), ...p,
})

const convite = (p: Partial<ConviteRecebido> = {}): ConviteRecebido => ({
  status: 'enviado', expiraEm: dia(5), primeiroNome: 'Carina', jaTenhoPerfil: true, ...p,
})

const MOTIVOS: MotivoDoAceite[] = [
  'nao_autenticado', 'convite_nao_encontrado', 'direcao_invalida', 'nao_pode_aceitar_o_proprio_convite',
  'convite_ja_respondido', 'convite_expirado', 'sem_perfil_profissional', 'desconhecido',
]

describe('CARE-003 · o catálogo de módulos', () => {
  it('CATRACA — todo módulo do escopo padrão tem entrada no catálogo', () => {
    // Sem isto, a pessoa autoriza uma área que nenhuma tela sabe abrir: ela acredita que concedeu acesso, e
    // o profissional não vê nada, sem que nenhuma das duas pontas diga por quê.
    expect(modulosDoPadraoSemCatalogo()).toEqual([])
  })

  it('CATRACA — nenhum módulo SENSÍVEL entrou pela porta dos fundos', () => {
    // Hábitos, ciclo, saúde da mulher e medicamentos não têm policy na migração 161. Listá-los aqui não
    // concederia acesso — só faria a consulta voltar vazia e a tela mentir sobre o que foi autorizado.
    for (const s of ESCOPO_SENSIVEL) {
      expect(MODULOS_DO_VINCULO.some(m => m.chave === s), `"${s}" é sensível e não pode estar no catálogo`).toBe(false)
    }
  })

  it('todo módulo tem rótulo e descrição legíveis — nunca a chave crua', () => {
    for (const m of MODULOS_DO_VINCULO) {
      expect(m.label.length, `"${m.chave}" sem rótulo`).toBeGreaterThan(2)
      expect(m.label).not.toBe(m.chave)
      expect(m.descricao.length, `"${m.chave}" sem descrição`).toBeGreaterThan(10)
    }
  })

  it('só os módulos autorizados aparecem, na ordem do catálogo', () => {
    expect(modulosAutorizados(['medidas', 'exames']).map(m => m.chave)).toEqual(['exames', 'medidas'])
  })

  it('escopo desconhecido é IGNORADO, não quebra (Modelo Aberto)', () => {
    // `escopo` é text[] no banco e pode trazer valor que este cliente ainda não conhece.
    expect(modulosAutorizados(['exames', 'modulo_do_futuro']).map(m => m.chave)).toEqual(['exames'])
    expect(modulosAutorizados([])).toEqual([])
  })
})

describe('CARE-003 · como a pessoa é nomeada na lista', () => {
  it('CATRACA — nunca mostra identificador onde deveria haver uma pessoa', () => {
    const semNome = nomeDoPaciente({ nome: null })
    expect(semNome).not.toContain('u1')
    expect(semNome.length).toBeGreaterThan(5)
    expect(semNome).toMatch(/pessoa/i)
  })

  it.each([[null], [''], ['   ']])('perfil sem nome (%s) não vira espaço em branco', (n) => {
    expect(nomeDoPaciente({ nome: n }).trim().length).toBeGreaterThan(0)
  })

  it('o nome preenchido é usado como está', () => {
    expect(nomeDoPaciente({ nome: '  Ana Souza  ' })).toBe('Ana Souza')
  })

  it('o resumo conta ÁREAS DO CATÁLOGO, não entradas cruas do escopo', () => {
    expect(resumoDoAcesso(['exames'])).toBe('Acesso a 1 área')
    expect(resumoDoAcesso([...ESCOPO_PADRAO])).toBe('Acesso a 4 áreas')
    // Chave que o catálogo não conhece não infla o número — senão o profissional procuraria uma quinta área.
    expect(resumoDoAcesso(['exames', 'modulo_do_futuro'])).toBe('Acesso a 1 área')
    expect(resumoDoAcesso([])).toMatch(/sem acesso/i)
  })

  it('painel vazio é vazio', () => {
    expect(painelEstaVazio([])).toBe(true)
    expect(painelEstaVazio([paciente()])).toBe(false)
  })
})

describe('CARE-003 · CATRACA — módulo que falhou não vira "não há nada"', () => {
  it('total negativo diz que NÃO CONSEGUIU LER, e não que está vazio', () => {
    const r = rotuloDoModulo(-1)
    expect(r).toMatch(/não consegui/i)
    expect(r, `"${r}" faria o profissional parar de procurar`).not.toMatch(/nenhum/i)
  })

  it('zero diz que está vazio, e isso é um fato — não um defeito', () => {
    expect(rotuloDoModulo(0)).toMatch(/nenhum registro/i)
  })

  it('contagem no singular e no plural', () => {
    expect(rotuloDoModulo(1)).toBe('1 registro')
    expect(rotuloDoModulo(7)).toBe('7 registros')
  })

  it('só o módulo que carregou mostra itens', () => {
    expect(moduloCarregou(-1)).toBe(false)
    expect(moduloCarregou(0)).toBe(true)
    expect(moduloCarregou(3)).toBe(true)
  })
})

describe('CARE-003 · CATRACA — todo erro do aceite tem frase, e a saída quando existe', () => {
  it('cada motivo tem uma frase própria, e nenhuma é técnica', () => {
    const vistas = new Set<string>()
    for (const m of MOTIVOS) {
      const f = fraseDoMotivo(m)
      expect(f.length, `"${m}" sem frase`).toBeGreaterThan(20)
      expect(f, `"${m}" devolve o identificador cru`).not.toContain('_')
      vistas.add(f)
    }
    expect(vistas.size, 'dois motivos diferentes com a mesma frase escondem um deles').toBe(MOTIVOS.length)
  })

  it('o motivo com etapa pendente OFERECE a etapa, não um beco', () => {
    // A lição de 27/09 noutro lugar: "tente de novo" sobre configuração ausente manda repetir o impossível.
    expect(temCaminho('sem_perfil_profissional')).toBe(true)
    expect(fraseDoMotivo('sem_perfil_profissional')).toMatch(/perfil profissional/i)
    expect(fraseDoMotivo('sem_perfil_profissional'), 'precisa dizer que o convite não se perde').toMatch(/guardad/i)
  })

  it('convite vencido explica o que resolve, mesmo não sendo ação dela', () => {
    expect(fraseDoMotivo('convite_expirado')).toMatch(/peça/i)
    expect(temCaminho('convite_expirado'), 'não há botão que ressuscite um convite vencido').toBe(false)
  })

  it('erro desconhecido cai numa frase honesta, nunca no texto técnico', () => {
    expect(motivoDoAceite('erro estranho do postgres 42P01')).toBe('desconhecido')
    expect(motivoDoAceite(null)).toBe('desconhecido')
    expect(motivoDoAceite(undefined)).toBe('desconhecido')
    expect(fraseDoMotivo('desconhecido')).not.toMatch(/postgres|42P01|erro estranho/i)
  })

  it('traduz as mensagens EXATAS que a migração 165 levanta', () => {
    // O acoplamento com os nomes das exceções é deliberado e está documentado dos dois lados. Se alguém
    // renomear uma exceção no banco sem mexer aqui, este teste continua verde e a frase vira a genérica —
    // por isso os nomes estão escritos por extenso, para o `grep` encontrar os dois lugares.
    expect(motivoDoAceite('sem_perfil_profissional')).toBe('sem_perfil_profissional')
    expect(motivoDoAceite('convite_expirado')).toBe('convite_expirado')
    expect(motivoDoAceite('convite_ja_respondido')).toBe('convite_ja_respondido')
    expect(motivoDoAceite('nao_pode_aceitar_o_proprio_convite')).toBe('nao_pode_aceitar_o_proprio_convite')
    expect(motivoDoAceite('direcao_invalida')).toBe('direcao_invalida')
    expect(motivoDoAceite('convite_nao_encontrado')).toBe('convite_nao_encontrado')
    expect(motivoDoAceite('nao_autenticado')).toBe('nao_autenticado')
  })

  it('a mensagem crua vem embrulhada pelo PostgREST e ainda assim é reconhecida', () => {
    expect(motivoDoAceite('P0001: sem_perfil_profissional')).toBe('sem_perfil_profissional')
    expect(motivoDoAceite('erro ao chamar: CONVITE_EXPIRADO')).toBe('convite_expirado')
  })
})

describe('CARE-003 · o convite antes de responder', () => {
  it('só convite enviado e no prazo pode ser respondido', () => {
    expect(podeResponderConviteRecebido(convite(), AGORA)).toBe(true)
    expect(podeResponderConviteRecebido(convite({ expiraEm: dia(-1) }), AGORA)).toBe(false)
    expect(podeResponderConviteRecebido(convite({ status: 'aceito' }), AGORA)).toBe(false)
    expect(podeResponderConviteRecebido(convite({ status: 'cancelado' }), AGORA)).toBe(false)
  })

  it('o instante do vencimento já está fora', () => {
    expect(podeResponderConviteRecebido(convite({ expiraEm: AGORA }), AGORA)).toBe(false)
  })

  it('CATRACA — quem convidou aparece só pelo primeiro nome', () => {
    // O token viaja em URL, e URL vaza: histórico, print, mensagem encaminhada. Nome completo aqui
    // identificaria a pessoa para quem quer que tenha recebido o endereço.
    expect(quemConvidou({ primeiroNome: 'Carina' })).toBe('Carina')
    expect(quemConvidou({ primeiroNome: null })).toBe('Alguém')
    expect(quemConvidou({ primeiroNome: '  ' })).toBe('Alguém')
  })

  it('cada estado do convite recebido tem rótulo próprio, e nenhum promete o que não há', () => {
    expect(rotuloDoConviteRecebido(convite(), AGORA)).toBe('Carina convidou você')
    expect(rotuloDoConviteRecebido(convite({ status: 'aceito' }), AGORA)).toMatch(/já aceitou/i)
    expect(rotuloDoConviteRecebido(convite({ status: 'recusado' }), AGORA)).toMatch(/recusou/i)
    expect(rotuloDoConviteRecebido(convite({ status: 'cancelado' }), AGORA)).toMatch(/cancelou/i)
    expect(rotuloDoConviteRecebido(convite({ expiraEm: dia(-1) }), AGORA)).toMatch(/venceu/i)
  })

  it('sem nome, o rótulo ainda é uma frase — não começa com espaço', () => {
    expect(rotuloDoConviteRecebido(convite({ primeiroNome: null }), AGORA)).toBe('Alguém convidou você')
  })
})
