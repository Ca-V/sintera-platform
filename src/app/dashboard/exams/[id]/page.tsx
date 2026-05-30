'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { motion } from 'framer-motion'
import { ArrowLeft, Brain, FileText, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react'

interface Biomarker {
  id: string
  name: string
  value: number | null
  unit: string | null
  reference_min: number | null
  reference_max: number | null
  interpretation: string | null
  ai_insight: string | null
}

interface AiInsight {
  id: string
  insight: string
  category: string | null
  priority: string
}

interface Exam {
  id: string
  type: string | null
  exam_date: string | null
  status: string
  notes: string | null
  file_url: string | null
}

export default function ExamDetailPage() {
  const params = useParams()
  const router = useRouter()
  const examId = params.id as string

  const [exam, setExam] = useState<Exam | null>(null)
  const [biomarkers, setBiomarkers] = useState<Biomarker[]>([])
  const [insights, setInsights] = useState<AiInsight[]>([])
  const [loading, setLoading] = useState(true)
  const [analyzing, setAnalyzing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()

  useEffect(() => {
    loadData()
  }, [examId])

  async function loadData() {
    setLoading(true)
    try {
      const { data: examData } = await supabase
        .from('exams')
        .select('*')
        .eq('id', examId)
        .single()

      if (examData) setExam(examData)

      const { data: bioData } = await supabase
        .from('biomarkers')
        .select('*')
        .eq('exam_id', examId)

      if (bioData) setBiomarkers(bioData)

      const { data: insightData } = await supabase
        .from('ai_insights')
        .select('*')
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id ?? '')
        .order('created_at', { ascending: false })
        .limit(5)

      if (insightData) setInsights(insightData)
    } catch (err) {
      setError('Erro ao carregar dados do exame')
    } finally {
      setLoading(false)
    }
  }

  async function extractTextFromPDF(url: string): Promise<string> {
    return new Promise((resolve) => {
      const pdfjsLib = (window as any).pdfjsLib
      if (!pdfjsLib) { resolve(''); return }
      pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'
      pdfjsLib.getDocument(url).promise.then(async (pdf: any) => {
        let text = ''
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i)
          const content = await page.getTextContent()
          text += content.items.map((item: any) => item.str).join(' ') + '\n'
        }
        resolve(text)
      }).catch(() => resolve(''))
    })
  }

  async function handleAnalyze() {
    if (!exam?.file_url) return
    setAnalyzing(true)
    setError(null)
    try {
      if (!(window as any).pdfjsLib) {
        await new Promise<void>((resolve, reject) => {
          const script = document.createElement('script')
          script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js'
          script.onload = () => resolve()
          script.onerror = () => reject()
          document.head.appendChild(script)
        })
      }
      const examText = await extractTextFromPDF(exam.file_url)
      const res = await fetch('/api/exams/' + examId + '/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ examText }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Erro na analise')
      }
      await loadData()
    } catch (err: any) {
      setError(err.message || 'Erro ao analisar exame')
    } finally {
      setAnalyzing(false)
    }
  }

  function getStatusColor(interpretation: string | null) {
    if (!interpretation) return 'text-gray-400'
    if (interpretation === 'high' || interpretation === 'low') return 'text-red-400'
    return 'text-green-400'
  }

  function getPriorityColor(priority: string) {
    if (priority === 'high') return 'border-red-500/50 bg-red-500/10'
    if (priority === 'medium') return 'border-yellow-500/50 bg-yellow-500/10'
    return 'border-green-500/50 bg-green-500/10'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
      </div>
    )
  }

  const abnormal = biomarkers.filter(b => b.interpretation === 'high' || b.interpretation === 'low')
  const normal = biomarkers.filter(b => b.interpretation === 'normal')

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Voltar
      </button>

      {exam && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card-premium p-6 mb-6"
        >
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <FileText className="w-6 h-6 text-purple-400" />
                <h1 className="text-xl font-bold text-white">{exam.type || 'Exame'}</h1>
              </div>
              {exam.exam_date && (
                <p className="text-gray-400 text-sm">
                  {new Date(exam.exam_date).toLocaleDateString('pt-BR')}
                </p>
              )}
              <span className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-medium ${
                exam.status === 'processed' ? 'bg-green-500/20 text-green-400' :
                exam.status === 'processing' ? 'bg-yellow-500/20 text-yellow-400' :
                'bg-gray-500/20 text-gray-400'
              }`}>
                {exam.status === 'processed' ? 'Processado' :
                 exam.status === 'processing' ? 'Processando...' : 'Pendente'}
              </span>
            </div>
            {exam.file_url && exam.status !== 'processed' && (
              <button
                onClick={handleAnalyze}
                disabled={analyzing}
                className="btn-primary flex items-center gap-2"
              >
                {analyzing ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Analisando...</>
                ) : (
                  <><Brain className="w-4 h-4" /> Analisar com IA</>
                )}
              </button>
            )}
          </div>
          {error && (
            <div className="mt-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}
        </motion.div>
      )}

      {insights.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card-premium p-6 mb-6"
        >
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Brain className="w-5 h-5 text-purple-400" />
            Insights da IA
          </h2>
          <div className="space-y-3">
            {insights.map(insight => (
              <div key={insight.id} className={`p-3 rounded-lg border ${getPriorityColor(insight.priority)}`}>
                <p className="text-gray-300 text-sm">{insight.insight}</p>
                {insight.category && (
                  <span className="text-xs text-gray-500 mt-1 block">{insight.category}</span>
                )}
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {abnormal.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card-premium p-6 mb-6"
        >
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-400" />
            Biomarcadores Alterados ({abnormal.length})
          </h2>
          <div className="space-y-3">
            {abnormal.map(b => (
              <div key={b.id} className="flex items-center justify-between p-3 bg-red-500/5 rounded-lg border border-red-500/20">
                <div>
                  <p className="text-white font-medium text-sm">{b.name}</p>
                  {b.ai_insight && <p className="text-gray-400 text-xs mt-0.5">{b.ai_insight}</p>}
                </div>
                <div className="text-right">
                  <p className={`font-bold ${getStatusColor(b.interpretation)}`}>
                    {b.value} {b.unit}
                  </p>
                  {b.reference_min != null && b.reference_max != null && (
                    <p className="text-gray-500 text-xs">Ref: {b.reference_min}-{b.reference_max}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {normal.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="card-premium p-6"
        >
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-400" />
            Biomarcadores Normais ({normal.length})
          </h2>
          <div className="space-y-3">
            {normal.map(b => (
              <div key={b.id} className="flex items-center justify-between p-3 bg-green-500/5 rounded-lg border border-green-500/20">
                <p className="text-white font-medium text-sm">{b.name}</p>
                <div className="text-right">
                  <p className="font-bold text-green-400">{b.value} {b.unit}</p>
                  {b.reference_min != null && b.reference_max != null && (
                    <p className="text-gray-500 text-xs">Ref: {b.reference_min}-{b.reference_max}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {biomarkers.length === 0 && exam?.status !== 'processing' && (
        <div className="text-center py-12 text-gray-500">
          <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>Nenhum biomarcador encontrado.</p>
          {exam?.file_url && <p className="text-sm mt-1">Clique em "Analisar com IA" para extrair os dados.</p>}
        </div>
      )}
    </div>
  )
}
