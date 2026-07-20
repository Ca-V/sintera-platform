# HIP-010 — Plano Executivo da Etapa 4 (implementação por ondas de valor)

**Status:** PLANO EXECUTIVO para aprovação. **Pré-requisito de qualquer código funcional.** Sob [[ADR-000]] ·
[[ARCH-002]] · deriva de [[HIP-007]]/[[HIP-008]]/[[HIP-009]]/[[HIP-011]].
**Princípio:** organizar por **entregas de VALOR**, não por tecnologia. Cada onda entrega experiência utilizável.
**Refina** as ondas do [[HIP-006]]: Health Connect/Apple Health = **capacidades nativas** (Onda 3), conectores externos
= Onda 4.

## Ondas (visão)
| Onda | Tema | Valor entregue |
|---|---|---|
| **1** | Fundação do app | um app instalável, autenticado, navegável, falando com a API |
| **2** | Experiência principal | a usuária vê e organiza sua história (timeline/exames/perfil/agenda) |
| **3** | Aquisição observacional | a história **cresce sozinha** (Apple Health/Health Connect → Observações) |
| **4** | Integrações adicionais | cobertura ampliada (conectores externos, atividade, dispositivos médicos) |

## Diretrizes transversais das ondas (fundadora)
1. **Cada onda = PRODUTO UTILIZÁVEL:** ao final, uma versão **instalável e usada** (ainda que por grupo restrito) — não
   só marco técnico. Cada entrega gera **aprendizado de produto**, não apenas evolução de infra.
2. **Critério de aceite de experiência (obrigatório em toda onda):** responder **"o que o usuário passa a conseguir
   fazer agora que não conseguia antes?"**. Se a resposta for só técnica, a onda não está pronta.
3. **Revisão arquitetural leve ao fim de cada onda** (§Revisão pós-onda): não rediscute arquitetura — **verifica
   aderência** aos princípios (Mobile-First · API-First · Observacional · SSOT · rastreabilidade · compartilhamento
   web↔mobile).

---

## Onda 1 — Fundação do app
**Backlog:** monorepo + pacote `@sintera/core` (tipos/contratos/validações/regras) · projeto RN+Expo (dev client + EAS) ·
**autenticação** (Supabase Auth, sessão, deep links) · **camada de comunicação com API** (cliente compartilhado,
versionado) · **navegação** (bottom tabs — [[HIP-011]]) · **Design System Mobile como FUNDAÇÃO** (não só componentes):
tokens Van Gogh + componentes base **+ princípios de navegação + acessibilidade ([[tema_g_acessibilidade]]) + animações
+ feedbacks + estados vazios + estados de carregamento + tratamento de erros** — garante consistência por toda a
evolução do app.
**Dependências:** nenhuma externa (base de tudo).
**Marco:** app roda em dispositivo (dev build), loga com conta SINTERA, navega entre tabs vazias, chama uma API real.
**Aceite:** login/logout funcionam; navegação estável; cliente de API tipado consumindo o backend; DS aplicado; verde
(lint/build/testes) e observado em **TestFlight/Play Internal**.
**Homologação:** comportamento observado em build interna (não só compilou) — [[governanca_aprovacao_acao_destrutiva]].

## Onda 2 — Experiência principal
**Backlog:** **Timeline de Saúde** (leitura da história) · **Exames e Documentos** (lista, detalhe, ver original) ·
**Perfil** (conta, preferências) · **Agenda** (consultas/lembretes) — **API-first:** cada capacidade nasce como
endpoint consumido pelo app (e depois pela web).
**Dependências:** Onda 1 (auth, DS, navegação, cliente API). Reusa domínios já existentes no backend (Exames, Agenda…).
**Marco:** a usuária navega a própria história e documentos no app, sem depender da web.
**Aceite:** timeline carrega dados reais; exames/documentos abrem original; agenda lista e cria; offline-first de leitura
([[HIP-011]] §6); observado em build interna + Gate de Conformidade (LGPD/rastreabilidade).

## Onda 3 — Aquisição observacional (capacidades nativas)
**Backlog:** integração **Health Connect** (Android) + **Apple HealthKit** (iOS) como **capacidades nativas** ·
**sincronização** (arquitetura [[HIP-009]]: push, cursores por dispositivo, offline, idempotência) · endpoint
**`/ingest`** (backend, reusa `propagateSamples`) · **Observações** no Monitoramento + **NOV-001** ("sua história
cresceu") · vocabulário de vitais contínuos (HRV/sono/FC…).
**Dependências:** Onda 1 (base) + Onda 2 (timeline/monitoramento onde as Observações aparecem) + arquitetura de sync
aprovada (Etapa 3).
**Marco:** dado de saúde do celular chega sozinho e aparece na timeline/monitoramento com reconhecimento natural.
**Aceite (ciclo real):** conceder permissões · sincronizar (foreground+background) · Observações reais na timeline ·
NOV-001 · reconexão/permissão revogada · rastreabilidade origem→observação. Observado com dispositivo real; Gate de
Conformidade. Encerramento só com **aprovação explícita** ([[governanca_aprovacao_acao_destrutiva]]).

## Onda 4 — Integrações adicionais
**Backlog:** **conectores externos** (Withings web já pronto — [[HIP-002]]; agregador Terra/Rook por gatilho —
[[HIP-006]]) · **atividade física** (domínio + Strava após sign-off jurídico) · **dispositivos médicos** (CGM/MAPA…).
Todos emitem **Observação** pela mesma via.
**Dependências:** Onda 3 (Observação/ingestão/sync consolidadas).
**Marco:** fontes além do celular ampliam a cobertura sem mudança estrutural.
**Aceite:** cada conector passa pelo ciclo real (conectar/sync/webhook/erros/reconexão/revogação) + Gate de Conformidade;
por onda, homologação + aprovação explícita.

---

## Dependências entre módulos (resumo)
`@sintera/core` → tudo. Onda 1 (auth/DS/nav/API) → Onda 2 → Onda 3 (sync depende da Etapa 3 aprovada) → Onda 4. Backend
API-first: cada capacidade existe como API antes da tela ([[ARCH-002]]).

## Riscos
- **Ordem OS/lojas:** dev build + revisão de HealthKit/permissões (Onda 3) → preparar cedo.
- **Divergência web↔app:** mitigada pelo monorepo/contratos compartilhados.
- **Background sync (limites de SO):** cadência realista (Etapa 3).
- **Escopo do app como produto:** manter MVP enxuto por onda; não inflar.
- **Dependências externas** (contas Apple/Play; sign-off jurídico Strava; custo agregador) → destravar no tempo certo.

## Estratégia de homologação
- **Ambientes:** API/web no Preview (Vercel); app em **TestFlight (iOS)** e **Play Internal Testing (Android)**.
- **Aceitação = comportamento OBSERVADO** na build (não "compilou/passou teste") — [[governanca_aprovacao_acao_destrutiva]].
- **Por onda:** validação de produto → **aprovação explícita da fundadora** → Gate de Conformidade → encerramento/congelamento.
- **Nada destrutivo/irreversível** sem aprovação explícita pós-validação.

## Estratégia de distribuição / publicação (escada — desde a Onda 1)
A distribuição faz parte do plano **desde o início** (build interna já na Fundação):
**Interno (dev build)** → **TestFlight (iOS) + Play Internal Testing (Android)** → **grupo fechado de homologação** →
**beta público** (quando fizer sentido) → **publicação oficial** (App Store / Google Play). Cada onda avança na escada
conforme a maturidade; o aprendizado de produto (§Diretrizes) vem já dos primeiros degraus.

## Métricas por onda (produto + técnicas) — evolução guiada por dados
O app é o produto principal → cada onda acompanha **métricas de produto**, não só técnicas (base: `usage_events` +
telemetria mobile; LGPD: dado agregado/consentido):
- **O1 Fundação:** conclusão de **onboarding**, login bem-sucedido, **crash-free sessions**, tempo de build/OTA.
- **O2 Experiência:** **uso da Timeline**, visualização de exames/documentos, **DAU/WAU**, **retenção D1/D7**, frequência de uso.
- **O3 Aquisição:** **sincronizações bem-sucedidas**, permissões concedidas, Observações por usuário, "sua história
  cresceu" (NOV-001), latência de sync.
- **O4 Integrações:** conexões por fonte, **uploads de documentos**, uso das funcionalidades principais, cobertura de dados.

## Revisão arquitetural leve ao fim de cada onda
Checklist de **aderência** (não rediscussão): Mobile-First? API-First (nada só-web; a capacidade existe como API)?
Observacional (todo dado objetivo = Observação)? SSOT bruto imutável? Rastreabilidade ponta a ponta? Compartilhamento
web↔mobile máximo (sem duplicação de regra)? Desvio detectado → corrige **antes** da próxima onda.

## Plano Mestre de Implementação — [[HIP-012]] (próximo artefato)
O guia **operacional** detalhado da implementação será um **artefato próprio (HIP-012 — Master Implementation Plan)**,
produzido **ao iniciar a Onda 1** (não diluído aqui): cronograma macro + por sprint · checklist da fundação · config do
monorepo · criação de contas (Apple Developer / Google Play / Expo) · estrutura React Native · Design System · autenticação
· backend · MVP · Health Connect · Apple Health · integrações futuras · estratégia de testes · estratégia de publicação.

## Decisões antes de iniciar a Onda 1
- **D-STACK** (confirmar RN+Expo) · **D-PLAT** (Android ou iOS primeiro no MVP) · **contas** (Apple Developer + Play
  Console) · **monorepo** (estrutura do repositório e do `@sintera/core`). Aprovado o plano, a **ordem de implementação =
  Ondas 1→4**.
