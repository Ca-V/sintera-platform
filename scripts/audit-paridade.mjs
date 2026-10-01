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
import { classificar } from './lib/paridade.mjs'

// A CLASSIFICACAO SAIU DAQUI em 30/09/2026, para scripts/lib/paridade.mjs.
// Ao escrever a catraca que exige motivo para cada orfao, eu reimplementei esta regra — e a minha versao
// discordava desta em ~60 simbolos, por esquecer tres detalhes que aqui ja estavam resolvidos: tirar
// comentarios, ignorar as linhas `export *`, e contar uso DENTRO do proprio arquivo.
//
// Duas medicoes do mesmo numero divergem, e ai ninguem sabe qual acreditar. Agora o script e a catraca
// chamam a mesma funcao.
const { total: totalSimbolos, nosDois, soWeb, soMobile, internos, orfaos } = classificar(process.cwd())
const soTeste = orfaos.filter(o => o.emTeste)

console.log('\n=== AUDITORIA · capacidades compartilhadas ===')
console.log('   simbolos publicos nos pacotes: ' + totalSimbolos)
console.log('   usados nas DUAS pontas:        ' + nosDois)
console.log('   so na Web:                     ' + soWeb.length)
console.log('   so no Mobile:                  ' + soMobile.length)
console.log('   helpers INTERNOS do pacote:    ' + internos.length)
 console.log('   ORFAOS (zero consumidores):    ' + orfaos.length)
console.log('     dos quais so o TESTE usa:    ' + soTeste.length)

console.log('\n--- ORFAOS consumidos apenas pelo teste (o padrao do dia) ---')
for (const o of soTeste.slice(0, 35)) console.log('   ' + o.nome.padEnd(32) + o.arq)
if (soTeste.length > 35) console.log('   ... e mais ' + (soTeste.length - 35))

console.log('\n--- SO NA WEB: capacidade que o Mobile nao alcanca ---')
for (const o of soWeb.slice(0, 35)) console.log('   ' + o.nome.padEnd(32) + o.arq)
if (soWeb.length > 35) console.log('   ... e mais ' + (soWeb.length - 35))
