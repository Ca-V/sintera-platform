# MOBILE-001 — Plano Executivo do App React Native (Expo)

**Status:** Proposto (aguarda aprovação da fundadora) · 2026-07-21 · **Consolida:** [[HIP-008]] (stack) · [[HIP-009]]
(sincronização) · [[HIP-010]] (ondas) · [[HIP-011]] (produto/UX) · [[ds002_architectural_freeze]] · [[estrategia_ssot_web_mobile]].
**Marco:** fase Web encerrada; a Web é a **implementação de referência** (funcional, arquitetural, visual). O RN passa a
ser a **2ª implementação do adaptador** sobre o DS-002 estabilizado — não instrumento de validação da arquitetura.

## 1. Arquitetura proposta (RN + Expo)
- **Stack:** React Native + **Expo** (dev client + **EAS Build/Update**), decidido no HIP-008. Scaffold já existe em
  `apps/mobile` (RN 0.79 · Expo ~53 · React 19).
- **Monorepo (mesma base da Web):** o app consome os pacotes compartilhados por caminhos já configurados
  (`apps/mobile/tsconfig`): `@sintera/design-system` (tokens/tema/recipes headless) · `@sintera/core` · `@sintera/types`
  · `@sintera/validation` · `@sintera/api-client` · `@sintera/utils` · `@sintera/config`.
- **Camadas do app** (pastas já criadas): `design-system` (adaptador DS→RN) · `presentation` (telas por domínio) ·
  `navigation` · `state` · `sync` · `infrastructure` (Supabase/secure store) · `integrations` (HealthKit/Health Connect).
- **Princípio-chave:** o RN **renderiza os mesmos `recipes` headless** do DS-002 (que retornam `VisualSpec` neutro de
  plataforma) via primitivos RN (`View`/`Text`). Identidade idêntica à Web **por construção** — foi exatamente o objetivo
  da consolidação do DS-002.
- **Builds nativos:** módulos de saúde exigem **development build** (não Expo Go) via `expo prebuild` + config plugins +
  **EAS** — padrão atual, não bloqueio (HIP-008).

## 2. Estratégia de reaproveitamento Web ⇄ Mobile
Fonte única de verdade = `packages/*`. Cada plataforma tem só um **adaptador fino** que traduz para o seu sistema de UI.

| Camada | Reúso |
|---|---|
| Tokens · tema (`getTheme`) · **recipes headless** (VisualSpec) | **100% compartilhado** (TS puro) |
| Modelos de domínio · validações · regras de negócio · infra de data | **100% compartilhado** |
| Cliente de API (`@sintera/api-client`) | **100% compartilhado** (API-first, ARCH-002) |
| Tradução para UI | **Adaptador por plataforma:** Web → CSS/React (`src/lib/ui/ds`); Mobile → RN (`apps/mobile/src/design-system`) |
| Já pronto no Mobile | Adaptadores DS→RN de **tipografia** (`toRNTextStyle`) e **elevação** (`toRNShadow`) — puros, com contratos |

Meta-prova (já garantida na Web): mudar identidade = editar **só** o DS; ambos os adaptadores consomem o mesmo token/recipe.

## 3. Componentes compartilhados × específicos
- **Compartilhados (packages):** tokens, tema, **recipes** (Card/Button/Badge/Chip/Divider/Icon/Avatar/Numeric + domínio
  LaboratoryTable/Banner/TimelineRow/BiomarkerCard/Indicator), modelos (Observação/Exame/Agenda/…), validações, API client.
- **Específicos Web:** adaptador CSS (`src/lib/ui/ds`), `globals.css`/artefato gerado, roteamento Next.js.
- **Específicos Mobile:** adaptador RN (primitivos `View`/`Text` a partir dos recipes), **navegação** (bottom tabs),
  módulos Expo (SecureStore, Notifications, HealthKit/Health Connect), **fila offline**, gestos/haptics.
- **Regra:** nenhum componente de domínio é reescrito — o recipe é reusado; só o adaptador muda.

## 4. Autenticação · Navegação · Sincronização
- **Autenticação:** Supabase Auth (mesmo backend/RLS da Web). Mobile: `@supabase/supabase-js` + **`expo-secure-store`**
  para persistir a sessão + **deep links** para o callback OAuth (Google). Sem lógica de auth duplicada — mesma API.
- **Navegação:** **bottom tab bar** (HIP-011): **Início · Minha Saúde · ＋Registrar · Agenda · Perfil**. Rótulos vindos da
  taxonomia da Sidebar (SSOT). Stack nativo por domínio dentro de cada tab.
- **Sincronização:** arquitetura **HIP-009** — SSOT bruto imutável + **idempotência** + cursores por dispositivo +
  reconciliação **na projeção** (equivalência/precedência/rastreabilidade). **Offline-first:** leitura em cache; captura
  enfileirada e enviada quando houver rede. Ingestão nativa (HealthKit/Health Connect) → `CanonicalSample` → endpoint
  **`/ingest`** (backend reusa `propagateSamples`). Push via **Expo Notifications** (APNs/FCM), reusando a Central de
  Notificações e o worker de despacho já existentes.

## 5. Cronograma macro (ondas — cada uma = produto instalável, HIP-010)
| Onda | Entrega | Aceite (o que o usuário passa a conseguir) |
|---|---|---|
| **0 — Setup** | Completar o adaptador DS→RN (primitivos `View`/`Text` dos recipes; fontes via `@expo-google-fonts`; gradientes via `expo-linear-gradient`; reconciliar o gradiente do botão na recipe) + EAS/dev build configurado | (interno) base de UI verificável e build rodando |
| **1 — Fundação** | Auth (login/logout, sessão, deep links) · navegação (tabs) · cliente API tipado · DS aplicado | app instalável, loga, navega, fala com a API real (dev build / TestFlight/Play Internal) |
| **2 — Experiência principal** | Timeline · Exames/Documentos (ver original) · Perfil · Agenda · offline-first de leitura | a usuária navega a própria história no app, sem depender da Web |
| **3 — Aquisição observacional** | Health Connect + HealthKit (capacidades nativas) · sync (HIP-009) · `/ingest` · Observações + NOV-001 | o dado do celular chega sozinho e aparece na timeline/monitoramento |
| **4 — Integrações adicionais** | Conectores externos (Withings pronto) · atividade física (após sign-off jurídico) · dispositivos médicos | fontes além do celular ampliam a cobertura sem mudança estrutural |

**Contas Apple Developer / Google Play + integrações nativas:** configuradas **após a 1ª versão navegável** (fim da Onda 1),
conforme diretriz da fundadora — o cadastro pode iniciar em paralelo à Onda 1 (prazos de aprovação).

## 6. Riscos técnicos e mitigações
| Risco | Mitigação |
|---|---|
| Ambiente de build RN indisponível no sandbox atual (Windows, sem toolchain) | Implementação em ambiente com Expo/**EAS (build na nuvem)**; aqui só a base **pura TS** é verificável (tsc/testes) — a fundação já segue esse padrão |
| Módulos nativos de saúde exigem dev build (não Expo Go) | `expo prebuild` + config plugins + **EAS dev build** (padrão HIP-008; não bloqueio) |
| Recipe do **botão** descreve primário sólido; a Web usa o **gradiente** de ação | Reconciliar na Onda 0: adicionar `backgroundGradient` ao `BoxSpec` (referenciando `gradient.action`) → Web e RN derivam do mesmo token (evolução já registrada na auditoria DS-002) |
| Tipografia (Fraunces/Hanken/IBM Plex Mono) no RN | `@expo-google-fonts` + `expo-font`, mesmos pesos; o adaptador `toRNTextStyle` já mapeia família por peso |
| Complexidade de sync/offline | Seguir **HIP-009** (idempotência, cursores); entregar **leitura offline** (Onda 2) antes da **ingestão** (Onda 3) |
| Divergência de identidade Web↔Mobile ao longo do tempo | Contratos **ARCH** para o adaptador RN (como os já existentes de tipografia/elevação), criados conforme os primitivos nascem |
| Custo/tempo de aprovação nas lojas | Cadastro Apple/Google iniciado cedo (paralelo à Onda 1); EAS Submit para publicação |

## Próximo passo
Aprovado o plano, a implementação inicia pela **Onda 0** (completar o adaptador DS→RN e o build), no ambiente com Expo/EAS,
mantendo o protocolo de entrega por incrementos verificáveis e a Web como referência.
