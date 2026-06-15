// Smoke test da camada educacional MedlinePlus — sem rede/dependências.
// Rode com: node src/lib/education/__smoke__/medlineplus.mjs
// Mantenha a lógica em sincronia com medlineplus.ts.

const LOINC_OID = '2.16.840.1.113883.6.1'
const MEDLINEPLUS_CONNECT_BASE = 'https://connect.medlineplus.gov/service'

function buildConnectUrl(loincCode, language = 'en') {
  const params = new URLSearchParams({
    'mainSearchCriteria.v.cs': LOINC_OID,
    'mainSearchCriteria.v.c': loincCode,
    'knowledgeResponseType': 'application/json',
    'informationRecipient.languageCode.c': language,
  })
  return `${MEDLINEPLUS_CONNECT_BASE}?${params.toString()}`
}

function stripHtml(html) {
  return html
    .replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/\s+/g, ' ').trim()
}

function parseConnectResponse(json) {
  const feed = json?.feed
  const rawEntries = feed?.entry
  if (!Array.isArray(rawEntries)) return []
  const topics = []
  for (const entry of rawEntries) {
    const title = typeof entry.title === 'string' ? entry.title : entry.title?._value ?? ''
    const links = Array.isArray(entry.link) ? entry.link : entry.link ? [entry.link] : []
    const url = links.find(l => l?.href)?.href ?? ''
    const rawSummary = typeof entry.summary === 'string' ? entry.summary : entry.summary?._value ?? ''
    const summary = rawSummary ? stripHtml(rawSummary) : null
    if (title && url) topics.push({ title, url, summary })
  }
  return topics
}

let failures = 0
const check = (label, cond) => { if (!cond) { failures++; console.log(`FAIL  ${label}`) } else console.log(`OK    ${label}`) }

// 1) URL bem formada com OID LOINC, código e idioma.
const url = buildConnectUrl('2339-0', 'en')
check('URL contém OID LOINC', url.includes(encodeURIComponent(LOINC_OID)))
check('URL contém o código', url.includes('2339-0'))
check('URL pede JSON', url.includes('application%2Fjson'))
check('URL com idioma en', url.includes('languageCode.c=en'))
check('URL com idioma es', buildConnectUrl('2339-0', 'es').includes('languageCode.c=es'))

// 2) Resposta típica do Connect (formato Atom serializado em JSON).
const resp = {
  feed: {
    entry: [
      {
        title: { _value: 'Blood Glucose Test' },
        link: [{ href: 'https://medlineplus.gov/lab-tests/blood-glucose-test/' }],
        summary: { _value: '<p>A blood glucose test measures the <b>glucose</b> levels in your blood.</p>' },
      },
      {
        title: { _value: 'Diabetes Tests' },
        link: [{ href: 'https://medlineplus.gov/diabetestests.html' }],
        summary: { _value: 'Diagnosis &amp; monitoring.' },
      },
    ],
  },
}
const topics = parseConnectResponse(resp)
check('parseou 2 tópicos', topics.length === 2)
check('título extraído', topics[0].title === 'Blood Glucose Test')
check('url extraída', topics[0].url.includes('blood-glucose-test'))
check('HTML removido do resumo', topics[0].summary === 'A blood glucose test measures the glucose levels in your blood.')
check('entidade &amp; decodificada', topics[1].summary === 'Diagnosis & monitoring.')

// 3) Robustez: sem feed / sem entry / entry vazio → []
check('json vazio → []', parseConnectResponse({}).length === 0)
check('null → []', parseConnectResponse(null).length === 0)
check('feed sem entry → []', parseConnectResponse({ feed: {} }).length === 0)

// 4) Entrada sem link é descartada (precisa de title + url).
const semLink = parseConnectResponse({ feed: { entry: [{ title: { _value: 'X' } }] } })
check('entrada sem url é descartada', semLink.length === 0)

console.log(`\n${failures === 0 ? 'TODOS OK' : failures + ' FALHA(S)'}`)
if (failures > 0) process.exit(1)
