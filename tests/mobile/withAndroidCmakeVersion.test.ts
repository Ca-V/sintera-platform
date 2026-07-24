// Teste de regressão do Config Plugin que fixa o CMake do Android SDK (MOBILE-010).
//
// POR QUE ESTE TESTE EXISTE:
// A persistência da correção do bloqueio de build no Windows (CMake 4.1.2 / Ninja 1.12.1) depende
// INTEIRAMENTE deste plugin reaplicar a configuração a cada `expo prebuild`. Se um upgrade futuro do
// Expo/RN alterar a forma do `app/build.gradle` de modo que a âncora `android {` deixe de casar, o
// plugin silenciosamente pararia de aplicar a modificação e o defeito de MAX_PATH voltaria no Windows.
// Este teste falha imediatamente nesse cenário — protegendo exatamente o mecanismo que resolveu o problema.
//
// É a versão barata/rápida do "prebuild --clean + grep version" recomendado: testa a transformação PURA
// do plugin sem precisar do toolchain nativo no CI. Ver docs/MOBILE-010 §3.2.
import { describe, it, expect } from 'vitest'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
// eslint-disable-next-line @typescript-eslint/no-var-requires
const plugin = require('../../apps/mobile/plugins/withAndroidCmakeVersion.js') as {
  injectCmakeVersion: (contents: string) => string
  CMAKE_VERSION: string
}
const { injectCmakeVersion, CMAKE_VERSION } = plugin

// Trecho representativo do app/build.gradle gerado pelo Expo prebuild (bloco `android {` no início da linha).
const SAMPLE_BUILD_GRADLE = `apply plugin: "com.android.application"

react {
    autolinkLibrariesWithApp()
}

android {
    ndkVersion rootProject.ext.ndkVersion
    compileSdk rootProject.ext.compileSdkVersion
    namespace 'health.sintera.app'
}
`

describe('withAndroidCmakeVersion (MOBILE-010 — persistência da baseline de toolchain)', () => {
  it('fixa uma versão de CMake (baseline mínima suportada)', () => {
    // A baseline validada é 4.1.2; se alguém reduzir a constante sem revalidar, isto sinaliza.
    expect(CMAKE_VERSION).toBe('4.1.2')
  })

  it('injeta externalNativeBuild.cmake.version no bloco android {}', () => {
    const out = injectCmakeVersion(SAMPLE_BUILD_GRADLE)
    expect(out).toContain('externalNativeBuild')
    expect(out).toContain(`version "${CMAKE_VERSION}"`)
    // A injeção ocorre DENTRO do bloco android { } (após a abertura).
    const androidIdx = out.indexOf('android {')
    const versionIdx = out.indexOf(`version "${CMAKE_VERSION}"`)
    expect(androidIdx).toBeGreaterThanOrEqual(0)
    expect(versionIdx).toBeGreaterThan(androidIdx)
  })

  it('é idempotente (rodar duas vezes não duplica a injeção)', () => {
    const once = injectCmakeVersion(SAMPLE_BUILD_GRADLE)
    const twice = injectCmakeVersion(once)
    expect(twice).toBe(once)
    const occurrences = twice.split(`version "${CMAKE_VERSION}"`).length - 1
    expect(occurrences).toBe(1)
  })

  it('LANÇA se a âncora `android {` mudar de forma (protege contra mudança de template do Expo/RN)', () => {
    const semAncora = SAMPLE_BUILD_GRADLE.replace('android {', 'androidConfig.apply {')
    expect(() => injectCmakeVersion(semAncora)).toThrow(/android \{/)
  })
})
