# MOBILE-025 — Incremento 4 (Perfil) ACCEPTED

- **Estado (MOBILE-022):** ✅ **Aceito** (fundadora, 2026-07-31) — homologação funcional em **Android físico**,
  T1–T7 PASS, sem regressão dos Inc.1–3.
- **Planejamento:** [MOBILE-016](MOBILE-016_PLANEJAMENTO_INCREMENTO4_PERFIL.md) · **Roteiro:** [MOBILE-023](MOBILE-023_ROTEIRO_HOMOLOGACAO_INCREMENTO4.md).

## 1. Resultado da homologação (dispositivo físico)

| Caso | Verificação | Resultado |
|------|-------------|-----------|
| T1 | Abrir **Mais → Perfil** | ✅ |
| T2 | Carregar dados (e-mail da sessão + nome/telefone) | ✅ |
| T3 | Editar nome | ✅ |
| T4 | Editar telefone | ✅ |
| T5 | **Salvar** (pessimista) → "Perfil salvo ✓" | ✅ |
| T6 | **Persistir** após forçar parada + reabrir | ✅ |
| T7 | **Sem regressão** de navegação (5 abas) / auth / Home (Inc.1–3) | ✅ |

**"passou tudo"** confirmado pela fundadora. Fronteira garantida por CI (`profile-boundary`: a tela não acessa
Supabase direto). Escopo entregue: editar `name`/`phone`; exibir avatar/faixa/objetivos; e-mail da sessão (RO).

## 2. Bloco de RASTREABILIDADE ([MOBILE-022](MOBILE-022_TEMPLATE_EVIDENCIAS_INCREMENTO.md))

```
Incremento:            Inc4 — Perfil
Estado:                Aceito
Branch:                feat/mobile-inc4-perfil
Commit (código homolog.): 8dd0d5b  (app inalterado até o tip; commits posteriores = só governança)
Tag:                   mobile-inc4-accepted
Pull Request:          — (integração ao ramo principal ao fim da Onda 1)
GitHub Actions:        run 30631715970 (8dd0d5b, success) · run 30635744433 (tip, success)
EAS Build:             5b3df1fb-b74b-4412-9b71-770aeffce6ab (perfil preview) — FINISHED
APK SHA-256:           45d1cda3f660459170e5179e0d522369fa32f996842219e4b90a90bbfcfbd6b9
Versão do aplicativo:  0.0.0 (build 1)
Versão do banco:       sem migrations (tabela `profiles` já existia; RLS reusada)
Contrato da API:       profile v1 (docs/API_CONTRACTS.md)
Toolchain:             Node v22.23.1 · npm 10.9.8 · eas-cli 21.4.0 · Expo SDK 54
Data da homologação:   2026-07-31
Responsável homolog.:  Carina (fundadora)
```

**Critério final (ADR-012):** um dev novo consegue entender/reproduzir/validar/evoluir o Inc.4 só pelo repo —
`git checkout mobile-inc4-accepted && npm run typecheck:mobile && npm run typecheck:packages && npx vitest run
tests/mobile tests/packages tests/contracts`.

## 3. Achado (honesto) registrado no backlog

O `eas.json` do perfil `preview` com `gradleCommand: :app:assembleRelease` **não** evitou o build do `app-debug.apk`
— o artefato do EAS continua `.tar.gz` (debug+release); a homologação usou o `app-release.apk` **extraído** do tar
(workflow provado). "Install de 1 toque" segue **item de infra** (não bloqueia; não é dívida de governança).

## 4. Encerramento

Tag `mobile-inc4-accepted`. Baseline + roadmap + matriz + changelog atualizados. O **Incremento 5 (Histórico de
Exames)** passa a **Em Implementação** (nasce desta tag; [MOBILE-024](MOBILE-024_PLANEJAMENTO_INCREMENTO5_EXAMES.md)).
