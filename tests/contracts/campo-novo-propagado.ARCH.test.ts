// CATRACA — O CAMPO NOVO PRECISA CHEGAR EM TODOS OS CONSUMIDORES.
//
// ─────────────────────────────────────────────────────────────────────────────────────────────────────────
// POR QUE ESTE ARQUIVO EXISTE (pedido da fundadora, 31/08).
//
// Depois de mais uma rodada de homologação com vários defeitos, ela disse: "é preciso estabelecer um padrão
// para que essas implementações sejam executadas de forma correta, sem gerar tantos erros."
//
// Classifiquei o que ela encontrou nesta semana. DUAS causas explicam quase tudo:
//
//   1. ESCRITO E NUNCA LIGADO — a função existe e nada a chama.
//      (o "Editar" em três telas · `destinoDoAchado` · o detector de duplicata · o scroll do formulário)
//
//   2. CAMPO NOVO NÃO PROPAGADO — o campo é criado e um consumidor fica para trás.
//      (`atualizadas` no diagnóstico · o rótulo das fontes · as colunas da busca · bpm e calorias no salvar)
//
// A causa 1 hoje é pega pelo linter (símbolo declarado e não referenciado) e pela auditoria de paridade.
// A causa 2 NÃO ERA PEGA POR NADA — e é o que este arquivo passa a pegar.
//
// A LIÇÃO GERAL: os testes de unidade verificam PEÇAS, e todos passavam. Os defeitos moram nas COSTURAS —
// entre a função e a tela, entre duas telas, entre o dado e o rótulo. Catraca de costura é o que faltava.
// ─────────────────────────────────────────────────────────────────────────────────────────────────────────
import { describe, it, expect } from 'vitest'
import {
  APPS, HEALTH_CONNECT_CHANNEL, BODY_SOURCE_LABEL, bodySourceLabel,
  ACTIVITY_TYPES, activityTypeLabel,
  HC_RECORD_TYPES, nomeTipoHc,
  HK_TYPES,
  DOCUMENT_SUBTYPES, documentSubtypeLabel,
} from '@sintera/core'

describe('toda FONTE que a plataforma produz tem nome na tela', () => {
  // O DEFEITO (31/08): uma atividade do Strava aparecia em Monitoramento como "Outra origem", enquanto Dados
  // recebidos mostrava "strava". O mapa de rótulos só conhecia balança, DEXA e registro manual.
  //
  // Não é cosmético: contradiz o requisito que a fundadora pôs como CONDIÇÃO da integração — "os dados
  // precisam ser uma importação cem por cento fiel à fonte para serem cem por cento confiáveis". Um dado cuja
  // origem a tela apaga deixa de ser confiável, mesmo estando correto.
  it('cada aplicativo que o Health Connect pode identificar tem rótulo próprio', () => {
    const semRotulo = APPS.map(a => a.source).filter(s => !BODY_SOURCE_LABEL[s])
    expect(
      semRotulo,
      '\nEstas fontes aparecem na tela como "Outra origem", apagando a procedência.\n' +
      'Acrescente o rótulo em BODY_SOURCE_LABEL — a origem é requisito, não enfeite.\n',
    ).toEqual([])
  })

  it('o próprio canal tem rótulo — quando o app de origem é desconhecido, a origem ainda é dizível', () => {
    expect(BODY_SOURCE_LABEL[HEALTH_CONNECT_CHANNEL]).toBeTruthy()
  })

  it('fonte DESCONHECIDA continua degradando, e não quebra', () => {
    // O Modelo Aberto vale: um app novo escrevendo no cofre não pode derrubar a tela.
    expect(bodySourceLabel('app_que_ninguem_mapeou')).toBe('Outra origem')
    expect(bodySourceLabel(null)).toBeNull()
  })
})

describe('todo TIPO que a plataforma guarda tem nome na tela', () => {
  it('atividade física', () => {
    for (const t of ACTIVITY_TYPES) {
      expect(activityTypeLabel(t.value), t.value).toBe(t.label)
    }
  })

  it('subtipo de documento', () => {
    for (const s of DOCUMENT_SUBTYPES) {
      expect(documentSubtypeLabel(s.value), s.value).toBe(s.label)
    }
  })

  it('todo tipo lido do Health Connect é dizível em português', () => {
    // Sem isto, o relatório de sincronização mostraria "OxygenSaturation" à pessoa — nome de campo de banco
    // vazando para a tela, que é o mesmo defeito que já fez "composicao · habito · recurso" aparecer cru.
    for (const t of HC_RECORD_TYPES) {
      const nome = nomeTipoHc(t)
      expect(nome, t).not.toBe(t)
      expect(nome, t).toMatch(/^[a-zà-ú]/)
    }
  })
})

describe('as duas pontas leem os MESMOS tipos dos cofres', () => {
  // Health Connect e Apple Saúde precisam trazer o mesmo conjunto — senão a pessoa que troca de Android para
  // iPhone perde categorias sem que nada avise, e a plataforma passa a valer menos num aparelho que no outro.
  const EQUIVALENTES: Record<string, string> = {
    HeartRate: 'HKQuantityTypeIdentifierHeartRate',
    OxygenSaturation: 'HKQuantityTypeIdentifierOxygenSaturation',
    BodyTemperature: 'HKQuantityTypeIdentifierBodyTemperature',
    Weight: 'HKQuantityTypeIdentifierBodyMass',
    Height: 'HKQuantityTypeIdentifierHeight',
    Steps: 'HKQuantityTypeIdentifierStepCount',
    BloodGlucose: 'HKQuantityTypeIdentifierBloodGlucose',
    Distance: 'HKQuantityTypeIdentifierDistanceWalkingRunning',
    ActiveCaloriesBurned: 'HKQuantityTypeIdentifierActiveEnergyBurned',
    ExerciseSession: 'HKWorkoutTypeIdentifier',
  }

  it('cada tipo do Android tem o correspondente no iPhone', () => {
    const semPar: string[] = []
    for (const [android, apple] of Object.entries(EQUIVALENTES)) {
      if (!(HC_RECORD_TYPES as readonly string[]).includes(android)) continue
      if (!(HK_TYPES as readonly string[]).includes(apple)) semPar.push(`${android} → ${apple}`)
    }
    expect(
      semPar,
      '\nEste tipo é lido no Android e não no iPhone. Quem trocar de aparelho perde a categoria em silêncio.\n',
    ).toEqual([])
  })

  it('a pressão arterial existe nos dois, ainda que modelada de formas diferentes', () => {
    // No Health Connect é UM registro; no HealthKit são DOIS tipos que precisam ser reparelhados. A diferença
    // de modelo é tratada no normalizador — o que não pode é a capacidade existir só de um lado.
    expect((HC_RECORD_TYPES as readonly string[])).toContain('BloodPressure')
    expect((HK_TYPES as readonly string[])).toContain('HKQuantityTypeIdentifierBloodPressureSystolic')
    expect((HK_TYPES as readonly string[])).toContain('HKQuantityTypeIdentifierBloodPressureDiastolic')
  })
})
