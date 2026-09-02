// TIPOS DO BANCO — GERADOS a partir do esquema de producao (Supabase) em 01/09/2026.
//
// O arquivo anterior era um STUB escrito a mao: 233 linhas cobrindo 6 das 67 tabelas, e mesmo essas pela
// metade (exams tinha 9 das 44 colunas). Consequencia: o compilador nao conseguia checar praticamente
// nenhuma escrita, e por isso toda gravacao da Web passa por row() e as never.
//
// Foi essa cegueira que deixou passar a familia de defeito mais cara deste projeto: coluna criada e
// ausente da consulta, do DTO ou da tela, sem que nada reclamasse.
//
// NAO EDITE A MAO. Regenere apos cada migracao.
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
      activity_sessions: {
        Row: {
          active_energy_kcal: number | null
          activity_type: string
          avg_heart_rate: number | null
          connector_version: string | null
          created_at: string
          distance_m: number | null
          duration_s: number | null
          elevation_gain_m: number | null
          ended_at: string | null
          external_id: string | null
          id: string
          max_heart_rate: number | null
          notes: string | null
          raw: Json | null
          source: string
          started_at: string
          steps: number | null
          title: string | null
          user_id: string
        }
        Insert: {
          active_energy_kcal?: number | null
          activity_type?: string
          avg_heart_rate?: number | null
          connector_version?: string | null
          created_at?: string
          distance_m?: number | null
          duration_s?: number | null
          elevation_gain_m?: number | null
          ended_at?: string | null
          external_id?: string | null
          id?: string
          max_heart_rate?: number | null
          notes?: string | null
          raw?: Json | null
          source: string
          started_at: string
          steps?: number | null
          title?: string | null
          user_id: string
        }
        Update: {
          active_energy_kcal?: number | null
          activity_type?: string
          avg_heart_rate?: number | null
          connector_version?: string | null
          created_at?: string
          distance_m?: number | null
          duration_s?: number | null
          elevation_gain_m?: number | null
          ended_at?: string | null
          external_id?: string | null
          id?: string
          max_heart_rate?: number | null
          notes?: string | null
          raw?: Json | null
          source?: string
          started_at?: string
          steps?: number | null
          title?: string | null
          user_id?: string
        }
        Relationships: []
      }
      agenda_events: {
        Row: {
          created_at: string
          duration_min: number | null
          event_date: string
          event_time: string | null
          event_type: string
          exam_id: string | null
          id: string
          notes: string | null
          reminder_enabled: boolean
          reminder_sent_at: string | null
          status: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          duration_min?: number | null
          event_date: string
          event_time?: string | null
          event_type: string
          exam_id?: string | null
          id?: string
          notes?: string | null
          reminder_enabled?: boolean
          reminder_sent_at?: string | null
          status?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          duration_min?: number | null
          event_date?: string
          event_time?: string | null
          event_type?: string
          exam_id?: string | null
          id?: string
          notes?: string | null
          reminder_enabled?: boolean
          reminder_sent_at?: string | null
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "agenda_events_exam_id_fkey"
            columns: ["exam_id"]
            isOneToOne: false
            referencedRelation: "exams"
            referencedColumns: ["id"]
          },
        ]
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
      ai_insights_archive: {
        Row: {
          ai_log_id: string | null
          archived_at: string
          archived_reason: string
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
          archived_at?: string
          archived_reason?: string
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
          archived_at?: string
          archived_reason?: string
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
        Relationships: []
      }
      ai_processing_log: {
        Row: {
          biomarkers_extracted: number | null
          completed_at: string | null
          completion_tokens: number | null
          document_id: string | null
          duration_ms: number | null
          exam_id: string | null
          extraction_path: string | null
          filter_applied: boolean
          filter_fallback: boolean
          full_text_chars: number | null
          id: string
          input_chars: number | null
          model: string
          operation: string
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
          prompt_version: string | null
          provider: string
          provider_http_status: number | null
          raw_response: string | null
          raw_response_hash: string | null
          repair_method: string | null
          repaired_response_hash: string | null
          reprocessed: boolean
          started_at: string | null
          status: string | null
          stop_reason: string | null
          suspicious_output: boolean | null
          truncated: boolean | null
          user_id: string | null
        }
        Insert: {
          biomarkers_extracted?: number | null
          completed_at?: string | null
          completion_tokens?: number | null
          document_id?: string | null
          duration_ms?: number | null
          exam_id?: string | null
          extraction_path?: string | null
          filter_applied?: boolean
          filter_fallback?: boolean
          full_text_chars?: number | null
          id?: string
          input_chars?: number | null
          model: string
          operation?: string
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
          prompt_version?: string | null
          provider?: string
          provider_http_status?: number | null
          raw_response?: string | null
          raw_response_hash?: string | null
          repair_method?: string | null
          repaired_response_hash?: string | null
          reprocessed?: boolean
          started_at?: string | null
          status?: string | null
          stop_reason?: string | null
          suspicious_output?: boolean | null
          truncated?: boolean | null
          user_id?: string | null
        }
        Update: {
          biomarkers_extracted?: number | null
          completed_at?: string | null
          completion_tokens?: number | null
          document_id?: string | null
          duration_ms?: number | null
          exam_id?: string | null
          extraction_path?: string | null
          filter_applied?: boolean
          filter_fallback?: boolean
          full_text_chars?: number | null
          id?: string
          input_chars?: number | null
          model?: string
          operation?: string
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
          prompt_version?: string | null
          provider?: string
          provider_http_status?: number | null
          raw_response?: string | null
          raw_response_hash?: string | null
          repair_method?: string | null
          repaired_response_hash?: string | null
          reprocessed?: boolean
          started_at?: string | null
          status?: string | null
          stop_reason?: string | null
          suspicious_output?: boolean | null
          truncated?: boolean | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_processing_log_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "patient_documents"
            referencedColumns: ["id"]
          },
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
      billing_invoices: {
        Row: {
          amount_cents: number
          coupon_code: string | null
          credit_cents: number
          currency: string
          discount_cents: number
          due_at: string | null
          external_ref: string | null
          id: string
          issued_at: string
          meta: Json
          paid_at: string | null
          plan_id: string | null
          status: string
          user_id: string
        }
        Insert: {
          amount_cents?: number
          coupon_code?: string | null
          credit_cents?: number
          currency?: string
          discount_cents?: number
          due_at?: string | null
          external_ref?: string | null
          id?: string
          issued_at?: string
          meta?: Json
          paid_at?: string | null
          plan_id?: string | null
          status?: string
          user_id: string
        }
        Update: {
          amount_cents?: number
          coupon_code?: string | null
          credit_cents?: number
          currency?: string
          discount_cents?: number
          due_at?: string | null
          external_ref?: string | null
          id?: string
          issued_at?: string
          meta?: Json
          paid_at?: string | null
          plan_id?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "billing_invoices_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "billing_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      billing_plans: {
        Row: {
          active: boolean
          created_at: string
          entitlements: Json
          id: string
          name: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          entitlements?: Json
          id: string
          name: string
        }
        Update: {
          active?: boolean
          created_at?: string
          entitlements?: Json
          id?: string
          name?: string
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
          {
            foreignKeyName: "biomarker_aliases_catalog_id_fkey"
            columns: ["catalog_id"]
            isOneToOne: false
            referencedRelation: "current_catalog"
            referencedColumns: ["id"]
          },
        ]
      }
      biomarker_catalog: {
        Row: {
          approval_status: string
          body_system: string | null
          canonical_unit: string | null
          catalog_version: number
          category: string
          clinical_domain: string | null
          code: string
          created_at: string
          curation_priority: number | null
          curation_wave: number
          display_name: string
          id: string
          is_critical: boolean
          lifecycle_status: string
          loinc_code: string | null
          loinc_status: string
          material_id: string | null
          measure_kind: string
          omics_domain: string | null
          preferred_name: string | null
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          scientific_name: string | null
          scientific_source: string | null
          scientific_version: string | null
          search_terms: string | null
          short_name: string | null
          snomed_ct_code: string | null
          snomed_status: string
          sort_order: number
          specimen: string
          tags: string[] | null
          ucum_unit: string | null
          visibility: string
        }
        Insert: {
          approval_status?: string
          body_system?: string | null
          canonical_unit?: string | null
          catalog_version?: number
          category: string
          clinical_domain?: string | null
          code: string
          created_at?: string
          curation_priority?: number | null
          curation_wave?: number
          display_name: string
          id?: string
          is_critical?: boolean
          lifecycle_status?: string
          loinc_code?: string | null
          loinc_status?: string
          material_id?: string | null
          measure_kind?: string
          omics_domain?: string | null
          preferred_name?: string | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          scientific_name?: string | null
          scientific_source?: string | null
          scientific_version?: string | null
          search_terms?: string | null
          short_name?: string | null
          snomed_ct_code?: string | null
          snomed_status?: string
          sort_order?: number
          specimen: string
          tags?: string[] | null
          ucum_unit?: string | null
          visibility?: string
        }
        Update: {
          approval_status?: string
          body_system?: string | null
          canonical_unit?: string | null
          catalog_version?: number
          category?: string
          clinical_domain?: string | null
          code?: string
          created_at?: string
          curation_priority?: number | null
          curation_wave?: number
          display_name?: string
          id?: string
          is_critical?: boolean
          lifecycle_status?: string
          loinc_code?: string | null
          loinc_status?: string
          material_id?: string | null
          measure_kind?: string
          omics_domain?: string | null
          preferred_name?: string | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          scientific_name?: string | null
          scientific_source?: string | null
          scientific_version?: string | null
          search_terms?: string | null
          short_name?: string | null
          snomed_ct_code?: string | null
          snomed_status?: string
          sort_order?: number
          specimen?: string
          tags?: string[] | null
          ucum_unit?: string | null
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "biomarker_catalog_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "materials"
            referencedColumns: ["id"]
          },
        ]
      }
      biomarker_panels: {
        Row: {
          catalog_id: string
          panel_id: string
        }
        Insert: {
          catalog_id: string
          panel_id: string
        }
        Update: {
          catalog_id?: string
          panel_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "biomarker_panels_catalog_id_fkey"
            columns: ["catalog_id"]
            isOneToOne: false
            referencedRelation: "biomarker_catalog"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "biomarker_panels_catalog_id_fkey"
            columns: ["catalog_id"]
            isOneToOne: false
            referencedRelation: "current_catalog"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "biomarker_panels_panel_id_fkey"
            columns: ["panel_id"]
            isOneToOne: false
            referencedRelation: "panels"
            referencedColumns: ["id"]
          },
        ]
      }
      biomarkers: {
        Row: {
          ai_insight: string | null
          ai_log_id: string | null
          catalog_id: string | null
          confidence: number | null
          created_at: string | null
          exam_id: string | null
          extraction_version_id: string | null
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
          source_exam_name: string | null
          source_material: string | null
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
          extraction_version_id?: string | null
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
          source_exam_name?: string | null
          source_material?: string | null
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
          extraction_version_id?: string | null
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
          source_exam_name?: string | null
          source_material?: string | null
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
            foreignKeyName: "biomarkers_catalog_id_fkey"
            columns: ["catalog_id"]
            isOneToOne: false
            referencedRelation: "current_catalog"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "biomarkers_exam_id_fkey"
            columns: ["exam_id"]
            isOneToOne: false
            referencedRelation: "exams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "biomarkers_extraction_version_id_fkey"
            columns: ["extraction_version_id"]
            isOneToOne: false
            referencedRelation: "extraction_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      body_metrics: {
        Row: {
          created_at: string
          exam_id: string | null
          id: string
          label: string | null
          measured_at: string | null
          measured_on: string
          metric: string
          notes: string | null
          source: string
          unit: string | null
          user_id: string
          value_text: string
        }
        Insert: {
          created_at?: string
          exam_id?: string | null
          id?: string
          label?: string | null
          measured_at?: string | null
          measured_on: string
          metric: string
          notes?: string | null
          source?: string
          unit?: string | null
          user_id: string
          value_text: string
        }
        Update: {
          created_at?: string
          exam_id?: string | null
          id?: string
          label?: string | null
          measured_at?: string | null
          measured_on?: string
          metric?: string
          notes?: string | null
          source?: string
          unit?: string | null
          user_id?: string
          value_text?: string
        }
        Relationships: [
          {
            foreignKeyName: "body_metrics_exam_id_fkey"
            columns: ["exam_id"]
            isOneToOne: false
            referencedRelation: "exams"
            referencedColumns: ["id"]
          },
        ]
      }
      canonical_rollout_allowlist: {
        Row: {
          added_by: string | null
          created_at: string
          exam_id: string
          expires_at: string | null
          note: string | null
        }
        Insert: {
          added_by?: string | null
          created_at?: string
          exam_id: string
          expires_at?: string | null
          note?: string | null
        }
        Update: {
          added_by?: string | null
          created_at?: string
          exam_id?: string
          expires_at?: string | null
          note?: string | null
        }
        Relationships: []
      }
      canonical_write_telemetry: {
        Row: {
          action: string | null
          created_at: string
          duration_ms: number | null
          exam_id: string | null
          id: string
          pct: number | null
          route_reason: string | null
          version_id: string | null
        }
        Insert: {
          action?: string | null
          created_at?: string
          duration_ms?: number | null
          exam_id?: string | null
          id?: string
          pct?: number | null
          route_reason?: string | null
          version_id?: string | null
        }
        Update: {
          action?: string | null
          created_at?: string
          duration_ms?: number | null
          exam_id?: string | null
          id?: string
          pct?: number | null
          route_reason?: string | null
          version_id?: string | null
        }
        Relationships: []
      }
      catalog_versions: {
        Row: {
          approval_status: string | null
          catalog_id: string
          created_at: string
          id: string
          lifecycle_status: string
          reviewed_at: string | null
          reviewed_by: string | null
          snapshot: Json | null
          version: number
        }
        Insert: {
          approval_status?: string | null
          catalog_id: string
          created_at?: string
          id?: string
          lifecycle_status: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          snapshot?: Json | null
          version: number
        }
        Update: {
          approval_status?: string | null
          catalog_id?: string
          created_at?: string
          id?: string
          lifecycle_status?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          snapshot?: Json | null
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "catalog_versions_catalog_id_fkey"
            columns: ["catalog_id"]
            isOneToOne: false
            referencedRelation: "biomarker_catalog"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "catalog_versions_catalog_id_fkey"
            columns: ["catalog_id"]
            isOneToOne: false
            referencedRelation: "current_catalog"
            referencedColumns: ["id"]
          },
        ]
      }
      clinical_results: {
        Row: {
          anatomy: string | null
          clinical_model: string
          code: string | null
          code_system: string | null
          context: string | null
          contract_version: string | null
          created_at: string
          engine_version: string | null
          exam_id: string
          group_label: string | null
          id: string
          item_type: string | null
          method: string | null
          name: string
          page: number | null
          raw_text: string | null
          reference_text: string | null
          region: string | null
          result_kind: string
          sort_order: number
          source: string
          specimen: string | null
          unit: string | null
          user_id: string
          value_code: string | null
          value_num: number | null
          value_text: string | null
        }
        Insert: {
          anatomy?: string | null
          clinical_model: string
          code?: string | null
          code_system?: string | null
          context?: string | null
          contract_version?: string | null
          created_at?: string
          engine_version?: string | null
          exam_id: string
          group_label?: string | null
          id?: string
          item_type?: string | null
          method?: string | null
          name: string
          page?: number | null
          raw_text?: string | null
          reference_text?: string | null
          region?: string | null
          result_kind: string
          sort_order?: number
          source?: string
          specimen?: string | null
          unit?: string | null
          user_id: string
          value_code?: string | null
          value_num?: number | null
          value_text?: string | null
        }
        Update: {
          anatomy?: string | null
          clinical_model?: string
          code?: string | null
          code_system?: string | null
          context?: string | null
          contract_version?: string | null
          created_at?: string
          engine_version?: string | null
          exam_id?: string
          group_label?: string | null
          id?: string
          item_type?: string | null
          method?: string | null
          name?: string
          page?: number | null
          raw_text?: string | null
          reference_text?: string | null
          region?: string | null
          result_kind?: string
          sort_order?: number
          source?: string
          specimen?: string | null
          unit?: string | null
          user_id?: string
          value_code?: string | null
          value_num?: number | null
          value_text?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clinical_results_exam_id_fkey"
            columns: ["exam_id"]
            isOneToOne: false
            referencedRelation: "exams"
            referencedColumns: ["id"]
          },
        ]
      }
      connector_sync_runs: {
        Row: {
          created_at: string
          error: string | null
          finished_at: string | null
          id: string
          last_success_at: string | null
          records_count: number
          source: string
          started_at: string
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          error?: string | null
          finished_at?: string | null
          id?: string
          last_success_at?: string | null
          records_count?: number
          source: string
          started_at?: string
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          error?: string | null
          finished_at?: string | null
          id?: string
          last_success_at?: string | null
          records_count?: number
          source?: string
          started_at?: string
          status?: string
          user_id?: string
        }
        Relationships: []
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
      content_seen: {
        Row: {
          seen_at: string
          stream: string
          user_id: string
        }
        Insert: {
          seen_at?: string
          stream: string
          user_id: string
        }
        Update: {
          seen_at?: string
          stream?: string
          user_id?: string
        }
        Relationships: []
      }
      contraceptive_methods: {
        Row: {
          brand: string | null
          created_at: string
          duration_months: number | null
          id: string
          kind: string
          notes: string | null
          reminder_enabled: boolean
          reminder_event_id: string | null
          replace_on: string | null
          started_on: string | null
          status: string
          usage_cadence: string | null
          user_id: string
        }
        Insert: {
          brand?: string | null
          created_at?: string
          duration_months?: number | null
          id?: string
          kind: string
          notes?: string | null
          reminder_enabled?: boolean
          reminder_event_id?: string | null
          replace_on?: string | null
          started_on?: string | null
          status?: string
          usage_cadence?: string | null
          user_id: string
        }
        Update: {
          brand?: string | null
          created_at?: string
          duration_months?: number | null
          id?: string
          kind?: string
          notes?: string | null
          reminder_enabled?: boolean
          reminder_event_id?: string | null
          replace_on?: string | null
          started_on?: string | null
          status?: string
          usage_cadence?: string | null
          user_id?: string
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
          bundle_cdu_count: number | null
          bundle_cdu_index: number | null
          bundle_page_end: number | null
          bundle_page_start: number | null
          clinical_family: string | null
          clinical_type: string | null
          created_at: string | null
          current_extraction_version_id: string | null
          display_title: string | null
          document_identity_status: string | null
          document_scope: string | null
          document_sha256: string | null
          document_type: string | null
          equipment: string | null
          error_reason: string | null
          exam_date: string | null
          exam_text: string | null
          exam_text_origin: string | null
          expense_amount_cents: number | null
          expense_doc_type: string | null
          expense_doc_url: string | null
          extraction_completeness: string | null
          extractor_family: string | null
          extractor_version: string | null
          file_url: string | null
          fulfills_order_id: string | null
          id: string
          issuer: string | null
          modality_code: string | null
          notes: string | null
          order_status: string | null
          page_count: number | null
          patient_name: string | null
          pdf_quality: string | null
          processed_at: string | null
          representation_fingerprint: string | null
          requesting_physician: string | null
          resolution_id: string | null
          source_bundle_exam_id: string | null
          status: string | null
          structural_confidence: string | null
          text_transcribed_at: string | null
          text_transcription_log_id: string | null
          text_transcription_prompt_version: string | null
          text_transcription_status: string | null
          text_truncated: boolean
          type: string | null
          understanding_report: Json | null
          user_id: string
        }
        Insert: {
          bundle_cdu_count?: number | null
          bundle_cdu_index?: number | null
          bundle_page_end?: number | null
          bundle_page_start?: number | null
          clinical_family?: string | null
          clinical_type?: string | null
          created_at?: string | null
          current_extraction_version_id?: string | null
          display_title?: string | null
          document_identity_status?: string | null
          document_scope?: string | null
          document_sha256?: string | null
          document_type?: string | null
          equipment?: string | null
          error_reason?: string | null
          exam_date?: string | null
          exam_text?: string | null
          exam_text_origin?: string | null
          expense_amount_cents?: number | null
          expense_doc_type?: string | null
          expense_doc_url?: string | null
          extraction_completeness?: string | null
          extractor_family?: string | null
          extractor_version?: string | null
          file_url?: string | null
          fulfills_order_id?: string | null
          id?: string
          issuer?: string | null
          modality_code?: string | null
          notes?: string | null
          order_status?: string | null
          page_count?: number | null
          patient_name?: string | null
          pdf_quality?: string | null
          processed_at?: string | null
          representation_fingerprint?: string | null
          requesting_physician?: string | null
          resolution_id?: string | null
          source_bundle_exam_id?: string | null
          status?: string | null
          structural_confidence?: string | null
          text_transcribed_at?: string | null
          text_transcription_log_id?: string | null
          text_transcription_prompt_version?: string | null
          text_transcription_status?: string | null
          text_truncated?: boolean
          type?: string | null
          understanding_report?: Json | null
          user_id: string
        }
        Update: {
          bundle_cdu_count?: number | null
          bundle_cdu_index?: number | null
          bundle_page_end?: number | null
          bundle_page_start?: number | null
          clinical_family?: string | null
          clinical_type?: string | null
          created_at?: string | null
          current_extraction_version_id?: string | null
          display_title?: string | null
          document_identity_status?: string | null
          document_scope?: string | null
          document_sha256?: string | null
          document_type?: string | null
          equipment?: string | null
          error_reason?: string | null
          exam_date?: string | null
          exam_text?: string | null
          exam_text_origin?: string | null
          expense_amount_cents?: number | null
          expense_doc_type?: string | null
          expense_doc_url?: string | null
          extraction_completeness?: string | null
          extractor_family?: string | null
          extractor_version?: string | null
          file_url?: string | null
          fulfills_order_id?: string | null
          id?: string
          issuer?: string | null
          modality_code?: string | null
          notes?: string | null
          order_status?: string | null
          page_count?: number | null
          patient_name?: string | null
          pdf_quality?: string | null
          processed_at?: string | null
          representation_fingerprint?: string | null
          requesting_physician?: string | null
          resolution_id?: string | null
          source_bundle_exam_id?: string | null
          status?: string | null
          structural_confidence?: string | null
          text_transcribed_at?: string | null
          text_transcription_log_id?: string | null
          text_transcription_prompt_version?: string | null
          text_transcription_status?: string | null
          text_truncated?: boolean
          type?: string | null
          understanding_report?: Json | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "exams_current_extraction_version_id_fkey"
            columns: ["current_extraction_version_id"]
            isOneToOne: false
            referencedRelation: "extraction_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exams_fulfills_order_id_fkey"
            columns: ["fulfills_order_id"]
            isOneToOne: false
            referencedRelation: "exams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exams_modality_code_fkey"
            columns: ["modality_code"]
            isOneToOne: false
            referencedRelation: "modalities"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "exams_source_bundle_exam_id_fkey"
            columns: ["source_bundle_exam_id"]
            isOneToOne: false
            referencedRelation: "exams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exams_text_transcription_log_id_fkey"
            columns: ["text_transcription_log_id"]
            isOneToOne: false
            referencedRelation: "ai_processing_log"
            referencedColumns: ["id"]
          },
        ]
      }
      extraction_versions: {
        Row: {
          ai_log_id: string | null
          created_at: string
          created_by: string | null
          document_sha256: string | null
          exam_id: string
          extraction_schema_version: number
          extractor_version: string | null
          id: string
          model_version: string | null
          origin: string
          processing_mode: string | null
          promoted_at: string | null
          promoted_by: string | null
          promotion_reason: string | null
          prompt_version: string | null
          reason: string | null
          reused_from_version_id: string | null
          source_text: string | null
          status: string
          user_id: string
          version_number: number
        }
        Insert: {
          ai_log_id?: string | null
          created_at?: string
          created_by?: string | null
          document_sha256?: string | null
          exam_id: string
          extraction_schema_version?: number
          extractor_version?: string | null
          id?: string
          model_version?: string | null
          origin?: string
          processing_mode?: string | null
          promoted_at?: string | null
          promoted_by?: string | null
          promotion_reason?: string | null
          prompt_version?: string | null
          reason?: string | null
          reused_from_version_id?: string | null
          source_text?: string | null
          status?: string
          user_id: string
          version_number: number
        }
        Update: {
          ai_log_id?: string | null
          created_at?: string
          created_by?: string | null
          document_sha256?: string | null
          exam_id?: string
          extraction_schema_version?: number
          extractor_version?: string | null
          id?: string
          model_version?: string | null
          origin?: string
          processing_mode?: string | null
          promoted_at?: string | null
          promoted_by?: string | null
          promotion_reason?: string | null
          prompt_version?: string | null
          reason?: string | null
          reused_from_version_id?: string | null
          source_text?: string | null
          status?: string
          user_id?: string
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "extraction_versions_ai_log_id_fkey"
            columns: ["ai_log_id"]
            isOneToOne: false
            referencedRelation: "ai_processing_log"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "extraction_versions_exam_id_fkey"
            columns: ["exam_id"]
            isOneToOne: false
            referencedRelation: "exams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "extraction_versions_reused_from_version_id_fkey"
            columns: ["reused_from_version_id"]
            isOneToOne: false
            referencedRelation: "extraction_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      eyeglass_prescriptions: {
        Row: {
          bc: string | null
          created_at: string
          dia: string | null
          dnp: string | null
          file_url: string | null
          id: string
          kind: string
          notes: string | null
          od_add: string | null
          od_axis: string | null
          od_cyl: string | null
          od_sph: string | null
          oe_add: string | null
          oe_axis: string | null
          oe_cyl: string | null
          oe_sph: string | null
          prescribed_on: string | null
          prescriber: string | null
          user_id: string
        }
        Insert: {
          bc?: string | null
          created_at?: string
          dia?: string | null
          dnp?: string | null
          file_url?: string | null
          id?: string
          kind?: string
          notes?: string | null
          od_add?: string | null
          od_axis?: string | null
          od_cyl?: string | null
          od_sph?: string | null
          oe_add?: string | null
          oe_axis?: string | null
          oe_cyl?: string | null
          oe_sph?: string | null
          prescribed_on?: string | null
          prescriber?: string | null
          user_id: string
        }
        Update: {
          bc?: string | null
          created_at?: string
          dia?: string | null
          dnp?: string | null
          file_url?: string | null
          id?: string
          kind?: string
          notes?: string | null
          od_add?: string | null
          od_axis?: string | null
          od_cyl?: string | null
          od_sph?: string | null
          oe_add?: string | null
          oe_axis?: string | null
          oe_cyl?: string | null
          oe_sph?: string | null
          prescribed_on?: string | null
          prescriber?: string | null
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
      health_conditions: {
        Row: {
          created_at: string
          file_url: string | null
          id: string
          kind: string | null
          name: string
          notes: string | null
          relative: string | null
          scope: string
          since_label: string | null
          source: string | null
          source_exam_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          file_url?: string | null
          id?: string
          kind?: string | null
          name: string
          notes?: string | null
          relative?: string | null
          scope?: string
          since_label?: string | null
          source?: string | null
          source_exam_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          file_url?: string | null
          id?: string
          kind?: string | null
          name?: string
          notes?: string | null
          relative?: string | null
          scope?: string
          since_label?: string | null
          source?: string | null
          source_exam_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "health_conditions_source_exam_id_fkey"
            columns: ["source_exam_id"]
            isOneToOne: false
            referencedRelation: "exams"
            referencedColumns: ["id"]
          },
        ]
      }
      health_events: {
        Row: {
          amount_cents: number | null
          attachment_url: string | null
          completed_at: string | null
          confidence: string
          created_at: string
          direct_expense: boolean
          duration_min: number | null
          establishment: string | null
          event_date: string
          event_time: string | null
          event_type: string
          expense_doc_type: string | null
          id: string
          is_return: boolean
          links: Json
          location: string | null
          modality: string | null
          notes: string | null
          outcome: Json | null
          parent_event_id: string | null
          preparation: string | null
          priority: string | null
          professional_kind: string | null
          professional_name: string | null
          recurrence_rule: string | null
          reminder_enabled: boolean
          reminder_sent_at: string | null
          root_event_id: string | null
          series_id: string | null
          source: string
          status: string
          synthetic: boolean
          title: string
          user_id: string
        }
        Insert: {
          amount_cents?: number | null
          attachment_url?: string | null
          completed_at?: string | null
          confidence?: string
          created_at?: string
          direct_expense?: boolean
          duration_min?: number | null
          establishment?: string | null
          event_date: string
          event_time?: string | null
          event_type: string
          expense_doc_type?: string | null
          id?: string
          is_return?: boolean
          links?: Json
          location?: string | null
          modality?: string | null
          notes?: string | null
          outcome?: Json | null
          parent_event_id?: string | null
          preparation?: string | null
          priority?: string | null
          professional_kind?: string | null
          professional_name?: string | null
          recurrence_rule?: string | null
          reminder_enabled?: boolean
          reminder_sent_at?: string | null
          root_event_id?: string | null
          series_id?: string | null
          source?: string
          status?: string
          synthetic?: boolean
          title: string
          user_id: string
        }
        Update: {
          amount_cents?: number | null
          attachment_url?: string | null
          completed_at?: string | null
          confidence?: string
          created_at?: string
          direct_expense?: boolean
          duration_min?: number | null
          establishment?: string | null
          event_date?: string
          event_time?: string | null
          event_type?: string
          expense_doc_type?: string | null
          id?: string
          is_return?: boolean
          links?: Json
          location?: string | null
          modality?: string | null
          notes?: string | null
          outcome?: Json | null
          parent_event_id?: string | null
          preparation?: string | null
          priority?: string | null
          professional_kind?: string | null
          professional_name?: string | null
          recurrence_rule?: string | null
          reminder_enabled?: boolean
          reminder_sent_at?: string | null
          root_event_id?: string | null
          series_id?: string | null
          source?: string
          status?: string
          synthetic?: boolean
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      health_resources: {
        Row: {
          attributes: Json
          brand: string | null
          created_at: string
          file_url: string | null
          id: string
          name: string
          notes: string | null
          prescriber: string | null
          resource_type: string
          started_on: string | null
          status: string
          until_date: string | null
          user_id: string
        }
        Insert: {
          attributes?: Json
          brand?: string | null
          created_at?: string
          file_url?: string | null
          id?: string
          name: string
          notes?: string | null
          prescriber?: string | null
          resource_type: string
          started_on?: string | null
          status?: string
          until_date?: string | null
          user_id: string
        }
        Update: {
          attributes?: Json
          brand?: string | null
          created_at?: string
          file_url?: string | null
          id?: string
          name?: string
          notes?: string | null
          prescriber?: string | null
          resource_type?: string
          started_on?: string | null
          status?: string
          until_date?: string | null
          user_id?: string
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
      life_habits: {
        Row: {
          category: string
          created_at: string
          description: string
          frequency: string | null
          goal_amount: number | null
          goal_divisions: number | null
          goal_unit: string | null
          id: string
          notes: string | null
          plan_name: string | null
          plan_url: string | null
          user_id: string
        }
        Insert: {
          category: string
          created_at?: string
          description: string
          frequency?: string | null
          goal_amount?: number | null
          goal_divisions?: number | null
          goal_unit?: string | null
          id?: string
          notes?: string | null
          plan_name?: string | null
          plan_url?: string | null
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string
          frequency?: string | null
          goal_amount?: number | null
          goal_divisions?: number | null
          goal_unit?: string | null
          id?: string
          notes?: string | null
          plan_name?: string | null
          plan_url?: string | null
          user_id?: string
        }
        Relationships: []
      }
      materials: {
        Row: {
          id: string
          label: string
          sort_order: number
        }
        Insert: {
          id: string
          label: string
          sort_order?: number
        }
        Update: {
          id?: string
          label?: string
          sort_order?: number
        }
        Relationships: []
      }
      medications: {
        Row: {
          acquired_quantity: number | null
          administration_route: string | null
          amount_cents: number | null
          brand: string | null
          created_at: string
          daily_consumption: number | null
          dose: string | null
          frequency: string | null
          id: string
          kind: string
          name: string
          notes: string | null
          pack_quantity: number | null
          pack_unit: string | null
          pharmaceutical_form: string | null
          prescriber_name: string | null
          prescription_url: string | null
          purchase_event_id: string | null
          purchase_status: string | null
          purchased_on: string | null
          repurchase_event_id: string | null
          repurchase_frequency: string | null
          repurchase_reminder: boolean
          started_on: string | null
          status: string
          until_date: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          acquired_quantity?: number | null
          administration_route?: string | null
          amount_cents?: number | null
          brand?: string | null
          created_at?: string
          daily_consumption?: number | null
          dose?: string | null
          frequency?: string | null
          id?: string
          kind?: string
          name: string
          notes?: string | null
          pack_quantity?: number | null
          pack_unit?: string | null
          pharmaceutical_form?: string | null
          prescriber_name?: string | null
          prescription_url?: string | null
          purchase_event_id?: string | null
          purchase_status?: string | null
          purchased_on?: string | null
          repurchase_event_id?: string | null
          repurchase_frequency?: string | null
          repurchase_reminder?: boolean
          started_on?: string | null
          status?: string
          until_date?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          acquired_quantity?: number | null
          administration_route?: string | null
          amount_cents?: number | null
          brand?: string | null
          created_at?: string
          daily_consumption?: number | null
          dose?: string | null
          frequency?: string | null
          id?: string
          kind?: string
          name?: string
          notes?: string | null
          pack_quantity?: number | null
          pack_unit?: string | null
          pharmaceutical_form?: string | null
          prescriber_name?: string | null
          prescription_url?: string | null
          purchase_event_id?: string | null
          purchase_status?: string | null
          purchased_on?: string | null
          repurchase_event_id?: string | null
          repurchase_frequency?: string | null
          repurchase_reminder?: boolean
          started_on?: string | null
          status?: string
          until_date?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "medications_repurchase_event_id_fkey"
            columns: ["repurchase_event_id"]
            isOneToOne: false
            referencedRelation: "agenda_events"
            referencedColumns: ["id"]
          },
        ]
      }
      menstrual_periods: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          started_on: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          started_on: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          started_on?: string
          user_id?: string
        }
        Relationships: []
      }
      modalities: {
        Row: {
          active: boolean
          code: string
          created_at: string
          display_order: number | null
          domain: string | null
          label: string
        }
        Insert: {
          active?: boolean
          code: string
          created_at?: string
          display_order?: number | null
          domain?: string | null
          label: string
        }
        Update: {
          active?: boolean
          code?: string
          created_at?: string
          display_order?: number | null
          domain?: string | null
          label?: string
        }
        Relationships: []
      }
      notification_preferences: {
        Row: {
          category: string
          channel: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category: string
          channel?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string
          channel?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      omics_aliases: {
        Row: {
          alias: string
          alias_norm: string
          catalog_id: string
          created_at: string
          domain: string
          id: string
          source: string | null
        }
        Insert: {
          alias: string
          alias_norm: string
          catalog_id: string
          created_at?: string
          domain: string
          id?: string
          source?: string | null
        }
        Update: {
          alias?: string
          alias_norm?: string
          catalog_id?: string
          created_at?: string
          domain?: string
          id?: string
          source?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "omics_aliases_catalog_id_fkey"
            columns: ["catalog_id"]
            isOneToOne: false
            referencedRelation: "omics_catalog"
            referencedColumns: ["id"]
          },
        ]
      }
      omics_catalog: {
        Row: {
          canonical_name: string
          category_id: string | null
          created_at: string
          curation_status: string
          description: string | null
          domain: string
          id: string
          source: string | null
          unit_default: string | null
          updated_at: string
          version: number
        }
        Insert: {
          canonical_name: string
          category_id?: string | null
          created_at?: string
          curation_status?: string
          description?: string | null
          domain: string
          id?: string
          source?: string | null
          unit_default?: string | null
          updated_at?: string
          version?: number
        }
        Update: {
          canonical_name?: string
          category_id?: string | null
          created_at?: string
          curation_status?: string
          description?: string | null
          domain?: string
          id?: string
          source?: string | null
          unit_default?: string | null
          updated_at?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "omics_catalog_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "omics_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      omics_categories: {
        Row: {
          created_at: string
          display_order: number
          domain: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          domain: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          display_order?: number
          domain?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      omics_curation_log: {
        Row: {
          action: string
          catalog_id: string
          created_at: string
          curated_by: string | null
          detail: Json
          id: string
          status_after: string | null
          status_before: string | null
          version: number | null
        }
        Insert: {
          action: string
          catalog_id: string
          created_at?: string
          curated_by?: string | null
          detail?: Json
          id?: string
          status_after?: string | null
          status_before?: string | null
          version?: number | null
        }
        Update: {
          action?: string
          catalog_id?: string
          created_at?: string
          curated_by?: string | null
          detail?: Json
          id?: string
          status_after?: string | null
          status_before?: string | null
          version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "omics_curation_log_catalog_id_fkey"
            columns: ["catalog_id"]
            isOneToOne: false
            referencedRelation: "omics_catalog"
            referencedColumns: ["id"]
          },
        ]
      }
      omics_external_references: {
        Row: {
          catalog_id: string
          created_at: string
          external_id: string
          id: string
          source: string
          url: string | null
        }
        Insert: {
          catalog_id: string
          created_at?: string
          external_id: string
          id?: string
          source: string
          url?: string | null
        }
        Update: {
          catalog_id?: string
          created_at?: string
          external_id?: string
          id?: string
          source?: string
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "omics_external_references_catalog_id_fkey"
            columns: ["catalog_id"]
            isOneToOne: false
            referencedRelation: "omics_catalog"
            referencedColumns: ["id"]
          },
        ]
      }
      omics_panels: {
        Row: {
          collected_on: string | null
          created_at: string
          domain: string
          exam_id: string | null
          id: string
          laboratory: string | null
          platform: string | null
          technology: string | null
          total_features: number | null
          user_id: string
        }
        Insert: {
          collected_on?: string | null
          created_at?: string
          domain: string
          exam_id?: string | null
          id?: string
          laboratory?: string | null
          platform?: string | null
          technology?: string | null
          total_features?: number | null
          user_id: string
        }
        Update: {
          collected_on?: string | null
          created_at?: string
          domain?: string
          exam_id?: string | null
          id?: string
          laboratory?: string | null
          platform?: string | null
          technology?: string | null
          total_features?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "omics_panels_exam_id_fkey"
            columns: ["exam_id"]
            isOneToOne: false
            referencedRelation: "exams"
            referencedColumns: ["id"]
          },
        ]
      }
      omics_results: {
        Row: {
          category_id: string | null
          created_at: string
          detection_status: string | null
          domain: string
          extraction_version_id: string | null
          feature_id: string | null
          feature_name: string
          id: string
          measured_on: string | null
          method: string | null
          panel_id: string
          raw_value: string | null
          unit: string | null
          user_id: string
          value: number | null
        }
        Insert: {
          category_id?: string | null
          created_at?: string
          detection_status?: string | null
          domain: string
          extraction_version_id?: string | null
          feature_id?: string | null
          feature_name: string
          id?: string
          measured_on?: string | null
          method?: string | null
          panel_id: string
          raw_value?: string | null
          unit?: string | null
          user_id: string
          value?: number | null
        }
        Update: {
          category_id?: string | null
          created_at?: string
          detection_status?: string | null
          domain?: string
          extraction_version_id?: string | null
          feature_id?: string | null
          feature_name?: string
          id?: string
          measured_on?: string | null
          method?: string | null
          panel_id?: string
          raw_value?: string | null
          unit?: string | null
          user_id?: string
          value?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "omics_results_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "omics_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "omics_results_extraction_version_id_fkey"
            columns: ["extraction_version_id"]
            isOneToOne: false
            referencedRelation: "extraction_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "omics_results_feature_catalog_fkey"
            columns: ["feature_id"]
            isOneToOne: false
            referencedRelation: "omics_catalog"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "omics_results_panel_id_fkey"
            columns: ["panel_id"]
            isOneToOne: false
            referencedRelation: "omics_panels"
            referencedColumns: ["id"]
          },
        ]
      }
      omics_versions: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          note: string | null
          panel_id: string
          source_file: string | null
          user_id: string
          version_number: number
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          note?: string | null
          panel_id: string
          source_file?: string | null
          user_id: string
          version_number: number
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          note?: string | null
          panel_id?: string
          source_file?: string | null
          user_id?: string
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "omics_versions_panel_id_fkey"
            columns: ["panel_id"]
            isOneToOne: false
            referencedRelation: "omics_panels"
            referencedColumns: ["id"]
          },
        ]
      }
      panels: {
        Row: {
          id: string
          label: string
          sort_order: number
        }
        Insert: {
          id: string
          label: string
          sort_order?: number
        }
        Update: {
          id?: string
          label?: string
          sort_order?: number
        }
        Relationships: []
      }
      patient_document_files: {
        Row: {
          created_at: string
          document_id: string
          document_sha256: string | null
          file_name: string | null
          file_url: string
          id: string
          mime_type: string | null
          position: number
          size_bytes: number | null
          user_id: string
        }
        Insert: {
          created_at?: string
          document_id: string
          document_sha256?: string | null
          file_name?: string | null
          file_url: string
          id?: string
          mime_type?: string | null
          position?: number
          size_bytes?: number | null
          user_id: string
        }
        Update: {
          created_at?: string
          document_id?: string
          document_sha256?: string | null
          file_name?: string | null
          file_url?: string
          id?: string
          mime_type?: string | null
          position?: number
          size_bytes?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "patient_document_files_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "patient_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      patient_document_links: {
        Row: {
          created_at: string
          document_id: string
          id: string
          target_domain: string
          target_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          document_id: string
          id?: string
          target_domain: string
          target_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          document_id?: string
          id?: string
          target_domain?: string
          target_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "patient_document_links_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "patient_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      patient_documents: {
        Row: {
          created_at: string
          doc_date: string | null
          document_sha256: string | null
          file_url: string
          id: string
          institution_name: string | null
          issuer: string | null
          notes: string | null
          prescribed_items: string[] | null
          professional_name: string | null
          source: string
          status: string
          subtype: string
          transcricao: string | null
          transcricao_log_id: string | null
          transcricao_origin: string | null
          transcricao_prompt_version: string | null
          transcricao_status: string | null
          transcrito_em: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          doc_date?: string | null
          document_sha256?: string | null
          file_url: string
          id?: string
          institution_name?: string | null
          issuer?: string | null
          notes?: string | null
          prescribed_items?: string[] | null
          professional_name?: string | null
          source?: string
          status?: string
          subtype?: string
          transcricao?: string | null
          transcricao_log_id?: string | null
          transcricao_origin?: string | null
          transcricao_prompt_version?: string | null
          transcricao_status?: string | null
          transcrito_em?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          doc_date?: string | null
          document_sha256?: string | null
          file_url?: string
          id?: string
          institution_name?: string | null
          issuer?: string | null
          notes?: string | null
          prescribed_items?: string[] | null
          professional_name?: string | null
          source?: string
          status?: string
          subtype?: string
          transcricao?: string | null
          transcricao_log_id?: string | null
          transcricao_origin?: string | null
          transcricao_prompt_version?: string | null
          transcricao_status?: string | null
          transcrito_em?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "patient_documents_transcricao_log_id_fkey"
            columns: ["transcricao_log_id"]
            isOneToOne: false
            referencedRelation: "ai_processing_log"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_methods: {
        Row: {
          brand: string | null
          created_at: string
          external_ref: string | null
          id: string
          is_default: boolean
          kind: string
          last4: string | null
          user_id: string
        }
        Insert: {
          brand?: string | null
          created_at?: string
          external_ref?: string | null
          id?: string
          is_default?: boolean
          kind: string
          last4?: string | null
          user_id: string
        }
        Update: {
          brand?: string | null
          created_at?: string
          external_ref?: string | null
          id?: string
          is_default?: boolean
          kind?: string
          last4?: string | null
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          age_range: string | null
          avatar_url: string | null
          birth_date: string | null
          created_at: string | null
          cycle_length: number | null
          cycle_regularity: string | null
          goals: string[] | null
          height_cm: number | null
          id: string
          last_period: string | null
          last_seen_at: string | null
          name: string | null
          phone: string | null
          pref_daily_reminder: boolean | null
          pref_email_insights: boolean | null
          pref_phase_alerts: boolean | null
          pref_whatsapp_reminder: boolean
          updated_at: string | null
          weight_goal_kg: number | null
        }
        Insert: {
          age_range?: string | null
          avatar_url?: string | null
          birth_date?: string | null
          created_at?: string | null
          cycle_length?: number | null
          cycle_regularity?: string | null
          goals?: string[] | null
          height_cm?: number | null
          id: string
          last_period?: string | null
          last_seen_at?: string | null
          name?: string | null
          phone?: string | null
          pref_daily_reminder?: boolean | null
          pref_email_insights?: boolean | null
          pref_phase_alerts?: boolean | null
          pref_whatsapp_reminder?: boolean
          updated_at?: string | null
          weight_goal_kg?: number | null
        }
        Update: {
          age_range?: string | null
          avatar_url?: string | null
          birth_date?: string | null
          created_at?: string | null
          cycle_length?: number | null
          cycle_regularity?: string | null
          goals?: string[] | null
          height_cm?: number | null
          id?: string
          last_period?: string | null
          last_seen_at?: string | null
          name?: string | null
          phone?: string | null
          pref_daily_reminder?: boolean | null
          pref_email_insights?: boolean | null
          pref_phase_alerts?: boolean | null
          pref_whatsapp_reminder?: boolean
          updated_at?: string | null
          weight_goal_kg?: number | null
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
      report_shares: {
        Row: {
          created_at: string
          excluded: Json
          expires_at: string
          id: string
          period: Json | null
          revoked: boolean
          sections: Json | null
          token: string
          user_id: string
        }
        Insert: {
          created_at?: string
          excluded?: Json
          expires_at: string
          id?: string
          period?: Json | null
          revoked?: boolean
          sections?: Json | null
          token?: string
          user_id: string
        }
        Update: {
          created_at?: string
          excluded?: Json
          expires_at?: string
          id?: string
          period?: Json | null
          revoked?: boolean
          sections?: Json | null
          token?: string
          user_id?: string
        }
        Relationships: []
      }
      report_templates: {
        Row: {
          created_at: string
          id: string
          name: string
          selection: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          selection?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          selection?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      subscription_events: {
        Row: {
          action: string
          created_at: string
          external_ref: string | null
          from_status: string | null
          id: string
          plan_id: string | null
          source: string
          to_status: string
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          external_ref?: string | null
          from_status?: string | null
          id?: string
          plan_id?: string | null
          source?: string
          to_status: string
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          external_ref?: string | null
          from_status?: string | null
          id?: string
          plan_id?: string | null
          source?: string
          to_status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscription_events_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "billing_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          auto_renew: boolean
          current_period_end: string | null
          grace_until: string | null
          meta: Json
          payment_method: string | null
          plan_id: string
          status: string
          trial_ends_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          auto_renew?: boolean
          current_period_end?: string | null
          grace_until?: string | null
          meta?: Json
          payment_method?: string | null
          plan_id: string
          status?: string
          trial_ends_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          auto_renew?: boolean
          current_period_end?: string | null
          grace_until?: string | null
          meta?: Json
          payment_method?: string | null
          plan_id?: string
          status?: string
          trial_ends_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "billing_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      system_flags: {
        Row: {
          key: string
          updated_at: string
          updated_by: string | null
          value: string
        }
        Insert: {
          key: string
          updated_at?: string
          updated_by?: string | null
          value: string
        }
        Update: {
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: string
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
      wearable_connections: {
        Row: {
          access_token: string | null
          created_at: string
          expires_at: string | null
          external_user_id: string | null
          id: string
          provider: string
          refresh_token: string | null
          scope: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          access_token?: string | null
          created_at?: string
          expires_at?: string | null
          external_user_id?: string | null
          id?: string
          provider: string
          refresh_token?: string | null
          scope?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          access_token?: string | null
          created_at?: string
          expires_at?: string | null
          external_user_id?: string | null
          id?: string
          provider?: string
          refresh_token?: string | null
          scope?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      wearable_readings: {
        Row: {
          connector_version: string | null
          created_at: string
          external_id: string | null
          id: string
          metric: string
          provider: string
          raw: Json | null
          recorded_at: string
          unit: string | null
          user_id: string
          value: number | null
        }
        Insert: {
          connector_version?: string | null
          created_at?: string
          external_id?: string | null
          id?: string
          metric: string
          provider: string
          raw?: Json | null
          recorded_at: string
          unit?: string | null
          user_id: string
          value?: number | null
        }
        Update: {
          connector_version?: string | null
          created_at?: string
          external_id?: string | null
          id?: string
          metric?: string
          provider?: string
          raw?: Json | null
          recorded_at?: string
          unit?: string | null
          user_id?: string
          value?: number | null
        }
        Relationships: []
      }
    }
    Views: {
      current_biomarkers: {
        Row: {
          ai_insight: string | null
          ai_log_id: string | null
          catalog_id: string | null
          confidence: number | null
          created_at: string | null
          exam_id: string | null
          extraction_version_id: string | null
          id: string | null
          interpretation: string | null
          name: string | null
          range_extracted: boolean | null
          raw_text: string | null
          reference_max: number | null
          reference_min: number | null
          reference_source: string | null
          result_type: string | null
          source: string | null
          source_exam_name: string | null
          source_material: string | null
          synthetic: boolean | null
          unit: string | null
          user_id: string | null
          value: number | null
          value_text: string | null
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
            foreignKeyName: "biomarkers_catalog_id_fkey"
            columns: ["catalog_id"]
            isOneToOne: false
            referencedRelation: "current_catalog"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "biomarkers_exam_id_fkey"
            columns: ["exam_id"]
            isOneToOne: false
            referencedRelation: "exams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "biomarkers_extraction_version_id_fkey"
            columns: ["extraction_version_id"]
            isOneToOne: false
            referencedRelation: "extraction_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      current_catalog: {
        Row: {
          approval_status: string | null
          body_system: string | null
          canonical_unit: string | null
          catalog_version: number | null
          category: string | null
          clinical_domain: string | null
          code: string | null
          compat_category: string | null
          compat_specimen: string | null
          created_at: string | null
          curation_priority: number | null
          curation_wave: number | null
          display_name: string | null
          id: string | null
          is_critical: boolean | null
          lifecycle_status: string | null
          loinc_code: string | null
          loinc_status: string | null
          material_id: string | null
          material_label: string | null
          measure_kind: string | null
          omics_domain: string | null
          panels: Json | null
          preferred_name: string | null
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          scientific_name: string | null
          scientific_source: string | null
          scientific_version: string | null
          search_terms: string | null
          short_name: string | null
          snomed_ct_code: string | null
          snomed_status: string | null
          sort_order: number | null
          specimen: string | null
          tags: string[] | null
          ucum_unit: string | null
          visibility: string | null
        }
        Relationships: [
          {
            foreignKeyName: "biomarker_catalog_material_id_fkey"
            columns: ["compat_specimen"]
            isOneToOne: false
            referencedRelation: "materials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "biomarker_catalog_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "materials"
            referencedColumns: ["id"]
          },
        ]
      }
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
      wearable_connection_status: {
        Row: {
          created_at: string | null
          expires_at: string | null
          provider: string | null
          scope: string | null
          status: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          expires_at?: string | null
          provider?: string | null
          scope?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          expires_at?: string | null
          provider?: string | null
          scope?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      canonical_route: { Args: { p_exam_id: string }; Returns: string }
      next_resolution_id: { Args: never; Returns: string }
      omics_ingest: {
        Args: {
          p_domain: string
          p_measured_on: string
          p_note: string
          p_panel: string
          p_rows: Json
          p_source_file: string
        }
        Returns: Json
      }
      omics_panel_categories: {
        Args: { p_panel: string }
        Returns: {
          category_id: string
          display_order: number
          n: number
          name: string
        }[]
      }
      omics_resolve_feature: {
        Args: { p_domain: string; p_term: string }
        Returns: string
      }
      replace_biomarkers: {
        Args: { p_biomarkers: Json; p_exam_id: string; p_user_id: string }
        Returns: undefined
      }
      seed_demo: { Args: { p_email?: string }; Returns: string }
      should_write_canonical: { Args: { p_exam_id: string }; Returns: boolean }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
      write_canonical_extraction: {
        Args: {
          p_biomarkers: Json
          p_exam_id: string
          p_meta: Json
          p_user_id: string
        }
        Returns: Json
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

// Atalhos usados pelo codigo. Preservados do arquivo anterior.
export type Profile = Database['public']['Tables']['profiles']['Row']
export type Exam = Database['public']['Tables']['exams']['Row']
export type Biomarker = Database['public']['Tables']['biomarkers']['Row']
export type AiInsight = Database['public']['Tables']['ai_insights']['Row']
export type BiologicalScore = Database['public']['Tables']['biological_scores']['Row']
