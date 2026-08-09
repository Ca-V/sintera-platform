// Mobile — INFRAESTRUTURA: converte o conteúdo de um arquivo local (uri do document/image picker) em base64,
// SEM dependência nativa nova (fetch → Blob → FileReader). Isola o acesso ao arquivo, como o documentPickerAdapter
// (decisão de arquitetura: trocar o mecanismo muda só este arquivo). Usado pela captura assistida (T1) para enviar
// o documento aos serviços de OCR/IA. Devolve APENAS o base64 (sem o prefixo `data:...;base64,`).
export async function readFileBase64(uri: string): Promise<string> {
  const res = await fetch(uri)
  const blob = await res.blob()
  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('Falha ao ler o arquivo.'))
    reader.onload = () => {
      const s = String(reader.result ?? '')
      const comma = s.indexOf(',')
      resolve(comma >= 0 ? s.slice(comma + 1) : s)
    }
    reader.readAsDataURL(blob)
  })
}
