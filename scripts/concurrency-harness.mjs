// Harness de concorrência da escrita canônica (1d.1) — parte permanente da suíte de validação.
// Duas conexões INDEPENDENTES executam write_canonical_extraction simultaneamente no MESMO
// exame com a MESMA chave de reuso. Comprova: serialização (advisory lock), dedup (índice
// único), nenhuma duplicação, ponteiro consistente. Reutilizável em 1d.2–1d.5 e ômica.
//
// Uso (ambiente controlado — branch/staging; produção só se for o procedimento de validação):
//   DATABASE_URL=postgres://...  TEST_USER_ID=<uuid de um usuário existente>  node scripts/concurrency-harness.mjs
//
// Requer: `npm i pg` (devDependency). Limpa o exame de teste ao final (cascade).

import pg from 'pg'
const { Client } = pg

const DATABASE_URL = process.env.DATABASE_URL
const TEST_USER_ID = process.env.TEST_USER_ID
if (!DATABASE_URL || !TEST_USER_ID) {
  console.error('Defina DATABASE_URL e TEST_USER_ID (uuid de usuário existente).')
  process.exit(1)
}

const KEY = { document_sha256: 'CONC-TEST-' + Date.now(), extractor_version: 'e', prompt_version: 'p', model_version: 'm' }
const BM = JSON.stringify([{ name: 'CONC', value: 1, result_type: 'numeric', reference_source: 'laudo' }])

async function svc(c) {
  await c.query(`select set_config('request.jwt.claims', '{"role":"service_role"}', false)`)
}
async function callWrite(c, examId) {
  const meta = JSON.stringify({ ...KEY, origin: 'fresh', processing_mode: 'canonical_on' })
  const r = await c.query(
    `select public.write_canonical_extraction($1::uuid, $2::uuid, $3::jsonb, $4::jsonb) as result`,
    [examId, TEST_USER_ID, BM, meta],
  )
  return r.rows[0].result
}

const setup = new Client({ connectionString: DATABASE_URL })
const a = new Client({ connectionString: DATABASE_URL })
const b = new Client({ connectionString: DATABASE_URL })

let examId
try {
  await setup.connect(); await svc(setup)
  // exame de teste (synthetic-friendly)
  const ex = await setup.query(
    `insert into public.exams (user_id, status) values ($1::uuid, 'processed') returning id`, [TEST_USER_ID])
  examId = ex.rows[0].id

  await a.connect(); await svc(a)
  await b.connect(); await svc(b)

  // dispara as duas escritas o mais simultâneo possível (mesma chave)
  const t0 = Date.now()
  const [ra, rb] = await Promise.all([callWrite(a, examId), callWrite(b, examId)])
  const ms = Date.now() - t0

  const versoes = await setup.query(
    `select count(*)::int n from public.extraction_versions
       where exam_id=$1 and status='valid' and document_sha256=$2`, [examId, KEY.document_sha256])
  const ponteiro = await setup.query(
    `select (select count(*) from public.extraction_versions ev where ev.id=e.current_extraction_version_id)::int as i8
       from public.exams e where e.id=$1`, [examId])

  const actions = [ra.action, rb.action].sort()
  const versoesValidas = versoes.rows[0].n
  const i8 = ponteiro.rows[0].i8
  const pass = versoesValidas === 1 && i8 === 1 &&
    ra.version_id === rb.version_id &&
    JSON.stringify(actions) === JSON.stringify(['CREATED', 'REUSED'])

  console.log(JSON.stringify({
    exam_id: examId, ms, actions, version_ids: [ra.version_id, rb.version_id],
    versoes_validas_da_chave: versoesValidas, i8_ponteiro_unico: i8, PASS: pass,
  }, null, 2))
  if (!pass) process.exitCode = 2
} finally {
  // limpeza: remove o exame de teste (cascade -> versões/biomarcadores)
  if (examId) { try { await setup.query(`delete from public.exams where id=$1`, [examId]) } catch {} }
  for (const c of [a, b, setup]) { try { await c.end() } catch {} }
}
