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

export default function VoiceInput({ onResult, title = 'Ditar por voz' }: {
  onResult: (text: string) => void
  title?: string
}) {
  const [supported, setSupported] = useState(false)
  const [listening, setListening] = useState(false)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recRef = useRef<any>(null)

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SR = typeof window !== 'undefined' && ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition)
    setSupported(!!SR)
  }, [])

  function toggle() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SR) return
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

  if (!supported) return null

  return (
    <button type="button" onClick={toggle} title={title} aria-label={title}
      className={`inline-flex items-center justify-center w-8 h-8 rounded-lg border transition-colors flex-shrink-0 ${
        listening ? 'border-petal bg-blush text-petal animate-pulse-soft' : 'border-border text-mauve/60 hover:text-petal hover:border-petal/40'
      }`}>
      <Mic size={15} />
    </button>
  )
}
