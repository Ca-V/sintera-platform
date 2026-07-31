# Changelog — SINTERA

Formato: [SemVer](https://semver.org/lang/pt-BR/). Nome interno da linha: **Van Gogh**.
Alterações **relevantes ao produto** (não commit a commit). Complementa o [roadmap](docs/MOBILE-015_ROADMAP_INCREMENTOS.md)
e a [baseline](BASELINE_PROJETO.md). A plataforma **Web** (`v1.x`) e o app **Mobile** (`0.0.x`, pré-lançamento)
têm linhas de versão próprias; enquanto pré-lançamento, o Mobile agrupa por incremento.

## [Não lançado] — Mobile, Onda 1

### Adicionado
- **Autenticação** (Inc.1) — login/logout, sessão persistente (SecureStore).
- **Navegação** (Inc.2) — Bottom Tabs projetando a taxonomia SSOT.
- **Home** (Inc.3) — tela inicial como composição de slots (saudação + acessos rápidos).
- **Perfil** (Inc.4) — ver e editar **nome** e **telefone**; exibição de avatar/faixa etária/objetivos; acesso
  via **Mais → Perfil**. *(Estado: **Aceito** — homologado em Android físico, tag `mobile-inc4-accepted`.)*

### Alterado
- **Build/validação Android → nuvem-first** (EAS Build + dispositivo físico), sem depender do emulador/RAM local.

### Corrigido
- **CMake** no build em nuvem (pin 4.1.2 só no Windows; Linux/EAS usa o padrão).
- **EAS** — variáveis `EXPO_PUBLIC_*` (Supabase) no ambiente `preview`.

### Infra (aberto)
- **Empacotamento do APK** — o artefato do EAS ainda vem `.tar.gz` (debug+release) mesmo com
  `gradleCommand: :app:assembleRelease`; instala-se extraindo o `app-release.apk`. "Install de 1 toque"
  segue em aberto (backlog).

## [v1.0.1] — 2026-07-12 · hotfix de domínio

**1ª entrega da Fase de Consolidação Arquitetural.** Demonstra o princípio: regras de
domínio **determinísticas** substituindo comportamento dependente de nome de arquivo ou de
interpretação ocasional da IA.

- **Corrige** a nomenclatura automática de documentos: o nome representa o **documento**,
  nunca um resultado interno (bug real — painel laboratorial nomeado por um único biomarcador,
  "IgE látex").
- **Introduz** classificação por `document_type` (categoria/mídia) + `document_scope`
  (single/panel/mixed) + `display_title` (nome de exibição derivado). `clinical_category`
  reservado.
- Nomenclatura **dirigida por categoria + escopo** (não por contagem): painel/misto →
  "Exames laboratoriais"; urina isolada → "Urina tipo I"; imagem → modalidade canônica; etc.
- **Backfill** dos registros existentes (Content Classifier aplicado retroativamente);
  mantém compatibilidade com documentos existentes.
- **1ª suíte reutilizável do Capture Hub** (ARCH-002), suite rápida (mock) + homologação (IA real).

Regra de domínio: `@/lib/capture/document-naming` · migrations 101/102 · CAP-002 §Content Classifier.

## [v1.0.0] — 2026-07 · Onda 1

Landing + identidade visual v3.0 "Van Gogh"; Relatório (Medidas = laudo/documento);
captura documental; publicação em produção (sinteramais.com.br).
