// @sintera/api-client — Fábrica ÚNICA do cliente Supabase de todo o ecossistema SINTERA.
// Web e Mobile NUNCA chamam createClient() diretamente — só createApiClient(). Toda config do Supabase vive aqui.
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { ApiClient, ApiClientConfig } from './types'
import { signIn } from './login'
import { signOut } from './logout'
import { getSession, onAuthStateChange } from './session'
import { getProfile } from '../profile/get'
import { updateProfile } from '../profile/update'
import { listExams } from '../exams/list'
import { getExam } from '../exams/get'
import { getExamBiomarkers } from '../exams/biomarkers'
import { uploadExam } from '../exams/upload'
import { createExam } from '../exams/create'
import { analyzeExam } from '../exams/analyze'
import { deleteExam } from '../exams/delete'
import { updateExam } from '../exams/update'
import { getExamClinicalResults } from '../exams/clinical'
import { listExamExpenses } from '../exams/expenses'
import { logUsageEvent } from '../events/log'
import { listEvents, saveEvent, deleteEvent } from '../agenda/events'
import { syncLinkedReminder } from '../agenda/reminder'
import { listConditions, saveCondition, deleteCondition } from '../conditions/conditions'
import { listHabits, saveHabit, deleteHabit } from '../habits/habits'

/**
 * >>> ÚNICO ponto de `createClient()` em todo o ecossistema SINTERA. <<<
 * Recebe url/key (injetados por plataforma) e um StorageAdapter genérico; devolve a API de domínio (AuthApi).
 * O cliente Supabase permanece ENCAPSULADO (não é exposto) — impede chamadas diretas ao SDK fora deste pacote.
 */
export function createApiClient(config: ApiClientConfig): ApiClient {
  const supabase: SupabaseClient = createClient(config.url, config.key, {
    auth: {
      // Ponte: StorageAdapter genérico (get/set/remove) → interface de storage do supabase-js (getItem/setItem/removeItem).
      storage: {
        getItem: (key: string) => config.storage.get(key),
        setItem: (key: string, value: string) => config.storage.set(key, value),
        removeItem: (key: string) => config.storage.remove(key),
      },
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  })

  return {
    auth: {
      signIn: (email, password) => signIn(supabase, email, password),
      signOut: () => signOut(supabase),
      getSession: () => getSession(supabase),
      onAuthStateChange: (listener) => onAuthStateChange(supabase, listener),
    },
    profile: {
      getProfile: (signal) => getProfile(supabase, signal),
      updateProfile: (patch, signal) => updateProfile(supabase, patch, signal),
    },
    exams: {
      listExams: (query, signal) => listExams(supabase, query, signal),
      getExam: (id, signal) => getExam(supabase, id, signal),
      getExamBiomarkers: (examId, signal) => getExamBiomarkers(supabase, examId, signal),
      getExamClinicalResults: (examId, signal) => getExamClinicalResults(supabase, examId, signal),
      listExamExpenses: (signal) => listExamExpenses(supabase, signal),
      uploadExam: (file, signal) => uploadExam(supabase, file), // storage não usa abortSignal; signal ignorado
      createExam: (input, signal) => createExam(supabase, input, signal),
      analyzeExam: (id) => analyzeExam(supabase, config.webBaseUrl, id), // ponte transitória (ADR-020)
      deleteExam: (id, signal) => deleteExam(supabase, id, signal), // requer RLS DELETE (isolado — MOBILE-030)
      updateExam: (id, patch, signal) => updateExam(supabase, id, patch, signal),
    },
    events: {
      logEvent: (eventName, metadata) => logUsageEvent(supabase, eventName, metadata),
    },
    agenda: {
      listEvents: (signal) => listEvents(supabase, signal),
      saveEvent: (draft) => saveEvent(supabase, draft),
      deleteEvent: (id) => deleteEvent(supabase, id),
      syncReminder: (link, opts) => syncLinkedReminder(supabase, link, opts),
    },
    conditions: {
      listConditions: (signal) => listConditions(supabase, signal),
      saveCondition: (input) => saveCondition(supabase, input),
      deleteCondition: (id) => deleteCondition(supabase, id),
    },
    habits: {
      listHabits: (signal) => listHabits(supabase, signal),
      saveHabit: (input) => saveHabit(supabase, input),
      deleteHabit: (id) => deleteHabit(supabase, id),
    },
  }
}
