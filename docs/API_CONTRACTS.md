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
- *(futuros: Documents/Upload, Registro Manual, Composição, Agenda, Insights — entram com bump de versão.)*

**Convenções (congeladas):** leitura → `T | null` (null = linha inexistente) ou `T[]`, **LANÇA** em falha
operacional; escrita → `{ error: Error | null }` (não lança). DTOs **enxutos** (só campos centrais de exibição;
campos internos/financeiros/de outros domínios **não vazam**). Tipos: `packages/api-client/src/{profile,exams}/types.ts`.

**Compatível com:**
- **Web** `0.1.0` (consumo pleno pendente — a Web ainda não migrou para o `@sintera/api-client`; ver
  [PARIDADE_WEB_MOBILE](PARIDADE_WEB_MOBILE.md) e [BACKLOG_MOBILE §Paridade](BACKLOG_MOBILE.md))
- **Mobile** `0.0.0` (consome `auth`+`profile`; `exams` no Inc.5)

## Controle de mudança
- **PATCH** (ex.: v1.0 → v1.0.1): correção sem alterar assinatura/semântica.
- **MINOR** (v1.0 → v1.1): novo domínio/operação **retrocompatível**.
- **MAJOR** (v1.x → v2.0): mudança **incompatível** de assinatura/semântica — exige plano de migração Web+Mobile
  e **escalonamento**.

Registrar cada mudança com data, versão, o que mudou e a compatibilidade Web/Mobile resultante.
