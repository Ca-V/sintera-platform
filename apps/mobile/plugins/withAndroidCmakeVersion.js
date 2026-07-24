// Config plugin (CNG) — fixa a versão do CMake do Android SDK usada pelo build nativo.
//
// POR QUE ISTO EXISTE (MOBILE-010):
// O default do Android Gradle Plugin é CMake 3.22.1, que empacota **ninja 1.10.2** — versão com o defeito
// de MAX_PATH no Windows que quebra o codegen C++ da New Architecture com
// "ninja: error: Stat(...): Filename longer than 260 characters".
// CMake 4.1.2 empacota **ninja 1.12.1**, sem o defeito. Validado experimentalmente em 2026-07-23.
//
// POR QUE UM CONFIG PLUGIN (e não editar android/app/build.gradle direto):
// `apps/mobile/android/` é GERADO por `expo prebuild` e está no .gitignore (projeto CNG). Uma edição
// manual ali não é versionada e seria destruída no próximo prebuild — outro desenvolvedor não receberia
// a correção e o defeito voltaria. Este plugin é versionado e reaplica a configuração a cada prebuild.
//
// NÃO reduzir a versão sem revalidar o build no Windows. Ver docs/MOBILE-010.
const { withAppBuildGradle } = require('@expo/config-plugins')

/** Versão do CMake do Android SDK validada como baseline do projeto (ver docs/MOBILE-010). */
const CMAKE_VERSION = '4.1.2'

const BLOCK = `    // MOBILE-010: CMake do Android SDK que empacota ninja 1.12.1 (o default 3.22.1 traz o
    // ninja 1.10.2, com o defeito de MAX_PATH no Windows). Injetado por plugins/withAndroidCmakeVersion.js.
    externalNativeBuild {
        cmake {
            version "${CMAKE_VERSION}"
        }
    }
`

/**
 * Transformação PURA: recebe o conteúdo de um `app/build.gradle` (Groovy) e devolve o conteúdo com
 * `externalNativeBuild { cmake { version } }` injetado no bloco `android { }`.
 * Idempotente. Lança se a âncora `android {` não existir (protege contra mudança de forma do template).
 * Exportada separadamente para permitir teste de regressão sem rodar `expo prebuild` (ver tests/mobile).
 */
function injectCmakeVersion(contents) {
  // Idempotência: se já houver a versão correta fixada, não faz nada.
  if (contents.includes(`version "${CMAKE_VERSION}"`)) return contents

  // Âncora: o bloco `android {` de nível superior (início de linha).
  const anchor = /^android\s*\{[ \t]*$/m
  if (!anchor.test(contents)) {
    throw new Error('withAndroidCmakeVersion: bloco `android {` não encontrado em app/build.gradle.')
  }

  return contents.replace(anchor, (match) => `${match}\n${BLOCK}`)
}

/** Injeta `externalNativeBuild { cmake { version } }` no bloco `android { }` do app/build.gradle. */
const withAndroidCmakeVersion = (config) =>
  withAppBuildGradle(config, (cfg) => {
    if (cfg.modResults.language !== 'groovy') {
      throw new Error('withAndroidCmakeVersion: esperado app/build.gradle em Groovy.')
    }
    cfg.modResults.contents = injectCmakeVersion(cfg.modResults.contents)
    return cfg
  })

module.exports = withAndroidCmakeVersion
module.exports.injectCmakeVersion = injectCmakeVersion
module.exports.CMAKE_VERSION = CMAKE_VERSION
