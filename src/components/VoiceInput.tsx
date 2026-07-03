'use client'

// ============================================================
// VoiceInput — ditado por voz (pt-BR) via Web Speech API
// ============================================================
// Botão de microfone que transcreve a fala e entrega o texto via onResult
// (o chamador decide o que fazer — normalmente concatenar ao campo).
// Usa a API do navegador (Chrome/Android); se não houver suporte, não aparece.
// Nada é enviado a servidor — a transcrição é do próprio navegador.
// ============================================================

import { useEffect, useRef, useState } from 'react'
import { Mic } from 'lucide-react'

export default function VoiceInput({ onResult, title = 'Ditar por voz', label = 'Falar', className }: {
  onResult: (text: string) => void
  title?: string
  label?: string
  className?: string
}) {
  const [supported, setSupported] = useState(false)
  const [listening, setListening] = useState(false)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recRef = useRef<any>(null)

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SR = typeof window !== 'undefined' && ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition)
    // eslint-disable-next-line react-hooks/set-state-in-effect -- detecção de suporte a voz na montagem
    setSupported(!!SR)
  }, [])

  function toggle() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    // DIAG (temporário) — instrumentação p/ diagnosticar o bug C. Remover após.
    console.log('[DIAG voz] clique', { SR_existe: !!SR, supported, listening, protocolo: location.protocol })
    if (!SR) {
      window.alert('Ditado por voz não está disponível neste navegador. Tente o Google Chrome (Android) ou o Safari atualizado (iPhone).')
      return
    }
    if (listening) { recRef.current?.stop?.(); return }
    const rec = new SR()
    rec.lang = 'pt-BR'
    rec.interimResults = false
    rec.maxAlternatives = 1
    rec.onstart = () => console.log('[DIAG voz] onstart (ouvindo)')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    rec.onresult = (e: any) => {
      const t = e?.results?.[0]?.[0]?.transcript
      console.log('[DIAG voz] onresult', { transcript: t })
      if (t) onResult(String(t).trim())
    }
    rec.onend = () => setListening(false)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    rec.onerror = (e: any) => {
      setListening(false)
      // DIAG (temporário) — captura o código de erro real. Remover após.
      console.log('[DIAG voz] onerror', { error: e?.error, message: e?.message })
      // Antes o erro era silencioso → parecia "não funcionar". Agora explica o motivo.
      const err = e?.error
      if (err === 'not-allowed' || err === 'service-not-allowed') {
        window.alert('Permita o acesso ao microfone para usar o ditado por voz. No navegador, clique no ícone de cadeado/câmera na barra de endereço e libere o microfone.')
      } else if (err === 'audio-capture') {
        window.alert('Nenhum microfone encontrado. Conecte um microfone e tente de novo.')
      } else if (err === 'no-speech') {
        window.alert('Não ouvi nada. Toque em "Falar" e fale perto do microfone.')
      } else if (err === 'network') {
        window.alert('O ditado por voz precisa de conexão com a internet. Verifique sua conexão e tente de novo.')
      }
      // 'aborted' e afins: silencioso (ex.: a própria pessoa parou).
    }
    recRef.current = rec
    setListening(true)
    try { rec.start() } catch (err) { console.log('[DIAG voz] start() lançou', err); setListening(false) }
  }

  const cls = className ?? `inline-flex items-center gap-1.5 px-2.5 h-9 rounded-lg border transition-colors flex-shrink-0 font-body text-xs ${
    listening ? 'border-petal bg-blush text-petal'
      : supported ? 'border-petal/40 text-petal hover:bg-blush'
      : 'border-border text-mauve/40'
  }`
  return (
    <button type="button" onClick={toggle} title={supported ? title : 'Ditado por voz indisponível neste navegador'} aria-label={title}
      className={`${cls}${listening ? ' animate-pulse-soft' : ''}`}>
      <Mic size={15} /> {listening ? 'Ouvindo…' : label}
    </button>
  )
}
