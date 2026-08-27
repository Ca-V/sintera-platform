// Teste de regressão do Config Plugin que mantém o app instalável em aparelhos antigos.
//
// POR QUE ESTE TESTE EXISTE: se esta sobreposição parar de ser aplicada, o build FALHA — o Gradle recusa
// compilar com `minSdk 24` uma biblioteca que declara 26. Isso é bom (falha alto), mas o conserto tentador é
// subir o `minSdkVersion` do app, e aí a SINTERA some de todo aparelho com Android 7 sem que ninguém decida
// isso conscientemente. O teste existe para que a quebra seja NOMEADA e a decisão, deliberada.
//
// Essas pessoas nunca teriam o Health Connect de qualquer forma — ele exige Android 9. Perderiam o app inteiro
// por um recurso que jamais usariam. É o princípio de disponibilidade universal (27/08).
import { describe, it, expect } from 'vitest'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
// eslint-disable-next-line @typescript-eslint/no-var-requires
const plugin = require('../../apps/mobile/plugins/withMinSdkOverride.js') as {
  sobreporMinSdk: (m: unknown, libs?: string[]) => Record<string, never>
  BIBLIOTECAS: string[]
  NS_TOOLS: string
}
const { sobreporMinSdk, BIBLIOTECAS, NS_TOOLS } = plugin

/* eslint-disable @typescript-eslint/no-explicit-any */
const manifestoExpo = (): any => ({
  manifest: {
    $: { 'xmlns:android': 'http://schemas.android.com/apk/res/android' },
    application: [{ $: { 'android:name': '.MainApplication' } }],
  },
})

const usesSdk = (m: any) => m.manifest['uses-sdk'][0].$

describe('sobreposição de minSdk — o app instala em aparelho antigo', () => {
  it('declara as bibliotecas que serão sobrepostas', () => {
    const m = sobreporMinSdk(manifestoExpo()) as any
    const lista = usesSdk(m)['tools:overrideLibrary'].split(',')
    expect(lista).toEqual(BIBLIOTECAS)
  })

  it('inclui a biblioteca AndroidX, não só o wrapper', () => {
    // É a `androidx.health.connect.client` que declara minSdk 26. Sobrepor só o wrapper não resolveria,
    // e o erro do Gradle apontaria a outra — depois de um build inteiro perdido.
    const m = sobreporMinSdk(manifestoExpo()) as any
    expect(usesSdk(m)['tools:overrideLibrary']).toContain('androidx.health.connect.client')
  })

  it('declara o namespace `tools` na raiz — sem ele o atributo é ignorado em SILÊNCIO', () => {
    const m = sobreporMinSdk(manifestoExpo()) as any
    expect(m.manifest.$['xmlns:tools']).toBe(NS_TOOLS)
  })

  it('preserva o que já estava no manifesto', () => {
    const m = sobreporMinSdk(manifestoExpo()) as any
    expect(m.manifest.$['xmlns:android']).toBe('http://schemas.android.com/apk/res/android')
    expect(m.manifest.application[0].$['android:name']).toBe('.MainApplication')
  })

  it('é IDEMPOTENTE — o prebuild roda a cada build', () => {
    const uma = sobreporMinSdk(manifestoExpo()) as any
    const duas = sobreporMinSdk(sobreporMinSdk(manifestoExpo())) as any
    expect(duas.manifest['uses-sdk'].length).toBe(uma.manifest['uses-sdk'].length)
    expect(usesSdk(duas)['tools:overrideLibrary']).toBe(usesSdk(uma)['tools:overrideLibrary'])
  })

  it('respeita um `uses-sdk` que já exista, em vez de substituí-lo', () => {
    const m: any = manifestoExpo()
    m.manifest['uses-sdk'] = [{ $: { 'android:targetSdkVersion': '36' } }]
    const r = sobreporMinSdk(m) as any
    expect(usesSdk(r)['android:targetSdkVersion']).toBe('36')
    expect(usesSdk(r)['tools:overrideLibrary']).toBeTruthy()
  })

  it('FALHA ALTO se o template do Expo mudar de forma', () => {
    expect(() => sobreporMinSdk({})).toThrow(/manifest/i)
  })
})
