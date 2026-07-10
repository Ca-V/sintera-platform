'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { Menu, X } from 'lucide-react'
import { cn } from '@/lib/utils'

const navLinks = [
  { label: 'Como funciona', href: '#como-funciona' },
  { label: 'Confiança', href: '#confianca' },
  { label: 'Planos', href: '#planos' },
]

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 24)
    fn()
    window.addEventListener('scroll', fn, { passive: true })
    return () => window.removeEventListener('scroll', fn)
  }, [])

  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-500',
        scrolled
          ? 'glass border-b border-border/40 py-3 shadow-sm'
          : 'bg-transparent py-5'
      )}
    >
      <nav className="max-w-6xl mx-auto px-6 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          {/* Logomark */}
          <div className="w-8 h-8 rounded-full gradient-sintera flex items-center justify-center shadow-sm">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <circle cx="8" cy="8" r="5.5" stroke="white" strokeWidth="1.2" fill="none" />
              <circle cx="8" cy="8" r="2" fill="white" />
              <path d="M8 2.5 A5.5 5.5 0 0 1 13.5 8" stroke="white" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
          </div>
          <span className="text-xl font-display font-semibold tracking-[0.18em] text-onyx group-hover:text-petal transition-colors duration-300">
            SINTERA
          </span>
        </Link>

        {/* Desktop nav */}
        <ul className="hidden md:flex items-center gap-7">
          {navLinks.map((link) => (
            <li key={link.label}>
              <a
                href={link.href}
                className="text-sm font-body text-mauve hover:text-onyx transition-colors duration-200 relative group"
              >
                {link.label}
                <span className="absolute -bottom-0.5 left-0 w-0 h-px bg-petal group-hover:w-full transition-all duration-300" />
              </a>
            </li>
          ))}
        </ul>

        {/* Desktop CTA */}
        <div className="hidden md:flex items-center gap-3">
          <Link
            href="/login"
            className="text-sm font-body font-medium text-mauve hover:text-onyx transition-colors px-4 py-2"
          >
            Entrar
          </Link>
          <Link
            href="/onboarding"
            className="gradient-sintera text-white text-sm font-body font-medium px-5 py-2.5 rounded-full hover:opacity-90 active:scale-[0.98] transition-all duration-200 shadow-sm"
          >
            Criar conta
          </Link>
        </div>

        {/* Mobile toggle */}
        <button
          onClick={() => setOpen(!open)}
          className="md:hidden p-2 text-mauve hover:text-onyx transition-colors"
          aria-label="Menu"
        >
          {open ? <X size={21} /> : <Menu size={21} />}
        </button>
      </nav>

      {/* Mobile drawer */}
      {open && (
        <div className="md:hidden glass border-t border-border/30 animate-fade-in">
          <div className="max-w-6xl mx-auto px-6 py-5 flex flex-col gap-4">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={() => setOpen(false)}
                className="text-sm font-body text-mauve hover:text-onyx py-1.5 transition-colors"
              >
                {link.label}
              </a>
            ))}
            <div className="flex flex-col gap-2.5 pt-3 border-t border-border/40">
              <Link href="/login" onClick={() => setOpen(false)}
                className="text-center py-3 rounded-xl border border-border text-sm font-body font-medium text-onyx hover:bg-ivory transition-colors"
              >
                Entrar
              </Link>
              <Link href="/onboarding" onClick={() => setOpen(false)}
                className="text-center py-3 rounded-xl gradient-sintera text-white text-sm font-body font-medium"
              >
                Criar conta
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
