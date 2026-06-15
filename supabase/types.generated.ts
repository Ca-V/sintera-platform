// =============================================================
// SINTERA — Types gerados do banco de produção (pxiglvrgxooawetboglb)
// Snapshot de 2026-06-12, gerado via Supabase (auditoria de continuidade).
// Arquivo de REFERÊNCIA: reflete o schema real com as 23 migrações aplicadas.
// O app ainda usa src/lib/supabase/types.ts (desatualizado, com casts `any`
// para tabelas novas) — a substituição deve ser feita de forma planejada,
// pois remove os casts e pode revelar erros de tipo existentes.
// Regenerar com: supabase gen types typescript --project-id pxiglvrgxooawetboglb
// =============================================================

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      account_deletion_log: {
        Row: {
          deleted_at: string
          id: string
          initiated_by: string
          reason: string
          user_id: string
        }
        Insert: {
          deleted_at?: string
          id?: string
          initiated_by?: string
          reason?: string
          user_id: string
        }
        Update: {
          deleted_at?: string
          id?: string
          initiated_by?: string
          reason?: string
          user_id?: string
        }
        Relationships: []
      }
      ai_insights: {
        Row: {
          ai_log_id: string | null
          biomarker_ids: string[] | null
          category: string | null
          clinical_confidence: number | null
          clinical_flag: string | null
          confidence_band: string | null
          content_hash: string | null
          created_at: string | null
          exam_id: string | null
          extraction_confidence: number | null
          generation_confidence: number | null
          id: string
          insight: string
          insight_type: string | null
          is_read: boolean | null
          model_version: string | null
          priority: string | null
          source: string | null
          synthetic: boolean
          template_key: string | null
          user_id: string
        }
        Insert: {
          ai_log_id?: string | null
          biomarker_ids?: string[] | null
          category?: string | null
          clinical_confidence?: number | null
          clinical_flag?: string | null
          confidence_band?: string | null
          content_hash?: string | null
          created_at?: string | null
          exam_id?: string | null
          extraction_confidence?: number | null
          generation_confidence?: number | null
          id?: string
          insight: string
          insight_type?: string | null
          is_read?: boolean | null
          model_version?: string | null
          priority?: string | null
          source?: string | null
          synthetic?: boolean
          template_key?: string | null
          user_id: string
        }
        Update: {
          ai_log_id?: string | null
          biomarker_ids?: string[] | null
          category?: string | null
          clinical_confidence?: number | null
          clinical_flag?: string | null
          confidence_band?: string | null
          content_hash?: string | null
          created_at?: string | null
          exam_id?: string | null
          extraction_confidence?: number | null
          generation_confidence?: number | null
          id?: string
          insight?: string
          insight_type?: string | null
          is_read?: boolean | null
          model_version?: string | null
          priority?: string | null
          source?: string | null
          synthetic?: boolean
          template_key?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_insights_ai_log_id_fkey"
            columns: ["ai_log_id"]
            isOneToOne: false
            referencedRelation: "ai_processing_log"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_insights_exam_id_fkey"
            columns: ["exam_id"]
            isOneToOne: false
            referencedRelation: "exams"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_processing_log: {
        Row: {
          biomarkers_extracted: number | null
          completed_at: string | null
          completion_tokens: number | null
          duration_ms: number | null
          exam_id: string | null
          extraction_path: string | null
          filter_applied: boolean
          filter_fallback: boolean
          full_text_chars: number | null
          id: string
          input_chars: number | null
          model: string
          pages_filtered: number | null
          pages_relevant: number | null
          pages_total: number | null
          parse_error: string | null
          parse_error_original: string | null
          parse_repaired: boolean | null
          parsed_ok: boolean | null
          pdf_quality_detected: string | null
          previous_biomarker_count: number | null
          previous_hash: string | null
          prompt_tokens: number | null
          provider: string
          raw_response: string | null
          raw_response_hash: string | null
          repair_method: string | null
          repaired_response_hash: string | null
          reprocessed: boolean
          started_at: string | null
          status: string | null
          suspicious_output: boolean | null
          truncated: boolean | null
          user_id: string | null
        }
        Insert: {
          biomarkers_extracted?: number | null
          completed_at?: string | null
          completion_tokens?: number | null
          duration_ms?: number | null
          exam_id?: string | null
          extraction_path?: string | null
          filter_applied?: boolean
          filter_fallback?: boolean
          full_text_chars?: number | null
          id?: string
          input_chars?: number | null
          model: string
          pages_filtered?: number | null
          pages_relevant?: number | null
          pages_total?: number | null
          parse_error?: string | null
          parse_error_original?: string | null
          parse_repaired?: boolean | null
          parsed_ok?: boolean | null
          pdf_quality_detected?: string | null
          previous_biomarker_count?: number | null
          previous_hash?: string | null
          prompt_tokens?: number | null
          provider?: string
          raw_response?: string | null
          raw_response_hash?: string | null
          repair_method?: string | null
          repaired_response_hash?: string | null
          reprocessed?: boolean
          started_at?: string | null
          status?: string | null
          suspicious_output?: boolean | null
          truncated?: boolean | null
          user_id?: string | null
        }
        Update: {
          biomarkers_extracted?: number | null
          completed_at?: string | null
          completion_tokens?: number | null
          duration_ms?: number | null
          exam_id?: string | null
          extraction_path?: string | null
          filter_applied?: boolean
          filter_fallback?: boolean
          full_text_chars?: number | null
          id?: string
          input_chars?: number | null
          model?: string
          pages_filtered?: number | null
          pages_relevant?: number | null
          pages_total?: number | null
          parse_error?: string | null
          parse_error_original?: string | null
          parse_repaired?: boolean | null
          parsed_ok?: boolean | null
          pdf_quality_detected?: string | null
          previous_biomarker_count?: number | null
          previous_hash?: string | null
          prompt_tokens?: number | null
          provider?: string
          raw_response?: string | null
          raw_response_hash?: string | null
          repair_method?: string | null
          repaired_response_hash?: string | null
          reprocessed?: boolean
          started_at?: string | null
          status?: string | null
          suspicious_output?: boolean | null
          truncated?: boolean | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_processing_log_exam_id_fkey"
            columns: ["exam_id"]
            isOneToOne: false
            referencedRelation: "exams"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_provider_config: {
        Row: {
          id: string
          is_active: boolean | null
          max_tokens: number | null
          model: string
          operation: string
          provider: string
          temperature: number | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          is_active?: boolean | null
          max_tokens?: number | null
          model: string
          operation: string
          provider: string
          temperature?: number | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          is_active?: boolean | null
          max_tokens?: number | null
          model?: string
          operation?: string
          provider?: string
          temperature?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      audit_purge_log: {
        Row: {
          action: string
          executed_at: string | null
          id: string
          reason: string | null
          record_count: number | null
          table_name: string
        }
        Insert: {
          action: string
          executed_at?: string | null
          id?: string
          reason?: string | null
          record_count?: number | null
          table_name: string
        }
        Update: {
          action?: string
          executed_at?: string | null
          id?: string
          reason?: string | null
          record_count?: number | null
          table_name?: string
        }
        Relationships: []
      }
      biological_scores: {
        Row: {
          biomarkers_used: number | null
          coverage_pct: number | null
          data_quality: string | null
          exam_id: string | null
          id: string
          score_cardiovascular: number | null
          score_cognitive: number | null
          score_hormonal: number | null
          score_inflammatory: number | null
          score_longevity: number | null
          score_metabolic: number | null
          score_performance: number | null
          score_total: number | null
          scored_at: string | null
          synthetic: boolean
          user_id: string
        }
        Insert: {
          biomarkers_used?: number | null
          coverage_pct?: number | null
          data_quality?: string | null
          exam_id?: string | null
          id?: string
          score_cardiovascular?: number | null
          score_cognitive?: number | null
          score_hormonal?: number | null
          score_inflammatory?: number | null
          score_longevity?: number | null
          score_metabolic?: number | null
          score_performance?: number | null
          score_total?: number | null
          scored_at?: string | null
          synthetic?: boolean
          user_id: string
        }
        Update: {
          biomarkers_used?: number | null
          coverage_pct?: number | null
          data_quality?: string | null
          exam_id?: string | null
          id?: string
          score_cardiovascular?: number | null
          score_cognitive?: number | null
          score_hormonal?: number | null
          score_inflammatory?: number | null
          score_longevity?: number | null
          score_metabolic?: number | null
          score_performance?: number | null
          score_total?: number | null
          scored_at?: string | null
          synthetic?: boolean
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "biological_scores_exam_id_fkey"
            columns: ["exam_id"]
            isOneToOne: false
            referencedRelation: "exams"
            referencedColumns: ["id"]
          },
        ]
      }
      biomarker_aliases: {
        Row: {
          alias_normalized: string
          catalog_id: string
          unit_pattern: string | null
        }
        Insert: {
          alias_normalized: string
          catalog_id: string
          unit_pattern?: string | null
        }
        Update: {
          alias_normalized?: string
          catalog_id?: string
          unit_pattern?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "biomarker_aliases_catalog_id_fkey"
            columns: ["catalog_id"]
            isOneToOne: false
            referencedRelation: "biomarker_catalog"
            referencedColumns: ["id"]
          },
        ]
      }
      biomarker_catalog: {
        Row: {
          approval_status: string
          canonical_unit: string | null
          category: string
          code: string
          created_at: string
          display_name: string
          id: string
          is_critical: boolean
          loinc_code: string | null
          loinc_status: string
          measure_kind: string
          reviewed_at: string | null
          reviewed_by: string | null
          scientific_source: string | null
          scientific_version: string | null
          snomed_ct_code: string | null
          snomed_status: string
          specimen: string
        }
        Insert: {
          approval_status?: string
          canonical_unit?: string | null
          category: string
          code: string
          created_at?: string
          display_name: string
          id?: string
          is_critical?: boolean
          loinc_code?: string | null
          loinc_status?: string
          measure_kind?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          scientific_source?: string | null
          scientific_version?: string | null
          snomed_ct_code?: string | null
          snomed_status?: string
          specimen: string
        }
        Update: {
          approval_status?: string
          canonical_unit?: string | null
          category?: string
          code?: string
          created_at?: string
          display_name?: string
          id?: string
          is_critical?: boolean
          loinc_code?: string | null
          loinc_status?: string
          measure_kind?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          scientific_source?: string | null
          scientific_version?: string | null
          snomed_ct_code?: string | null
          snomed_status?: string
          specimen?: string
        }
        Relationships: []
      }
      biomarkers: {
        Row: {
          ai_insight: string | null
          ai_log_id: string | null
          catalog_id: string | null
          confidence: number | null
          created_at: string | null
          exam_id: string | null
          id: string
          interpretation: string | null
          name: string
          range_extracted: boolean | null
          raw_text: string | null
          reference_max: number | null
          reference_min: number | null
          reference_source: string
          result_type: string
          source: string | null
          synthetic: boolean
          unit: string | null
          user_id: string
          value: number | null
          value_text: string | null
        }
        Insert: {
          ai_insight?: string | null
          ai_log_id?: string | null
          catalog_id?: string | null
          confidence?: number | null
          created_at?: string | null
          exam_id?: string | null
          id?: string
          interpretation?: string | null
          name: string
          range_extracted?: boolean | null
          raw_text?: string | null
          reference_max?: number | null
          reference_min?: number | null
          reference_source: string
          result_type: string
          source?: string | null
          synthetic?: boolean
          unit?: string | null
          user_id: string
          value?: number | null
          value_text?: string | null
        }
        Update: {
          ai_insight?: string | null
          ai_log_id?: string | null
          catalog_id?: string | null
          confidence?: number | null
          created_at?: string | null
          exam_id?: string | null
          id?: string
          interpretation?: string | null
          name?: string
          range_extracted?: boolean | null
          raw_text?: string | null
          reference_max?: number | null
          reference_min?: number | null
          reference_source?: string
          result_type?: string
          source?: string | null
          synthetic?: boolean
          unit?: string | null
          user_id?: string
          value?: number | null
          value_text?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "biomarkers_ai_log_id_fkey"
            columns: ["ai_log_id"]
            isOneToOne: false
            referencedRelation: "ai_processing_log"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "biomarkers_catalog_id_fkey"
            columns: ["catalog_id"]
            isOneToOne: false
            referencedRelation: "biomarker_catalog"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "biomarkers_exam_id_fkey"
            columns: ["exam_id"]
            isOneToOne: false
            referencedRelation: "exams"
            referencedColumns: ["id"]
          },
        ]
      }
      consent_records: {
        Row: {
          accepted_at: string
          consent_type: string
          document_hash: string
          id: string
          ip_address: string | null
          user_agent: string | null
          user_id: string | null
          version: string
        }
        Insert: {
          accepted_at?: string
          consent_type: string
          document_hash: string
          id?: string
          ip_address?: string | null
          user_agent?: string | null
          user_id?: string | null
          version: string
        }
        Update: {
          accepted_at?: string
          consent_type?: string
          document_hash?: string
          id?: string
          ip_address?: string | null
          user_agent?: string | null
          user_id?: string | null
          version?: string
        }
        Relationships: []
      }
      daily_logs: {
        Row: {
          energy: number | null
          id: string
          logged_at: string
          mood: number | null
          sleep_hours: number | null
          user_id: string
          water_liters: number | null
        }
        Insert: {
          energy?: number | null
          id?: string
          logged_at?: string
          mood?: number | null
          sleep_hours?: number | null
          user_id: string
          water_liters?: number | null
        }
        Update: {
          energy?: number | null
          id?: string
          logged_at?: string
          mood?: number | null
          sleep_hours?: number | null
          user_id?: string
          water_liters?: number | null
        }
        Relationships: []
      }
      exams: {
        Row: {
          created_at: string | null
          error_reason: string | null
          exam_date: string | null
          exam_text: string | null
          file_url: string | null
          id: string
          notes: string | null
          page_count: number | null
          pdf_quality: string | null
          status: string | null
          text_truncated: boolean
          type: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          error_reason?: string | null
          exam_date?: string | null
          exam_text?: string | null
          file_url?: string | null
          id?: string
          notes?: string | null
          page_count?: number | null
          pdf_quality?: string | null
          status?: string | null
          text_truncated?: boolean
          type?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          error_reason?: string | null
          exam_date?: string | null
          exam_text?: string | null
          file_url?: string | null
          id?: string
          notes?: string | null
          page_count?: number | null
          pdf_quality?: string | null
          status?: string | null
          text_truncated?: boolean
          type?: string | null
          user_id?: string
        }
        Relationships: []
      }
      feedback_responses: {
        Row: {
          accuracy: string | null
          action_taken: string | null
          comprehension: string | null
          created_at: string
          id: string
          most_useful: string | null
          open_feedback: string | null
          trust: string | null
          user_id: string | null
        }
        Insert: {
          accuracy?: string | null
          action_taken?: string | null
          comprehension?: string | null
          created_at?: string
          id?: string
          most_useful?: string | null
          open_feedback?: string | null
          trust?: string | null
          user_id?: string | null
        }
        Update: {
          accuracy?: string | null
          action_taken?: string | null
          comprehension?: string | null
          created_at?: string
          id?: string
          most_useful?: string | null
          open_feedback?: string | null
          trust?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      insight_feedback: {
        Row: {
          created_at: string
          id: string
          insight_id: string
          rating: string
          template_key: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          insight_id: string
          rating: string
          template_key: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          insight_id?: string
          rating?: string
          template_key?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "insight_feedback_insight_id_fkey"
            columns: ["insight_id"]
            isOneToOne: false
            referencedRelation: "ai_insights"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          age_range: string | null
          avatar_url: string | null
          created_at: string | null
          cycle_length: number | null
          cycle_regularity: string | null
          goals: string[] | null
          id: string
          last_period: string | null
          name: string | null
          pref_daily_reminder: boolean | null
          pref_email_insights: boolean | null
          pref_phase_alerts: boolean | null
          updated_at: string | null
        }
        Insert: {
          age_range?: string | null
          avatar_url?: string | null
          created_at?: string | null
          cycle_length?: number | null
          cycle_regularity?: string | null
          goals?: string[] | null
          id: string
          last_period?: string | null
          name?: string | null
          pref_daily_reminder?: boolean | null
          pref_email_insights?: boolean | null
          pref_phase_alerts?: boolean | null
          updated_at?: string | null
        }
        Update: {
          age_range?: string | null
          avatar_url?: string | null
          created_at?: string | null
          cycle_length?: number | null
          cycle_regularity?: string | null
          goals?: string[] | null
          id?: string
          last_period?: string | null
          name?: string | null
          pref_daily_reminder?: boolean | null
          pref_email_insights?: boolean | null
          pref_phase_alerts?: boolean | null
          updated_at?: string | null
        }
        Relationships: []
      }
      prompt_registry: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          content_hash: string
          created_by: string | null
          deployed_at: string | null
          deprecated_at: string | null
          id: string
          max_tokens: number | null
          operation: string
          status: string | null
          system_prompt: string
          temperature: number | null
          user_prompt_template: string | null
          version: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          content_hash: string
          created_by?: string | null
          deployed_at?: string | null
          deprecated_at?: string | null
          id?: string
          max_tokens?: number | null
          operation: string
          status?: string | null
          system_prompt: string
          temperature?: number | null
          user_prompt_template?: string | null
          version: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          content_hash?: string
          created_by?: string | null
          deployed_at?: string | null
          deprecated_at?: string | null
          id?: string
          max_tokens?: number | null
          operation?: string
          status?: string | null
          system_prompt?: string
          temperature?: number | null
          user_prompt_template?: string | null
          version?: string
        }
        Relationships: []
      }
      usage_events: {
        Row: {
          created_at: string
          event_name: string
          id: string
          metadata: Json | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          event_name: string
          id?: string
          metadata?: Json | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          event_name?: string
          id?: string
          metadata?: Json | null
          user_id?: string | null
        }
        Relationships: []
      }
      waitlist: {
        Row: {
          created_at: string
          email: string
          id: string
          invited_at: string | null
          name: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          invited_at?: string | null
          name: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          invited_at?: string | null
          name?: string
        }
        Relationships: []
      }
    }
    Views: {
      retencao_usuarios: {
        Row: {
          primeiro_em: string | null
          retornou_d14: number | null
          retornou_d30: number | null
          retornou_d7: number | null
          user_id: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      replace_biomarkers: {
        Args: { p_biomarkers: Json; p_exam_id: string; p_user_id: string }
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
