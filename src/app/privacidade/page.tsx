import Link from "next/link"
import fs from "fs"
import path from "path"

export const metadata = {
  title: "Política de Privacidade — Sinctera",
  description: "Como a Sinctera coleta, usa e protege seus dados pessoais.",
}

export default function PrivacidadePage() {
  const filePath = path.join(process.cwd(), "public/docs/privacy-v2.0.txt")
  const content = fs.readFileSync(filePath, "utf-8")

  return (
    <main className="min-h-screen bg-cream text-onyx">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-onyx/60 hover:text-onyx mb-10 transition-colors"
        >
          ← Voltar ao início
        </Link>
        <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-onyx/80">
          {content}
        </pre>
      </div>
    </main>
  )
}
