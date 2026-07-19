// Limite de upload de documentos (Exames e Hub de Registro) — SSOT único.
//
// Missão SINTERA: a plataforma deve aceitar QUALQUER exame. O antigo teto de 50 MB era uma escolha
// da aplicação (não do storage — o bucket 'exams' não tem file_size_limit). Elevado aqui, num só lugar.
//
// TETO REAL (infra, fora do código): o limite GLOBAL de upload do projeto Supabase (Storage → Settings)
// ainda vale para uploads padrão. Para arquivos acima dele, o caminho definitivo é upload RESUMABLE (TUS).
// Enquanto isso, o documento é sempre PRESERVADO no storage; a extração automática é best-effort.
export const MAX_UPLOAD_MB = 200
export const MAX_UPLOAD_BYTES = MAX_UPLOAD_MB * 1024 * 1024
