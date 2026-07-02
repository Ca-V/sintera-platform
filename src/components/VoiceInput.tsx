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
    if (!SR) {
      window.alert('Ditado por voz não está disponível neste navegador. Tente o Google Chrome (Android) ou o Safari atualizado (iPhone).')
      return
    }
    if (listening) { recRef.current?.stop?.(); return }
    const rec = new SR()
    rec.lang = 'pt-BR'
    rec.interimResults = false
    rec.maxAlternatives = 1
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    rec.onresult = (e: any) => {
      const t = e?.results?.[0]?.[0]?.transcript
      if (t) onResult(String(t).trim())
    }
    rec.onend = () => setListening(false)
    rec.onerror = () => setListening(false)
    recRef.current = rec
    setListening(true)
    try { rec.start() } catch { setListening(false) }
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
