export type Json = string | number | boolean | null | { [key: string]: Json } | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          name: string | null
          age_range: string | null
          cycle_length: number | null
          last_period: string | null
          cycle_regularity: string | null
          goals: string[] | null
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
