// CATRACA — a política de formatos de anexo tem UM dono.
//
// O QUE ESTA CATRACA IMPEDE (achado em 30/08, auditando as capacidades órfãs). `supportedNowAcceptAttr()`
// existia no núcleo, com a lista certa, e **nenhuma tela a chamava**. Cada `<input type="file">` declarava a
// sua própria lista, e as oito divergiam entre si.
//
// A pior delas: `image/*`, em quatro pontos. Deixa passar **HEIC**, que é o formato padrão da câmera do
// iPhone e que a plataforma declara como *capacidade ainda não habilitada* — falta a conversão no pipeline.
// O arquivo entrava, a leitura falhava depois, e ninguém entendia por quê.
//
// Recusar na porta é melhor por dois motivos: a pessoa descobre na hora que aquele arquivo não serve, e o
// iOS converte a foto HEIC para JPEG sozinho quando o `accept` não a inclui — ou seja, restringir a lista faz
// MAIS coisas funcionarem, não menos.
//
// É o princípio de ENTRADA DOCUMENTAL ÚNICA em forma executável: um componente, nenhuma tela reimplementa.
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { globSync } from 'glob'

const ARQUIVOS = globSync('{src,apps/mobile/src}/**/*.tsx', { ignore: ['**/node_modules/**'] })

/** `accept` escrito à mão, em vez de vir da política. */
const ACCEPT_LITERAL = /accept=(["'])(.*?)\1/g

describe('política de formatos de anexo — um dono só', () => {
  it('NENHUM input declara a sua própria lista de formatos', () => {
    const infratores: string[] = []
    for (const f of ARQUIVOS) {
      const corpo = readFileSync(f, 'utf8')
      for (const m of corpo.matchAll(ACCEPT_LITERAL)) {
        // `capture` e outros atributos não são lista de formato; só interessa o que parece MIME ou extensão.
        const valor = m[2]
        if (!/[./]/.test(valor)) continue
        infratores.push(`${f.replace(/\\/g, '/')} → accept="${valor}"`)
      }
    }
    expect(
      infratores,
      '\nEste input escreve a própria lista de formatos. A política tem um dono: use\n' +
      '`supportedNowAcceptAttr()` — ou `acceptAttrWith([...])` quando o domínio tiver formatos próprios,\n' +
      'declarados como constante no núcleo (ver OMICS_EXTRA_MIME_TYPES).\n\n' +
      'Listas escritas à mão divergem. Foi assim que `image/*` reapareceu em quatro pontos e passou a\n' +
      'aceitar HEIC — que a plataforma NÃO consegue ler. O arquivo entrava e falhava depois.\n',
    ).toEqual([])
  })

  it('a lista oferecida hoje NÃO inclui formato que a plataforma ainda não lê', async () => {
    const { supportedNowAcceptAttr, CAPABILITY_FORMATS, ATTACHMENT_FORMATS } = await import('@sintera/core')
    const oferecido = supportedNowAcceptAttr()
    for (const cap of CAPABILITY_FORMATS) {
      const mimes = ATTACHMENT_FORMATS.find(f => f.format === cap.format)?.mimes ?? []
      for (const mime of mimes) {
        expect(oferecido, `${mime} é capacidade não habilitada e não pode ser oferecida`).not.toContain(mime)
      }
    }
  })

  it('o acréscimo de um domínio NÃO reescreve a parte comum', async () => {
    const { acceptAttrWith, OMICS_EXTRA_MIME_TYPES, SUPPORTED_NOW_MIME_TYPES } = await import('@sintera/core')
    const omicas = acceptAttrWith(OMICS_EXTRA_MIME_TYPES)
    for (const base of SUPPORTED_NOW_MIME_TYPES) expect(omicas).toContain(base)
    expect(omicas).toContain('text/csv')
    // E não devolve o curinga por nenhum caminho.
    expect(omicas).not.toContain('image/*')
  })
})
