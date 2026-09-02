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
import { Paperclip, X, FileText, Image as ImageIcon, Loader2, UploadCloud, AlertTriangle } from 'lucide-react'
import {
  acceptFiles, removeFile, rejectionMessage, attachmentCountLabel,
  supportedNowAcceptAttr, entryMethodsFor,
  readingFromClassification, documentDivergence, documentSubtypeLabel, motivoLeituraLabel,
  type MotivoLeituraFalha,
  type AttachedFile, type IncomingFile, type DocumentReading, type PatientDocumentSubtype, uuid, SCREEN_COPY } from '@sintera/core'
import { fileToBase64 } from '@/lib/capture/fileToBase64'

export interface AnexoDocumentoProps {
  /** Conjunto atual — o dono do estado é a tela, para poder salvá-lo junto do registro. */
  files: AttachedFile[]
  onChange: (files: AttachedFile[]) => void
  /** Sobe UM arquivo e devolve a URL. A tela decide o destino (bucket, caminho). */
  upload: (file: File) => Promise<string | null>
  label?: string
  disabled?: boolean
  /**
   * LEITURA ASSISTIDA (ANEXO-001) — opcional. Quando a tela declara o que ESPERA receber, o componente lê o
   * primeiro documento anexado, AVISA se o que leu diverge do declarado, e devolve os fatos para a tela
   * preencher o formulário (autopreenchimento para REVISÃO humana).
   *
   * Mora aqui, e não em cada tela, pelo mesmo motivo que o resto do componente: se cada uma implementasse a
   * sua, teríamos avisos com redações diferentes e telas que simplesmente não avisam. É a fonte única.
   *
   * NUNCA move o documento sozinho e NUNCA bloqueia o salvamento — a pessoa escolheu o tipo, e ela decide.
   */
  leituraAssistida?: {
    /** O subtipo que esta tela declara receber (ex.: 'receita' na tela de Receitas e atestados). */
    declarado: PatientDocumentSubtype
    /** Recebe os fatos lidos para a tela aplicar `autofillFrom` nos próprios campos. */
    onLeitura: (leitura: DocumentReading) => void
  }
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
  files, onChange, upload, label = 'Documento', disabled = false, leituraAssistida,
}: AnexoDocumentoProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [arrastando, setArrastando] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [aviso, setAviso] = useState<string | null>(null)
  const [lendo, setLendo] = useState(false)
  const [divergencia, setDivergencia] = useState<string | null>(null)
  /** Por que a leitura NAO rodou. Distinto de "rodou e nao reconheceu", que e legitimo e silencioso. */
  const [motivo, setMotivo] = useState<MotivoLeituraFalha | null>(null)

  /**
   * Lê o documento e compara com o que a tela declarou. Silencioso quando falha: leitura assistida que quebra
   * a tela seria pior que leitura que não acontece — a pessoa preenche à mão, como sempre pôde.
   */
  const lerDocumento = useCallback(async (original: File) => {
    if (!leituraAssistida) return
    setLendo(true)
    setDivergencia(null); setMotivo(null)
    try {
      const payload = await fileToBase64(original)
      // CADA SAÍDA DIZ POR QUÊ, como no aplicativo. Antes eram três `return` mudos, e do lado de fora "não
      // consegui ler" era indistinguível de "li e não reconheci" — a pessoa preenchia à mão achando que a
      // plataforma não sabe ler, e deixava de confiar num recurso que funciona.
      if (!payload.fileBase64) { setMotivo('sem-arquivo'); return }
      const res = await fetch('/api/capture/classify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...payload, filename: original.name }),
      })
      if (!res.ok) {
        console.warn(`[SINTERA] leitura de documento: o servidor respondeu ${res.status}.`)
        // 401 tem conserto diferente de 500: uma pede entrar de novo, a outra pede tentar mais tarde.
        setMotivo(res.status === 401 ? 'sem-sessao' : 'servidor')
        return
      }
      const leitura = readingFromClassification(await res.json())
      // Leu e não reconheceu nada: resposta legítima, e silenciosa de propósito. Avisar aqui transformaria uma
      // leitura bem-sucedida num alarme.
      if (!leitura) return

      // AVISA, e só. Nunca move o documento nem impede salvar — a pessoa escolheu o tipo.
      setDivergencia(documentDivergence(leituraAssistida.declarado, leitura, documentSubtypeLabel).message)
      leituraAssistida.onLeitura(leitura)
    } catch (e) {
      console.warn('[SINTERA] leitura de documento: não houve resposta.', e)
      setMotivo('rede')
    } finally {
      setLendo(false)
    }
  }, [leituraAssistida])

  const receber = useCallback(async (escolhidos: FileList | File[]) => {
    setAviso(null)
    const lista = Array.from(escolhidos)
    if (lista.length === 0) return

    // A POLÍTICA decide o que entra. A tela não repete essa decisão.
    const entrando: IncomingFile[] = lista.map(f => ({
      id: uuid(), name: f.name, mime: f.type, sizeBytes: f.size,
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
      let primeiro = true
      for (const novo of novos) {
        const original = lista.find(f => f.name === novo.name && f.size === novo.sizeBytes)
        if (!original) continue
        // Lê só o PRIMEIRO documento do lote. Um registro tem um tipo; ler todos produziria avisos
        // conflitantes sobre a mesma coisa, e a pessoa não saberia a qual responder.
        if (primeiro) { primeiro = false; void lerDocumento(original) }
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
  }, [files, onChange, upload, lerDocumento])

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
          {enviando ? SCREEN_COPY.anexo.sending
            : files.length > 0 ? SCREEN_COPY.anexo.addMore
            : PODE_ARRASTAR ? SCREEN_COPY.anexo.addDrag : SCREEN_COPY.anexo.add}
        </span>
        <span className="text-xs opacity-70">{SCREEN_COPY.anexo.formatHint}</span>
      </button>

      {aviso && <p className="mt-1.5 text-sm text-red-600">{aviso}</p>}

      {lendo && (
        <p className="mt-1.5 flex items-center gap-1.5 text-xs text-mauve">
          <Loader2 size={12} className="animate-spin" /> {SCREEN_COPY.anexo.reading}
        </p>
      )}

      {/* A LEITURA NAO RODOU. Tom NEUTRO, nao de erro: o documento foi anexado e nada se perdeu — o que
          faltou foi o auxilio, nao o registro. */}
      {motivo && (
        <p className="mt-2 rounded-xl border border-border px-3 py-2 text-xs leading-relaxed text-mauve">
          {motivoLeituraLabel(motivo)}
        </p>
      )}

      {/* DIVERGÊNCIA — informa, não obstrui. Sem botão de "corrigir": a pessoa escolheu o tipo, e mover o
          documento por conta própria seria decidir por ela. O tom é âmbar, não vermelho: isto não é erro. */}
      {divergencia && (
        <div className="mt-2 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2">
          <AlertTriangle size={14} className="mt-0.5 flex-shrink-0 text-amber-600" />
          <p className="text-xs leading-relaxed text-amber-900">
            {divergencia}{' '}
            <span className="text-amber-700">Se estiver certo, é só continuar — nada será movido.</span>
          </p>
        </div>
      )}
    </div>
  )
}
