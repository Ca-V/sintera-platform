# BASELINE DO PROJETO — SINTERA

Documento **vivo** (fundadora, 2026-07-31). Consolida o estado do sistema num ponto no tempo, para auditoria e
retomada por qualquer dev. **Atualizado após cada Aceito** de incremento (etapa obrigatória — [MOBILE-022](docs/MOBILE-022_TEMPLATE_EVIDENCIAS_INCREMENTO.md)).

- **Última atualização:** 2026-07-31 · **após:** Inc3 Aceito (Inc4 em Verificado)
- **Branch de trabalho Mobile:** `feat/mobile-inc4-perfil`

## 1. Roadmap / estados (Mobile — Onda 1)

| Inc | Nome | Estado | Gate para "Em Implementação" |
|-----|------|--------|------------------------------|
| 1 | Autenticação | ✅ Aceito | — |
| 2 | Navegação | ✅ Aceito | — |
| 3 | Home Shell | ✅ Aceito | — |
| 4 | Perfil | 🔄 **Verificado** | Homologação Android (build EAS `5b3df1fb`) |
| 5 | Histórico de Exames | 📋 **Planejado** | **Aceite do Inc4** |
| 6–11 | Upload · Registro Manual · RegistrationHub · Composição Corporal · Agenda · Insights | ⬜ | aceite do anterior |

Detalhe: [MOBILE-015](docs/MOBILE-015_ROADMAP_INCREMENTOS.md). Estados: [MOBILE-022](docs/MOBILE-022_TEMPLATE_EVIDENCIAS_INCREMENTO.md).

## 2. ADRs / princípios estruturais em vigor
ADR-012 (Continuidade Operacional) · ADR-016 (React único temporário) · ADR-017 (guarda de logout) · ADR-018
(Home = composição de slots) · **ADR-019 (governança do ciclo de incrementos: 5 estados · baseline · gates ·
rastreabilidade)** · DS-002 (Design System congelado) · REG-001 (fronteira factual) · política de validação
**nuvem-first** ([MOBILE-015](docs/MOBILE-015_ROADMAP_INCREMENTOS.md)).

## 3. Contratos compartilhados (`@sintera/*`) — Web e Mobile consomem os mesmos
- **api-client:** `auth` · `profile` (getProfile/updateProfile) · `exams` (listExams/getExam). Fronteira: nenhum
  Supabase direto nas telas (ponto único de cliente). DTOs enxutos (só campos centrais).
- **validation** (validateName/Phone/ProfileEditable) · **types** (Result/PageRequest/DateRange) · **core**
  (timeline) · **utils** (initials/string) · **design-system** (DS-002).

## 4. Backlog, Riscos, Rastreabilidade e Contratos
- Backlog Mobile: [docs/BACKLOG_MOBILE.md](docs/BACKLOG_MOBILE.md).
- Registro de riscos: [RISK_REGISTER.md](RISK_REGISTER.md) (8 riscos; R-001 AVG Aberto; R-002 EAS Monitorado).
- Rastreabilidade (requisito↔inc↔evidência↔estado): [TRACEABILITY_MATRIX.md](TRACEABILITY_MATRIX.md).
- Contratos de API versionados: [docs/API_CONTRACTS.md](docs/API_CONTRACTS.md) (**v1.0**: auth·profile·exams).

## 5. Versões
- **Mobile:** app version `0.0.0` (build 1) · Expo SDK 54 · RN 0.81.5 · React 19.1.0 · eas-cli 21.4.0 · Node 22.x.
- **Web:** ver `package.json` (Next 16 · React 19.2.x). Web **congelada** como referência (DS-002).
- **Banco:** Supabase `pxiglvrgxooawetboglb`; sem migrations novas no Inc.4/5 (tabelas já existem; RLS reusada).

## 6. Como retomar (qualquer dev)
`git clone` → `git checkout <tag do último aceite>` → `npm run typecheck:mobile && npm run typecheck:packages &&
npx vitest run tests/mobile tests/packages tests/contracts` → seguir o roadmap a partir do próximo incremento.
Onboarding: [GOV-002](docs/GOV-002_ONBOARDING_HANDOVER.md).
