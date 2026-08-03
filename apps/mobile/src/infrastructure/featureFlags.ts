// Feature flags (build-time, via EXPO_PUBLIC_*). Permitem PREPARAR mecanismos cujo backend/infra ainda não está
// habilitado, sem expor UI que falharia. Default: desligado. Ativar = setar a env (eas env:set) + rebuild.
//
// `examsDelete`: exclusão de exame pelo dono. Requer a política RLS de DELETE em `exams` (infra compartilhada,
// isolada — MOBILE-030 / D-DEL-1). Quando a RLS for aplicada na janela de infra, ligar
// EXPO_PUBLIC_EXAMS_DELETE_ENABLED=true e rebuildar → a funcionalidade fica imediatamente operacional.
export const featureFlags = {
  examsDelete: process.env.EXPO_PUBLIC_EXAMS_DELETE_ENABLED === 'true',
}
