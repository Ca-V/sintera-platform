// Smoke test da conferência de nome — sem dependências.
// Rode: node src/lib/exams/__smoke__/nameMatch.mjs
// Mantenha em sincronia com nameMatch.ts.

const CONNECTIVES = new Set(['de','da','do','dos','das','e','di','del','la'])
function nameTokens(name) {
  return name.normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase()
    .replace(/[^a-z\s]/g,' ').split(/\s+/).filter(t => t.length>=2 && !CONNECTIVES.has(t))
}
function compareNames(profileName, examName) {
  if (!profileName || !examName) return 'unverified'
  const p = nameTokens(profileName), e = nameTokens(examName)
  if (p.length===0 || e.length===0) return 'unverified'
  const eSet = new Set(e)
  const overlap = p.filter(t => eSet.has(t)).length
  const needed = p.length>=2 ? 2 : 1
  return overlap>=needed ? 'match' : 'mismatch'
}

let fail=0
const check=(l,c)=>{ if(!c){fail++;console.log('FAIL  '+l)}else console.log('OK    '+l) }

// Caso real: perfil curto vs laudo completo (com acentos/conectivos)
check('Carina Leite ~ CARINA SOARES DE PAIVA LEITE', compareNames('Carina Leite','CARINA SOARES DE PAIVA LEITE')==='match')
// Pessoa diferente
check('Carina Leite x João da Silva', compareNames('Carina Leite','João da Silva')==='mismatch')
// Mesmo nome com acento
check('acentos normalizam', compareNames('José Antônio','JOSE ANTONIO SOUZA')==='match')
// Perfil 1 token presente
check('1 token presente', compareNames('Maria','Maria Santos')==='match')
// 1 token ausente
check('1 token ausente', compareNames('Ana','Beatriz Souza')==='mismatch')
// Faltando dado
check('sem nome do laudo -> unverified', compareNames('Carina Leite', null)==='unverified')
check('sem nome do perfil -> unverified', compareNames('', 'Carina Leite')==='unverified')
// Só primeiro nome bate, sobrenome diferente -> mismatch (perfil 2 tokens)
check('Ana Silva x Ana Souza -> mismatch', compareNames('Ana Silva','Ana Souza')==='mismatch')

console.log('\n'+(fail===0?'TODOS OK':fail+' FALHA(S)'))
if(fail>0) process.exit(1)
