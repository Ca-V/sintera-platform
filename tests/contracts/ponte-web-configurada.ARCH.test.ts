// ARCH · A PONTE PRECISA DE ENDEREÇO — e a falta dele não pode ser silenciosa.
//
// O QUE ACONTECEU (27/08). A homologação reportou duas vezes: "não puxa os dados da receita, e também não
// apareceu nenhuma mensagem". E Conexões não carregava. Procurei no lugar errado — corrigi a autenticação, que
// estava mesmo quebrada, e o defeito continuou.
//
// A causa era outra e mais banal: `EXPO_PUBLIC_WEB_URL` não estava definida em lugar nenhum. Não no `eas.json`,
// não em `.env.example`, em nada versionado. Toda build saía com a variável `undefined`.
//
// Oito módulos do cliente dependem dela (ADR-020 — a ponte que reusa rotas da Web em vez de duplicar a regra no
// aplicativo): classificação de documento, Conexões, análise de exame, ômicas, conta, visão, auth. Todos tratam
// a ausência devolvendo `null` — decisão certa (leitura assistida é auxílio, não requisito; quebrar a tela seria
// pior). Mas somadas, "endereço ausente" e "falha silenciosa" produzem um aplicativo em que vários recursos
// simplesmente não fazem nada, sem uma linha de erro em lugar nenhum.
//
// Silêncio é bom para o usuário e péssimo para quem procura o defeito. A guarda fecha essa combinação: a
// configuração passa a ser verificável antes de virar APK.
import { describe, it, expect } from 'vitest'
import { readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'

const ROOT = process.cwd()
const EAS = join(ROOT, 'apps/mobile/eas.json')
const EXEMPLO = join(ROOT, 'apps/mobile/.env.example')

/** Variáveis sem as quais o aplicativo perde recurso em silêncio. */
const OBRIGATORIAS = ['EXPO_PUBLIC_WEB_URL'] as const

describe('ARCH · a ponte para a Web tem endereço em toda build', () => {
  const eas = JSON.parse(readFileSync(EAS, 'utf8')) as {
    build: Record<string, { env?: Record<string, string> }>
  }
  const perfis = Object.keys(eas.build)

  it('todo perfil de build declara as variáveis obrigatórias', () => {
    const faltando: string[] = []
    for (const perfil of perfis) {
      for (const chave of OBRIGATORIAS) {
        if (!eas.build[perfil].env?.[chave]) faltando.push(`${perfil} → ${chave}`)
      }
    }
    expect(
      faltando,
      '\nPerfil de build sem variável obrigatória:\n  ' + faltando.join('\n  ') +
        '\n\nSem ela o aplicativo perde, EM SILÊNCIO, tudo que passa pela ponte ADR-020: leitura assistida,\n' +
        'Conexões, análise de exame, ômicas e exportação de conta. Nenhuma delas dá erro — todas devolvem null.\n' +
        'Declare em apps/mobile/eas.json (é URL pública, não segredo — e versionada é auditável).\n',
    ).toEqual([])
  })

  it('o endereço é absoluto e https — a ponte sai do aparelho pela rede', () => {
    for (const perfil of perfis) {
      const url = eas.build[perfil].env?.EXPO_PUBLIC_WEB_URL
      if (!url) continue
      expect(url, `${perfil}: endereço precisa começar com https://`).toMatch(/^https:\/\/[^\s/]+/)
      expect(url.endsWith('/'), `${perfil}: sem barra no fim (o cliente já a acrescenta)`).toBe(false)
    }
  })

  it('o .env.example documenta as obrigatórias — quem clona o repo precisa saber que existem', () => {
    expect(existsSync(EXEMPLO)).toBe(true)
    const corpo = readFileSync(EXEMPLO, 'utf8')
    for (const chave of OBRIGATORIAS) {
      expect(corpo.includes(chave), `${chave} ausente de .env.example`).toBe(true)
    }
  })
})
