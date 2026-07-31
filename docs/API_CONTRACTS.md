# API_CONTRACTS — Versionamento dos contratos compartilhados (`@sintera/api-client`)

Documento **vivo** (fundadora, 2026-07-31; [ADR-019](adr/ADR-019_GOVERNANCA_CICLO_INCREMENTOS.md)). Web e Mobile
**evoluem em paralelo consumindo os MESMOS contratos** — versioná-los explicitamente evita ambiguidade e
controla mudanças. **Nenhuma tela acessa o Supabase direto**: tudo por `ApiClient` (ponto único, Inc.1).

> **Governança:** alterar um contrato público destes é **item de ESCALONAMENTO** (mandato — "alteração dos
> contratos públicos da plataforma"), não decisão técnica rotineira. Mudança ⇒ **bump de versão** + registro aqui.

## API Contracts — **v1.0** (2026-07-31)

**Domínios expostos por `ApiClient`:**
- **auth** — `getSession` · `onAuthStateChange` · `signIn` · `signOut`. (Inc.1)
- **profile** — `getProfile(signal?) → ProfileDTO | null` · `updateProfile(patch: ProfileEditable, signal?) → { error }`. (Inc.4)
- **exams** — `listExams(query?, signal?) → ExamDTO[]` · `getExam(id, signal?) → ExamDTO | null`. (Inc.5, leitura)
- **exams — escrita (DEFINIDO, Inc.6; pré-implementação)** — `uploadExam(file, signal?) → { data: UploadResult | null, error }` · `createExam(input, signal?) → { data: { id } | null, error }`. Contrato aprovado (fundadora 31/07); **operações separadas** e **fluxo em 2 etapas** (`uploadExam → createExam`). Entra no `ApiClient` concreto com **bump MINOR (v1.1)** na implementação (pós-aceite do Inc.5). Tipos: `exams/write.ts`; port de seleção `device/documentPicker.ts`; validação `exams/validateUpload.ts`. Ver [MOBILE-027](MOBILE-027_READINESS_INCREMENTO6_UPLOAD.md).
- *(futuros: Registro Manual, Composição, Agenda, Insights — entram com bump de versão.)*

**Convenções (congeladas):** leitura → `T | null` (null = linha inexistente) ou `T[]`, **LANÇA** em falha
operacional; escrita → `{ error: Error | null }` (não lança). DTOs **enxutos** (só campos centrais de exibição;
campos internos/financeiros/de outros domínios **não vazam**). Tipos: `packages/api-client/src/{profile,exams}/types.ts`.

**Estado e compatibilidade por domínio:**

| Domínio | Versão | Status | Última alteração | Commit (referência) | Compatível com |
|---------|--------|--------|------------------|---------------------|----------------|
| `auth` | v1 | **Estável** | 2026-07 (Inc.1) | `mobile-inc1-accepted` | Web `>=0.1.0` · Mobile `>=0.0.0` |
| `profile` | v1 | **Estável** | 2026-07-31 | `c65b4cb` (consumo Mobile) | Web `>=0.1.0` (a migrar) · Mobile `>=0.0.0` |
| `exams` | v1 | **Estável (leitura)** | 2026-07-31 | `483692c` (merge p/ Mobile) | Web `>=0.1.0` · Mobile `>=0.0.0` (Inc.5) |

> **Nota de paridade:** a **Web** ainda **não migrou** para o `@sintera/api-client` (predata o cliente
> compartilhado, nascido no Mobile Inc.1). Ao descongelar a Web, alinhá-la aos contratos v1 (Prioridade B) —
> ver [PARIDADE_WEB_MOBILE](PARIDADE_WEB_MOBILE.md) e [BACKLOG_MOBILE §Paridade](BACKLOG_MOBILE.md). Registrado
> como risco [R-008](../RISK_REGISTER.md).

## Controle de mudança
- **PATCH** (ex.: v1.0 → v1.0.1): correção sem alterar assinatura/semântica.
- **MINOR** (v1.0 → v1.1): novo domínio/operação **retrocompatível**.
- **MAJOR** (v1.x → v2.0): mudança **incompatível** de assinatura/semântica — exige plano de migração Web+Mobile
  e **escalonamento**.

Registrar cada mudança com data, versão, o que mudou e a compatibilidade Web/Mobile resultante.
