// Config plugin (CNG) — fixa a versão do CMake do Android SDK usada pelo build nativo.
//
// POLÍTICA POR PLATAFORMA (ver função no fim): no Windows INJETA o pin 4.1.2 (bug de MAX_PATH do ninja);
// em Linux/macOS (inclusive o builder do EAS) REMOVE qualquer pin — o EAS NÃO possui o 4.1.2 e o CMake padrão
// funciona; forçá-lo lá quebra o gradlew com "[CXX1300] CMake '4.1.2' was not found". A remoção é ATIVA para
// neutralizar um build.gradle vindo de cache do EAS com o pin (causa raiz do build 6b38f5d8). MOBILE-010 §3.3.
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

/**
 * Transformação PURA inversa: REMOVE o bloco `externalNativeBuild { cmake { version } }` (e o comentário
 * MOBILE-010, se presente) que este plugin injeta. Usada em plataformas != Windows para GARANTIR que um
 * `app/build.gradle` — inclusive um vindo do **cache do EAS** (gerado por um build anterior que aplicou o
 * pin) — NÃO force o CMake 4.1.2 no Linux, onde ele não existe ("[CXX1300] CMake '4.1.2' was not found").
 * Idempotente: no-op se o bloco não estiver presente.
 */
function removeCmakeVersion(contents) {
  return contents
    .replace(/[ \t]*\/\/ MOBILE-010:[^\n]*\n(?:[ \t]*\/\/[^\n]*\n)?/g, '')
    .replace(/[ \t]*externalNativeBuild\s*\{\s*cmake\s*\{\s*version\s+"[^"]*"\s*\}\s*\}[ \t]*\n?/g, '')
}

/**
 * Aplica a política de CMake POR PLATAFORMA no `app/build.gradle` — o mod roda SEMPRE (garante o estado
 * correto mesmo sobre um build.gradle vindo de cache):
 * - **Windows** (ou `SINTERA_FORCE_CMAKE_PIN=1`): **INJETA** o pin 4.1.2 (evita o bug de MAX_PATH do
 *   ninja 1.10.2 do CMake 3.22.1 padrão — MOBILE-010).
 * - **Linux/macOS (inclui o builder do EAS)**: **REMOVE** qualquer pin (o EAS não tem o 4.1.2; o CMake
 *   padrão 3.22.1 compila normal em Linux). Removemos ATIVAMENTE — em vez de só "não injetar" — para
 *   neutralizar um build.gradle que venha de cache do EAS com o pin (causa raiz do build 6b38f5d8).
 */
const withAndroidCmakeVersion = (config) =>
  withAppBuildGradle(config, (cfg) => {
    if (cfg.modResults.language !== 'groovy') {
      throw new Error('withAndroidCmakeVersion: esperado app/build.gradle em Groovy.')
    }
    const shouldPin = process.platform === 'win32' || process.env.SINTERA_FORCE_CMAKE_PIN === '1'
    cfg.modResults.contents = shouldPin
      ? injectCmakeVersion(cfg.modResults.contents)
      : removeCmakeVersion(cfg.modResults.contents)
    return cfg
  })

module.exports = withAndroidCmakeVersion
module.exports.injectCmakeVersion = injectCmakeVersion
module.exports.removeCmakeVersion = removeCmakeVersion
module.exports.CMAKE_VERSION = CMAKE_VERSION
