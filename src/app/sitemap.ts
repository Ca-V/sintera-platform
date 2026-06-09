import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const base = 'https://sinteramais.com.br'
  const now  = new Date()

  return [
    { url: base,                    lastModified: now, changeFrequency: 'monthly',  priority: 1.0 },
    { url: `${base}/lista-de-espera`, lastModified: now, changeFrequency: 'monthly',  priority: 0.9 },
    { url: `${base}/login`,         lastModified: now, changeFrequency: 'yearly',   priority: 0.6 },
    { url: `${base}/privacidade`,   lastModified: now, changeFrequency: 'yearly',   priority: 0.5 },
    { url: `${base}/termos`,        lastModified: now, changeFrequency: 'yearly',   priority: 0.5 },
    { url: `${base}/lgpd`,          lastModified: now, changeFrequency: 'yearly',   priority: 0.5 },
  ]
}
