// A CLASSIFICAÇÃO DE PARIDADE, num lugar só.
//
// ============================================================================================
// POR QUE ISTO VIROU MÓDULO EM 30/09/2026
// ============================================================================================
// A regra morava dentro de `scripts/audit-paridade.mjs`. Ao escrever a catraca que exige motivo para cada
// órfão, eu a reimplementei — e a minha versão discordava da original em ~60 símbolos, porque esquecia três
// detalhes que o script já tinha resolvido: tirar comentários, ignorar as linhas `export *`, e contar uso
// DENTRO do próprio arquivo.
//
// Ou seja: eu ia criar um segundo medidor do mesmo fato, que é exatamente o defeito que passei o dia
// corrigindo noutros lugares. Duas medições do mesmo número divergem, e aí ninguém sabe qual acreditar.
//
// Agora o script e a catraca chamam esta função. Se a regra mudar, muda uma vez.
import fs from 'node:fs'
import path from 'node:path'

function walkAll(dir, out = []) {
  if (!fs.existsSync(dir)) return out
  for (const n of fs.readdirSync(dir)) {
    if (n === 'node_modules' || n === '.next' || n.startsWith('.')) continue
    const p = path.join(dir, n)
    if (fs.statSync(p).isDirectory()) walkAll(p, out)
    else if (/\.(ts|tsx)$/.test(n)) out.push(p)
  }
  return out
}

const semTestes = (fs2) => fs2.filter(f => !/\.test\.tsx?$/.test(f))
const corpo = (f) => fs.readFileSync(f, 'utf8')

/** Menção em JSDoc não é uso. Contá-la classificaria como "interno" algo que ninguém chama. */
const semComentarios = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')

const usos = (nome, body) => {
  const re = new RegExp('\\b' + nome.replace(/\$/g, '\\$') + '\\b', 'g')
  return (body.match(re) || []).length
}

/**
 * Classifica todo símbolo público dos pacotes compartilhados.
 *
 * As duas checagens que evitam falso positivo, e sem as quais a auditoria perde a credibilidade que a faz
 * valer alguma coisa:
 *  · usado por OUTRO arquivo do pacote (fora as linhas `export *`, que só reexportam) = helper interno;
 *  · usado mais de uma vez NO PRÓPRIO arquivo = a primeira ocorrência é a declaração, o resto é uso real.
 */
export function classificar(raiz) {
  const R = raiz
  const rel = (f) => path.relative(R, f).split(path.sep).join('/')

  const pacotes = semTestes([
    ...walkAll(path.join(R, 'packages/core/src')),
    ...walkAll(path.join(R, 'packages/api-client/src')),
  ])
  const web = semTestes(walkAll(path.join(R, 'src')))
  const mobile = semTestes(walkAll(path.join(R, 'apps/mobile/src')))
  const testes = walkAll(path.join(R, 'tests'))

  const bodyWeb = web.map(corpo).join('\n')
  const bodyMob = mobile.map(corpo).join('\n')
  const bodyTest = testes.map(corpo).join('\n')

  const EXPORT_RE = /^export\s+(?:async\s+)?(?:function|const|class)\s+([A-Za-z_$][\w$]*)/gm
  const simbolos = new Map()
  for (const f of pacotes) {
    const s = corpo(f)
    let m
    while ((m = EXPORT_RE.exec(s))) if (!simbolos.has(m[1])) simbolos.set(m[1], rel(f))
  }

  const corpoPacoteSem = new Map()
  for (const f of pacotes) corpoPacoteSem.set(rel(f), pacotes.filter(x => x !== f).map(corpo).join('\n'))

  const corpoDoArquivo = new Map()
  for (const f of pacotes) corpoDoArquivo.set(rel(f), semComentarios(corpo(f)))

  const orfaos = [], internos = [], soWeb = [], soMobile = []
  let nosDois = 0

  for (const [nome, arq] of simbolos) {
    const w = usos(nome, bodyWeb), mo = usos(nome, bodyMob)
    if (w === 0 && mo === 0) {
      const dentro = usos(nome, semComentarios(corpoPacoteSem.get(arq) || '').replace(/^export \* from .*$/gm, ''))
      const noProprio = usos(nome, corpoDoArquivo.get(arq) || '')
      if (dentro > 0 || noProprio > 1) internos.push({ nome, arq })
      else orfaos.push({ nome, arq, emTeste: usos(nome, bodyTest) > 0 })
    } else if (w > 0 && mo === 0) soWeb.push({ nome, arq })
    else if (mo > 0 && w === 0) soMobile.push({ nome, arq })
    else nosDois++
  }

  return { total: simbolos.size, nosDois, soWeb, soMobile, internos, orfaos }
}
