export type Json = string | number | boolean | null | { [key: string]: Json } | Json[]

export interface Database {
  public: {
    Tables: {
      exams: {
        Row: {
          id: string
          user_id: string
          type: string | null
          exam_date: string | null
          file_url: string | null
          status: string
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type?: string | null
          exam_date?: string | null
          file_url?: string | null
          status?: string
          notes?: string | null
        }
        Update: {
          type?: string | null
          exam_date?: string | null
          file_url?: string | null
          status?: string
          notes?: string | null
        }
      }
      ai_insights: {
        Row: {
          id: string
          user_id: string
          insight: string
          category: string | null
          priority: string
          is_read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          insight: string
          category?: string | null
          priority?: string
          is_read?: boolean
        }
        Update: {
          insight?: string
          category?: string | null
          priority?: string
          is_read?: boolean
        }
      }
      biomarkers: {
        Row: {
          id: string
          exam_id: string | null
          user_id: string
          name: string
          value: number | null
          unit: string | null
          reference_min: number | null
          reference_max: number | null
          interpretation: string | null
          ai_insight: string | null
          created_at: string
        }
        Insert: {
          id?: string
          exam_id?: string | null
          user_id: string
          name: string
          value?: number | null
          unit?: string | null
          reference_min?: number | null
          reference_max?: number | null
          interpretation?: string | null
          ai_insight?: string | null
        }
        Update: {
          value?: number | null
          unit?: string | null
          reference_min?: number | null
          reference_max?: number | null
          interpretation?: string | null
          ai_insight?: string | null
        }
      }
      biological_scores: {
        Row: {
          id: string
          user_id: string
          score_total: number | null
          score_metabolic: number | null
          score_hormonal: number | null
          score_inflammatory: number | null
          score_cardiovascular: number | null
          score_cognitive: number | null
          score_performance: number | null
          score_longevity: number | null
          scored_at: string
        }
        Insert: {
          id?: string
          user_id: string
          score_total?: number | null
          score_metabolic?: number | null
          score_hormonal?: number | null
          score_inflammatory?: number | null
          score_cardiovascular?: number | null
          score_cognitive?: number | null
          score_performance?: number | null
          score_longevity?: number | null
        }
        Update: {
          score_total?: number | null
          score_metabolic?: number | null
          score_hormonal?: number | null
          score_inflammatory?: number | null
          score_cardiovascular?: number | null
          score_cognitive?: number | null
          score_performance?: number | null
          score_longevity?: number | null
        }
      }
      profiles: {
        Row: {
          id: string
          name: string | null
          age_range: string | null
          cycle_length: number | null
          last_period: string | null
          cycle_regularity: string | null
          goals: string[] | null
          height_cm: number | null
          pref_daily_reminder: boolean
          pref_phase_alerts: boolean
          pref_email_insights: boolean
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          name?: string | null
          age_range?: string | null
          cycle_length?: number | null
          last_period?: string | null
          cycle_regularity?: string | null
          goals?: string[] | null
          height_cm?: number | null
          pref_daily_reminder?: boolean
          pref_phase_alerts?: boolean
          pref_email_insights?: boolean
          avatar_url?: string | null
        }
        Update: {
          name?: string | null
          age_range?: string | null
          cycle_length?: number | null
          last_period?: string | null
          cycle_regularity?: string | null
          goals?: string[] | null
          height_cm?: number | null
          pref_daily_reminder?: boolean
          pref_phase_alerts?: boolean
          pref_email_insights?: boolean
          avatar_url?: string | null
          updated_at?: string
        }
      }
    }
  }
}

export type Profile = Database['public']['Tables']['profiles']['Row']

export type Exam = Database['public']['Tables']['exams']['Row']
export type Biomarker = Database['public']['Tables']['biomarkers']['Row']
export type AiInsight = Database['public']['Tables']['ai_insights']['Row']
export type BiologicalScore = Database['public']['Tables']['biological_scores']['Row']
