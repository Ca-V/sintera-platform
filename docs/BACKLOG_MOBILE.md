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
| ✅ Primitivo `Switch` (recipe `toggle` + RN) | feito 27/07 | Preferências; commit `f983b5a`. [DS-003](DS-003_PRIMITIVOS_RN_CHECKLIST.md). |
| ✅ Primitivo RN `Avatar` | feito 27/07 | Exibição; consome o recipe `avatar`; commit `f983b5a`. |
| ✅ Primitivo `FieldRow` (recipe `field` + RN) | feito 27/07 | Linha de formulário (infra pura); commit `b05a355`. |
| Primitivos RN faltantes: badge·card·chip·divider·icon·surface | conforme necessidade | promover quando um incremento precisar (não antecipar). |

## 🔀 Paridade Web↔Mobile (divergências → [Matriz](PARIDADE_WEB_MOBILE.md))
| Divergência | Detectada | Nota |
|------|-----------|------|
| **Camada de perfil: Mobile mais moderno que a Web.** O `@sintera/api-client` `profile` (getProfile/updateProfile — **upsert**, whitelist de coluna, timeout, contrato `T\|null`+throw) é mais correto que a Web (`src/app/api/profile/route.ts`: `createClient` direto, `.update()`, mistura domínios ciclo/altura, sem timeout). | 27/07 (auditoria de consistência) | Ao **descongelar** a Web, alinhá-la ao api-client compartilhado (**Prioridade B** — passa pelo gate de paridade). Não fazer agora. Contexto maior: a Web ainda **não** consome `@sintera/api-client` (predata o cliente compartilhado, nascido no Mobile Inc 1). |

## 🚀 Incrementos futuros (roadmap [MOBILE-015](MOBILE-015_ROADMAP_INCREMENTOS.md))
3 Home Shell (homologação pendente) · **4 Perfil** ([MOBILE-016](MOBILE-016_PLANEJAMENTO_INCREMENTO4_PERFIL.md), planejado) · 5 Histórico de Exames · 6 Upload · 7 Registro Manual · 8 RegistrationHub · 9 Composição Corporal · 10 Agenda · 11 Insights.

## ⏸️ Adiados por decisão (não antecipar)
- Edição/upload de **avatar** (Storage/permissões) — incremento próprio ([MOBILE-016 §2.2](MOBILE-016_PLANEJAMENTO_INCREMENTO4_PERFIL.md)).
- **Offline-first** de gravação (fila/sync) — onda futura.
- Deep linking · notificações · analytics — fora do escopo atual.
