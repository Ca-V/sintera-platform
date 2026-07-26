# BACKLOG — Mobile (índice consolidado)

- **Status:** índice vivo (2026-07-24). Consolida itens abertos por **categoria**, apontando para o doc dono
  de cada um. Não duplica conteúdo — é uma visão única para priorização.

## 🐞 Bugs / defeitos
*(nenhum aberto no momento — a anomalia de logout do Inc. 1 foi mitigada por [ADR-017](adr/ADR-017_GUARDA_REENTRANCIA_LOGOUT.md); causa raiz inconclusiva, não reproduzida.)*

## 🧱 Dívida técnica
| Item | Doc | Nota |
|------|-----|------|
| Débito de lint (Web congelada) | [QA-002](QA-002_DEBITO_LINT_WEB.md) | 13 erros em produto Web; saneamento próprio, decisão da fundadora. Lint informativo no CI até lá. |
| Commits com `@` no assunto | — | Artefato de here-string em ~alguns commits mobile; normalizar no squash da integração da Onda 1 (não reescrever histórico agora). |

## ⚙️ Ambiente / infra
| Item | Doc | Nota |
|------|-----|------|
| Revalidação AVD pós-16 GB | [MOBILE-011](MOBILE-011_ESTABILIDADE_AMBIENTE_VALIDACAO_ANDROID.md) | `hw.ramSize` 3072→4096 + cold boot; confirmar sumiço dos ANRs de host. **Pendente do upgrade (terça).** |
| Gate de release em monorepo | [REL-001](REL-001_RELEASE_BUNDLE_MONOREPO.md) | `assembleRelease` não resolve `./index.ts`; adiado para a fase de distribuição (pós-Onda 1). |
| CI — tornar `lint` bloqueante | [ci.yml](../.github/workflows/ci.yml) | Após sanear o QA-002. |
| CI — não consegui assistir ao run (gh sem credencial) | — | Confirmar o 1º run verde em Actions (build Web com env dummy). |

## 🎨 Design System (evoluções — "DS antes da tela")
| Item | Quando | Nota |
|------|--------|------|
| Primitivo `switch` (recipe + RN) | **Inc. 4** | Preferências do Perfil; recipe não existe. [MOBILE-016 §3.2](MOBILE-016_PLANEJAMENTO_INCREMENTO4_PERFIL.md). |
| Primitivo RN `Avatar` | **Inc. 4** | Exibir avatar; recipe `avatar` já existe, falta adaptador RN. |
| Primitivos RN faltantes: badge·card·chip·divider·icon·surface | conforme necessidade | 11 recipes base × 4 primitivos RN; promover quando o incremento precisar. |

## 🚀 Incrementos futuros (roadmap [MOBILE-015](MOBILE-015_ROADMAP_INCREMENTOS.md))
3 Home Shell (homologação pendente) · **4 Perfil** ([MOBILE-016](MOBILE-016_PLANEJAMENTO_INCREMENTO4_PERFIL.md), planejado) · 5 Histórico de Exames · 6 Upload · 7 Registro Manual · 8 RegistrationHub · 9 Composição Corporal · 10 Agenda · 11 Insights.

## ⏸️ Adiados por decisão (não antecipar)
- Edição/upload de **avatar** (Storage/permissões) — incremento próprio ([MOBILE-016 §2.2](MOBILE-016_PLANEJAMENTO_INCREMENTO4_PERFIL.md)).
- **Offline-first** de gravação (fila/sync) — onda futura.
- Deep linking · notificações · analytics — fora do escopo atual.
