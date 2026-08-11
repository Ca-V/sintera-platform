# Fundação de Storage — persistência de documento/arquivo

**Status:** capacidade de CÓDIGO consolidada. Proprietário: `src/lib/api/storage.ts`.

## Proprietário e conceito
A auditoria (propriedade primeiro) encontrou uma capacidade transversal **sem dono no
lado ESCRITA**: "persistir arquivo privado da usuária → signed URL durável". O lado
LEITURA já tem dono (`lib/provenance`, que inclusive **nomeia** o dono futuro —
`health_documents`/DOC-001), e a infra de CRUD de tabela tem dono (`lib/api/db.ts`, que
declara não cobrir documentos). A escrita estava órfã: o ritual (bucket `'exams'`, TTL
`60*60*24*365`, path `${userId}/<uuid>.<ext>`) reimplementado em 5 call-sites de 4
domínios (Exames captura + página, Ômica, Recursos, Agenda/anexo).

## Fundação
`uploadUserDocument(supabase, { userId, file, prefix?, keepFilename?, ttl? }) → { path, signedUrl }`
— dono único de bucket · TTL · esquema de path. Isomórfico (recebe o SupabaseClient,
browser ou server). Lança em falha de upload; `signedUrl` volta null se a assinatura
falhar (o consumidor decide se é erro — preservando o comportamento de cada call-site:
falha-dura em Exames/Agenda, best-effort em Ômica/Recursos). `DOCUMENTS_BUCKET` e
`DOCUMENT_URL_TTL` são as constantes-fonte; as rotas de exclusão (`api/account`,
`api/exams/[id]`) passam a referenciar `DOCUMENTS_BUCKET` — o nome do bucket tem **uma**
fonte.

## Critério de encerramento (por CONCEITO)
Reauditoria: **nenhum** `.upload`/`createSignedUrl` fora do dono; **nenhuma** string de
bucket `'exams'` hardcoded fora de `lib/api/storage.ts`. O ritual de escrita e o nome do
bucket têm dono único.

## Decisões de PRODUTO/INFRA registradas (NÃO implementadas — dependem do PO)
Estas alteram infra/schema e ficam para decisão do Product Owner; a fundação acima é o
pré-requisito para executá-las **num só lugar**:
1. **Bucket dedicado / `health_documents` (DOC-001):** hoje um único bucket `'exams'`
   guarda exames, ômica, recursos e anexos. Dividir em buckets por tipo e materializar a
   tabela canônica `health_documents` (já prevista em `lib/provenance`) é migração de
   infra + modelo de dados.
2. **Exclusão de conta (LGPD):** `api/account` faz `list(userId)` NÃO-recursivo no bucket
   e não alcança `userId/omics/...` (arquivos de ômica ficam órfãos na exclusão). A
   correção (delete recursivo por prefixos, ou a tabela `health_documents` como índice) é
   decisão de infra à parte.

## Preparação para as próximas fases
Toda ingestão futura (laboratórios, FHIR, Health Connect, wearables, cliente Mobile) que
precise preservar o arquivo de origem usa `uploadUserDocument` — bucket/TTL/path e a
evolução para `health_documents` acontecem sem tocar os domínios.
