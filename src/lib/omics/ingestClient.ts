// Ingestão de um arquivo de ômica a partir do cliente: preserva o original
// (storage), escolhe a rota certa (CSV/JSON via parser; PDF/foto via IA) e
// retorna o resultado. Usado tanto na criação do painel (upload-first) quanto
// na importação dentro do painel.

export interface IngestResult { version?: number; inserted?: number; resolved?: number; total_rows?: number }

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result).split(',')[1] ?? '')
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export async function uploadAndIngest(
  panelId: string,
  file: File,
  userId: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
): Promise<IngestResult> {
  const lower = file.name.toLowerCase()
  const isJson = lower.endsWith('.json') || file.type.includes('json')
  const isCsv = lower.endsWith('.csv') || file.type.includes('csv') || file.type.includes('text/plain')
  const isPdf = lower.endsWith('.pdf') || file.type === 'application/pdf'
  const isImage = file.type.startsWith('image/')
  if (!isJson && !isCsv && !isPdf && !isImage) throw new Error('Envie um arquivo CSV, JSON, PDF ou foto do laudo.')
  const maxMb = (isPdf || isImage) ? 6 : 8
  if (file.size > maxMb * 1024 * 1024) throw new Error(`Arquivo muito grande (máx. ${maxMb} MB).`)

  // Preserva o arquivo original (bucket privado).
  let sourceUrl: string | null = null
  const path = `${userId}/omics/${crypto.randomUUID()}-${file.name}`
  const { error: upErr } = await supabase.storage.from('exams').upload(path, file, {
    contentType: file.type || 'application/octet-stream', upsert: false,
  })
  if (!upErr) {
    const { data: signed } = await supabase.storage.from('exams').createSignedUrl(path, 60 * 60 * 24 * 365)
    sourceUrl = signed?.signedUrl ?? null
  }

  let res: Response
  if (isPdf || isImage) {
    const base64 = await fileToBase64(file)
    res = await fetch(`/api/omics/panels/${panelId}/ingest-pdf`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileBase64: base64, mediaType: isPdf ? 'application/pdf' : file.type, source_file: sourceUrl, note: file.name }),
    })
  } else {
    const content = await file.text()
    res = await fetch(`/api/omics/panels/${panelId}/ingest`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ format: isJson ? 'json' : 'csv', content, source_file: sourceUrl, note: file.name }),
    })
  }
  const json = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(json.error ?? 'Falha na importação.')
  return json as IngestResult
}
