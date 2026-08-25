// AUDITORIA DE PARIDADE — mede as classes de divergência encontradas na homologação de 25/08.
//
// Executável e repetível de propósito: um relatório escrito à mão envelhece no dia seguinte. Rode com
//   node scripts/audit-paridade.mjs
//
// O que mede: quantos símbolos dos pacotes compartilhados são de fato consumidos pelas DUAS pontas,
// quantos só por uma, e quantos por NENHUMA. A última categoria é o padrão que dominou a homologação:
// capacidade escrita, testada, e nunca ligada a tela alguma.
//
// Distingue helper INTERNO do pacote de órfão de verdade — sem isso a medição acusa falso positivo.

// Auditoria de paridade — mede as classes de divergência encontradas na homologação de 25/08.
const fs = require('fs'), path = require('path')
const R = process.cwd()

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
const semTestes = fs => fs.filter(f => !/\.test\.tsx?$/.test(f))
const rel = f => path.relative(R, f).split(path.sep).join('/')
const corpo = f => fs.readFileSync(f, 'utf8')

const pacotes = semTestes([
  ...walkAll(path.join(R, 'packages/core/src')),
  ...walkAll(path.join(R, 'packages/api-client/src')),
])
const web    = semTestes(walkAll(path.join(R, 'src')))
const mobile = semTestes(walkAll(path.join(R, 'apps/mobile/src')))
const testes = walkAll(path.join(R, 'tests'))

const bodyWeb  = web.map(corpo).join('\n')
const bodyMob  = mobile.map(corpo).join('\n')
const bodyTest = testes.map(corpo).join('\n')

// Símbolos públicos dos pacotes compartilhados.
const EXPORT_RE = /^export\s+(?:async\s+)?(?:function|const|class)\s+([A-Za-z_$][\w$]*)/gm
const simbolos = new Map()
for (const f of pacotes) {
  const s = corpo(f)
  let m
  while ((m = EXPORT_RE.exec(s))) if (!simbolos.has(m[1])) simbolos.set(m[1], rel(f))
}

const usos = (nome, body) => {
  const re = new RegExp('\\b' + nome.replace(/\$/g, '\\$') + '\\b', 'g')
  return (body.match(re) || []).length
}

// Corpo dos pacotes SEM o arquivo que declara o símbolo — para separar "helper usado internamente" de
// "capacidade que ninguém consome". Sem esta distinção a auditoria acusa falso positivo e perde credibilidade.
const corpoPacoteSem = new Map()
for (const f of pacotes) corpoPacoteSem.set(rel(f), pacotes.filter(x => x !== f).map(corpo).join('\n'))

const orfaos = [], internos = [], soWeb = [], soMobile = []
let nosDois = 0
for (const [nome, arq] of simbolos) {
  const w = usos(nome, bodyWeb), mo = usos(nome, bodyMob)
  if (w === 0 && mo === 0) {
    // usado por OUTRO arquivo do pacote (fora o index, que só reexporta) = helper interno, não órfão
    const dentro = usos(nome, (corpoPacoteSem.get(arq) || '').replace(/^export \* from .*$/gm, ''))
    if (dentro > 0) internos.push({ nome, arq })
    else orfaos.push({ nome, arq, emTeste: usos(nome, bodyTest) > 0 })
  }
  else if (w > 0 && mo === 0) soWeb.push({ nome, arq })
  else if (mo > 0 && w === 0) soMobile.push({ nome, arq })
  else nosDois++
}

console.log('\n=== AUDITORIA · capacidades compartilhadas ===')
console.log('   simbolos publicos nos pacotes: ' + simbolos.size)
console.log('   usados nas DUAS pontas:        ' + nosDois)
console.log('   so na Web:                     ' + soWeb.length)
console.log('   so no Mobile:                  ' + soMobile.length)
console.log('   helpers INTERNOS do pacote:    ' + internos.length)
 console.log('   ORFAOS (zero consumidores):    ' + orfaos.length)
const soTeste = orfaos.filter(o => o.emTeste)
console.log('     dos quais so o TESTE usa:    ' + soTeste.length)

console.log('\n--- ORFAOS consumidos apenas pelo teste (o padrao do dia) ---')
for (const o of soTeste.slice(0, 35)) console.log('   ' + o.nome.padEnd(32) + o.arq)
if (soTeste.length > 35) console.log('   ... e mais ' + (soTeste.length - 35))

console.log('\n--- SO NA WEB: capacidade que o Mobile nao alcanca ---')
for (const o of soWeb.slice(0, 35)) console.log('   ' + o.nome.padEnd(32) + o.arq)
if (soWeb.length > 35) console.log('   ... e mais ' + (soWeb.length - 35))
