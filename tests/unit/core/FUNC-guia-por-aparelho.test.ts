// CATRACA — o caminho que se mostra tem de existir NO APARELHO de quem lê.
//
// O caminho do Strava no Android custou uma rodada de homologação: ele chama o Health Connect de "Conexão
// Saúde" e o esconde em "Outros serviços". Só descobrimos porque a fundadora procurou no aparelho dela.
//
// Ao acrescentar o iPhone, a tentação é escrever os equivalentes de cabeça. Seria repetir o mesmo erro numa
// escala maior — mandar metade das pessoas procurar um menu que talvez não esteja onde eu disse. Enquanto o
// caminho não for CONFERIDO num iPhone real, a orientação é a frase genérica, que é vaga e verdadeira.
import { describe, it, expect } from 'vitest'
import {
  HEALTH_CONNECT_FONTES, caminhoDaFonte, CAMINHO_IOS_GENERICO, CONEXOES_ONDE_FUNCIONA,
} from '@sintera/core'

const strava = HEALTH_CONNECT_FONTES.find(f => f.source === 'strava')!

describe('o caminho depende do aparelho', () => {
  it('no Android, mostra o caminho conferido', () => {
    expect(caminhoDaFonte(strava, 'android')).toContain('Conexão Saúde')
  })

  it('no iPhone, NÃO mostra o caminho do Android — o menu não existe lá', () => {
    expect(caminhoDaFonte(strava, 'ios')).not.toContain('Conexão Saúde')
  })

  it('sem caminho conferido no iPhone, cai na frase genérica — vaga e VERDADEIRA', () => {
    expect(caminhoDaFonte(strava, 'ios')).toBe(CAMINHO_IOS_GENERICO)
    expect(CAMINHO_IOS_GENERICO).toContain('Apple Saúde')
  })

  it('a frase genérica descreve o que PROCURAR, sem afirmar onde está', () => {
    // "procure" é honesto; um caminho exato inventado não é. A diferença importa quando a pessoa não acha.
    expect(CAMINHO_IOS_GENERICO.toLowerCase()).toContain('procure')
  })

  it('toda fonte tem caminho nos dois aparelhos — nenhuma fica sem orientação', () => {
    for (const f of HEALTH_CONNECT_FONTES) {
      for (const p of ['android', 'ios'] as const) {
        expect(caminhoDaFonte(f, p).length, `${f.nome} em ${p}`).toBeGreaterThan(10)
      }
    }
  })

  it('quando um caminho de iPhone for conferido, ele passa a ter precedência', () => {
    const conferida = { ...strava, caminhoIos: 'Strava → Você → Configurações → Saúde' }
    expect(caminhoDaFonte(conferida, 'ios')).toBe('Strava → Você → Configurações → Saúde')
    // E não contamina o Android.
    expect(caminhoDaFonte(conferida, 'android')).toBe(strava.caminho)
  })
})

describe('o que a Web conta sobre onde funciona', () => {
  it('não trata a entrada automática como exclusiva do Android — os dois cofres existem', () => {
    expect(CONEXOES_ONDE_FUNCIONA.comoFunciona).toContain('Health Connect')
    expect(CONEXOES_ONDE_FUNCIONA.comoFunciona).toContain('Apple Saúde')
  })

  it('DIZ o que a Apple não deixa saber — calar faria a pessoa culpar a plataforma', () => {
    // Por privacidade o iOS não informa o que foi recusado. Um tipo negado parece um tipo vazio.
    expect(CONEXOES_ONDE_FUNCIONA.iphone).toContain('não informa')
    expect(CONEXOES_ONDE_FUNCIONA.iphone).toContain('Ajustes')
  })
})
