'use client'

// ANEXO-001 — FONTE ÚNICA da entrada de documento na Web.
//
// Princípio da fundadora (25/08/2026, PERMANENTE): toda entrada de documento na plataforma segue o MESMO
// padrão, em 100% dos pontos que oferecem anexo. Antes disto, cada tela abria seu `<input type="file">` e
// entregava um subconjunto diferente: Exames tinha arrastar, Ômicas tinha câmera, Receitas e atestados tinha
// só seleção de arquivo. Ninguém tinha o conjunto completo.
//
// Este componente É o padrão. Quem anexa documento na Web usa-o; ninguém reimplementa.
//   • vários arquivos de uma vez        (ATTACHMENT_CARDINALITY.multiple)
//   • formatos mistos                   (mixedFormats)
//   • acrescentar depois                (addLater)
//   • PDF não encerra o fluxo           (pdfEndsFlow: false)
//   • arrastar e soltar                 (entryMethodsFor('web'))
//   • recusa DITA, com nome e motivo    (rejectionMessage)
//
// A REGRA de aceitar/recusar não mora aqui — mora em `attachmentSet` no core, e o Mobile usa a mesma.
// Este arquivo é só a aparência dela.
import { useCallback, useRef, useState } from 'react'
import { Paperclip, X, FileText, Image as ImageIcon, Loader2, UploadCloud } from 'lucide-react'
import {
  acceptFiles, removeFile, rejectionMessage, attachmentCountLabel,
  supportedNowAcceptAttr, entryMethodsFor,
  type AttachedFile, type IncomingFile,
} from '@sintera/core'

export interface AnexoDocumentoProps {
  /** Conjunto atual — o dono do estado é a tela, para poder salvá-lo junto do registro. */
  files: AttachedFile[]
  onChange: (files: AttachedFile[]) => void
  /** Sobe UM arquivo e devolve a URL. A tela decide o destino (bucket, caminho). */
  upload: (file: File) => Promise<string | null>
  label?: string
  disabled?: boolean
}

const PODE_ARRASTAR = entryMethodsFor('web').includes('drag_drop')

function iconePara(mime: string) {
  return mime === 'application/pdf' ? FileText : ImageIcon
}

function tamanhoLegivel(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function AnexoDocumento({
  files, onChange, upload, label = 'Documento', disabled = false,
}: AnexoDocumentoProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [arrastando, setArrastando] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [aviso, setAviso] = useState<string | null>(null)

  const receber = useCallback(async (escolhidos: FileList | File[]) => {
    setAviso(null)
    const lista = Array.from(escolhidos)
    if (lista.length === 0) return

    // A POLÍTICA decide o que entra. A tela não repete essa decisão.
    const entrando: IncomingFile[] = lista.map(f => ({
      id: crypto.randomUUID(), name: f.name, mime: f.type, sizeBytes: f.size,
    }))
    const { files: aceitos, rejected } = acceptFiles(files, entrando)
    setAviso(rejectionMessage(rejected))
    onChange(aceitos)

    // Sobe só os que acabaram de entrar, na ordem, preservando o que já estava.
    const novos = aceitos.filter(a => entrando.some(e => e.id === a.id))
    if (novos.length === 0) return

    setEnviando(true)
    try {
      let atual = aceitos
      for (const novo of novos) {
        const original = lista.find(f => f.name === novo.name && f.size === novo.sizeBytes)
        if (!original) continue
        const url = await upload(original)
        if (url) {
          atual = atual.map(f => (f.id === novo.id ? { ...f, url } : f))
        } else {
          // Falha de envio remove o item: manter na lista um arquivo que não subiu faria a tela
          // prometer um anexo que não existe.
          atual = removeFile(atual, novo.id)
          setAviso(`Não foi possível enviar ${novo.name}. Tente de novo.`)
        }
        onChange(atual)
      }
    } finally {
      setEnviando(false)
    }
  }, [files, onChange, upload])

  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between">
        <label className="text-sm text-mauve">{label}</label>
        {files.length > 0 && (
          <span className="text-xs text-mauve">{attachmentCountLabel(files.length)}</span>
        )}
      </div>

      {files.length > 0 && (
        <ul className="mb-2 space-y-1.5">
          {files.map(f => {
            const Icone = iconePara(f.mime)
            return (
              <li key={f.id} className="flex items-center gap-2 rounded-xl border border-border px-3 py-2">
                <Icone size={16} className="flex-shrink-0 text-mauve" />
                <span className="flex-1 truncate text-sm">{f.name}</span>
                <span className="flex-shrink-0 text-xs text-mauve tabular-nums">{tamanhoLegivel(f.sizeBytes)}</span>
                {!f.url && <Loader2 size={14} className="flex-shrink-0 animate-spin text-mauve" />}
                <button
                  type="button"
                  onClick={() => onChange(removeFile(files, f.id))}
                  disabled={disabled}
                  aria-label={`Remover ${f.name}`}
                  className="flex-shrink-0 rounded-full p-1 text-mauve hover:bg-black/[0.05]"
                >
                  <X size={14} />
                </button>
              </li>
            )
          })}
        </ul>
      )}

      <input
        ref={inputRef}
        type="file"
        multiple
        accept={supportedNowAcceptAttr()}
        onChange={e => { void receber(e.target.files ?? []); e.target.value = '' }}
        className="hidden"
      />

      <button
        type="button"
        disabled={disabled || enviando}
        onClick={() => inputRef.current?.click()}
        onDragOver={PODE_ARRASTAR ? e => { e.preventDefault(); setArrastando(true) } : undefined}
        onDragLeave={PODE_ARRASTAR ? () => setArrastando(false) : undefined}
        onDrop={PODE_ARRASTAR ? e => {
          e.preventDefault(); setArrastando(false)
          void receber(e.dataTransfer.files)
        } : undefined}
        className={[
          'flex w-full flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed px-4 py-5 text-sm transition-colors',
          arrastando ? 'border-petal bg-petal/[0.06] text-petal' : 'border-border text-mauve',
        ].join(' ')}
      >
        {enviando
          ? <Loader2 size={18} className="animate-spin" />
          : arrastando ? <UploadCloud size={18} /> : <Paperclip size={18} />}
        <span>
          {enviando ? 'Enviando…'
            : files.length > 0 ? 'Adicionar mais páginas'
            : PODE_ARRASTAR ? 'Anexar ou arrastar aqui' : 'Anexar documento'}
        </span>
        <span className="text-xs opacity-70">PDF ou imagem · vários arquivos</span>
      </button>

      {aviso && <p className="mt-1.5 text-sm text-red-600">{aviso}</p>}
    </div>
  )
}
